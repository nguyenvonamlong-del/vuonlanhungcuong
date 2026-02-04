import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Eye, UserCheck, CreditCard, XCircle, Flower2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, Technician } from "@shared/schema";

const statusOptions = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SHIPPING", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const { language, user } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians/available"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật trạng thái" : "Status updated",
      });
    },
  });

  const assignTechnicianMutation = useMutation({
    mutationFn: async ({ orderId, technicianId }: { orderId: string; technicianId: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/assign`, { technicianId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setAssignDialogOpen(false);
      setSelectedTechnician("");
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã phân công kỹ thuật viên" : "Technician assigned",
      });
    },
  });

  const markPaymentMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "deposit" | "remaining" }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}/payment`, { type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã xác nhận thanh toán" : "Payment confirmed",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}/cancel`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setCancelDialogOpen(false);
      setCancelReason("");
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã hủy đơn hàng" : "Order cancelled",
      });
    },
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canUpdateStatus = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "EMPLOYEE";

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
              <h1 className="font-semibold">{t("orders.title", language)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("common.search", language) + "..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder={t("orders.status", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`status.${status}`, language)}
                      </SelectItem>
                    ))}
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
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Flower2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{t("orders.noOrders", language)}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("orders.orderNumber", language)}</TableHead>
                          <TableHead>{t("orders.customer", language)}</TableHead>
                          <TableHead className="text-right">{t("orders.total", language)}</TableHead>
                          <TableHead>{t("orders.status", language)}</TableHead>
                          <TableHead>{t("orders.date", language)}</TableHead>
                          <TableHead className="text-right">{t("orders.actions", language)}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                            <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{order.customerName}</p>
                                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(order.totalAmount, language)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={order.status} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.createdAt!).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" data-testid={`button-actions-${order.id}`}>
                                    {t("orders.actions", language)}
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setDetailDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t("orders.viewDetails", language)}
                                  </DropdownMenuItem>
                                  {canUpdateStatus && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setAssignDialogOpen(true);
                                        }}
                                      >
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        {t("orders.assignTechnician", language)}
                                      </DropdownMenuItem>
                                      {!order.depositPaid && (
                                        <DropdownMenuItem
                                          onClick={() => markPaymentMutation.mutate({ id: order.id, type: "deposit" })}
                                        >
                                          <CreditCard className="h-4 w-4 mr-2" />
                                          {t("orders.markDeposit", language)}
                                        </DropdownMenuItem>
                                      )}
                                      {order.depositPaid && !order.remainingPaid && (
                                        <DropdownMenuItem
                                          onClick={() => markPaymentMutation.mutate({ id: order.id, type: "remaining" })}
                                        >
                                          <CreditCard className="h-4 w-4 mr-2" />
                                          {t("orders.markPaid", language)}
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setCancelDialogOpen(true);
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {t("orders.cancel", language)}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("orders.orderNumber", language)}: {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <StatusBadge status={selectedOrder.status} />
                {canUpdateStatus && selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "DELIVERED" && (
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(status) => updateStatusMutation.mutate({ id: selectedOrder.id, status })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("orders.updateStatus", language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.filter((s) => s !== "CANCELLED").map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`status.${status}`, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("orders.customer", language)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">{t("form.fullName", language)}:</span> {selectedOrder.customerName}</p>
                  <p><span className="text-muted-foreground">{t("form.phone", language)}:</span> {selectedOrder.customerPhone}</p>
                  {selectedOrder.customerEmail && (
                    <p><span className="text-muted-foreground">{t("form.email", language)}:</span> {selectedOrder.customerEmail}</p>
                  )}
                  <p><span className="text-muted-foreground">{t("form.address", language)}:</span> {selectedOrder.streetAddress}, {selectedOrder.ward}, {selectedOrder.district}, {selectedOrder.province}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{language === "vi" ? "Sản phẩm" : "Products"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrder.pots?.map((pot: any, idx: number) => (
                    <div key={pot.potId || idx} className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium mb-2">{pot.potName}</p>
                      {pot.orchids?.length > 0 ? (
                        pot.orchids.map((orchid: any) => (
                          <div key={orchid.catalogId} className="flex justify-between text-sm pl-3">
                            <span>{orchid.speciesName} ({orchid.color}) x{orchid.quantity}</span>
                            <span>{formatCurrency(orchid.subtotal, language)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground pl-3">
                          {formatCurrency(pot.potSubtotal, language)}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground mb-1">{t("checkout.deposit", language)}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{formatCurrency(selectedOrder.depositAmount, language)}</span>
                    {selectedOrder.depositPaid ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                        {language === "vi" ? "Đã thanh toán" : "Paid"}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">
                        {language === "vi" ? "Chưa thanh toán" : "Unpaid"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground mb-1">{t("checkout.remaining", language)}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{formatCurrency(selectedOrder.remainingAmount, language)}</span>
                    {selectedOrder.remainingPaid ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                        {language === "vi" ? "Đã thanh toán" : "Paid"}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">
                        {language === "vi" ? "Chưa thanh toán" : "Unpaid"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t("checkout.total", language)}</span>
                  <span className="text-primary">{formatCurrency(selectedOrder.totalAmount, language)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("orders.assignTechnician", language)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger data-testid="select-technician">
                <SelectValue placeholder={language === "vi" ? "Chọn kỹ thuật viên" : "Select technician"} />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.fullName} ({tech.currentWorkload}/{tech.maxWorkload})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button
              onClick={() =>
                selectedOrder && assignTechnicianMutation.mutate({ orderId: selectedOrder.id, technicianId: selectedTechnician })
              }
              disabled={!selectedTechnician || assignTechnicianMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {t("common.confirm", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("orders.cancel", language)}</DialogTitle>
            <DialogDescription>
              {language === "vi"
                ? "Vui lòng nhập lý do hủy đơn hàng"
                : "Please enter the reason for cancellation"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "vi" ? "Lý do" : "Reason"}</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={language === "vi" ? "Nhập lý do hủy..." : "Enter cancellation reason..."}
                data-testid="input-cancel-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedOrder && cancelOrderMutation.mutate({ id: selectedOrder.id, reason: cancelReason })
              }
              disabled={!cancelReason || cancelOrderMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {t("common.confirm", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
