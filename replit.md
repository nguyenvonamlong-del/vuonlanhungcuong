# Orchid Sales Web Application

## Project Overview
A comprehensive orchid sales web application with multi-language support (Vietnamese/English), featuring a public-facing shop, custom order composition builder, VietQR payment integration, and a complete admin panel.

## Recent Changes
- **2026-02-04**: Admin panel expansion:
  - Added Suppliers management page with full CRUD operations, contact tracking, type categorization, and rating system
  - Added Audit Log page (read-only) showing all system activities with auto-refresh every 30 seconds
  - Restructured Catalog page into 5 tabs: Orchid, Pot, Decoration, Shipping, Payment types
  - Extended sidebar navigation with new pages under Management and Admin sections
  - Database schema expanded with tables: suppliers, purchase_orders, notifications, payment_types

- **2026-02-04**: AI Chatbot feature:
  - Added floating chatbot button on all pages (bottom-right corner)
  - Customer chatbot: helps with product inquiries, ordering info, and order tracking
  - Admin chatbot: provides real-time business insights (inventory, orders, revenue, technicians)
  - Uses OpenAI via Replit AI Integrations for natural language responses
  - Streaming responses for real-time chat experience
  - Role-based access: Customers see customer assistant, logged-in admins see business assistant

- **2026-02-04**: Business information updates:
  - English name: "Hùng Cường Orchid Garden"
  - Address: Đội 10, Xích Đằng, phường Lam Sơn, TP. Hưng Yên, tỉnh Hưng Yên
  - Phone: 0983 270 995
  - Email: Thanhtusky147@gmail.com
  - Payment: VIETCOMBANK account 9983270995 (LE THI THANH TU)
  - Static QR code image for payment (client/public/assets/vietcombank-qr.png)

- **2026-02-04**: Pot composition enhancements:
  - Added pot type selection per pot (e.g., ceramic, terracotta, cement pots)
  - Added decoration type selection per pot (e.g., pebbles, moss, bark chips)
  - Default orchid quantity is now 5 stems (minimum requirement)
  - Added visible info alert about minimum 5 stems requirement
  - Pot type and decoration type prices are included in subtotal calculation

- **2026-02-04**: Payment proof upload feature:
  - Added file upload button for payment proof images (replaces URL input)
  - Uses Replit Object Storage for secure file uploads
  - Customers can upload images directly from their device
  - Preview of uploaded image shown before order submission

- **2026-02-04**: Order tracking and form improvements:
  - Added order tracking by phone number or email (shows active orders only)
  - District field is now optional in checkout form
  - Fixed product card layout on shop page (buttons no longer cut off)
  - Address display gracefully handles missing district field
  
- **2026-02-04**: Tax system and payment proof features:
  - Added configurable tax system with admin toggle and percentage (0-100%)
  - Tax calculated on (subtotal + shipping cost) when enabled
  - Settings management page for admin users (/dashboard/settings)
  - Payment proof URL required before order placement (customer uploads to imgur or similar)
  - Server-side validation for payment proof and tax calculation to prevent tampering
  - Settings API with admin-only write access and value validation
  
- **2024-02-04**: Complete MVP implementation including:
  - Full PostgreSQL database schema with all entities
  - Multi-language support (Vietnamese/English) throughout
  - Public pages: Landing, Shop, Checkout, Order Tracking
  - Staff authentication with demo accounts
  - Admin dashboard with statistics and charts
  - Management pages for Catalog, Orders, Customers, Technicians, Pre-made Pots
  - VietQR payment integration with 50% deposit workflow

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: React Context + TanStack Query

### Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   ├── pages/          # Page components
│   │   │   └── dashboard/  # Admin dashboard pages
│   │   └── App.tsx         # Main app router
├── server/
│   ├── db.ts               # Database connection
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── seed.ts             # Seed data script
├── shared/
│   └── schema.ts           # Database schema and types
```

### Key Features

#### Public Features
- **Landing Page**: Hero section, features, testimonials, CTA
- **Shop**: Browse pre-made orchid pots with filtering/sorting
- **Checkout**: 5-step process with composition builder or cart checkout
- **Order Tracking**: Track orders by token, phone number, or email

#### Staff Features
- **Dashboard**: Revenue charts, order statistics, recent orders
- **Catalog Management**: CRUD for orchid species
- **Order Management**: Status updates, technician assignment, payments
- **Customer Management**: View customer details and history
- **Technician Management**: Workload tracking and assignments
- **Pre-made Pots**: Manage inventory for ready-made products

### Demo Accounts
- **Admin**: username=`admin`, password=`admin123`
- **Manager**: username=`manager`, password=`manager123`
- **Employee**: username=`employee`, password=`employee123`

### API Routes
- `POST /api/auth/login` - Staff authentication
- `GET /api/catalog` - List catalog items
- `GET /api/shop/pots` - Public shop products
- `POST /api/orders` - Create new order (requires paymentProofUrl for website orders)
- `GET /api/orders/track/:token` - Track order by token
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/settings` - Get all settings (public)
- `PUT /api/settings/:key` - Update setting (admin only, validates key/value)

### Database Schema
- **users**: Staff accounts with roles (ADMIN, MANAGER, EMPLOYEE)
- **catalogItems**: Orchid species catalog
- **premadePots**: Pre-made pot products
- **customers**: Customer information
- **technicians**: Technician assignments
- **orders**: Order records with pots/orchids JSON, taxAmount, paymentProofUrl
- **shippingTypes**: Shipping options
- **activities**: Activity log
- **settings**: System settings (tax_enabled, tax_percentage)

### Running the Project
```bash
npm run dev          # Start development server
npm run db:push      # Push schema to database
npx tsx server/seed.ts  # Seed database
```

## User Preferences
- Default language: Vietnamese
- Theme: Light/Dark mode toggle available
- Currency format: VND (Vietnamese Dong)

## Notes
- Passwords are stored in plaintext for demo purposes only
- Session management uses express-session with PostgreSQL store
- VietQR QR codes are generated dynamically for payments
