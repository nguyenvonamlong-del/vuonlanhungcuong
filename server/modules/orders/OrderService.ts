import { storage } from "../../storage";
import type { Order, InsertOrder } from "@shared/schema";
import { PaymentService } from "../payments/PaymentService";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export interface PublicOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  province: string;
  district?: string;
  ward: string;
  streetAddress: string;
  pots: any[];
  subtotal: number;
  shippingCost: number;
  paymentProofUrl?: string;
  orderType?: string;
}

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

  static async cancelOrder(
    orderId: string,
    reason?: string,
    cancelledBy?: string
  ): Promise<Order> {
    const order = await storage.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    this.validateTransition(order.status, "CANCELLED");

    const updateData: any = {
      status: "CANCELLED",
      cancelReason: reason || null,
    };
    if (cancelledBy) {
      updateData.updatedBy = cancelledBy;
    }

    const updated = await storage.updateOrder(orderId, updateData);
    if (!updated) {
      throw new Error(`Failed to cancel order: ${orderId}`);
    }
    return updated;
  }

  static async assignTechnician(
    orderId: string,
    technicianId: string,
    assignedBy?: string
  ): Promise<Order> {
    const order = await storage.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const tech = await storage.getTechnicianById(technicianId);
    if (!tech) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    const updateData: any = { technicianId };
    if (assignedBy) {
      updateData.updatedBy = assignedBy;
    }

    const updated = await storage.updateOrder(orderId, updateData);
    if (!updated) {
      throw new Error(`Failed to assign technician to order: ${orderId}`);
    }

    await storage.updateTechnician(technicianId, {
      currentWorkload: tech.currentWorkload + 1,
    } as any);

    return updated;
  }

  static async createOrderFromPublicInput(
    input: PublicOrderInput
  ): Promise<{ order: Order; trackingToken: string; orderNumber: string }> {
    const taxEnabledSetting = await storage.getSetting("tax_enabled");
    const taxPercentageSetting = await storage.getSetting("tax_percentage");
    const isTaxEnabled = taxEnabledSetting?.value === "true";
    const taxPercentage = parseFloat(taxPercentageSetting?.value || "0");

    const serverTaxAmount = isTaxEnabled
      ? Math.ceil((input.subtotal + input.shippingCost) * taxPercentage / 100)
      : 0;
    const serverTotal = input.subtotal + input.shippingCost + serverTaxAmount;
    const serverDeposit = Math.ceil(serverTotal / 2);
    const serverRemaining = serverTotal - serverDeposit;

    let customer = await storage.getCustomerByPhone(input.customerPhone);
    if (!customer) {
      customer = await storage.createCustomer({
        fullName: input.customerName,
        phoneNumber: input.customerPhone,
        email: input.customerEmail,
        province: input.province,
        district: input.district,
        ward: input.ward,
        streetAddress: input.streetAddress,
        customerType: "GUEST",
      });
    }

    const order = await storage.createOrder({
      customerId: customer.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || undefined,
      province: input.province,
      district: input.district || "",
      ward: input.ward,
      streetAddress: input.streetAddress,
      pots: input.pots,
      subtotal: String(input.subtotal),
      shippingCost: String(input.shippingCost),
      taxAmount: String(serverTaxAmount),
      totalAmount: String(serverTotal),
      depositAmount: String(serverDeposit),
      remainingAmount: String(serverRemaining),
      orderType: input.orderType || "WEBSITE",
      status: "PENDING",
      depositPaid: false,
      remainingPaid: false,
      orderNumber: "",
      trackingToken: "",
    } as any);

    if (input.paymentProofUrl) {
      await PaymentService.createPayment({
        orderId: order.id,
        amount: String(serverDeposit),
        status: "PENDING",
        proofUrl: input.paymentProofUrl,
      });
    }

    await storage.updateCustomer(customer.id, {
      totalOrders: customer.totalOrders + 1,
      totalSpent: String(Number(customer.totalSpent) + serverTotal),
    } as any);

    return {
      order,
      trackingToken: order.trackingToken,
      orderNumber: order.orderNumber,
    };
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

  static async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    return storage.getOrderByOrderNumber(orderNumber);
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
