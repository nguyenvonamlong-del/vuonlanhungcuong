import { storage } from "../../storage";
import type { Order, InsertOrder } from "@shared/schema";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export class OrderService {
  static getAllowedTransitions(currentStatus: string): string[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }

  static validateTransition(currentStatus: string, newStatus: string): void {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed) {
      throw new Error(`Unknown order status: ${currentStatus}`);
    }
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed transitions: ${allowed.join(", ") || "none"}`
      );
    }
  }

  static async transitionStatus(
    orderId: string,
    newStatus: string,
    updatedBy?: string
  ): Promise<Order> {
    const order = await storage.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    this.validateTransition(order.status, newStatus);

    const updateData: any = {
      status: newStatus,
    };
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    const updated = await storage.updateOrder(orderId, updateData);
    if (!updated) {
      throw new Error(`Failed to update order: ${orderId}`);
    }
    return updated;
  }

  static async getOrders(): Promise<Order[]> {
    return storage.getOrders();
  }

  static async getOrderById(id: string): Promise<Order | undefined> {
    return storage.getOrderById(id);
  }

  static async getOrderByTrackingToken(token: string): Promise<Order | undefined> {
    return storage.getOrderByTrackingToken(token);
  }

  static async createOrder(orderData: InsertOrder, createdBy?: string): Promise<Order> {
    const data = { ...orderData };
    if (createdBy) {
      (data as any).createdBy = createdBy;
    }
    return storage.createOrder(data);
  }

  static async updateOrder(
    id: string,
    data: Partial<InsertOrder>,
    updatedBy?: string
  ): Promise<Order | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }
    return storage.updateOrder(id, updateData);
  }
}
