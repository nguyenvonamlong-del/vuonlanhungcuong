import { storage } from "../../storage";
import type { InventoryItem, InsertInventoryItem, InventoryTransaction, InsertInventoryTransaction } from "@shared/schema";

export class InventoryService {
  static async getInventoryItems(): Promise<InventoryItem[]> {
    return storage.getInventoryItems();
  }

  static async getInventoryForItem(itemType: string, itemId: string): Promise<InventoryItem | undefined> {
    return storage.getInventoryItemByTypeAndId(itemType, itemId);
  }

  static async ensureInventoryItem(
    itemType: string,
    itemId: string,
    initialQuantity = 0,
    createdBy?: string
  ): Promise<InventoryItem> {
    const existing = await storage.getInventoryItemByTypeAndId(itemType, itemId);
    if (existing) return existing;

    return storage.createInventoryItem({
      itemType,
      itemId,
      stockQuantity: initialQuantity,
      minQuantity: 0,
    });
  }

  static async adjustStock(
    itemType: string,
    itemId: string,
    quantityChange: number,
    reason: string,
    entityType?: string,
    entityId?: string,
    createdBy?: string
  ): Promise<{ inventoryItem: InventoryItem; transaction: InventoryTransaction }> {
    let inventoryItem = await this.ensureInventoryItem(itemType, itemId, 0, createdBy);

    const newQuantity = inventoryItem.stockQuantity + quantityChange;
    if (newQuantity < 0) {
      throw new Error(
        `Insufficient stock for ${itemType}:${itemId}. Current: ${inventoryItem.stockQuantity}, requested change: ${quantityChange}`
      );
    }

    const updated = await storage.updateInventoryItem(inventoryItem.id, {
      stockQuantity: newQuantity,
    });
    if (!updated) {
      throw new Error(`Failed to update inventory for ${itemType}:${itemId}`);
    }

    const transaction = await storage.createInventoryTransaction({
      itemType,
      itemId,
      quantityChange,
      reason,
      entityType: entityType || null,
      entityId: entityId || null,
    });

    return { inventoryItem: updated, transaction };
  }

  static async getTransactions(itemType?: string, itemId?: string): Promise<InventoryTransaction[]> {
    return storage.getInventoryTransactions(itemType, itemId);
  }

  static async getStockLevel(itemType: string, itemId: string): Promise<number> {
    const item = await storage.getInventoryItemByTypeAndId(itemType, itemId);
    return item?.stockQuantity ?? 0;
  }
}
