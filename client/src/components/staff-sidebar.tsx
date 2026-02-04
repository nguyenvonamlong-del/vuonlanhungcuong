import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Flower2,
  ShoppingBag,
  Users,
  Wrench,
  Settings,
  LogOut,
  Package,
  Building2,
  History,
  Warehouse,
  ClipboardList,
  Bell,
  BarChart3,
  UserCog,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function StaffSidebar() {
  const { language, user, logout } = useApp();
  const [location] = useLocation();

  const mainMenuItems = [
    { href: "/dashboard", label: t("nav.dashboard", language), icon: LayoutDashboard },
    { href: "/dashboard/catalog", label: t("nav.catalog", language), icon: Flower2 },
    { href: "/dashboard/orders", label: t("nav.orders", language), icon: ShoppingBag },
    { href: "/dashboard/premade-pots", label: t("nav.premadePots", language), icon: Package },
  ];

  const managementItems = [
    { href: "/dashboard/customers", label: t("nav.customers", language), icon: Users },
    { href: "/dashboard/technicians", label: t("nav.technicians", language), icon: Wrench },
    { href: "/dashboard/suppliers", label: language === "vi" ? "Nhà cung cấp" : "Suppliers", icon: Building2 },
    { href: "/dashboard/inventory", label: language === "vi" ? "Tồn kho" : "Inventory", icon: Warehouse },
    { href: "/dashboard/purchase-orders", label: language === "vi" ? "Đơn nhập hàng" : "Purchase Orders", icon: ClipboardList },
  ];

  const adminItems = user?.role === "ADMIN" ? [
    { href: "/dashboard/users", label: language === "vi" ? "Người dùng" : "Users", icon: UserCog },
    { href: "/dashboard/reports", label: language === "vi" ? "Báo cáo" : "Reports", icon: BarChart3 },
    { href: "/dashboard/notifications", label: language === "vi" ? "Thông báo" : "Notifications", icon: Bell },
    { href: "/dashboard/audit-log", label: language === "vi" ? "Nhật ký" : "Audit Log", icon: History },
    { href: "/dashboard/settings", label: language === "vi" ? "Cài đặt" : "Settings", icon: Settings },
  ] : [];

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/dashboard";
    return location.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Flower2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{t("landing.heroTitle", language)}</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.dashboard", language)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href} data-testid={`link-sidebar-${item.href.replace("/dashboard/", "").replace("/dashboard", "dashboard")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {language === "vi" ? "Quản lý" : "Management"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                    >
                      <Link href={item.href} data-testid={`link-sidebar-${item.href.replace("/dashboard/", "")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {language === "vi" ? "Hệ thống" : "System"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                    >
                      <Link href={item.href} data-testid={`link-sidebar-${item.href.replace("/dashboard/", "")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
            <p className="text-xs text-muted-foreground">{user?.role || "Staff"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
