# Orchid Sales Web Application

## Project Overview
A comprehensive orchid sales web application with multi-language support (Vietnamese/English), featuring a public-facing shop, custom order composition builder, VietQR payment integration, and a complete admin panel.

## Recent Changes
- **2026-02-08**: Performance Optimizations for Concurrent Users:
  - **Database pool**: Increased connection pool to 20 max connections with idle/connection timeouts
  - **In-memory caching**: Added server-side cache for catalog, pot types, decoration types, shop pots, settings, shipping types, dashboard stats with automatic invalidation on mutations
  - **Response compression**: Added gzip/deflate compression middleware to reduce API payload sizes
  - Cache layer: `server/cache.ts` with configurable TTLs (SHORT=30s, MEDIUM=120s, LONG=300s)

- **2026-02-08**: Landing Page & Admin Enhancements:
  - **Product Showcase on Landing**: Horizontal scrollable carousel of premade products with media thumbnails (video priority) displayed right below hero CTA buttons
  - **Bulk Video Upload**: Admin can bulk-upload multiple videos at once from Premade Pots page; each video creates an INACTIVE placeholder pot entry for later editing
  - **Production Login Fix**: Added trust proxy and sameSite cookie config to fix session issues behind reverse proxy
  - **Video-first thumbnails**: Shop product cards now prioritize video over photo as thumbnail

- **2026-02-08**: Pre-made Pots Enhancement:
  - **Multi-media support**: Each pre-made pot now supports multiple photos AND multiple videos upload via object storage
  - **Auto-tagging system**: Tags are automatically generated from selected orchid types (orchidComposition), decoration types, and pot type using canonical format (orchid:{id}, decoration:{id}, pot:{id})
  - **Manual tag editing**: Admin can manually add/remove tags, plus "Regenerate" button to rebuild from current composition
  - **Orchid composition with quantities**: Admin can add multiple orchid types with individual quantities (+/- controls)
  - **Tags column in table**: Pre-made pots table shows tag badges with resolved names
  - **Reference gallery in Create Pot**: When public customers select pot type, decoration, or orchid type during custom pot creation, matching pre-made pots appear as reference gallery with photos/videos and "View & Purchase" link
  - **On-read tag enrichment**: Existing premade pots without tags get auto-generated tags on API read
  - Database: Added `videos` (text[]) and `tags` (text[]) columns to premade_pots table

- **2026-02-04**: Notification Services Integration (admin-only):
  - **Notification Channels CRUD**: Full management for notification channels (Email, SMS, Voicemail, Zalo)
    - Add/Edit/Delete channels with bilingual names and descriptions
    - Status toggle (Active/Inactive) per channel
    - Type-specific icons (Mail, Phone, MessageSquare)
  - **API Credentials Management**: Settings page now includes API credentials section for:
    - **Plivo** (SMS + Voicemail): Auth ID and Auth Token fields
    - **Zoho ZeptoMail** (Email): Send Mail Token field (10,000 free emails/month)
    - **Zalo Official Account**: App ID and Secret Key fields
  - Password masking with visibility toggle for sensitive credentials
  - "Configured" badge indicator when credentials are saved
  - Settings stored securely in database with upsert logic

- **2026-02-04**: Users Management system (admin-only):
  - Full CRUD operations for staff accounts with username, password, full name, email, role
  - Enable/Disable toggle for user accounts (status: ACTIVE/INACTIVE)
  - Role management: ADMIN, MANAGER, EMPLOYEE with dropdown selection
  - Statistics dashboard: total users, active users, admins, managers
  - Search by username/name and filter by role/status
  - Schema-driven validation with z.enum for role and status
  - Technician-User association: technicians can be linked to user accounts via userId field
  - Admin-only access restriction (non-admins get 403 error)

- **2026-02-04**: Enhanced admin panel with comprehensive management features:
  - **Inventory Management**: Stock level tracking with low/critical alerts, adjustment dialog with increment/decrement controls, summary cards for orchids and premade pots
  - **Purchase Orders**: Full CRUD with supplier selection, dynamic item management, status workflow (Pending→Confirmed→Shipped→Received), payment tracking
  - **Customers Page Enhanced**: Add/Update/Block functionality, customer type filtering (VIP/Registered/Guest), statistics cards (total customers, VIP, registered, avg spent)
  - **Technicians Page Enhanced**: Availability badges (Available/Near Full/Busy based on workload), statistics cards, status filtering
  - **Notifications Page**: Full notification management with status/type filtering, mark as read, delete functionality, statistics cards
  - **Reports Section**: Comprehensive reports with 5 tabs (Sales, Orders, Customers, Technicians, Suppliers) with relevant metrics, charts, and data tables
  - Database: Added isBlocked field to customers table

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
