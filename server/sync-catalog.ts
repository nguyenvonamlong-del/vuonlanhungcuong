import { db } from "./db";
import { sql, inArray } from "drizzle-orm";
import { catalogItems } from "@shared/schema";

const REQUIRED_CATALOG_ITEMS = [
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000016",
    species_name_vi: "Bản đồ kho báu",
    species_name_en: "Treasure Map Phalaenopsis",
    color: "Pink",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Bản đồ kho báu, hoa màu hồng vân bản đồ, kích thước 3.5",
    description_en: "Treasure Map Phalaenopsis with pink map pattern, size 3.5",
    status: "ACTIVE",
    sku: "PHA-PK-TMAP-MP-35",
    genus: "Phalaenopsis",
    tags: ["map-pattern", "treasure"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000017",
    species_name_vi: "Chớp ngôi sao",
    species_name_en: "Star Flash Phalaenopsis",
    color: "Pink",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Chớp ngôi sao, hoa màu hồng chớp sao, kích thước 3.5",
    description_en: "Star Flash Phalaenopsis, size 3.5",
    status: "ACTIVE",
    sku: "PHA-PK-STAR-FL-35",
    genus: "Phalaenopsis",
    tags: ["star", "flash"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000018",
    species_name_vi: "Ngọc trai đen",
    species_name_en: "Black Pearl Phalaenopsis",
    color: "Purple",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Ngọc trai đen, hoa màu tím đen quý hiếm, kích thước 3.5",
    description_en: "Black Pearl Phalaenopsis, dark purple/black premium variety, size 3.5",
    status: "ACTIVE",
    sku: "PHA-PP-BPRL-SL-35",
    genus: "Phalaenopsis",
    tags: ["black-pearl", "dark", "premium"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000019",
    species_name_vi: "Kim cương đỏ",
    species_name_en: "Red Diamond Phalaenopsis",
    color: "Red",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Kim cương đỏ, hoa màu đỏ rực rỡ, kích thước 3.5",
    description_en: "Red Diamond Phalaenopsis, vibrant red variety, size 3.5",
    status: "ACTIVE",
    sku: "PHA-RD-RDIA-SL-35",
    genus: "Phalaenopsis",
    tags: ["red", "diamond"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000020",
    species_name_vi: "Vàng gấu",
    species_name_en: "Bear Yellow Phalaenopsis",
    color: "Yellow",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Vàng gấu, hoa màu vàng tươi, kích thước 3.5",
    description_en: "Bear Yellow Phalaenopsis, bright yellow variety, size 3.5",
    status: "ACTIVE",
    sku: "PHA-YL-BEAR-SL-35",
    genus: "Phalaenopsis",
    tags: ["yellow", "bear"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000021",
    species_name_vi: "Vàng ong 2 ngồng",
    species_name_en: "Honey Yellow Phalaenopsis (Double Spike)",
    color: "Yellow",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Vàng ong 2 ngồng, hoa màu vàng mật ong, kích thước 3.5",
    description_en: "Honey Yellow Phalaenopsis double spike variety, size 3.5",
    status: "ACTIVE",
    sku: "PHA-YL-HNY-DB-35",
    genus: "Phalaenopsis",
    tags: ["yellow", "honey", "double-spike"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000022",
    species_name_vi: "Trắng nhuỵ đỏ",
    species_name_en: "White Phalaenopsis (Red Lip)",
    color: "White",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Trắng nhuỵ đỏ, hoa trắng nhị đỏ cổ điển, kích thước 3.5",
    description_en: "White Phalaenopsis with red lip, classic variety, size 3.5",
    status: "ACTIVE",
    sku: "PHA-WH-RLIP-VE-35",
    genus: "Phalaenopsis",
    tags: ["white", "red-lip", "classic"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000023",
    species_name_vi: "Cam cà rốt (Đà Lạt)",
    species_name_en: "Carrot Orange Phalaenopsis (Da Lat)",
    color: "Orange",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Cam cà rốt từ Đà Lạt, hoa màu cam tươi, kích thước 3.5",
    description_en: "Carrot Orange Phalaenopsis from Da Lat, size 3.5",
    status: "ACTIVE",
    sku: "PHA-OR-CARROT-SL-35",
    genus: "Phalaenopsis",
    tags: ["orange", "da-lat", "carrot"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000024",
    species_name_vi: "Chớp bản đồ",
    species_name_en: "Map Flash Phalaenopsis",
    color: "Pink",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Chớp bản đồ, hoa màu hồng vân bản đồ chớp, kích thước 3.5",
    description_en: "Map Flash Phalaenopsis with map pattern, size 3.5",
    status: "ACTIVE",
    sku: "PHA-PK-MFLASH-MP-35",
    genus: "Phalaenopsis",
    tags: ["map-pattern", "flash"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000025",
    species_name_vi: "Vàng Mỹ Nhân 1 ngồng",
    species_name_en: "My Nhan Yellow Phalaenopsis (Single Spike)",
    color: "Yellow",
    height_cm: 35,
    price_per_unit: 160000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Vàng Mỹ Nhân 1 ngồng, kích thước 3.5",
    description_en: "My Nhan Yellow Phalaenopsis single spike variety, size 3.5",
    status: "ACTIVE",
    sku: "PHA-YL-MNH-SG-35",
    genus: "Phalaenopsis",
    tags: ["yellow", "my-nhan", "single-spike"],
  },
  {
    id: "1f2b3c4d-1111-4aaa-8bbb-000000000026",
    species_name_vi: "Vàng Mỹ Nhân 2 ngồng",
    species_name_en: "My Nhan Yellow Phalaenopsis (Double Spike)",
    color: "Yellow",
    height_cm: 35,
    price_per_unit: 180000,
    cost_per_unit: 115000,
    stock_quantity: 100,
    min_order_quantity: 5,
    description_vi: "Giống lan hồ điệp Vàng Mỹ Nhân 2 ngồng, kích thước 3.5",
    description_en: "My Nhan Yellow Phalaenopsis double spike variety, size 3.5",
    status: "ACTIVE",
    sku: "PHA-YL-MNH-DB-35",
    genus: "Phalaenopsis",
    tags: ["yellow", "my-nhan", "double-spike"],
  },
];

async function ensureExtraColumns(): Promise<void> {
  try {
    await db.execute(sql`ALTER TABLE premade_pots ADD COLUMN IF NOT EXISTS total_cost numeric(12, 0)`);
    await db.execute(sql`ALTER TABLE pot_types ADD COLUMN IF NOT EXISTS price_max numeric(12, 0)`);
    await db.execute(sql`ALTER TABLE decoration_types ADD COLUMN IF NOT EXISTS price_max numeric(12, 0)`);
    await db.execute(sql`ALTER TABLE shipping_types ADD COLUMN IF NOT EXISTS base_cost_max numeric(12, 0)`);
  } catch (err) {
    console.error("[sync] Failed to ensure extra columns:", (err as Error).message);
  }
}

export async function syncCatalogItems(): Promise<void> {
  await ensureExtraColumns();
  try {
    const ids = REQUIRED_CATALOG_ITEMS.map((item) => item.id);
    const existing = await db
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(inArray(catalogItems.id, ids));
    const existingIds = new Set(existing.map((r) => r.id));
    const missing = REQUIRED_CATALOG_ITEMS.filter((item) => !existingIds.has(item.id));

    if (missing.length === 0) {
      console.log("[sync] All catalog items are present");
      return;
    }

    for (const item of missing) {
      await db
        .insert(catalogItems)
        .values({
          id: item.id,
          speciesNameVi: item.species_name_vi,
          speciesNameEn: item.species_name_en,
          color: item.color,
          heightCm: item.height_cm,
          pricePerUnit: String(item.price_per_unit),
          costPerUnit: String(item.cost_per_unit),
          stockQuantity: item.stock_quantity,
          minOrderQuantity: item.min_order_quantity,
          descriptionVi: item.description_vi,
          descriptionEn: item.description_en,
          status: item.status,
          sku: item.sku,
          genus: item.genus,
          tags: item.tags,
        })
        .onConflictDoNothing({ target: catalogItems.id });
    }
    console.log(`[sync] Inserted ${missing.length} missing catalog items`);
  } catch (err) {
    console.error("[sync] Failed to sync catalog items:", (err as Error).message);
  }
}
