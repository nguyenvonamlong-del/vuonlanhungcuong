import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertCatalogItemSchema, insertPremadePotSchema, insertTechnicianSchema, insertOrderSchema, insertCustomerSchema, insertShippingTypeSchema, insertUserSchema } from "@shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { z } from "zod";
import { randomUUID } from "crypto";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { getOrCreateConversation, getChatMessages, streamChatResponse, getConversationById, getConversationAnalytics, getAllConversations, updateConversationStatus, linkConversationToEntity } from "./chatbot";
import { cache, CACHE_KEYS, CACHE_TTL } from "./cache";
import { OrderService } from "./modules/orders/OrderService";
import { InventoryService } from "./modules/inventory/InventoryService";
import { PaymentService } from "./modules/payments/PaymentService";
import { ShipmentService } from "./modules/logistics/ShipmentService";
import { generatePotTypeSku, generateDecorationTypeSku, generatePremadePotSku, ensureUniqueSku } from "./utils/sku-generator";

function generatePremadePotTags(data: any): string[] {
  const tags: string[] = [];
  if (data.orchidComposition && Array.isArray(data.orchidComposition)) {
    for (const item of data.orchidComposition) {
      if (item.catalogItemId) {
        const tag = `orchid:${item.catalogItemId}`;
        if (!tags.includes(tag)) tags.push(tag);
      }
    }
  }
  if (data.decorations && Array.isArray(data.decorations)) {
    for (const item of data.decorations) {
      if (item.decorationTypeId) {
        const tag = `decoration:${item.decorationTypeId}`;
        if (!tags.includes(tag)) tags.push(tag);
      }
    }
  }
  if (data.potTypeId) {
    tags.push(`pot:${data.potTypeId}`);
  }
  return tags;
}

async function isItemSkuLocked(itemType: "POT_TYPE" | "DECORATION_TYPE" | "PREMADE_POT", itemId: string): Promise<boolean> {
  if (itemType === "POT_TYPE") {
    const orderRef = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM orders, jsonb_array_elements(pots) AS p WHERE p->>'potTypeId' = $1) AS referenced`,
      [itemId]
    );
    if (orderRef.rows[0]?.referenced) return true;
    const poRef = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM purchase_orders, jsonb_array_elements(items) AS i WHERE i->>'itemId' = $1 AND i->>'itemType' = 'POT') AS referenced`,
      [itemId]
    );
    return poRef.rows[0]?.referenced || false;
  }
  if (itemType === "DECORATION_TYPE") {
    const orderRef = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM orders, jsonb_array_elements(pots) AS p WHERE p->>'decorationTypeId' = $1) AS referenced`,
      [itemId]
    );
    if (orderRef.rows[0]?.referenced) return true;
    const poRef = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM purchase_orders, jsonb_array_elements(items) AS i WHERE i->>'itemId' = $1 AND i->>'itemType' = 'DECORATION') AS referenced`,
      [itemId]
    );
    return poRef.rows[0]?.referenced || false;
  }
  if (itemType === "PREMADE_POT") {
    const orderRef = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM orders, jsonb_array_elements(pots) AS p WHERE p->>'potId' = $1) AS referenced`,
      [itemId]
    );
    if (orderRef.rows[0]?.referenced) return true;
    const poRef = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM purchase_orders, jsonb_array_elements(items) AS i WHERE i->>'itemId' = $1) AS referenced`,
      [itemId]
    );
    return poRef.rows[0]?.referenced || false;
  }
  return false;
}

