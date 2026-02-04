import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertCatalogItemSchema, insertPremadePotSchema, insertTechnicianSchema, insertOrderSchema, insertCustomerSchema, insertShippingTypeSchema } from "@shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { z } from "zod";
import { randomUUID } from "crypto";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { getOrCreateConversation, getChatMessages, streamChatResponse, getConversationById } from "./chatbot";

// Schema for public order creation with required payment proof
// Matches actual frontend data structure for both premade and custom composition orders
const publicOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().regex(/^0\d{9,10}$/, "Invalid phone number format"),
  customerEmail: z.string().email().optional().or(z.literal("")).or(z.undefined()),
  province: z.string().min(1, "Province is required"),
  district: z.string().optional().default(""),
  ward: z.string().min(1, "Ward is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  pots: z.array(z.object({
    potId: z.string().optional(),
    potName: z.string().optional(),
    potTypeId: z.string().optional(),
    potTypeName: z.string().optional(),
    potTypePrice: z.number().nonnegative().optional(),
    decorationTypeId: z.string().optional(),
    decorationTypeName: z.string().optional(),
    decorationTypePrice: z.number().nonnegative().optional(),
    orchids: z.array(z.object({
      catalogId: z.string().optional(),
      catalogItemId: z.string().optional(),
      speciesName: z.string().optional(),
      name: z.string().optional(),
      color: z.string().optional(),
      quantity: z.number().int().positive(),
      pricePerUnit: z.number().nonnegative(),
      subtotal: z.number().nonnegative().optional(),
    })).optional().default([]),
    potSubtotal: z.number().nonnegative(),
  })).min(1, "Order must contain at least one pot"),
  subtotal: z.number().nonnegative(),
  shippingCost: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative(),
  depositAmount: z.number().nonnegative(),
  remainingAmount: z.number().nonnegative(),
  paymentProofUrl: z.string().min(1, "Payment proof is required").refine(
    (val) => val.startsWith("http") || val.startsWith("/objects/"),
    "Valid payment proof URL or upload path is required"
  ),
  orderType: z.enum(["WEBSITE", "PREMADE"]).default("WEBSITE"),
});

