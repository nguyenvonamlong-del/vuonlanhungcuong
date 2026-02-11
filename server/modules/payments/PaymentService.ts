import { storage } from "../../storage";
import type { Payment, InsertPayment } from "@shared/schema";

export class PaymentService {
  static async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return storage.getPaymentsByOrderId(orderId);
  }

  static async getPaymentById(id: string): Promise<Payment | undefined> {
    return storage.getPaymentById(id);
  }

  static async createPayment(data: InsertPayment, createdBy?: string): Promise<Payment> {
    const paymentData: any = { ...data };
    if (createdBy) {
      paymentData.createdBy = createdBy;
    }
    return storage.createPayment(paymentData);
  }

  static async verifyPayment(id: string, createdBy?: string): Promise<Payment> {
    const payment = await storage.getPaymentById(id);
    if (!payment) {
      throw new Error(`Payment not found: ${id}`);
    }
    if (payment.status !== "PENDING") {
      throw new Error(`Payment ${id} is already ${payment.status}`);
    }

    const updated = await storage.updatePayment(id, {
      status: "VERIFIED",
      paidAt: new Date(),
    });
    if (!updated) {
      throw new Error(`Failed to verify payment: ${id}`);
    }
    return updated;
  }

  static async rejectPayment(id: string): Promise<Payment> {
    const payment = await storage.getPaymentById(id);
    if (!payment) {
      throw new Error(`Payment not found: ${id}`);
    }
    if (payment.status !== "PENDING") {
      throw new Error(`Payment ${id} is already ${payment.status}`);
    }

    const updated = await storage.updatePayment(id, {
      status: "REJECTED",
    });
    if (!updated) {
      throw new Error(`Failed to reject payment: ${id}`);
    }
    return updated;
  }

  static async getOrderPaymentSummary(orderId: string): Promise<{
    payments: Payment[];
    totalPaid: number;
    hasPendingPayments: boolean;
  }> {
    const payments = await storage.getPaymentsByOrderId(orderId);
    const totalPaid = payments
      .filter((p) => p.status === "VERIFIED")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const hasPendingPayments = payments.some((p) => p.status === "PENDING");
    return { payments, totalPaid, hasPendingPayments };
  }
}
