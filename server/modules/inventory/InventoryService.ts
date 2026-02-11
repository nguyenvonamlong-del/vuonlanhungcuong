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

    const data: any = {
      itemType,
      itemId,
      stockQuantity: initialQuantity,
      minQuantity: 0,
    };
    if (createdBy) {
      data.createdBy = createdBy;
    }

    return storage.createInventoryItem(data);
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

    const updateData: any = {
      stockQuantity: newQuantity,
    };
    if (createdBy) {
      updateData.updatedBy = createdBy;
    }

    const updated = await storage.updateInventoryItem(inventoryItem.id, updateData);
    if (!updated) {
      throw new Error(`Failed to update inventory for ${itemType}:${itemId}`);
    }

    const txData: any = {
      itemType,
      itemId,
      quantityChange,
      reason,
      entityType: entityType || null,
      entityId: entityId || null,
    };
    if (createdBy) {
      txData.createdBy = createdBy;
    }

    const transaction = await storage.createInventoryTransaction(txData);

    return { inventoryItem: updated, transaction };
  }

  static async reserveStockForOrder(
    orderId: string,
    pots: any[],
    createdBy?: string
  ): Promise<void> {
    for (const pot of pots) {
      if (pot.potId) {
        try {
          await this.adjustStock(
            "PREMADE_POT",
            pot.potId,
            -1,
            "SALE",
            "ORDER",
            orderId,
            createdBy
          );
        } catch (err) {
        }
      }

      if (pot.orchids && Array.isArray(pot.orchids)) {
        for (const orchid of pot.orchids) {
          const catalogId = orchid.catalogId || orchid.catalogItemId;
          if (catalogId && orchid.quantity) {
            try {
              await this.adjustStock(
                "ORCHID",
                catalogId,
                -orchid.quantity,
                "SALE",
                "ORDER",
                orderId,
                createdBy
              );
            } catch (err) {
            }
          }
        }
      }
    }
  }

  static async getTransactions(itemType?: string, itemId?: string): Promise<InventoryTransaction[]> {
    return storage.getInventoryTransactions(itemType, itemId);
  }

  static async getStockLevel(itemType: string, itemId: string): Promise<number> {
    const item = await storage.getInventoryItemByTypeAndId(itemType, itemId);
    return item?.stockQuantity ?? 0;
  }

  static async syncFromCatalog(): Promise<void> {
    const existingItems = await storage.getInventoryItems();
    const existingKeys = new Set(existingItems.map(i => `${i.itemType}:${i.itemId}`));

    const catalogItems = await storage.getCatalogItems();
    for (const item of catalogItems) {
      if (!existingKeys.has(`ORCHID:${item.id}`)) {
        await storage.createInventoryItem({
          itemType: "ORCHID",
          itemId: item.id,
          stockQuantity: item.stockQuantity,
          minQuantity: item.minOrderQuantity || 0,
          createdBy: "system",
        });
      }
    }

    const premadePots = await storage.getPremadePots();
    for (const pot of premadePots) {
      if (!existingKeys.has(`PREMADE_POT:${pot.id}`)) {
        await storage.createInventoryItem({
          itemType: "PREMADE_POT",
          itemId: pot.id,
          stockQuantity: pot.stockQuantity,
          minQuantity: 0,
          createdBy: "system",
        });
      }
    }
  }
}
