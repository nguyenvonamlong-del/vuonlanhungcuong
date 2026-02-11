import { storage } from "../../storage";
import type { Payment, InsertPayment } from "@shared/schema";
import { OrderService } from "../orders/OrderService";

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

  static async verifyPayment(id: string, verifiedBy?: string): Promise<Payment> {
    const payment = await storage.getPaymentById(id);
    if (!payment) {
      throw new Error(`Payment not found: ${id}`);
    }
    if (payment.status !== "PENDING") {
      throw new Error(`Payment ${id} is already ${payment.status}`);
    }

    const updateData: any = {
      status: "VERIFIED",
      paidAt: new Date(),
    };
    if (verifiedBy) {
      updateData.createdBy = verifiedBy;
    }

    const updated = await storage.updatePayment(id, updateData);
    if (!updated) {
      throw new Error(`Failed to verify payment: ${id}`);
    }

    const order = await OrderService.getOrderById(payment.orderId);
    if (order && order.status === "PENDING") {
      const summary = await this.getOrderPaymentSummary(payment.orderId);
      const depositAmount = Number(order.depositAmount);
      if (summary.totalPaid >= depositAmount) {
        try {
          await OrderService.transitionStatus(payment.orderId, "CONFIRMED", verifiedBy);
        } catch (err) {
        }
      }
    }

    return updated;
  }

  static async rejectPayment(id: string, rejectedBy?: string): Promise<Payment> {
    const payment = await storage.getPaymentById(id);
    if (!payment) {
      throw new Error(`Payment not found: ${id}`);
    }
    if (payment.status !== "PENDING") {
      throw new Error(`Payment ${id} is already ${payment.status}`);
    }

    const updateData: any = {
      status: "REJECTED",
    };
    if (rejectedBy) {
      updateData.createdBy = rejectedBy;
    }

    const updated = await storage.updatePayment(id, updateData);
    if (!updated) {
      throw new Error(`Failed to reject payment: ${id}`);
    }
    return updated;
  }

  static async getOrderPaymentSummary(orderId: string): Promise<{
    payments: Payment[];
    totalPaid: number;
    totalPending: number;
    hasPendingPayments: boolean;
    depositPaid: boolean;
    remainingPaid: boolean;
    orderTotal: number;
    depositAmount: number;
    remainingAmount: number;
  }> {
    const payments = await storage.getPaymentsByOrderId(orderId);
    const order = await storage.getOrderById(orderId);

    const totalPaid = payments
      .filter((p) => p.status === "VERIFIED")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const hasPendingPayments = payments.some((p) => p.status === "PENDING");

    const orderTotal = order ? Number(order.totalAmount) : 0;
    const depositAmount = order ? Number(order.depositAmount) : 0;
    const remainingAmount = order ? Number(order.remainingAmount) : 0;

    const depositPaid = totalPaid >= depositAmount && depositAmount > 0;
    const remainingPaid = totalPaid >= orderTotal && orderTotal > 0;

    return {
      payments,
      totalPaid,
      totalPending,
      hasPendingPayments,
      depositPaid,
      remainingPaid,
      orderTotal,
      depositAmount,
      remainingAmount,
    };
  }

  static async markDepositPaid(orderId: string, createdBy?: string): Promise<Payment> {
    const order = await storage.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const payment = await this.createPayment({
      orderId,
      amount: order.depositAmount,
      status: "VERIFIED",
      paidAt: new Date(),
    }, createdBy);

    if (order.status === "PENDING") {
      try {
        await OrderService.transitionStatus(orderId, "CONFIRMED", createdBy);
      } catch (err) {
      }
    }

    return payment;
  }

  static async markRemainingPaid(orderId: string, createdBy?: string): Promise<Payment> {
    const order = await storage.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const summary = await this.getOrderPaymentSummary(orderId);
    const remaining = Number(order.totalAmount) - summary.totalPaid;

    if (remaining <= 0) {
      throw new Error("Order is already fully paid");
    }

    return this.createPayment({
      orderId,
      amount: String(remaining),
      status: "VERIFIED",
      paidAt: new Date(),
    }, createdBy);
  }
}
