import OpenAI from "openai";
import { db } from "./db";
import { conversations, messages, catalogItems, orders, technicians, customers, premadePots } from "@shared/schema";
import { eq, desc, sql, and, gte, count, sum, isNull, ne } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CUSTOMER_SYSTEM_PROMPT = `You are the AI assistant for Vườn Lan Hùng Cường (Hung Cuong Orchid Garden), a premium orchid shop in Hưng Yên, Vietnam.
Your Tone: Polite, knowledgeable, helpful, and distinctly Vietnamese in style.

BUSINESS INFORMATION:
- Name: Vườn Lan Hùng Cường / Hùng Cường Orchid Garden
- Address: Đội 10, Xích Đằng, phường Lam Sơn, TP. Hưng Yên, tỉnh Hưng Yên
- Phone: 0983 270 995
- Email: Thanhtusky147@gmail.com
- Specializes in: Premium Phalaenopsis orchids (Lan Hồ Điệp)

ORDERING INFORMATION:
- Minimum 5 orchid stems per pot
- Custom pot compositions available with pot type and decoration selection
- 50% deposit required via VietQR bank transfer
- Payment: VIETCOMBANK account 9983270995 (LE THI THANH TU)
- Free orchid care consultation available
- Delivery from north of Vietnam to Đà Nẵng

ORCHID CARE KNOWLEDGE:
- Watering: Advise users to water only when the moss/medium is dry (usually every 7-10 days). Never water the leaves directly to avoid rot. Overwatering is the most common mistake.
- Light: Orchids need bright, indirect sunlight. Avoid harsh midday sun. East or north-facing windows are ideal.
- Temperature: Phalaenopsis orchids thrive at 18-30°C. Avoid cold drafts and sudden temperature changes.
- Humidity: Ideal humidity is 50-70%. In dry conditions, place a tray of water near the orchid or mist the roots (not leaves).
- Fertilizer: Use diluted orchid fertilizer (20-20-20) once every 2 weeks during growing season. Reduce in winter.
- Repotting: Repot every 1-2 years when the medium breaks down. Use fresh sphagnum moss or bark mix.
- Common issues: Yellow leaves may indicate overwatering or too much sun. Wrinkled leaves suggest underwatering. Black spots can be bacterial infection - isolate the plant immediately.
- After bloom care: Cut the spike above the second node from the base to encourage reblooming. Some orchids may rebloom from the same spike.
- Products: If a user has a sick plant, recommend bringing it to the garden for inspection or calling 0983 270 995 for consultation.

YOUR ROLE:
- Help customers with product inquiries
- Explain ordering process and pricing
- Assist with order tracking (ask for tracking code, phone number, or email)
- Provide detailed orchid care tips based on the knowledge above
- Answer questions in Vietnamese by default, but respond in the same language the customer uses

IMPORTANT:
- Be friendly, professional, and helpful
- If customers want to place an order, guide them to use the checkout page on the website
- For order tracking, tell them to provide their tracking code, phone number, or email
- Always be supportive of their flower choices and celebrate their occasions
- If you don't know the answer, ask them to call the owner at 0983 270 995`;

const ADMIN_SYSTEM_PROMPT = `You are an intelligent business assistant for Hùng Cường Orchid Garden (Vườn Lan Hùng Cường) admin panel.

You have access to real-time business data including:
- Current inventory levels and stock
- Order statistics and revenue
- Technician availability and workload
- Customer information

When asked about business metrics, I will provide you with the current data context. Use this data to give accurate, helpful responses.

Respond professionally and concisely. When discussing numbers, format currency in VND.`;

export interface ChatContext {
  userType: "CUSTOMER" | "ADMIN";
  userId?: string;
  sessionId?: string;
}

const INTENT_KEYWORDS: Record<string, string[]> = {
  PRODUCT_INQUIRY: ["giá", "price", "sản phẩm", "product", "lan", "orchid", "loại", "type", "hoa", "flower", "bao nhiêu", "how much", "mua", "buy"],
  ORDER_TRACKING: ["đơn hàng", "order", "tracking", "theo dõi", "mã đơn", "order number", "giao hàng", "delivery", "tình trạng", "status"],
  ORDER_PLACEMENT: ["đặt hàng", "place order", "đặt", "order", "mua", "purchase", "checkout", "thanh toán", "payment"],
  CARE_TIPS: ["chăm sóc", "care", "tưới", "water", "ánh sáng", "light", "phân bón", "fertilizer", "bệnh", "disease", "héo", "wilt"],
  COMPLAINT: ["phàn nàn", "complaint", "không hài lòng", "dissatisfied", "lỗi", "error", "hỏng", "broken", "trả lại", "return", "hoàn tiền", "refund"],
  BUSINESS_REPORT: ["báo cáo", "report", "doanh thu", "revenue", "thống kê", "statistics", "tổng kết", "summary", "lợi nhuận", "profit"],
};

