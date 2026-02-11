import { storage } from "../../storage";
import type {
  OutboundShipment, InsertOutboundShipment,
  InboundShipment, InsertInboundShipment,
} from "@shared/schema";

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
    return storage.createOutboundShipment(shipmentData);
  }

  static async updateOutboundShipment(
    id: string,
    data: Partial<InsertOutboundShipment>,
    updatedBy?: string
  ): Promise<OutboundShipment | undefined> {
    const updateData: any = { ...data };
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }
    return storage.updateOutboundShipment(id, updateData);
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
    return storage.createInboundShipment(shipmentData);
  }

  static async updateInboundShipment(
    id: string,
    data: Partial<InsertInboundShipment>,
    updatedBy?: string
  ): Promise<InboundShipment | undefined> {
    const updateData: any = { ...data };
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }
    return storage.updateInboundShipment(id, updateData);
  }
}
