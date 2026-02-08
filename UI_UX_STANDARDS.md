# UI/UX Standards & Global Styles Documentation

This document details the design system, component patterns, and page-by-page UI/UX standards used throughout the Orchid Sales Web Application. Use this as a reference for providing design feedback.

---

## 1. Global Design System

### 1.1 Color Palette

**Primary Brand Color**: Purple (HSL 271 81% 56%)
- Used for: primary buttons, active sidebar items, focus rings, brand accents
- Custom orchid scale: orchid-50 through orchid-900 (purple shades)

**Semantic Colors**:
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `background` | White (#fff) | Near-black (#121212) | Page backgrounds |
| `foreground` | Near-black (#171717) | Near-white (#f2f2f2) | Primary text |
| `card` | Light gray (#fafafa) | Dark gray (#171717) | Card surfaces |
| `muted` | Gray (#ebebeb) | Dark gray (#292929) | Disabled states, subtle backgrounds |
| `muted-foreground` | Mid-gray (#666) | Mid-gray (#a6a6a6) | Secondary/tertiary text |
| `destructive` | Red (0 84% 48%) | Red (0 84% 48%) | Delete actions, errors |
| `accent` | Light purple (271 15% 93%) | Dark purple (271 15% 14%) | Subtle brand highlights |

**Status Colors** (hardcoded RGB):
- Online/Success: Green (34 197 94)
- Warning/Away: Amber (245 158 11)
- Error/Busy: Red (239 68 68)
- Offline: Gray (156 163 175)

**Chart Colors**: 5 distinct hues for data visualization (purple, green, blue, amber, pink)

### 1.2 Typography

| Property | Value |
|----------|-------|
| Font Family | Open Sans, sans-serif |
| Serif Fallback | Georgia, serif |
| Mono Fallback | Menlo, monospace |
| Body Base | `font-sans antialiased` applied globally |
| Text Rendering | Antialiased for smoother rendering |

**Text Hierarchy** (3 levels):
1. **Default** (`text-foreground`): Primary content, headings, labels
2. **Secondary** (`text-muted-foreground`): Supporting info, descriptions, captions
3. **Tertiary** (`text-muted-foreground` with smaller size): Least important, timestamps, hints

**Heading Sizes Used Across Pages**:
- Hero: `text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight`
- Page Title: `text-2xl font-bold` or `text-xl font-semibold`
- Section Title: `text-lg font-semibold`
- Card Title: `font-semibold` (default size)
- Label: `text-sm font-medium`
- Caption: `text-xs text-muted-foreground`

### 1.3 Spacing & Layout

| Token | Value |
|-------|-------|
| Base spacing unit | 0.25rem (4px) |
| Border radius lg | 9px (0.5625rem) |
| Border radius md | 6px (0.375rem) |
| Border radius sm | 3px (0.1875rem) |

**Container**: `container mx-auto px-4` — centered with horizontal padding
**Standard Page Padding**: `py-8` (32px vertical)
**Card Padding**: `p-4` or `p-6` depending on content density
**Gap Between Cards**: `gap-4` or `gap-6`

### 1.4 Shadows

All shadow values are set to transparent (0 opacity) in both modes — the design is **flat/borderless** by default. Visual separation relies on background color contrast and borders rather than shadows.

### 1.5 Dark Mode

- Enabled via CSS class toggle (`darkMode: ["class"]`)
- The `.dark` class is applied to `document.documentElement`
- All color tokens have dark mode overrides
- Managed by ThemeToggle component (stored in localStorage)

---

## 2. Component Library (shadcn/ui + Custom)

### 2.1 Button

**Variants Used**:
| Variant | Appearance | Typical Usage |
|---------|-----------|---------------|
| `default` (primary) | Purple bg, white text | Main CTAs, submit actions |
| `destructive` | Red bg, white text | Delete, remove actions |
| `outline` | Transparent bg, subtle border | Secondary actions, filters |
| `ghost` | No bg, no border | Tertiary actions, icon buttons |
| `secondary` | Gray bg | Alternative secondary actions |

**Sizes**: `default` (min-h-9), `sm` (min-h-8), `lg` (min-h-10), `icon` (h-9 w-9)

**Interaction System**: All buttons use built-in `hover-elevate` and `active-elevate-2` classes (brightness overlay on hover/press). No custom hover colors are applied.

### 2.2 Badge

**Variants Used**:
| Variant | Usage |
|---------|-------|
| `default` | Featured indicators, cart count |
| `secondary` | Quantity badges (x5), filter counts |
| `outline` | Item type labels, orchid/decoration names |
| `destructive` | Out of stock, error states |

Badges include built-in `hover-elevate`. They never wrap text and have hidden overflow.

### 2.3 Card

- Styling: `rounded-xl border bg-card border-card-border text-card-foreground shadow-sm`
- Cards are never nested inside other cards
- Cards are never used as sidebar containers
- Uses `CardHeader`, `CardContent`, `CardFooter` sub-components

### 2.4 Dialog/Modal

- Used for: product detail view, edit forms, delete confirmations
- Contains: `DialogHeader` with `DialogTitle`, content area, optional `DialogFooter`
- Max width varies: product detail uses `max-w-4xl`, forms use default

### 2.5 Table

- Used in all admin management pages
- Structure: `Table > TableHeader > TableRow > TableHead` + `TableBody > TableRow > TableCell`
- Responsive via horizontal scroll wrapper (`overflow-x-auto`)

### 2.6 Form Controls

- Forms use `react-hook-form` with `zodResolver`
- Input fields: shadcn `Input`, `Select`, `Textarea`, `Checkbox`
- All controls maintain consistent height when on the same horizontal line

### 2.7 Custom Elevation System

The app uses a custom CSS utility system for interactions:
- `hover-elevate`: Subtle brightness overlay on hover
- `active-elevate-2`: Stronger brightness overlay on click/press
- `toggle-elevate` + `toggle-elevated`: For toggleable states
- These work by adding a `::before`/`::after` pseudo-element overlay

---

## 3. Shared Components

### 3.1 PublicHeader (Public Pages)

**Layout**: Sticky top bar, 64px height (`h-16`), full-width with border-bottom
**Background**: Semi-transparent with backdrop blur (`bg-background/95 backdrop-blur`)
**Structure (left to right)**:
1. Logo: Flower2 icon + "Vườn Lan Hùng Cường" text
2. Desktop Nav: Horizontal buttons (Home, Shop, Checkout, Track Order)
3. Utility Area: Cart button (with count badge), Chatbot button, Language toggle (VI/EN), Theme toggle (sun/moon), Mobile menu button (md:hidden)

**Mobile**: Nav links collapse into a dropdown panel below header. Cart opens as a side Sheet.

**Active State**: Current page nav button uses `variant="secondary"`, others use `variant="ghost"`

### 3.2 StaffSidebar (Admin Pages)

**Component**: shadcn Sidebar (`SidebarProvider` > `Sidebar` > `SidebarContent`)
**Width**: 16rem (256px), icon mode: 3rem (48px)
**Structure (3 groups)**:

1. **Dashboard** (visible to all staff):
   - Dashboard, Catalog, Orders, Pre-made Pots

2. **Management** (ADMIN + MANAGER only):
   - Customers, Technicians, Suppliers, Inventory, Purchase Orders

3. **System** (ADMIN only):
   - Users, Reports, Notifications, Audit Log, Settings

**Header Bar**: 56px height (`h-14`), contains sidebar trigger, page title, language toggle, theme toggle
**Active State**: `isActive` check highlights current page via `SidebarMenuButton`

### 3.3 StatusBadge

Custom component that maps status strings to colored badges:
- ACTIVE/Available: Green variant
- INACTIVE/Unavailable: Gray variant
- PENDING: Yellow/amber variant
- Status-specific text translations (vi/en)

### 3.4 LanguageToggle

Simple button showing "EN" or "VI" — clicking toggles between Vietnamese and English. Uses `variant="ghost" size="sm"`.

### 3.5 ThemeToggle

Icon button toggling between Sun (light) and Moon (dark) icons. Persists choice to localStorage.

### 3.6 AI Chatbot

Floating button in bottom-right corner of all pages. Opens a chat panel. Two modes:
- **Customer mode**: Product inquiries, ordering help, order tracking
- **Admin mode**: Business insights, inventory queries, revenue data

---

## 4. Page-by-Page UI/UX Details

### 4.1 Landing Page (`/`)

**Layout**: Full-width vertical flow, no sidebar
**Sections**:
1. **Hero**: Gradient background (orchid-100 → orchid-50 → background), SVG cross pattern overlay at 5% opacity. Centered text with pill badge, large heading, subtitle, two CTA buttons (primary "Shop Now" + outline "Track Order")
2. **Features**: 3-column grid of Cards with icon + title + description
3. **Testimonials**: Grid of customer quote cards
4. **CTA Section**: Centered call-to-action block

**Color Treatment**: Hero uses custom orchid gradient colors with dark mode variants (`dark:from-orchid-900/20`)

### 4.2 Shop Page (`/shop`)

**Layout**: Sidebar (filters) + main content area
- Desktop: Fixed 256px left sidebar with filter controls, right side has search + sort + product grid
- Mobile: Filters accessible via Sheet (slide-in panel) triggered by filter icon button

**Filter Sidebar**:
- 3 multi-select dropdowns (Orchid Types, Pot Types, Decoration Types)
- Each uses Popover with checkboxes inside
- Trigger shows "Select..." or "N selected" count
- "Clear Filters" button at bottom

**Active Filters**: Row of removable Badge chips above product grid with "Clear all" link

**Search + Sort Bar**: Search input (left) + sort dropdown (right: Featured, Price Low→High, Price High→Low)

**Product Cards** (responsive grid: 1/2/3 columns):
- Aspect-square image area with placeholder orchid icon if no image
- Featured badge (top-left, star icon)
- Media count badge (top-right, if multiple photos/videos)
- Out of stock overlay (semi-transparent black with red badge)
- Card content: Name, itemized orchid composition with quantities and costs, pot type with cost, decorations with costs, total price with separator line
- Footer: "View Details" outline button + "Add to Cart" primary button

**Product Detail Dialog** (`max-w-4xl`):
- 2-column layout on desktop: MediaGallery (left) + Details (right)
- MediaGallery: Image/video carousel with prev/next buttons, dot indicators, counter badge
- Details: Price, description, orchid composition with quantities/colors/costs, pot type with cost, decorations with costs, dimensions (optional), weight (optional), stock count, care instructions
- Thumbnail grid below (clickable, syncs with main gallery via ring highlight)
- "Add to Cart" full-width button

### 4.3 Checkout Page (`/checkout`)

**Layout**: Full-width, multi-step wizard
**Steps** (5-step progress with numbered indicators):
1. **Composition Builder**: Add/remove pots, select orchid types per pot with quantity controls (+/- buttons, minimum 5 stems), select pot type, select decoration type. Reference gallery of pre-made pots appears when selections match.
2. **Customer Information**: Form fields — Full Name, Phone, Email, Province, District (optional), Ward, Street Address
3. **Shipping Selection**: Radio cards for shipping options with name, description, estimated days, cost
4. **Payment**: VietQR display with bank details, static QR code image, payment proof upload (file upload to object storage), deposit amount calculation (50%)
5. **Confirmation**: Order summary, tracking token, link to tracking page

**Cart Mode**: If coming from Shop with items in cart, skips step 0 and shows cart summary instead of composition builder

### 4.4 Order Tracking Page (`/tracking`)

**Layout**: Centered card, full-width background
**Features**:
- Two search modes: by tracking token, or by phone/email
- Tab-like toggle between modes
- Search results show order cards with status, date, items summary
- Order detail view in dialog or inline expansion

### 4.5 Login Page (`/login`)

**Layout**: Centered card on full-screen background
**Form**: Username + Password fields, Login button
**Style**: Simple Card with form, minimal design

### 4.6 Admin Dashboard (`/dashboard`)

**Layout**: Sidebar + main content
**Stats Cards Row**: 4 summary cards (Total Revenue, Total Orders, Pending Orders, Active Customers) with icons and values
**Charts**: Revenue chart (line/bar), Order status distribution
**Recent Orders**: Table with latest orders

### 4.7 Catalog Management (`/dashboard/catalog`)

**Layout**: Sidebar + main content with 5 tabs
**Tabs**: Orchid, Pot, Decoration, Shipping, Payment types
**Each Tab**:
- Header with title + "Add New" button
- Search bar
- Data table with columns specific to type
- CRUD dialogs for add/edit
- Status toggle (ACTIVE/INACTIVE)

### 4.8 Orders Management (`/dashboard/orders`)

**Layout**: Sidebar + main content
**Features**:
- Search bar + status filter dropdown
- Statistics cards (total, pending, confirmed, completed)
- Orders table: Order #, customer, date, items, total, status, actions
- Order detail dialog with status update, technician assignment, payment tracking
- Dropdown menus for status changes

### 4.9 Pre-made Pots Management (`/dashboard/premade-pots`)

**Layout**: Sidebar + main content
**Features**:
- "Add New Pot" button in header
- Status/search filters
- Table: Image thumbnail, name, price, tags (as badges), stock, featured star, status, actions
- **Action Buttons**: Clearly labeled "Edit" (outline) and "Delete" (destructive) buttons with icons + text
- Add/Edit Dialog: Multi-section form with name (vi/en), description, price, stock, images upload, videos upload, orchid composition builder (add types with quantities), pot type selector, decoration selector, tags management (auto-generate + manual edit), care instructions, size/status toggles

### 4.10 Customers (`/dashboard/customers`)

**Layout**: Sidebar + main content
**Features**:
- Stats cards (total, VIP, registered, average spent)
- Search + type filter (All, VIP, Registered, Guest)
- Table: Name, email, phone, type, total spent, orders count, status, actions
- Add/Edit dialogs
- Block/Unblock toggle

### 4.11 Technicians (`/dashboard/technicians`)

**Layout**: Sidebar + main content
**Features**:
- Stats cards with workload indicators
- Availability badges: Available (green), Near Full (amber), Busy (red)
- Table: Name, specialization, workload, availability, status, actions
- Link to user account (optional)

### 4.12 Suppliers (`/dashboard/suppliers`)

**Layout**: Sidebar + main content
**Features**:
- Table: Name, contact, type, rating (star display), status, actions
- CRUD dialogs

### 4.13 Inventory (`/dashboard/inventory`)

**Layout**: Sidebar + main content
**Features**:
- Summary cards for orchid and pre-made pot stock levels
- Low/critical stock alerts with color coding
- Adjustment dialog with increment/decrement controls
- Table: Item name, current stock, minimum stock, status indicator

### 4.14 Purchase Orders (`/dashboard/purchase-orders`)

**Layout**: Sidebar + main content
**Features**:
- Supplier selection dropdown
- Dynamic item management (add/remove line items)
- Status workflow: Pending → Confirmed → Shipped → Received
- Payment tracking

### 4.15 Reports (`/dashboard/reports`)

**Layout**: Sidebar + main content with 5 tabs
**Tabs**: Sales, Orders, Customers, Technicians, Suppliers
**Each Tab**: Summary metrics cards, charts (bar/line), data tables

### 4.16 Notifications (`/dashboard/notifications`)

**Layout**: Sidebar + main content
**Features**:
- Stats cards (total, unread, by type)
- Status/type filtering
- Mark as read, delete actions
- Notification channels management (Email, SMS, Voicemail, Zalo)

### 4.17 Audit Log (`/dashboard/audit-log`)

**Layout**: Sidebar + main content
**Features**: Read-only table of system activities, auto-refresh every 30 seconds

### 4.18 Settings (`/dashboard/settings`)

**Layout**: Sidebar + main content
**Sections**:
- Tax configuration (toggle + percentage)
- Display settings (show dimensions, show weight)
- API credentials for notification services (Plivo, ZeptoMail, Zalo)
- Notification channels CRUD

### 4.19 Users (`/dashboard/users`)

**Layout**: Sidebar + main content
**Features**:
- Stats cards (total, active, by role)
- Search + role/status filters
- Table: Username, full name, email, role, status, actions
- Add/Edit dialogs with role dropdown (ADMIN, MANAGER, EMPLOYEE)
- Enable/Disable toggle

---

## 5. Interaction Patterns

### 5.1 Hover & Active States
- **Buttons/Badges**: Built-in brightness overlay (hover-elevate + active-elevate-2), never custom hover colors
- **Filter checkboxes**: `hover-elevate` on label wrapper
- **Cards**: No hover elevation by default (flat design)
- **Sidebar items**: shadcn SidebarMenuButton handles active/hover states

### 5.2 Loading States
- Skeleton components shown during data fetch (`isLoading` from TanStack Query)
- Buttons show loading spinner during mutations (`isPending`)

### 5.3 Toast Notifications
- Success/error feedback via shadcn Toast (top-right)
- Used for: CRUD operations, login/logout, cart actions

### 5.4 Dialogs
- Confirmation dialogs before destructive actions (delete)
- Form dialogs for create/edit operations
- Product detail dialogs on shop page

### 5.5 Responsive Breakpoints
- Mobile-first approach
- `md:` (768px) — sidebar visibility, grid column changes
- `lg:` (1024px) — larger grid layouts
- `sm:` (640px) — minor adjustments

---

## 6. Multi-Language (i18n) System

- **Default Language**: Vietnamese (vi)
- **Supported**: Vietnamese (vi), English (en)
- **Toggle**: Single button showing opposite language code
- **Implementation**: `t(key, language)` function with dot-notation keys
- **Currency**: Vietnamese Dong (VND) formatted as `X.XXX.XXXđ`
- **Fallback**: English if translation missing, then returns key itself

**Coverage**: Navigation, landing page, shop, checkout, tracking, dashboard, forms, status labels, common actions

---

## 7. Design Principles Summary

| Principle | Implementation |
|-----------|---------------|
| **Visual Hierarchy** | 3-level text color system + font size variation |
| **Flat Design** | No drop shadows, borders for separation, subtle bg contrast |
| **Consistency** | shadcn component library with semantic color tokens |
| **Accessibility** | Focus rings (ring color = primary), ARIA labels on interactive elements, data-testid attributes |
| **Responsiveness** | Mobile-first, collapsible sidebar, responsive grids |
| **Dark Mode** | Full theme support via CSS class toggle |
| **Internationalization** | Complete vi/en support across all pages |
