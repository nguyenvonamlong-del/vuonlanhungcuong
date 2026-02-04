import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { ChatbotProvider } from "@/context/ChatbotContext";
import { AuthGuard } from "@/components/auth-guard";
import { Chatbot } from "@/components/chatbot";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import ShopPage from "@/pages/shop";
import CheckoutPage from "@/pages/checkout";
import TrackingPage from "@/pages/tracking";
import DashboardPage from "@/pages/dashboard/index";
import CatalogPage from "@/pages/dashboard/catalog";
import OrdersPage from "@/pages/dashboard/orders";
import CustomersPage from "@/pages/dashboard/customers";
import TechniciansPage from "@/pages/dashboard/technicians";
import PremadePotsPage from "@/pages/dashboard/premade-pots";
import SuppliersPage from "@/pages/dashboard/suppliers";
import InventoryPage from "@/pages/dashboard/inventory";
import PurchaseOrdersPage from "@/pages/dashboard/purchase-orders";
import NotificationsPage from "@/pages/dashboard/notifications";
import ReportsPage from "@/pages/dashboard/reports";
import AuditLogPage from "@/pages/dashboard/audit-log";
import SettingsPage from "@/pages/dashboard/settings";
import UsersPage from "@/pages/dashboard/users";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AuthGuard>
      <Component />
    </AuthGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/shop" component={ShopPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/tracking" component={TrackingPage} />
      <Route path="/dashboard">{() => <ProtectedRoute component={DashboardPage} />}</Route>
      <Route path="/dashboard/catalog">{() => <ProtectedRoute component={CatalogPage} />}</Route>
      <Route path="/dashboard/orders">{() => <ProtectedRoute component={OrdersPage} />}</Route>
      <Route path="/dashboard/customers">{() => <ProtectedRoute component={CustomersPage} />}</Route>
      <Route path="/dashboard/technicians">{() => <ProtectedRoute component={TechniciansPage} />}</Route>
      <Route path="/dashboard/premade-pots">{() => <ProtectedRoute component={PremadePotsPage} />}</Route>
      <Route path="/dashboard/suppliers">{() => <ProtectedRoute component={SuppliersPage} />}</Route>
      <Route path="/dashboard/inventory">{() => <ProtectedRoute component={InventoryPage} />}</Route>
      <Route path="/dashboard/purchase-orders">{() => <ProtectedRoute component={PurchaseOrdersPage} />}</Route>
      <Route path="/dashboard/notifications">{() => <ProtectedRoute component={NotificationsPage} />}</Route>
      <Route path="/dashboard/reports">{() => <ProtectedRoute component={ReportsPage} />}</Route>
      <Route path="/dashboard/audit-log">{() => <ProtectedRoute component={AuditLogPage} />}</Route>
      <Route path="/dashboard/settings">{() => <ProtectedRoute component={SettingsPage} />}</Route>
      <Route path="/dashboard/users">{() => <ProtectedRoute component={UsersPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <ChatbotProvider>
            <Toaster />
            <Router />
            <Chatbot />
          </ChatbotProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
