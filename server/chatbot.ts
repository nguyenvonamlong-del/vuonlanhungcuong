import OpenAI from "openai";
import { db } from "./db";
import { conversations, messages, catalogItems, orders, technicians, customers, premadePots } from "@shared/schema";
import { eq, desc, sql, and, gte, count, sum } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CUSTOMER_SYSTEM_PROMPT = `You are a helpful assistant for Hùng Cường Orchid Garden (Vườn Lan Hùng Cường), a premium orchid shop in Hưng Yên, Vietnam.

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
- Nationwide delivery in 2-5 days

YOUR ROLE:
- Help customers with product inquiries
- Explain ordering process and pricing
- Assist with order tracking (ask for tracking code, phone number, or email)
- Provide orchid care tips
- Answer questions in Vietnamese by default, but respond in the same language the customer uses

IMPORTANT:
- Be friendly, professional, and helpful
- If customers want to place an order, guide them to use the checkout page on the website
- For order tracking, tell them to provide their tracking code, phone number, or email
- Always be supportive of their flower choices and celebrate their occasions`;

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
}