async function checkSkuExists(table: string, sku: string, excludeId?: string): Promise<boolean> {
  const query = excludeId
    ? `SELECT EXISTS(SELECT 1 FROM ${table} WHERE sku = $1 AND id != $2) AS exists`
    : `SELECT EXISTS(SELECT 1 FROM ${table} WHERE sku = $1) AS exists`;
  const params = excludeId ? [sku, excludeId] : [sku];
  const result = await pool.query(query, params);
  return result.rows[0]?.exists || false;
}

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
  // Trust proxy for production (Replit runs behind a reverse proxy)
  app.set("trust proxy", 1);

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
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  // Object storage routes for file uploads
  registerObjectStorageRoutes(app);

  async function logActivity(req: any, action: string, entityType: string, entityId: string | null, description: string, metadata?: any) {
    try {
      await storage.createActivity({
        userId: (req.session as any)?.userId || null,
        action,
        entityType,
        entityId,
        description,
        metadata: metadata || null,
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  }

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
      req.session.save(async (err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        await logActivity(req, "LOGIN", "AUTH", user.id, "User logged in: " + user.username);
        res.json({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        });
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (userId) {
      await logActivity(req, "LOGOUT", "AUTH", userId, "User logged out");
    }
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

  // Cache management (admin only)
  app.post("/api/admin/cache/clear", async (req, res) => {
    try {
      cache.clear();
      res.json({ success: true, message: "All caches cleared" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  // Catalog routes
  app.get("/api/catalog", async (req, res) => {
    try {
      const refresh = req.query.refresh === "true";
      if (!refresh) {
        const cached = cache.get(CACHE_KEYS.CATALOG_ITEMS);
        if (cached) return res.json(cached);
      }
      const items = await storage.getCatalogItems();
      cache.set(CACHE_KEYS.CATALOG_ITEMS, items, CACHE_TTL.MEDIUM);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch catalog" });
    }
  });

  // Pot Types
  app.get("/api/pot-types", async (req, res) => {
    try {
      const cached = cache.get(CACHE_KEYS.POT_TYPES);
      if (cached) return res.json(cached);
      const types = await storage.getPotTypes();
      cache.set(CACHE_KEYS.POT_TYPES, types, CACHE_TTL.LONG);
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pot types" });
    }
  });

  // Decoration Types
  app.get("/api/decoration-types", async (req, res) => {
    try {
      const cached = cache.get(CACHE_KEYS.DECORATION_TYPES);
      if (cached) return res.json(cached);
      const types = await storage.getDecorationTypes();
      cache.set(CACHE_KEYS.DECORATION_TYPES, types, CACHE_TTL.LONG);
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch decoration types" });
    }
  });

  app.post("/api/catalog", async (req, res) => {
    try {
      const data = insertCatalogItemSchema.parse(req.body);
      const item = await storage.createCatalogItem(data);
      cache.invalidate(CACHE_KEYS.CATALOG_ITEMS);
      await logActivity(req, "CREATE", "CATALOG", item.id, "Created catalog item: " + (item as any).speciesNameVi);
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
      cache.invalidate(CACHE_KEYS.CATALOG_ITEMS);
      await logActivity(req, "UPDATE", "CATALOG", req.params.id, "Updated catalog item: " + req.params.id);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/catalog/:id", async (req, res) => {
    try {
      await storage.deleteCatalogItem(req.params.id);
      cache.invalidate(CACHE_KEYS.CATALOG_ITEMS);
      await logActivity(req, "DELETE", "CATALOG", req.params.id, "Deleted catalog item: " + req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // Premade pots routes
  app.get("/api/premade-pots", async (req, res) => {
    try {
      const cached = cache.get(CACHE_KEYS.ALL_POTS);
      if (cached) return res.json(cached);
      const pots = await storage.getPremadePots();
      const enriched = pots.map((pot: any) => {
        if (!pot.tags || pot.tags.length === 0) {
          pot.tags = generatePremadePotTags(pot);
        }
        return pot;
      });
      cache.set(CACHE_KEYS.ALL_POTS, enriched, CACHE_TTL.MEDIUM);
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pots" });
    }
  });

  app.get("/api/shop/pots", async (req, res) => {
    try {
      const cached = cache.get(CACHE_KEYS.ACTIVE_POTS);
      if (cached) return res.json(cached);
      const pots = await storage.getActivePremadePots();
      const enriched = pots.map((pot: any) => {
        if (!pot.tags || pot.tags.length === 0) {
          pot.tags = generatePremadePotTags(pot);
        }
        return pot;
      });
      cache.set(CACHE_KEYS.ACTIVE_POTS, enriched, CACHE_TTL.MEDIUM);
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pots" });
    }
  });

  app.post("/api/premade-pots", async (req, res) => {
    try {
      const data = insertPremadePotSchema.parse(req.body);
      if (!data.tags || data.tags.length === 0) {
        data.tags = generatePremadePotTags(data);
      }
      if (!data.sku && data.nameVi) {
        const baseSku = generatePremadePotSku(data.nameVi, data.potTypeName || undefined);
        data.sku = await ensureUniqueSku(baseSku, (s) => checkSkuExists("premade_pots", s));
      }
      const pot = await storage.createPremadePot(data);
      cache.invalidate(CACHE_KEYS.ALL_POTS);
      cache.invalidate(CACHE_KEYS.ACTIVE_POTS);
      await logActivity(req, "CREATE", "PREMADE_POT", pot.id, "Created premade pot: " + pot.nameVi);
      res.status(201).json(pot);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid data" });
    }
  });

  app.patch("/api/premade-pots/:id", async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.orchidComposition || body.decorations || body.potTypeId || body.orchidTypes) {
        body.tags = generatePremadePotTags(body);
      }
      if (body.sku !== undefined) {
        const existing = await pool.query("SELECT sku FROM premade_pots WHERE id = $1", [req.params.id]);
        const currentSku = existing.rows[0]?.sku;
        if (body.sku !== currentSku) {
          const locked = await isItemSkuLocked("PREMADE_POT", req.params.id);
          if (locked) {
            return res.status(400).json({ error: "SKU cannot be changed - item is referenced by orders or purchase orders" });
          }
        }
      }
      const pot = await storage.updatePremadePot(req.params.id, body);
      if (!pot) {
        return res.status(404).json({ error: "Pot not found" });
      }
      cache.invalidate(CACHE_KEYS.ALL_POTS);
      cache.invalidate(CACHE_KEYS.ACTIVE_POTS);
      await logActivity(req, "UPDATE", "PREMADE_POT", req.params.id, "Updated premade pot: " + req.params.id);
      res.json(pot);
    } catch (error) {
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/premade-pots/:id", async (req, res) => {
    try {
      await storage.deletePremadePot(req.params.id);
      cache.invalidate(CACHE_KEYS.ALL_POTS);
      cache.invalidate(CACHE_KEYS.ACTIVE_POTS);
      await logActivity(req, "DELETE", "PREMADE_POT", req.params.id, "Deleted premade pot: " + req.params.id);
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
      await logActivity(req, "CREATE", "TECHNICIAN", tech.id, "Created technician: " + tech.fullName);
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
      await logActivity(req, "UPDATE", "TECHNICIAN", req.params.id, "Updated technician: " + req.params.id);
      res.json(tech);
    } catch (error) {
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/technicians/:id", async (req, res) => {
    try {
      await storage.deleteTechnician(req.params.id);
      await logActivity(req, "DELETE", "TECHNICIAN", req.params.id, "Deleted technician: " + req.params.id);
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

  app.post("/api/customers", async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      await logActivity(req, "CREATE", "CUSTOMER", customer.id, "Created customer: " + customer.fullName);
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      await logActivity(req, "UPDATE", "CUSTOMER", req.params.id, "Updated customer: " + req.params.id);
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const allOrders = await OrderService.getOrders();
      res.json(allOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/track/:token", async (req, res) => {
    try {
      const token = req.params.token;
      let order = await OrderService.getOrderByOrderNumber(token);
      if (!order) {
        order = await OrderService.getOrderByTrackingToken(token);
      }
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

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
      const parseResult = publicOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return res.status(400).json({ error: firstError.message });
      }
      
      const result = await OrderService.createOrderFromPublicInput(parseResult.data);
      
      cache.invalidate(CACHE_KEYS.DASHBOARD_STATS);
      await logActivity(req, "CREATE", "ORDER", result.order.id, "New order #" + result.orderNumber + " placed by " + parseResult.data.customerName, { total: result.order.totalAmount, pots: parseResult.data.pots.length });
      res.status(201).json({
        orderNumber: result.orderNumber,
        trackingToken: result.trackingToken,
      });
    } catch (error: any) {
      console.error("Create order error:", error);
      res.status(400).json({ error: error.message || "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const userId = (req.session as any)?.userId;
      const order = await OrderService.transitionStatus(req.params.id, status, userId);
      cache.invalidate(CACHE_KEYS.DASHBOARD_STATS);
      await logActivity(req, "UPDATE", "ORDER", req.params.id, "Order status changed to: " + status, { status });
      res.json(order);
    } catch (error: any) {
      if (error.message.includes("Invalid status transition") || error.message.includes("Unknown order status")) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.get("/api/orders/:id/transitions", async (req, res) => {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const allowed = OrderService.getAllowedTransitions(order.status);
      res.json({ currentStatus: order.status, allowedTransitions: allowed });
    } catch (error) {
      res.status(500).json({ error: "Failed to get transitions" });
    }
  });

  app.patch("/api/orders/:id/assign", async (req, res) => {
    try {
      const { technicianId } = req.body;
      const userId = (req.session as any)?.userId;
      const order = await OrderService.assignTechnician(req.params.id, technicianId, userId);
      cache.invalidate(CACHE_KEYS.DASHBOARD_STATS);
      await logActivity(req, "UPDATE", "ORDER", req.params.id, "Technician assigned to order", { technicianId });
      res.json(order);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to assign technician" });
    }
  });

  app.patch("/api/orders/:id/payment", async (req, res) => {
    try {
      const { type } = req.body;
      const userId = (req.session as any)?.userId;
      let payment;
      if (type === "deposit") {
        payment = await PaymentService.markDepositPaid(req.params.id, userId);
      } else {
        payment = await PaymentService.markRemainingPaid(req.params.id, userId);
      }
      cache.invalidate(CACHE_KEYS.DASHBOARD_STATS);
      await logActivity(req, "UPDATE", "PAYMENT", payment.id, "Payment recorded: " + type + " for order " + req.params.id, { type });
      const summary = await PaymentService.getOrderPaymentSummary(req.params.id);
      res.json({ ...summary, paymentId: payment.id });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message || "Failed to update payment" });
    }
  });

  app.patch("/api/orders/:id/cancel", async (req, res) => {
    try {
      const { reason } = req.body;
      const userId = (req.session as any)?.userId;
      const order = await OrderService.cancelOrder(req.params.id, reason, userId);
      cache.invalidate(CACHE_KEYS.DASHBOARD_STATS);
      await logActivity(req, "UPDATE", "ORDER", req.params.id, "Order cancelled", { reason });
      res.json(order);
    } catch (error: any) {
      if (error.message.includes("Invalid status transition")) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });

  // ==================== PAYMENTS ====================
  app.get("/api/payments/order/:orderId", async (req, res) => {
    try {
      const payments = await PaymentService.getPaymentsByOrderId(req.params.orderId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/order/:orderId/summary", async (req, res) => {
    try {
      const summary = await PaymentService.getOrderPaymentSummary(req.params.orderId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment summary" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = (req.session as any).userId;
      const payment = await PaymentService.createPayment(req.body, userId);
      await logActivity(req, "CREATE", "PAYMENT", payment.id, "Payment created for order: " + req.body.orderId, { amount: req.body.amount });
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create payment" });
    }
  });

  app.patch("/api/payments/:id/verify", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = (req.session as any).userId;
      const payment = await PaymentService.verifyPayment(req.params.id, userId);
      await logActivity(req, "UPDATE", "PAYMENT", req.params.id, "Payment verified", { amount: payment.amount });
      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to verify payment" });
    }
  });

  app.patch("/api/payments/:id/reject", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = (req.session as any).userId;
      const payment = await PaymentService.rejectPayment(req.params.id, userId);
      await logActivity(req, "UPDATE", "PAYMENT", req.params.id, "Payment rejected");
      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to reject payment" });
    }
  });

  // ==================== INVENTORY ====================
  app.get("/api/inventory", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const items = await InventoryService.getInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/:itemType/:itemId", async (req, res) => {
    try {
      const item = await InventoryService.getInventoryForItem(req.params.itemType, req.params.itemId);
      res.json(item || { stockQuantity: 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory item" });
    }
  });

  app.post("/api/inventory/adjust", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { itemType, itemId, quantityChange, reason, entityType, entityId } = req.body;
      const userId = (req.session as any).userId;
      const result = await InventoryService.adjustStock(
        itemType, itemId, quantityChange, reason, entityType, entityId, userId
      );
      await logActivity(req, "UPDATE", "INVENTORY", result.inventoryItem.id, 
        `Inventory adjusted: ${itemType}:${itemId} by ${quantityChange} (${reason})`,
        { itemType, itemId, quantityChange, reason }
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to adjust inventory" });
    }
  });

  app.get("/api/inventory/transactions", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { itemType, itemId } = req.query;
      const transactions = await InventoryService.getTransactions(
        itemType as string | undefined,
        itemId as string | undefined
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory transactions" });
    }
  });

  // ==================== SHIPMENTS ====================
  app.get("/api/shipments/outbound", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const shipments = await ShipmentService.getOutboundShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outbound shipments" });
    }
  });

  app.get("/api/shipments/outbound/order/:orderId", async (req, res) => {
    try {
      const shipments = await ShipmentService.getOutboundShipmentsByOrderId(req.params.orderId);
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments for order" });
    }
  });

  app.post("/api/shipments/outbound", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = (req.session as any).userId;
      const shipment = await ShipmentService.createOutboundShipment(req.body, userId);
      await logActivity(req, "CREATE", "SHIPMENT", shipment.id, "Outbound shipment created for order: " + req.body.orderId);
      res.status(201).json(shipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create shipment" });
    }
  });

  app.patch("/api/shipments/outbound/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = (req.session as any).userId;
      const shipment = await ShipmentService.updateOutboundShipment(req.params.id, req.body, userId);
      if (!shipment) return res.status(404).json({ error: "Shipment not found" });
      await logActivity(req, "UPDATE", "SHIPMENT", req.params.id, 
        `Outbound shipment updated${req.body.status ? ` -> ${req.body.status}` : ""}`);
      res.json(shipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update shipment" });
    }
  });

  app.get("/api/shipments/inbound", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const shipments = await ShipmentService.getInboundShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inbound shipments" });
    }
  });

  app.get("/api/shipments/inbound/purchase-order/:purchaseOrderId", async (req, res) => {
    try {
      const shipments = await ShipmentService.getInboundShipmentsByPurchaseOrderId(req.params.purchaseOrderId);
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments for purchase order" });
    }
  });

  app.post("/api/shipments/inbound", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = (req.session as any).userId;
      const shipment = await ShipmentService.createInboundShipment(req.body, userId);
      await logActivity(req, "CREATE", "SHIPMENT", shipment.id, "Inbound shipment created for PO: " + req.body.purchaseOrderId);
      res.status(201).json(shipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create shipment" });
    }
  });

  app.patch("/api/shipments/inbound/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userId = (req.session as any).userId;
      const shipment = await ShipmentService.updateInboundShipment(req.params.id, req.body, userId);
      if (!shipment) return res.status(404).json({ error: "Shipment not found" });
      await logActivity(req, "UPDATE", "SHIPMENT", req.params.id, 
        `Inbound shipment updated${req.body.status ? ` -> ${req.body.status}` : ""}`);
      res.json(shipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update shipment" });
    }
  });

  app.get("/api/shipments/delayed", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [delayedOutbound, delayedInbound] = await Promise.all([
        ShipmentService.getDelayedOutboundShipments(),
        ShipmentService.getDelayedInboundShipments(),
      ]);
      res.json({ outbound: delayedOutbound, inbound: delayedInbound });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delayed shipments" });
    }
  });

  app.get("/api/shipments/stats", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const stats = await ShipmentService.getShipmentStats();
      res.json(stats);
    } catch (error: any) {
      console.error("[ShipmentService] Stats error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch shipment stats" });
    }
  });

  // Shipping types routes
  app.get("/api/shipping-types", async (req, res) => {
    try {
      const cached = cache.get(CACHE_KEYS.SHIPPING_TYPES);
      if (cached) return res.json(cached);
      const types = await storage.getShippingTypes();
      cache.set(CACHE_KEYS.SHIPPING_TYPES, types, CACHE_TTL.LONG);
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipping types" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const cached = cache.get(CACHE_KEYS.DASHBOARD_STATS);
      if (cached) return res.json(cached);
      const stats = await storage.getDashboardStats();
      cache.set(CACHE_KEYS.DASHBOARD_STATS, stats, CACHE_TTL.SHORT);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const cached = cache.get(CACHE_KEYS.SETTINGS);
      if (cached) return res.json(cached);
      const allSettings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      allSettings.forEach(s => { settingsMap[s.key] = s.value; });
      cache.set(CACHE_KEYS.SETTINGS, settingsMap, CACHE_TTL.LONG);
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
      const allowedKeys = [
        "tax_enabled", 
        "tax_percentage",
        "show_premade_dimensions",
        "show_premade_weight",
        "plivo_auth_id",
        "plivo_auth_token",
        "zeptomail_token",
        "zalo_app_id",
        "zalo_secret_key"
      ];
      if (!allowedKeys.includes(key)) {
        return res.status(400).json({ error: "Invalid setting key" });
      }
      
      // Validate value format based on key
      if (key === "tax_enabled" || key === "show_premade_dimensions" || key === "show_premade_weight") {
        if (value !== "true" && value !== "false") {
          return res.status(400).json({ error: `${key} must be 'true' or 'false'` });
        }
      } else if (key === "tax_percentage") {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          return res.status(400).json({ error: "tax_percentage must be a number between 0 and 100" });
        }
      }
      
      const updated = await storage.updateSetting(key, value);
      cache.invalidate(CACHE_KEYS.SETTINGS);
      await logActivity(req, "UPDATE", "SETTING", key, "Setting updated: " + key, { value });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // ========== CHATBOT ROUTES ==========
  
  // Get or create a chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      let userType = "CUSTOMER";
      let userId = null;
      
      if (sessionUserId) {
        const sessionUser = await storage.getUserById(sessionUserId);
        if (sessionUser && sessionUser.role === "ADMIN") {
          userType = "ADMIN";
        }
        userId = sessionUserId;
      }
      
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
      const currentUserId = (req.session as any)?.userId;
      
      // Check if user is admin
      let isAdmin = false;
      if (currentUserId) {
        const sessionUser = await storage.getUserById(currentUserId);
        isAdmin = sessionUser?.role === "ADMIN";
      }
      
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
      const currentUserId = (req.session as any)?.userId;
      
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

  app.get("/api/chat/conversations", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { userType, status, intent } = req.query;
      const convos = await getAllConversations({
        userType: userType as string | undefined,
        status: status as string | undefined,
        intent: intent as string | undefined,
      });
      res.json(convos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/chat/analytics", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const analytics = await getConversationAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat analytics" });
    }
  });

  app.patch("/api/chat/conversations/:id/status", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { status } = req.body;
      if (!["ACTIVE", "RESOLVED", "ESCALATED", "ABANDONED"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await updateConversationStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ error: "Conversation not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update conversation status" });
    }
  });

  app.patch("/api/chat/conversations/:id/link", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { entityType, entityId } = req.body;
      if (!entityType || !entityId) {
        return res.status(400).json({ error: "entityType and entityId are required" });
      }
      const updated = await linkConversationToEntity(req.params.id, entityType, entityId);
      if (!updated) return res.status(404).json({ error: "Conversation not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to link conversation to entity" });
    }
  });

  // ==================== POT TYPES CRUD ====================
  app.post("/api/pot-types", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const data = { ...req.body };
      if (!data.sku && data.nameVi) {
        const baseSku = generatePotTypeSku(data.nameVi);
        data.sku = await ensureUniqueSku(baseSku, (s) => checkSkuExists("pot_types", s));
      }
      const created = await storage.createPotType(data);
      cache.invalidate(CACHE_KEYS.POT_TYPES);
      await logActivity(req, "CREATE", "POT_TYPE", created.id, "Created pot type: " + (created as any).nameVi);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create pot type" });
    }
  });

  app.put("/api/pot-types/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const data = { ...req.body };
      const existing = await pool.query("SELECT sku FROM pot_types WHERE id = $1", [req.params.id]);
      const currentSku = existing.rows[0]?.sku;
      if (data.sku && data.sku !== currentSku) {
        const locked = await isItemSkuLocked("POT_TYPE", req.params.id);
        if (locked) {
          return res.status(400).json({ error: "SKU cannot be changed - item is referenced by orders or purchase orders" });
        }
      }
      const updated = await storage.updatePotType(req.params.id, data);
      if (!updated) return res.status(404).json({ error: "Not found" });
      cache.invalidate(CACHE_KEYS.POT_TYPES);
      await logActivity(req, "UPDATE", "POT_TYPE", req.params.id, "Updated pot type: " + req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update pot type" });
    }
  });

  app.delete("/api/pot-types/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deletePotType(req.params.id);
      cache.invalidate(CACHE_KEYS.POT_TYPES);
      await logActivity(req, "DELETE", "POT_TYPE", req.params.id, "Deleted pot type: " + req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete pot type" });
    }
  });

  // ==================== DECORATION TYPES CRUD ====================

  app.post("/api/decoration-types", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const data = { ...req.body };
      if (!data.sku && data.nameVi) {
        const baseSku = generateDecorationTypeSku(data.nameVi);
        data.sku = await ensureUniqueSku(baseSku, (s) => checkSkuExists("decoration_types", s));
      }
      const created = await storage.createDecorationType(data);
      cache.invalidate(CACHE_KEYS.DECORATION_TYPES);
      await logActivity(req, "CREATE", "DECORATION_TYPE", created.id, "Created decoration type: " + (created as any).nameVi);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create decoration type" });
    }
  });

  app.put("/api/decoration-types/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const data = { ...req.body };
      const existing = await pool.query("SELECT sku FROM decoration_types WHERE id = $1", [req.params.id]);
      const currentSku = existing.rows[0]?.sku;
      if (data.sku && data.sku !== currentSku) {
        const locked = await isItemSkuLocked("DECORATION_TYPE", req.params.id);
        if (locked) {
          return res.status(400).json({ error: "SKU cannot be changed - item is referenced by orders or purchase orders" });
        }
      }
      const updated = await storage.updateDecorationType(req.params.id, data);
      if (!updated) return res.status(404).json({ error: "Not found" });
      cache.invalidate(CACHE_KEYS.DECORATION_TYPES);
      await logActivity(req, "UPDATE", "DECORATION_TYPE", req.params.id, "Updated decoration type: " + req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update decoration type" });
    }
  });

  app.delete("/api/decoration-types/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deleteDecorationType(req.params.id);
      cache.invalidate(CACHE_KEYS.DECORATION_TYPES);
      await logActivity(req, "DELETE", "DECORATION_TYPE", req.params.id, "Deleted decoration type: " + req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete decoration type" });
    }
  });

  app.get("/api/sku-lock/:type/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const typeMap: Record<string, "POT_TYPE" | "DECORATION_TYPE" | "PREMADE_POT"> = {
        "pot-type": "POT_TYPE",
        "decoration-type": "DECORATION_TYPE",
        "premade-pot": "PREMADE_POT",
      };
      const itemType = typeMap[req.params.type];
      if (!itemType) return res.status(400).json({ error: "Invalid type" });
      const locked = await isItemSkuLocked(itemType, req.params.id);
      res.json({ locked });
    } catch (error) {
      res.status(500).json({ error: "Failed to check SKU lock" });
    }
  });

  app.post("/api/generate-sku", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { type, nameVi, potTypeName } = req.body;
      let baseSku: string;
      let tableName: string;
      switch (type) {
        case "pot-type":
          baseSku = generatePotTypeSku(nameVi);
          tableName = "pot_types";
          break;
        case "decoration-type":
          baseSku = generateDecorationTypeSku(nameVi);
          tableName = "decoration_types";
          break;
        case "premade-pot":
          baseSku = generatePremadePotSku(nameVi, potTypeName);
          tableName = "premade_pots";
          break;
        default:
          return res.status(400).json({ error: "Invalid type" });
      }
      const sku = await ensureUniqueSku(baseSku, (s) => checkSkuExists(tableName, s));
      res.json({ sku });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate SKU" });
    }
  });

  // ==================== PAYMENT TYPES ====================
  app.get("/api/payment-types", async (req, res) => {
    try {
      const items = await storage.getPaymentTypes();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment types" });
    }
  });

  app.post("/api/payment-types", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const created = await storage.createPaymentType(req.body);
      await logActivity(req, "CREATE", "PAYMENT_TYPE", created.id, "Created payment type");
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment type" });
    }
  });

  app.put("/api/payment-types/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const updated = await storage.updatePaymentType(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      await logActivity(req, "UPDATE", "PAYMENT_TYPE", req.params.id, "Updated payment type: " + req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment type" });
    }
  });

  app.delete("/api/payment-types/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deletePaymentType(req.params.id);
      await logActivity(req, "DELETE", "PAYMENT_TYPE", req.params.id, "Deleted payment type: " + req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment type" });
    }
  });

  // ==================== SUPPLIERS ====================
  app.get("/api/suppliers", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const items = await storage.getSuppliers();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const supplier = await storage.getSupplierById(req.params.id);
      if (!supplier) return res.status(404).json({ error: "Supplier not found" });
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const created = await storage.createSupplier(req.body);
      await logActivity(req, "CREATE", "SUPPLIER", created.id, "Created supplier: " + (created as any).name);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const updated = await storage.updateSupplier(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Supplier not found" });
      await logActivity(req, "UPDATE", "SUPPLIER", req.params.id, "Updated supplier: " + req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deleteSupplier(req.params.id);
      await logActivity(req, "DELETE", "SUPPLIER", req.params.id, "Deleted supplier: " + req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // ==================== PURCHASE ORDERS ====================
  app.get("/api/purchase-orders", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const items = await storage.getPurchaseOrders();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  app.get("/api/purchase-orders/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const order = await storage.getPurchaseOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: "Purchase order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase order" });
    }
  });

  app.post("/api/purchase-orders", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const orderNumber = await storage.generatePurchaseOrderNumber();
      const created = await storage.createPurchaseOrder({
        ...req.body,
        orderNumber,
        createdBy: (req.session as any).user.id,
      });
      await logActivity(req, "CREATE", "PURCHASE_ORDER", created.id, "Created purchase order: " + orderNumber);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  app.put("/api/purchase-orders/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const updated = await storage.updatePurchaseOrder(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Purchase order not found" });
      await logActivity(req, "UPDATE", "PURCHASE_ORDER", req.params.id, "Updated purchase order: " + req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update purchase order" });
    }
  });

  // ==================== NOTIFICATIONS ====================
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { recipientType, recipientId } = req.query;
      const items = await storage.getNotifications(
        recipientType as string | undefined,
        recipientId as string | undefined
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const created = await storage.createNotification(req.body);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const updated = await storage.markNotificationRead(req.params.id);
      if (!updated) return res.status(404).json({ error: "Notification not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const updated = await storage.updateNotification(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Notification not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ==================== ACTIVITIES (Audit Log) ====================
  app.get("/api/activities", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const limit = parseInt(req.query.limit as string) || 100;
      const items = await storage.getActivities(limit);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // ==================== PRIORITY TYPES ====================
  app.get("/api/priority-types", async (req, res) => {
    try {
      const items = await storage.getPriorityTypes();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch priority types" });
    }
  });

  app.post("/api/priority-types", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const item = await storage.createPriorityType(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create priority type" });
    }
  });

  app.put("/api/priority-types/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const item = await storage.updatePriorityType(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update priority type" });
    }
  });

  app.delete("/api/priority-types/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deletePriorityType(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete priority type" });
    }
  });

  // ==================== NOTIFICATION CHANNELS ====================
  app.get("/api/notification-channels", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const items = await storage.getNotificationChannels();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification channels" });
    }
  });

  app.post("/api/notification-channels", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const item = await storage.createNotificationChannel(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification channel" });
    }
  });

  app.put("/api/notification-channels/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const item = await storage.updateNotificationChannel(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification channel" });
    }
  });

  app.delete("/api/notification-channels/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.deleteNotificationChannel(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification channel" });
    }
  });

  // ==================== USERS MANAGEMENT ====================
  app.get("/api/users", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      // Check if user is admin
      const currentUser = await storage.getUserById((req.session as any).userId);
      if (!currentUser || currentUser.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const items = await storage.getUsers();
      // Remove passwords from response
      const safeUsers = items.map(({ password, ...rest }) => rest);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const currentUser = await storage.getUserById((req.session as any).userId);
      if (!currentUser || currentUser.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }
      // Validate request body using Zod schema (schema enforces role and status enums)
      const userData = insertUserSchema.parse(req.body);
      // Check if username already exists
      const existing = await storage.getUserByUsername(userData.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const item = await storage.createUser(userData);
      const { password: pwd, ...safeUser } = item;
      await logActivity(req, "CREATE", "USER", item.id, "Created user: " + item.username, { role: item.role });
      res.json(safeUser);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid data" });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const currentUser = await storage.getUserById((req.session as any).userId);
      if (!currentUser || currentUser.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }
      // Don't allow changing own account status or role
      if (req.params.id === (req.session as any).userId) {
        const existingUser = await storage.getUserById(req.params.id);
        if (existingUser && req.body.status && req.body.status !== existingUser.status) {
          return res.status(400).json({ error: "Cannot change your own status" });
        }
        if (existingUser && req.body.role && req.body.role !== existingUser.role) {
          return res.status(400).json({ error: "Cannot change your own role" });
        }
      }
      // Validate using partial schema - schema enforces role and status enums
      const updateUserSchema = insertUserSchema.partial().omit({ username: true });
      const validated = updateUserSchema.parse(req.body);
      
      // Pass validated data directly to storage
      const item = await storage.updateUser(req.params.id, validated);
      if (!item) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: pwd, ...safeUser } = item;
      await logActivity(req, "UPDATE", "USER", req.params.id, "Updated user: " + req.params.id);
      res.json(safeUser);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid data" });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const currentUser = await storage.getUserById((req.session as any).userId);
      if (!currentUser || currentUser.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }
      // Don't allow deleting own account
      if (req.params.id === (req.session as any).userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      await storage.deleteUser(req.params.id);
      await logActivity(req, "DELETE", "USER", req.params.id, "Deleted user: " + req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/users/:id/status", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const currentUser = await storage.getUserById((req.session as any).userId);
      if (!currentUser || currentUser.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }
      // Don't allow changing own account status
      if (req.params.id === (req.session as any).userId) {
        return res.status(400).json({ error: "Cannot change your own status" });
      }
      const { status } = req.body;
      if (!["ACTIVE", "INACTIVE"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const item = await storage.updateUser(req.params.id, { status });
      if (!item) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...safeUser } = item;
      await logActivity(req, "UPDATE", "USER", req.params.id, "User status changed to: " + status, { status });
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Update order priority
  app.patch("/api/orders/:id/priority", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { priorityId } = req.body;
      const order = await storage.updateOrder(req.params.id, { priorityId });
      cache.invalidate(CACHE_KEYS.DASHBOARD_STATS);
      await logActivity(req, "UPDATE", "ORDER", req.params.id, "Order priority updated", { priorityId });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order priority" });
    }
  });
}
