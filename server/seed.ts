import { db } from "./db";
import { users, catalogItems, premadePots, technicians, shippingTypes, customers, orders } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo users
  const adminId = uuidv4();
  const managerId = uuidv4();
  const employeeId = uuidv4();

  await db.insert(users).values([
    {
      id: adminId,
      username: "admin",
      password: "admin123",
      fullName: "Nguyễn Văn Admin",
      role: "ADMIN",
      status: "ACTIVE",
    },
    {
      id: managerId,
      username: "manager",
      password: "manager123",
      fullName: "Trần Thị Manager",
      role: "MANAGER",
      status: "ACTIVE",
    },
    {
      id: employeeId,
      username: "employee",
      password: "employee123",
      fullName: "Lê Văn Employee",
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
  ]).onConflictDoNothing();

  console.log("✓ Users created");

  // Create catalog items
  const orchidData = [
    { nameVi: "Lan Hồ Điệp Trắng", nameEn: "White Phalaenopsis", color: "Trắng", height: 45, price: "250000", stock: 150 },
    { nameVi: "Lan Hồ Điệp Tím", nameEn: "Purple Phalaenopsis", color: "Tím", height: 50, price: "280000", stock: 120 },
    { nameVi: "Lan Hồ Điệp Hồng", nameEn: "Pink Phalaenopsis", color: "Hồng", height: 48, price: "260000", stock: 100 },
    { nameVi: "Lan Hồ Điệp Vàng", nameEn: "Yellow Phalaenopsis", color: "Vàng", height: 52, price: "350000", stock: 80 },
    { nameVi: "Lan Đai Châu", nameEn: "Rhynchostylis Orchid", color: "Hồng đốm", height: 35, price: "180000", stock: 200 },
    { nameVi: "Lan Cattleya Đỏ", nameEn: "Red Cattleya", color: "Đỏ", height: 40, price: "420000", stock: 60 },
    { nameVi: "Lan Dendrobium Trắng", nameEn: "White Dendrobium", color: "Trắng", height: 55, price: "200000", stock: 180 },
    { nameVi: "Lan Dendrobium Tím", nameEn: "Purple Dendrobium", color: "Tím", height: 58, price: "220000", stock: 150 },
    { nameVi: "Lan Vũ Nữ", nameEn: "Dancing Lady Orchid", color: "Vàng cam", height: 65, price: "380000", stock: 90 },
    { nameVi: "Lan Mokara Cam", nameEn: "Orange Mokara", color: "Cam", height: 60, price: "300000", stock: 110 },
  ];

  for (const orchid of orchidData) {
    await db.insert(catalogItems).values({
      id: uuidv4(),
      speciesNameVi: orchid.nameVi,
      speciesNameEn: orchid.nameEn,
      color: orchid.color,
      heightCm: orchid.height,
      pricePerUnit: orchid.price,
      stockQuantity: orchid.stock,
      minOrderQuantity: 5,
      status: "ACTIVE",
    }).onConflictDoNothing();
  }

  console.log("✓ Catalog items created");

  // Create premade pots
  const potData = [
    {
      nameVi: "Chậu Phú Quý",
      nameEn: "Prosperity Pot",
      descVi: "Chậu lan hồ điệp trắng tượng trưng cho sự thịnh vượng",
      descEn: "White phalaenopsis pot symbolizing prosperity",
      price: "1500000",
      stock: 15,
      size: "MEDIUM",
      difficulty: "EASY",
      featured: true,
    },
    {
      nameVi: "Chậu Hạnh Phúc",
      nameEn: "Happiness Pot",
      descVi: "Kết hợp lan hồ điệp hồng và trắng mang đến hạnh phúc",
      descEn: "Pink and white phalaenopsis combination bringing happiness",
      price: "2200000",
      stock: 10,
      size: "LARGE",
      difficulty: "MEDIUM",
      featured: true,
    },
    {
      nameVi: "Chậu Tài Lộc",
      nameEn: "Fortune Pot",
      descVi: "Lan Cattleya đỏ rực rỡ thu hút tài lộc",
      descEn: "Vibrant red Cattleya attracting fortune",
      price: "3500000",
      stock: 5,
      size: "LARGE",
      difficulty: "HARD",
      featured: true,
    },
    {
      nameVi: "Chậu Thanh Lịch",
      nameEn: "Elegance Pot",
      descVi: "Lan Dendrobium trắng tinh khiết và thanh lịch",
      descEn: "Pure and elegant white Dendrobium",
      price: "1200000",
      stock: 20,
      size: "SMALL",
      difficulty: "EASY",
      featured: false,
    },
    {
      nameVi: "Chậu Hoàng Gia",
      nameEn: "Royal Pot",
      descVi: "Lan hồ điệp tím quý phái dành cho không gian sang trọng",
      descEn: "Elegant purple phalaenopsis for luxurious spaces",
      price: "2800000",
      stock: 8,
      size: "XLARGE",
      difficulty: "MEDIUM",
      featured: true,
    },
    {
      nameVi: "Chậu Bình An",
      nameEn: "Peace Pot",
      descVi: "Lan Vũ Nữ nhẹ nhàng mang lại bình an",
      descEn: "Gentle Dancing Lady bringing peace",
      price: "1800000",
      stock: 12,
      size: "MEDIUM",
      difficulty: "MEDIUM",
      featured: false,
    },
  ];

  for (const pot of potData) {
    await db.insert(premadePots).values({
      id: uuidv4(),
      nameVi: pot.nameVi,
      nameEn: pot.nameEn,
      descriptionVi: pot.descVi,
      descriptionEn: pot.descEn,
      price: pot.price,
      stockQuantity: pot.stock,
      potSize: pot.size,
      difficultyLevel: pot.difficulty,
      featured: pot.featured,
      status: "ACTIVE",
    }).onConflictDoNothing();
  }

  console.log("✓ Premade pots created");

  // Create technicians
  const techData = [
    { name: "Phạm Văn Hùng", phone: "0901234567", max: 5, current: 2 },
    { name: "Nguyễn Thị Lan", phone: "0912345678", max: 4, current: 1 },
    { name: "Trần Minh Đức", phone: "0923456789", max: 6, current: 3 },
    { name: "Lê Hoàng Nam", phone: "0934567890", max: 5, current: 0 },
  ];

  for (const tech of techData) {
    await db.insert(technicians).values({
      id: uuidv4(),
      fullName: tech.name,
      phoneNumber: tech.phone,
      maxWorkload: tech.max,
      currentWorkload: tech.current,
      status: "ACTIVE",
      performanceRating: "4.5",
    }).onConflictDoNothing();
  }

  console.log("✓ Technicians created");

  // Create shipping types
  const shippingData = [
    {
      nameVi: "Giao hàng tiêu chuẩn",
      nameEn: "Standard Delivery",
      descVi: "Giao hàng trong 3-5 ngày làm việc",
      descEn: "Delivery within 3-5 business days",
      cost: "50000",
      days: 5,
    },
    {
      nameVi: "Giao hàng nhanh",
      nameEn: "Express Delivery",
      descVi: "Giao hàng trong 1-2 ngày làm việc",
      descEn: "Delivery within 1-2 business days",
      cost: "100000",
      days: 2,
    },
    {
      nameVi: "Giao hàng trong ngày",
      nameEn: "Same Day Delivery",
      descVi: "Giao hàng trong ngày (nội thành)",
      descEn: "Same day delivery (city area only)",
      cost: "150000",
      days: 1,
    },
  ];

  for (const ship of shippingData) {
    await db.insert(shippingTypes).values({
      id: uuidv4(),
      nameVi: ship.nameVi,
      nameEn: ship.nameEn,
      descriptionVi: ship.descVi,
      descriptionEn: ship.descEn,
      baseCost: ship.cost,
      estimatedDays: ship.days,
      isActive: true,
    }).onConflictDoNothing();
  }

  console.log("✓ Shipping types created");

  // Create sample customers
  const customerData = [
    { name: "Nguyễn Văn A", phone: "0909111222", email: "nguyenvana@gmail.com", type: "VIP", orders: 15, spent: "45000000" },
    { name: "Trần Thị B", phone: "0909222333", email: "tranthib@gmail.com", type: "REGISTERED", orders: 8, spent: "18000000" },
    { name: "Lê Văn C", phone: "0909333444", email: null, type: "GUEST", orders: 2, spent: "3200000" },
  ];

  for (const cust of customerData) {
    await db.insert(customers).values({
      id: uuidv4(),
      fullName: cust.name,
      phoneNumber: cust.phone,
      email: cust.email,
      customerType: cust.type,
      totalOrders: cust.orders,
      totalSpent: cust.spent,
    }).onConflictDoNothing();
  }

  console.log("✓ Sample customers created");

  // Create sample orders
  const sampleCustomer = await db.select().from(customers).limit(1);
  if (sampleCustomer.length > 0) {
    const orderStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SHIPPING", "DELIVERED"];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      await db.insert(orders).values({
        id: uuidv4(),
        orderNumber: `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(i + 1).padStart(4, "0")}`,
        trackingToken: `TRK${String(Math.random()).substring(2, 10).toUpperCase()}`,
        customerId: sampleCustomer[0].id,
        customerName: sampleCustomer[0].fullName,
        customerPhone: sampleCustomer[0].phoneNumber,
        customerEmail: sampleCustomer[0].email,
        province: "Hồ Chí Minh",
        district: "Quận 1",
        ward: "Phường Bến Nghé",
        streetAddress: "123 Nguyễn Huệ",
        pots: [],
        subtotal: String(1500000 + i * 200000),
        shippingCost: "50000",
        totalAmount: String(1550000 + i * 200000),
        depositAmount: String(Math.ceil((1550000 + i * 200000) / 2)),
        remainingAmount: String(Math.floor((1550000 + i * 200000) / 2)),
        status: orderStatuses[i],
        depositPaid: i > 0,
        remainingPaid: i > 4,
        orderType: "WEBSITE",
        createdAt: date,
      }).onConflictDoNothing();
    }

    console.log("✓ Sample orders created");
  }

  console.log("🎉 Database seeding completed!");
}

seed().catch(console.error).finally(() => process.exit(0));
