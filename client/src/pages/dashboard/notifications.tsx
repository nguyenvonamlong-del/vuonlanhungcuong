import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Search, MessageCircle, Trash2, Eye, RefreshCw, Filter, Clock, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export default function NotificationsPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/notifications/${id}`, { status: "READ" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: language === "vi" ? "Đã đánh dấu đã đọc" : "Marked as read",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: language === "vi" ? "Đã xóa thông báo" : "Notification deleted",
      });
    },
  });

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const unreadCount = notifications.filter(n => n.status === "PENDING" || n.status === "SENT").length;
  const pendingCount = notifications.filter(n => n.status === "PENDING").length;
  const sentCount = notifications.filter(n => n.status === "SENT").length;
  const failedCount = notifications.filter(n => n.status === "FAILED").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {language === "vi" ? "Chờ xử lý" : "Pending"}
        </Badge>;
      case "SENT":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Send className="h-3 w-3" />
          {language === "vi" ? "Đã gửi" : "Sent"}
        </Badge>;
      case "READ":
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCheck className="h-3 w-3" />
          {language === "vi" ? "Đã đọc" : "Read"}
        </Badge>;
      case "FAILED":
        return <Badge variant="destructive">{language === "vi" ? "Thất bại" : "Failed"}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, { vi: string; en: string; color: string }> = {
      ORDER_CREATED: { vi: "Đơn mới", en: "New Order", color: "bg-green-100 text-green-800" },
      ORDER_UPDATED: { vi: "Cập nhật đơn", en: "Order Update", color: "bg-blue-100 text-blue-800" },
      PAYMENT_RECEIVED: { vi: "Thanh toán", en: "Payment", color: "bg-yellow-100 text-yellow-800" },
      LOW_STOCK: { vi: "Hết hàng", en: "Low Stock", color: "bg-red-100 text-red-800" },
      SUPPLIER_DELIVERY: { vi: "Nhập hàng", en: "Delivery", color: "bg-purple-100 text-purple-800" },
      SYSTEM: { vi: "Hệ thống", en: "System", color: "bg-gray-100 text-gray-800" },
    };
    const label = typeLabels[type] || { vi: type, en: type, color: "bg-gray-100 text-gray-800" };
    return <Badge className={label.color}>{language === "vi" ? label.vi : label.en}</Badge>;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "EMAIL": return <Mail className="h-4 w-4 text-muted-foreground" />;
      case "SYSTEM": return <Bell className="h-4 w-4 text-muted-foreground" />;
      default: return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
    }
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
              <h1 className="font-semibold">{language === "vi" ? "Thông báo" : "Notifications"}</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => refetch()} data-testid="button-refresh">
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={openChatbot} data-testid="button-header-chatbot">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Chưa đọc" : "Unread"}</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{unreadCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Chờ gửi" : "Pending"}</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Đã gửi" : "Sent"}</CardTitle>
                  <Check className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{sentCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Thất bại" : "Failed"}</CardTitle>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{failedCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "vi" ? "Tìm kiếm..." : "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                    <SelectValue placeholder={language === "vi" ? "Trạng thái" : "Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
                    <SelectItem value="PENDING">{language === "vi" ? "Chờ xử lý" : "Pending"}</SelectItem>
                    <SelectItem value="SENT">{language === "vi" ? "Đã gửi" : "Sent"}</SelectItem>
                    <SelectItem value="READ">{language === "vi" ? "Đã đọc" : "Read"}</SelectItem>
                    <SelectItem value="FAILED">{language === "vi" ? "Thất bại" : "Failed"}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
                    <SelectValue placeholder={language === "vi" ? "Loại" : "Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
                    <SelectItem value="ORDER_CREATED">{language === "vi" ? "Đơn mới" : "New Order"}</SelectItem>
                    <SelectItem value="ORDER_UPDATED">{language === "vi" ? "Cập nhật đơn" : "Order Update"}</SelectItem>
                    <SelectItem value="PAYMENT_RECEIVED">{language === "vi" ? "Thanh toán" : "Payment"}</SelectItem>
                    <SelectItem value="LOW_STOCK">{language === "vi" ? "Hết hàng" : "Low Stock"}</SelectItem>
                    <SelectItem value="SYSTEM">{language === "vi" ? "Hệ thống" : "System"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{language === "vi" ? "Không có thông báo" : "No notifications"}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>{language === "vi" ? "Tiêu đề" : "Title"}</TableHead>
                          <TableHead>{language === "vi" ? "Loại" : "Type"}</TableHead>
                          <TableHead>{language === "vi" ? "Trạng thái" : "Status"}</TableHead>
                          <TableHead>{language === "vi" ? "Thời gian" : "Time"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Thao tác" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNotifications.map((notification) => (
                          <TableRow 
                            key={notification.id} 
                            className={`cursor-pointer ${notification.status === "PENDING" || notification.status === "SENT" ? "bg-muted/30" : ""}`}
                            onClick={() => setSelectedNotification(notification)}
                            data-testid={`row-notification-${notification.id}`}
                          >
                            <TableCell>
                              {getChannelIcon(notification.channel)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">{notification.message}</div>
                            </TableCell>
                            <TableCell>{getTypeBadge(notification.type)}</TableCell>
                            <TableCell>{getStatusBadge(notification.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {notification.createdAt ? new Date(notification.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {(notification.status === "PENDING" || notification.status === "SENT") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => markReadMutation.mutate(notification.id)}
                                    data-testid={`button-read-${notification.id}`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => deleteMutation.mutate(notification.id)}
                                  data-testid={`button-delete-${notification.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getChannelIcon(selectedNotification?.channel || "SYSTEM")}
              {selectedNotification?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedNotification.type)}
                {getStatusBadge(selectedNotification.status)}
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p>{selectedNotification.message}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {language === "vi" ? "Thời gian: " : "Time: "}
                {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "-"}
              </div>
              {selectedNotification.sentAt && (
                <div className="text-sm text-muted-foreground">
                  {language === "vi" ? "Đã gửi: " : "Sent: "}
                  {new Date(selectedNotification.sentAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                </div>
              )}
              <DialogFooter>
                {(selectedNotification.status === "PENDING" || selectedNotification.status === "SENT") && (
                  <Button
                    onClick={() => {
                      markReadMutation.mutate(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {language === "vi" ? "Đánh dấu đã đọc" : "Mark as Read"}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
