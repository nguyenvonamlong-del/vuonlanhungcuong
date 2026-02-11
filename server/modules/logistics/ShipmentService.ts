import { storage } from "../../storage";
import { db } from "../../db";
import { outboundShipments, inboundShipments, orders } from "@shared/schema";
import { eq, and, lt, isNull, inArray, sql } from "drizzle-orm";
import type {
  OutboundShipment, InsertOutboundShipment,
  InboundShipment, InsertInboundShipment,
} from "@shared/schema";

const OUTBOUND_VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED", "RETURNED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RETURNED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED", "RETURNED"],
  DELIVERED: [],
  FAILED: ["PENDING"],
  RETURNED: [],
};

const INBOUND_VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED", "RETURNED"],
  IN_TRANSIT: ["RECEIVED", "FAILED", "RETURNED"],
  RECEIVED: [],
  FAILED: ["PENDING"],
  RETURNED: [],
};

export class ShipmentService {
  static async getOutboundShipments(): Promise<OutboundShipment[]> {
    return storage.getOutboundShipments();
  }

  static async getOutboundShipmentsByOrderId(orderId: string): Promise<OutboundShipment[]> {
    return storage.getOutboundShipmentsByOrderId(orderId);
  }

  static async getOutboundShipmentById(id: string): Promise<OutboundShipment | undefined> {
    return storage.getOutboundShipmentById(id);
  }

  static async createOutboundShipment(
    data: InsertOutboundShipment,
    createdBy?: string
  ): Promise<OutboundShipment> {
    const shipmentData: any = { ...data };
    if (createdBy) {
      shipmentData.createdBy = createdBy;
    }
    shipmentData.lastStatusUpdate = new Date();
    return storage.createOutboundShipment(shipmentData);
  }

  static async updateOutboundShipment(
    id: string,
    data: Partial<InsertOutboundShipment>,
    updatedBy?: string
  ): Promise<OutboundShipment | undefined> {
    const existing = await storage.getOutboundShipmentById(id);
    if (!existing) return undefined;

    const updateData: any = { ...data };
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    if (data.status && data.status !== existing.status) {
      const validNext = OUTBOUND_VALID_TRANSITIONS[existing.status] || [];
      if (!validNext.includes(data.status)) {
        throw new Error(`Invalid shipment status transition: ${existing.status} -> ${data.status}`);
      }
      updateData.lastStatusUpdate = new Date();

      if (data.status === "PICKED_UP" && !existing.pickedUpAt) {
        updateData.pickedUpAt = new Date();
      }
      if (data.status === "DELIVERED" && !existing.actualDelivery) {
        updateData.actualDelivery = new Date();
      }
    }

    const updated = await storage.updateOutboundShipment(id, updateData);

    if (updated && data.status === "DELIVERED") {
      await this.syncOrderStatusOnDelivery(updated.orderId);
    }

    return updated;
  }

  static async getInboundShipments(): Promise<InboundShipment[]> {
    return storage.getInboundShipments();
  }

  static async getInboundShipmentsByPurchaseOrderId(purchaseOrderId: string): Promise<InboundShipment[]> {
    return storage.getInboundShipmentsByPurchaseOrderId(purchaseOrderId);
  }

  static async getInboundShipmentById(id: string): Promise<InboundShipment | undefined> {
    return storage.getInboundShipmentById(id);
  }

  static async createInboundShipment(
    data: InsertInboundShipment,
    createdBy?: string
  ): Promise<InboundShipment> {
    const shipmentData: any = { ...data };
    if (createdBy) {
      shipmentData.createdBy = createdBy;
    }
    shipmentData.lastStatusUpdate = new Date();
    return storage.createInboundShipment(shipmentData);
  }

  static async updateInboundShipment(
    id: string,
    data: Partial<InsertInboundShipment>,
    updatedBy?: string
  ): Promise<InboundShipment | undefined> {
    const existing = await storage.getInboundShipmentById(id);
    if (!existing) return undefined;

    const updateData: any = { ...data };
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    if (data.status && data.status !== existing.status) {
      const validNext = INBOUND_VALID_TRANSITIONS[existing.status] || [];
      if (!validNext.includes(data.status)) {
        throw new Error(`Invalid shipment status transition: ${existing.status} -> ${data.status}`);
      }
      updateData.lastStatusUpdate = new Date();

      if (data.status === "RECEIVED" && !existing.actualDelivery) {
        updateData.actualDelivery = new Date();
      }
    }

    return storage.updateInboundShipment(id, updateData);
  }

  static async getDelayedOutboundShipments(): Promise<OutboundShipment[]> {
    const now = new Date();
    return db.select().from(outboundShipments)
      .where(and(
        lt(outboundShipments.expectedDelivery, now),
        isNull(outboundShipments.actualDelivery),
        inArray(outboundShipments.status, ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"])
      ));
  }

  static async getDelayedInboundShipments(): Promise<InboundShipment[]> {
    const now = new Date();
    return db.select().from(inboundShipments)
      .where(and(
        lt(inboundShipments.expectedDelivery, now),
        isNull(inboundShipments.actualDelivery),
        inArray(inboundShipments.status, ["PENDING", "PICKED_UP", "IN_TRANSIT"])
      ));
  }

  static async getShipmentStats(): Promise<{
    outbound: { total: number; pending: number; inTransit: number; delivered: number; delayed: number; failed: number };
    inbound: { total: number; pending: number; inTransit: number; received: number; delayed: number; failed: number };
  }> {
    const outboundResult = await db.execute(sql`
      SELECT
        count(*)::int as total,
        count(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending,
        count(CASE WHEN status IN ('PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY') THEN 1 END)::int as "inTransit",
        count(CASE WHEN status = 'DELIVERED' THEN 1 END)::int as delivered,
        count(CASE WHEN expected_delivery < NOW() AND actual_delivery IS NULL AND status NOT IN ('DELIVERED', 'FAILED', 'RETURNED') THEN 1 END)::int as delayed,
        count(CASE WHEN status IN ('FAILED', 'RETURNED') THEN 1 END)::int as failed
      FROM outbound_shipments
    `);

    const inboundResult = await db.execute(sql`
      SELECT
        count(*)::int as total,
        count(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending,
        count(CASE WHEN status IN ('PICKED_UP', 'IN_TRANSIT') THEN 1 END)::int as "inTransit",
        count(CASE WHEN status = 'RECEIVED' THEN 1 END)::int as received,
        count(CASE WHEN expected_arrival < NOW() AND actual_arrival IS NULL AND status NOT IN ('RECEIVED', 'FAILED', 'RETURNED') THEN 1 END)::int as delayed,
        count(CASE WHEN status IN ('FAILED', 'RETURNED') THEN 1 END)::int as failed
      FROM inbound_shipments
    `);

    const outboundStats = outboundResult.rows[0] as any || { total: 0, pending: 0, inTransit: 0, delivered: 0, delayed: 0, failed: 0 };
    const inboundStats = inboundResult.rows[0] as any || { total: 0, pending: 0, inTransit: 0, received: 0, delayed: 0, failed: 0 };

    return {
      outbound: outboundStats,
      inbound: inboundStats,
    };
  }

  private static async syncOrderStatusOnDelivery(orderId: string): Promise<void> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (order && order.status === "SHIPPING") {
        await db.update(orders)
          .set({ status: "DELIVERED", updatedAt: new Date() })
          .where(eq(orders.id, orderId));
      }
    } catch (err) {
      console.error(`[ShipmentService] Failed to sync order status on delivery for order ${orderId}:`, err);
    }
  }
}
