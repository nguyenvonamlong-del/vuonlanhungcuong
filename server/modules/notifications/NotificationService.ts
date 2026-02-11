import { storage } from "../../storage";
import type { Notification, InsertNotification } from "@shared/schema";

export class NotificationService {
  static async getNotifications(recipientType?: string, recipientId?: string): Promise<Notification[]> {
    return storage.getNotifications(recipientType, recipientId);
  }

  static async getNotificationById(id: string): Promise<Notification | undefined> {
    return storage.getNotificationById(id);
  }

  static async createNotification(data: InsertNotification): Promise<Notification> {
    return storage.createNotification(data);
  }

  static async markAsRead(id: string): Promise<Notification | undefined> {
    return storage.markNotificationRead(id);
  }

  static async deleteNotification(id: string): Promise<void> {
    return storage.deleteNotification(id);
  }

  static async notifyOrderCreated(orderId: string, orderNumber: string): Promise<void> {
    try {
      await storage.createNotification({
        type: "ORDER_CREATED",
        recipientType: "ADMIN",
        title: `New Order: ${orderNumber}`,
        message: `A new order ${orderNumber} has been placed.`,
        channel: "SYSTEM",
        status: "PENDING",
      });
    } catch (e) {
      console.error("Failed to create order notification:", e);
    }
  }

  static async notifyPaymentReceived(orderId: string, orderNumber: string, amount: number): Promise<void> {
    try {
      await storage.createNotification({
        type: "PAYMENT_RECEIVED",
        recipientType: "ADMIN",
        title: `Payment Received: ${orderNumber}`,
        message: `Payment of ${amount.toLocaleString()}₫ received for order ${orderNumber}.`,
        channel: "SYSTEM",
        status: "PENDING",
        relatedEntity: "ORDER",
        relatedEntityId: orderId,
      });
    } catch (e) {
      console.error("Failed to create payment notification:", e);
    }
  }

  static async notifyLowStock(itemType: string, itemName: string, currentStock: number): Promise<void> {
    try {
      await storage.createNotification({
        type: "LOW_STOCK",
        recipientType: "ADMIN",
        title: `Low Stock Alert: ${itemName}`,
        message: `${itemName} (${itemType}) stock is low: ${currentStock} remaining.`,
        channel: "SYSTEM",
        status: "PENDING",
      });
    } catch (e) {
      console.error("Failed to create low stock notification:", e);
    }
  }
}