function detectIntent(message: string): string {
  const lowerMsg = message.toLowerCase();
  let bestIntent = "GENERAL";
  let maxScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lowerMsg.includes(kw)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }

  return bestIntent;
}

function extractOrderReference(message: string): string | null {
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = message.match(uuidPattern);
  if (match) return match[0];

  const orderNumPattern = /ORD-?\d+/i;
  const orderMatch = message.match(orderNumPattern);
  if (orderMatch) return orderMatch[0];

  return null;
}

async function getBusinessContext(): Promise<string> {
  const [catalogData] = await db.select({ 
    count: count(),
    totalStock: sum(catalogItems.stockQuantity)
  }).from(catalogItems).where(eq(catalogItems.status, "ACTIVE"));
  
  const [lowStockCount] = await db.select({ count: count() })
    .from(catalogItems)
    .where(and(
      eq(catalogItems.status, "ACTIVE"),
      sql`${catalogItems.stockQuantity} < 10`
    ));
  
  const [orderStats] = await db.select({
    totalOrders: count(),
    pendingOrders: count(sql`CASE WHEN status = 'PENDING' THEN 1 END`),
    preparingOrders: count(sql`CASE WHEN status = 'PREPARING' THEN 1 END`),
    shippingOrders: count(sql`CASE WHEN status = 'SHIPPING' THEN 1 END`),
  }).from(orders);
  
  const [revenueData] = await db.select({
    totalRevenue: sum(sql`CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END`),
    depositRevenue: sum(sql`deposit_paid`)
  }).from(orders);
  
  const technicianData = await db.select({
    fullName: technicians.fullName,
    status: technicians.status,
    currentWorkload: technicians.currentWorkload,
    maxWorkload: technicians.maxWorkload
  }).from(technicians).where(eq(technicians.status, "ACTIVE"));
  
  const [customerStats] = await db.select({
    totalCustomers: count()
  }).from(customers);
  
  const [premadePotsCount] = await db.select({ count: count() })
    .from(premadePots)
    .where(and(
      eq(premadePots.status, "AVAILABLE"),
      sql`${premadePots.stockQuantity} > 0`
    ));

  const recentOrders = await db.select({
    id: orders.id,
    status: orders.status,
    totalAmount: orders.totalAmount,
    createdAt: orders.createdAt
  }).from(orders).orderBy(desc(orders.createdAt)).limit(5);

  return `
CURRENT BUSINESS DATA:
- Active Catalog Items: ${catalogData.count}
- Total Stock: ${catalogData.totalStock || 0} stems
- Low Stock Items (<10): ${lowStockCount.count}
- Available Pre-made Pots: ${premadePotsCount.count}

ORDER STATISTICS:
- Total Orders: ${orderStats.totalOrders}
- Pending Orders: ${orderStats.pendingOrders}
- Preparing: ${orderStats.preparingOrders}
- Shipping: ${orderStats.shippingOrders}

REVENUE:
- Total Paid Revenue: ${Number(revenueData.totalRevenue || 0).toLocaleString()} VND
- Total Deposits Collected: ${Number(revenueData.depositRevenue || 0).toLocaleString()} VND

TECHNICIAN AVAILABILITY:
${technicianData.length > 0 
  ? technicianData.map(t => `- ${t.fullName}: ${t.currentWorkload}/${t.maxWorkload} orders (${t.status})`).join('\n')
  : '- No technicians currently available'}

CUSTOMER BASE:
- Total Customers: ${customerStats.totalCustomers}

RECENT ORDERS:
${recentOrders.length > 0 
  ? recentOrders.map(o => `- Order ${o.id.slice(0, 8)}: ${o.status} - ${Number(o.totalAmount).toLocaleString()} VND`).join('\n')
  : '- No recent orders'}
`;
}

export async function getConversationById(conversationId: string) {
  const [conversation] = await db.select().from(conversations)
    .where(eq(conversations.id, conversationId));
  return conversation;
}

export async function getOrCreateConversation(
  sessionId: string,
  userType: "CUSTOMER" | "ADMIN",
  userId?: string
) {
  const existingConv = await db.select().from(conversations)
    .where(and(
      eq(conversations.sessionId, sessionId),
      eq(conversations.userType, userType)
    ))
    .orderBy(desc(conversations.createdAt))
    .limit(1);

  if (existingConv.length > 0) {
    return existingConv[0];
  }

  const title = userType === "ADMIN" ? "Admin Chat" : "Customer Chat";
  const [newConv] = await db.insert(conversations).values({
    title,
    userType,
    userId: userId || null,
    sessionId
  }).returning();

  return newConv;
}

