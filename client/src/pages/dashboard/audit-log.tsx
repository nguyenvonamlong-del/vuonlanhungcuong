import { useQuery } from "@tanstack/react-query";
import { History, User, Calendar, FileText, MessageCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import type { Activity, User as UserType } from "@shared/schema";

export default function AuditLogPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return language === "vi" ? "Hệ thống" : "System";
    const user = users.find((u) => u.id === userId);
    return user?.fullName || userId;
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, { vi: string; en: string }> = {
      ORDER: { vi: "Đơn hàng", en: "Order" },
      CATALOG: { vi: "Sản phẩm", en: "Product" },
      CUSTOMER: { vi: "Khách hàng", en: "Customer" },
      TECHNICIAN: { vi: "Kỹ thuật viên", en: "Technician" },
      USER: { vi: "Người dùng", en: "User" },
      SETTINGS: { vi: "Cài đặt", en: "Settings" },
      SUPPLIER: { vi: "Nhà cung cấp", en: "Supplier" },
      PURCHASE_ORDER: { vi: "Đơn nhập hàng", en: "Purchase Order" },
    };
    return labels[type]?.[language] || type;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { vi: string; en: string }> = {
      CREATE: { vi: "Tạo mới", en: "Create" },
      UPDATE: { vi: "Cập nhật", en: "Update" },
      DELETE: { vi: "Xóa", en: "Delete" },
      LOGIN: { vi: "Đăng nhập", en: "Login" },
      LOGOUT: { vi: "Đăng xuất", en: "Logout" },
      STATUS_CHANGE: { vi: "Đổi trạng thái", en: "Status Change" },
      ASSIGN: { vi: "Phân công", en: "Assign" },
      PAYMENT: { vi: "Thanh toán", en: "Payment" },
    };
    return labels[action]?.[language] || action;
  };

  const getActionVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case "CREATE": return "default";
      case "DELETE": return "destructive";
      case "UPDATE": return "secondary";
      default: return "outline";
    }
  };

  const formatDate = (date: Date | null | string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <StaffSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 h-14 px-4 border-b bg-background shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="font-semibold">
                {language === "vi" ? "Nhật Ký Hoạt Động" : "Audit Log"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={openChatbot} data-testid="button-header-chatbot">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {language === "vi" ? "Lịch sử hoạt động" : "Activity History"}
                </CardTitle>
                <Badge variant="outline" className="text-muted-foreground">
                  {activities.length} {language === "vi" ? "hoạt động" : "activities"}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {language === "vi" ? "Chưa có hoạt động nào" : "No activities found"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                        data-testid={`row-activity-${activity.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getActionVariant(activity.action)}>
                                {getActionLabel(activity.action)}
                              </Badge>
                              <Badge variant="outline">
                                {getEntityTypeLabel(activity.entityType)}
                              </Badge>
                              {activity.entityId && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  #{activity.entityId.slice(0, 8)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{activity.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {getUserName(activity.userId)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(activity.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              {language === "vi"
                ? "Nhật ký này chỉ đọc và tự động cập nhật mỗi 30 giây"
                : "This log is read-only and auto-refreshes every 30 seconds"}
            </p>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
