# Orchid Sales Web Application

## Project Overview
A comprehensive orchid sales web application with multi-language support (Vietnamese/English), featuring a public-facing shop, custom order composition builder, VietQR payment integration, and a complete admin panel.

## Recent Changes
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
- **Order Tracking**: Track orders by token number

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
- `POST /api/orders` - Create new order
- `GET /api/orders/track/:token` - Track order by token
- `GET /api/dashboard/stats` - Dashboard statistics

### Database Schema
- **users**: Staff accounts with roles (ADMIN, MANAGER, EMPLOYEE)
- **catalogItems**: Orchid species catalog
- **premadePots**: Pre-made pot products
- **customers**: Customer information
- **technicians**: Technician assignments
- **orders**: Order records with pots/orchids JSON
- **shippingTypes**: Shipping options
- **activities**: Activity log

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