export async function getChatMessages(conversationId: string) {
  return db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

async function updateConversationMetadata(
  conversationId: string,
  userMessage: string,
  userType: "CUSTOMER" | "ADMIN"
) {
  const conversation = await getConversationById(conversationId);
  if (!conversation) return;

  const updateData: Record<string, any> = {
    lastMessageAt: new Date(),
    messageCount: (conversation.messageCount || 0) + 1,
  };

  if (!conversation.intent) {
    const intent = detectIntent(userMessage);
    if (intent !== "GENERAL") {
      updateData.intent = intent;
    }
  }

  if (!conversation.relatedEntityId) {
    const orderRef = extractOrderReference(userMessage);
    if (orderRef) {
      updateData.relatedEntityType = "ORDER";
      updateData.relatedEntityId = orderRef;
    }
  }

  await db.update(conversations)
    .set(updateData)
    .where(eq(conversations.id, conversationId));
}

export async function* streamChatResponse(
  conversationId: string,
  userMessage: string,
  context: ChatContext
): AsyncGenerator<string> {
  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: userMessage
  });

  await updateConversationMetadata(conversationId, userMessage, context.userType);

  const history = await getChatMessages(conversationId);
  const chatHistory = history.slice(-20).map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content
  }));

  let systemPrompt = context.userType === "ADMIN" ? ADMIN_SYSTEM_PROMPT : CUSTOMER_SYSTEM_PROMPT;
  
  if (context.userType === "ADMIN") {
    const businessContext = await getBusinessContext();
    systemPrompt = `${ADMIN_SYSTEM_PROMPT}\n\n${businessContext}`;
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory
    ],
    stream: true,
    max_completion_tokens: 1024,
  });

  let fullResponse = "";

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullResponse += content;
      yield content;
    }
  }

  await db.insert(messages).values({
    conversationId,
    role: "assistant",
    content: fullResponse
  });

  await db.update(conversations)
    .set({ messageCount: sql`message_count + 1` })
    .where(eq(conversations.id, conversationId));
}

export async function getConversationAnalytics() {
  const [stats] = await db.select({
    total: count(),
    active: sql<number>`count(*) FILTER (WHERE conversation_status = 'ACTIVE')::int`,
    resolved: sql<number>`count(*) FILTER (WHERE conversation_status = 'RESOLVED')::int`,
    escalated: sql<number>`count(*) FILTER (WHERE conversation_status = 'ESCALATED')::int`,
    abandoned: sql<number>`count(*) FILTER (WHERE conversation_status = 'ABANDONED')::int`,
    customerChats: sql<number>`count(*) FILTER (WHERE user_type = 'CUSTOMER')::int`,
    adminChats: sql<number>`count(*) FILTER (WHERE user_type = 'ADMIN')::int`,
    totalMessages: sql<number>`COALESCE(SUM(message_count), 0)::int`,
  }).from(conversations);

  const intentBreakdown = await db.select({
    intent: conversations.intent,
    count: count(),
  }).from(conversations)
    .where(sql`${conversations.intent} IS NOT NULL`)
    .groupBy(conversations.intent);

  const recentConversations = await db.select().from(conversations)
    .orderBy(desc(conversations.lastMessageAt))
    .limit(20);

  return {
    stats,
    intentBreakdown,
    recentConversations,
  };
}

export async function getAllConversations(filters?: {
  userType?: string;
  status?: string;
  intent?: string;
}) {
  let query = db.select().from(conversations);
  
  const conditions = [];
  if (filters?.userType) {
    conditions.push(eq(conversations.userType, filters.userType));
  }
  if (filters?.status) {
    conditions.push(eq(conversations.status, filters.status));
  }
  if (filters?.intent) {
    conditions.push(eq(conversations.intent, filters.intent));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return (query as any).orderBy(desc(conversations.lastMessageAt));
}

export async function updateConversationStatus(
  conversationId: string,
  status: "ACTIVE" | "RESOLVED" | "ESCALATED" | "ABANDONED"
) {
  const updateData: Record<string, any> = { status };
  if (status === "RESOLVED") {
    updateData.resolvedAt = new Date();
  }
  const [updated] = await db.update(conversations)
    .set(updateData)
    .where(eq(conversations.id, conversationId))
    .returning();
  return updated;
}

export async function linkConversationToEntity(
  conversationId: string,
  entityType: string,
  entityId: string
) {
  const [updated] = await db.update(conversations)
    .set({ relatedEntityType: entityType, relatedEntityId: entityId })
    .where(eq(conversations.id, conversationId))
    .returning();
  return updated;
}