const PgSession = connectPgSimple(session);

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Session setup
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "orchid-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  // Object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (user.status !== "ACTIVE") {
        return res.status(403).json({ error: "Account is inactive" });
      }

      (req.session as any).userId = user.id;
      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });
  });

  // Catalog routes
  app.get("/api/catalog", async (req, res) => {
    try {
      const items = await storage.getCatalogItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch catalog" });
    }
  });

  // Pot Types
  app.get("/api/pot-types", async (req, res) => {
    try {
      const types = await storage.getPotTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pot types" });
    }
  });

  // Decoration Types
  app.get("/api/decoration-types", async (req, res) => {
    try {
      const types = await storage.getDecorationTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch decoration types" });
    }
  });

  app.post("/api/catalog", async (req, res) => {
    try {
      const data = insertCatalogItemSchema.parse(req.body);
      const item = await storage.createCatalogItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid data" });
    }
  });

  app.patch("/api/catalog/:id", async (req, res) => {
    try {
      const item = await storage.updateCatalogItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/catalog/:id", async (req, res) => {
    try {
      await storage.deleteCatalogItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // Premade pots routes
  app.get("/api/premade-pots", async (req, res) => {
    try {
      const pots = await storage.getPremadePots();
      res.json(pots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pots" });
    }
  });

  app.get("/api/shop/pots", async (req, res) => {
    try {
      const pots = await storage.getActivePremadePots();
      res.json(pots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pots" });
    }
  });

  app.post("/api/premade-pots", async (req, res) => {
    try {
      const data = insertPremadePotSchema.parse(req.body);
      const pot = await storage.createPremadePot(data);
      res.status(201).json(pot);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid data" });
    }
  });

  app.patch("/api/premade-pots/:id", async (req, res) => {
    try {
      const pot = await storage.updatePremadePot(req.params.id, req.body);
      if (!pot) {
        return res.status(404).json({ error: "Pot not found" });
      }
      res.json(pot);
    } catch (error) {
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/premade-pots/:id", async (req, res) => {
    try {
      await storage.deletePremadePot(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // Technicians routes
  app.get("/api/technicians", async (req, res) => {
    try {
      const techs = await storage.getTechnicians();
      res.json(techs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });

  app.get("/api/technicians/available", async (req, res) => {
    try {
      const techs = await storage.getAvailableTechnicians();
      res.json(techs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });

  app.post("/api/technicians", async (req, res) => {
    try {
      const data = insertTechnicianSchema.parse(req.body);
      const tech = await storage.createTechnician(data);
      res.status(201).json(tech);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid data" });
    }
  });

  app.patch("/api/technicians/:id", async (req, res) => {
    try {
      const tech = await storage.updateTechnician(req.params.id, req.body);
      if (!tech) {
        return res.status(404).json({ error: "Technician not found" });
      }
      res.json(tech);
    } catch (error) {
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/technicians/:id", async (req, res) => {
    try {
      await storage.deleteTechnician(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // Customers routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const allOrders = await storage.getOrders();
      res.json(allOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/track/:token", async (req, res) => {
    try {
      const order = await storage.getOrderByTrackingToken(req.params.token);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Track active orders by phone or email
  app.get("/api/orders/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }
      const activeOrders = await storage.getActiveOrdersByPhoneOrEmail(q.trim());
      res.json(activeOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to search orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      // Validate request body with Zod schema
      const parseResult = publicOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return res.status(400).json({ error: firstError.message });
      }
      
      const { customerName, customerPhone, customerEmail, province, district, ward, streetAddress, pots, subtotal, shippingCost, paymentProofUrl, orderType } = parseResult.data;
      
      // Fetch tax settings and recalculate tax server-side to prevent tampering
      const taxEnabledSetting = await storage.getSetting("tax_enabled");
      const taxPercentageSetting = await storage.getSetting("tax_percentage");
      const isTaxEnabled = taxEnabledSetting?.value === "true";
      const taxPercentage = parseFloat(taxPercentageSetting?.value || "0");
      
      // Recalculate tax and total on server side (using validated values from Zod)
      const serverTaxAmount = isTaxEnabled ? Math.ceil((subtotal + shippingCost) * taxPercentage / 100) : 0;
      const serverTotal = subtotal + shippingCost + serverTaxAmount;
      const serverDeposit = Math.ceil(serverTotal / 2);
      const serverRemaining = serverTotal - serverDeposit;
      
      // Find or create customer
      let customer = await storage.getCustomerByPhone(customerPhone);
      if (!customer) {
        customer = await storage.createCustomer({
          fullName: customerName,
          phoneNumber: customerPhone,
          email: customerEmail,
          province,
          district,
          ward,
          streetAddress,
          customerType: "GUEST",
          totalOrders: 0,
          totalSpent: "0",
        });
      }
      
      const order = await storage.createOrder({
        customerId: customer.id,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        province,
        district: district || "",
        ward,
        streetAddress,
        pots,
        subtotal: String(subtotal),
        shippingCost: String(shippingCost),
        taxAmount: String(serverTaxAmount),
        totalAmount: String(serverTotal),
        depositAmount: String(serverDeposit),
        remainingAmount: String(serverRemaining),
        paymentProofUrl,
        orderType,
        status: "PENDING",
        depositPaid: false,
        remainingPaid: false,
      });
      
      // Update customer stats (use server-computed total to prevent tampering)
      await storage.updateCustomer(customer.id, {
        totalOrders: customer.totalOrders + 1,
        totalSpent: String(Number(customer.totalSpent) + serverTotal),
      });
      
      res.status(201).json({
        orderNumber: order.orderNumber,
        trackingToken: order.trackingToken,
      });
    } catch (error: any) {
      console.error("Create order error:", error);
      res.status(400).json({ error: error.message || "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrder(req.params.id, { status });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.patch("/api/orders/:id/assign", async (req, res) => {
    try {
      const { technicianId } = req.body;
      const order = await storage.updateOrder(req.params.id, { assignedTechnicianId: technicianId });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Update technician workload
      const tech = await storage.getTechnicianById(technicianId);
      if (tech) {
        await storage.updateTechnician(technicianId, {
          currentWorkload: tech.currentWorkload + 1,
        });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign technician" });
    }
  });

  app.patch("/api/orders/:id/payment", async (req, res) => {
    try {
      const { type } = req.body;
      const update = type === "deposit" ? { depositPaid: true, status: "CONFIRMED" } : { remainingPaid: true };
      const order = await storage.updateOrder(req.params.id, update as any);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  app.patch("/api/orders/:id/cancel", async (req, res) => {
    try {
      const { reason } = req.body;
      const order = await storage.updateOrder(req.params.id, { status: "CANCELLED", cancelReason: reason });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });

  // Shipping types routes
  app.get("/api/shipping-types", async (req, res) => {
    try {
      const types = await storage.getShippingTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipping types" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const allSettings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      allSettings.forEach(s => { settingsMap[s.key] = s.value; });
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      // Validate known settings keys and their value formats
      const allowedKeys = ["tax_enabled", "tax_percentage"];
      if (!allowedKeys.includes(key)) {
        return res.status(400).json({ error: "Invalid setting key" });
      }
      
      // Validate value format based on key
      if (key === "tax_enabled") {
        if (value !== "true" && value !== "false") {
          return res.status(400).json({ error: "tax_enabled must be 'true' or 'false'" });
        }
      } else if (key === "tax_percentage") {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          return res.status(400).json({ error: "tax_percentage must be a number between 0 and 100" });
        }
      }
      
      const updated = await storage.updateSetting(key, value);
      if (!updated) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // ========== CHATBOT ROUTES ==========
  
  // Get or create a chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const userType = (req.session as any)?.user?.role === "ADMIN" ? "ADMIN" : "CUSTOMER";
      const userId = (req.session as any)?.user?.id;
      // Use express sessionID - it's always available and persists via cookie
      const sessionId = req.sessionID;
      
      // Mark session as touched to ensure it's saved
      (req.session as any).chatActive = true;
      
      const conversation = await getOrCreateConversation(sessionId, userType, userId);
      const messages = await getChatMessages(conversation.id);
      
      // Include sessionId in response for debugging
      res.json({ conversation, messages, sessionId });
    } catch (error) {
      console.error("Error getting chat session:", error);
      res.status(500).json({ error: "Failed to get chat session" });
    }
  });

  // Send a message and get streaming response
  app.post("/api/chat/message", async (req, res) => {
    try {
      const { conversationId, message } = req.body;
      
      if (!conversationId || !message) {
        return res.status(400).json({ error: "Conversation ID and message are required" });
      }
      
      // Get the conversation and verify ownership
      const conversation = await getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const currentSessionId = req.sessionID;
      const currentUserId = (req.session as any)?.user?.id;
      const isAdmin = (req.session as any)?.user?.role === "ADMIN";
      
      // Verify conversation ownership: must match session ID or user ID
      const ownsConversation = 
        (conversation.sessionId && conversation.sessionId === currentSessionId) ||
        (conversation.userId && conversation.userId === currentUserId);
      
      if (!ownsConversation) {
        return res.status(403).json({ error: "Not authorized to access this conversation" });
      }
      
      // Determine the actual user type based on the conversation's type
      // This prevents CUSTOMER conversations from being used to get ADMIN data
      const userType = conversation.userType as "CUSTOMER" | "ADMIN";
      
      // If conversation is ADMIN type, verify the user is actually an admin
      if (userType === "ADMIN" && !isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      // Handle client disconnect
      let isAborted = false;
      res.on("close", () => {
        isAborted = true;
      });
      
      const stream = streamChatResponse(conversationId, message, {
        userType,
        userId: currentUserId,
        sessionId: currentSessionId
      });
      
      for await (const content of stream) {
        if (isAborted) break;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      
      if (!isAborted) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
      res.end();
    } catch (error) {
      console.error("Error in chat message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  // Get chat history - requires ownership verification
  app.get("/api/chat/messages/:conversationId", async (req, res) => {
    try {
      const conversation = await getConversationById(req.params.conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const currentSessionId = req.sessionID;
      const currentUserId = (req.session as any)?.user?.id;
      
      // Verify ownership
      const ownsConversation = 
        (conversation.sessionId && conversation.sessionId === currentSessionId) ||
        (conversation.userId && conversation.userId === currentUserId);
      
      if (!ownsConversation) {
        return res.status(403).json({ error: "Not authorized to access this conversation" });
      }
      
      const messages = await getChatMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });
}
