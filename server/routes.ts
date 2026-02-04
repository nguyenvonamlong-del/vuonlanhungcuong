import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertCatalogItemSchema, insertPremadePotSchema, insertTechnicianSchema, insertOrderSchema, insertCustomerSchema, insertShippingTypeSchema } from "@shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

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

  app.post("/api/orders", async (req, res) => {
    try {
      const { customerName, customerPhone, customerEmail, province, district, ward, streetAddress, pots, subtotal, shippingCost, totalAmount, depositAmount, remainingAmount, orderType } = req.body;
      
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
        customerEmail,
        province,
        district,
        ward,
        streetAddress,
        pots,
        subtotal: String(subtotal),
        shippingCost: String(shippingCost),
        totalAmount: String(totalAmount),
        depositAmount: String(depositAmount),
        remainingAmount: String(remainingAmount),
        orderType: orderType || "WEBSITE",
        status: "PENDING",
        depositPaid: false,
        remainingPaid: false,
      });
      
      // Update customer stats
      await storage.updateCustomer(customer.id, {
        totalOrders: customer.totalOrders + 1,
        totalSpent: String(Number(customer.totalSpent) + totalAmount),
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
}
