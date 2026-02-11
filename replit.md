# Orchid Sales Web Application

## Overview
This project is an orchid sales web application designed to support multi-language (Vietnamese/English) online retail. It features a public-facing e-commerce shop, a unique custom order composition builder for personalized orchid arrangements, and integrated VietQR payment processing. A comprehensive admin panel facilitates efficient management of sales, inventory, customer relations, and system configurations. The application aims to streamline the orchid sales process, from customer interaction and order placement to fulfillment and inventory management, targeting both individual customers and business operations within the orchid market.

## User Preferences
- Default language: Vietnamese
- Theme: Light/Dark mode toggle available
- Currency format: VND (Vietnamese Dong)

## System Architecture
The application is built with a modern web stack, utilizing **React + TypeScript + Vite** for the frontend, **Express.js + TypeScript** for the backend, and **PostgreSQL with Drizzle ORM** for database management. Styling is handled with **TailwindCSS** and **shadcn/ui** components. State management on the frontend employs **React Context** and **TanStack Query**.

**Core Architectural Decisions:**
- **Separated Concerns & Domain Services**: The backend is structured into modular domain services (e.g., OrderService, InventoryService, PaymentService, ShipmentService, NotificationService) located under `server/modules/`, promoting maintainability and scalability. API routes are thin wrappers around these services.
- **Robust Order State Machine**: Orders follow a strict state transition model (PENDING→CONFIRMED→PREPARING→READY→SHIPPING→DELIVERED) with a separate CANCELLED path, ensuring accurate order lifecycle management.
- **Multi-media Support**: Products (Premade Pots) support multiple photos and videos, enhancing product presentation.
- **Automatic Tagging System**: Premade pots automatically generate tags based on their composition (orchid type, decoration, pot type) for improved search and categorization. Manual tag editing is also available.
- **Comprehensive Admin Panel**: A dedicated admin dashboard provides full CRUD operations for users, catalog items, orders, customers, technicians, suppliers, and notification channels. It includes inventory management, purchase order tracking, and detailed reports.
- **AI Chatbot Integration**: Both customer-facing and admin-facing chatbots are integrated using OpenAI via Replit AI Integrations, offering product inquiries and business insights, respectively.
- **Scalability Enhancements**: The architecture includes database indexing (39 indexes across tables), a dual-layer Redis-backed cache (in-memory + Upstash Redis), API rate limiting, and database connection pooling to handle high concurrency (1000+ users). Response compression (gzip/deflate) is also implemented.
- **Multi-language Support**: The application supports both Vietnamese and English throughout the UI and content.
- **Payment Workflow**: Integrated VietQR payment with a 50% deposit option, and a secure payment proof upload feature using Replit Object Storage.
- **Configurable Tax System**: An admin-managed tax system allows enabling/disabling tax calculation and setting a percentage.

**Key Features:**
- **Public Shop**: Browse and purchase premade orchid pots, with filtering and sorting options.
- **Custom Pot Builder**: A multi-step checkout process allowing customers to compose custom orchid arrangements with selectable pot types, decoration types, and orchid compositions.
- **Order Tracking**: Customers can track their orders using a token, phone number, or email.
- **User Management**: CRUD for staff accounts with role-based access (ADMIN, MANAGER, EMPLOYEE).
- **Inventory Management**: Track stock levels for orchids and premade pots, with alerts and adjustment capabilities.
- **Notification Services**: CRUD for managing various notification channels (Email, SMS, Voicemail, Zalo) and their respective API credentials.
- **Reporting**: Comprehensive reports cover sales, orders, customers, technicians, and suppliers with charts and data tables.
- **UI/UX**: Features dropdown sorting, flexible pricing display (fixed or range), bulk inline editing in admin, and video lightbox for product showcases.

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Drizzle ORM**: Used for interacting with the PostgreSQL database.
- **Upstash Redis**: Used for caching, with a graceful fallback to in-memory caching if unavailable.
- **OpenAI via Replit AI Integrations**: Powers the AI chatbot functionality for both customers and admins.
- **Plivo**: Integrated for SMS and Voicemail notification services.
- **Zoho ZeptoMail**: Integrated for email notification services.
- **Zalo Official Account API**: Integrated for Zalo notification services.
- **Replit Object Storage**: Used for secure file uploads, specifically for payment proof images and multi-media for premade pots.
- **VietQR**: Payment integration for processing transactions.
- **express-session with PostgreSQL store**: For session management.