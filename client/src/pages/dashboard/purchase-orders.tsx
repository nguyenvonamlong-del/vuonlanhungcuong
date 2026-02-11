import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Search, MessageCircle, Package, Truck, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { t, formatCurrency } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PurchaseOrder, Supplier, CatalogItem, PotType, DecorationType } from "@shared/schema";

interface FormData {
  supplierId: string;
  items: Array<{
    itemType: string;
    catalogItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  shippingCost: string;
  notes: string;
  expectedDelivery: string;
}

const initialFormData: FormData = {
  supplierId: "",
  items: [],
  shippingCost: "0",
  notes: "",
  expectedDelivery: "",
};

export default function PurchaseOrdersPage() {
  const { language, user } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
  });

  const { data: potTypes = [] } = useQuery<PotType[]>({
    queryKey: ["/api/pot-types"],
  });

  const { data: decorationTypes = [] } = useQuery<DecorationType[]>({
    queryKey: ["/api/decoration-types"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/purchase-orders/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật trạng thái" : "Status updated",
      });
    },
    onError: () => {
      toast({
        title: t("common.error", language),
        description: language === "vi" ? "Không thể cập nhật" : "Failed to update",
        variant: "destructive",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/purchase-orders", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã tạo đơn đặt hàng" : "Purchase order created",
      });
    },
    onError: () => {
      toast({
        title: t("common.error", language),
        description: language === "vi" ? "Không thể tạo đơn" : "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || "Unknown";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="h-4 w-4" />;
      case "CONFIRMED": return <CheckCircle className="h-4 w-4" />;
      case "SHIPPED": return <Truck className="h-4 w-4" />;
      case "RECEIVED": return <Package className="h-4 w-4" />;
      case "CANCELLED": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="default" className="bg-green-600">{language === "vi" ? "Đã thanh toán" : "Paid"}</Badge>;
      case "PARTIAL":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{language === "vi" ? "Một phần" : "Partial"}</Badge>;
      default:
        return <Badge variant="outline">{language === "vi" ? "Chưa thanh toán" : "Unpaid"}</Badge>;
    }
  };

  const openOrderDetail = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemType: "ORCHID", catalogItemId: "", itemName: "", quantity: 1, unitPrice: 0, subtotal: 0 }]
    }));
  };

  const getAvailableItemsForType = (type: string) => {
    switch (type) {
      case "ORCHID":
        return catalogItems.map(item => ({ id: item.id, name: language === "vi" ? item.speciesNameVi : item.speciesNameEn, price: parseFloat(String(item.pricePerUnit)) })).sort((a, b) => a.name.localeCompare(b.name));
      case "POT":
        return potTypes.map(item => ({ id: item.id, name: language === "vi" ? item.nameVi : item.nameEn, price: parseFloat(item.price || "0") })).sort((a, b) => a.name.localeCompare(b.name));
      case "DECORATION":
        return decorationTypes.map(item => ({ id: item.id, name: language === "vi" ? item.nameVi : item.nameEn, price: parseFloat(item.price || "0") })).sort((a, b) => a.name.localeCompare(b.name));
      default:
        return [];
    }
  };

  const handleItemTypeChange = (index: number, type: string) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], itemType: type, catalogItemId: "", itemName: "", unitPrice: 0, subtotal: 0 };
      return { ...prev, items };
    });
  };

  const handleCatalogItemChange = (index: number, itemId: string) => {
    const item = formData.items[index];
    const availableItems = getAvailableItemsForType(item.itemType);
    const selectedItem = availableItems.find(i => i.id === itemId);
    if (selectedItem) {
      setFormData(prev => {
        const items = [...prev.items];
        items[index] = { 
          ...items[index], 
          catalogItemId: itemId, 
          itemName: selectedItem.name, 
          unitPrice: selectedItem.price, 
          subtotal: items[index].quantity * selectedItem.price 
        };
        return { ...prev, items };
      });
    }
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        items[index].subtotal = items[index].quantity * items[index].unitPrice;
      }
      return { ...prev, items };
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalAmount = subtotal + parseFloat(formData.shippingCost || "0");
    
    createOrderMutation.mutate({
      supplierId: formData.supplierId,
      items: formData.items,
      subtotal: subtotal.toString(),
      shippingCost: formData.shippingCost,
      totalAmount: totalAmount.toString(),
      notes: formData.notes,
      expectedDelivery: formData.expectedDelivery ? new Date(formData.expectedDelivery) : null,
      createdBy: user?.id,
    });
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const totalPending = purchaseOrders.filter(o => o.status === "PENDING").length;
  const totalConfirmed = purchaseOrders.filter(o => o.status === "CONFIRMED").length;
  const totalValue = purchaseOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
  const unpaidValue = purchaseOrders.filter(o => o.paymentStatus !== "PAID").reduce((sum, o) => sum + parseFloat(o.totalAmount) - parseFloat(o.paidAmount || "0"), 0);

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <StaffSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 h-14 px-4 border-b bg-background shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="font-semibold">{language === "vi" ? "Đơn đặt hàng nhà cung cấp" : "Purchase Orders"}</h1>
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
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Chờ xử lý" : "Pending"}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Đã xác nhận" : "Confirmed"}</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalConfirmed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng giá trị" : "Total Value"}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalValue, language)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Chưa thanh toán" : "Unpaid"}</CardTitle>
                  <DollarSign className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatCurrency(unpaidValue, language)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "vi" ? "Tìm theo mã đơn..." : "Search by order number..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder={language === "vi" ? "Trạng thái" : "Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
                    <SelectItem value="PENDING">{language === "vi" ? "Chờ xử lý" : "Pending"}</SelectItem>
                    <SelectItem value="CONFIRMED">{language === "vi" ? "Đã xác nhận" : "Confirmed"}</SelectItem>
                    <SelectItem value="SHIPPED">{language === "vi" ? "Đang giao" : "Shipped"}</SelectItem>
                    <SelectItem value="RECEIVED">{language === "vi" ? "Đã nhận" : "Received"}</SelectItem>
                    <SelectItem value="CANCELLED">{language === "vi" ? "Đã hủy" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-po">
                <Plus className="h-4 w-4 mr-2" />
                {language === "vi" ? "Tạo đơn" : "Create Order"}
              </Button>
            </div>

            {/* Orders Table */}
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
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{t("common.noData", language)}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "vi" ? "Mã đơn" : "Order #"}</TableHead>
                          <TableHead>{language === "vi" ? "Nhà cung cấp" : "Supplier"}</TableHead>
                          <TableHead>{language === "vi" ? "Trạng thái" : "Status"}</TableHead>
                          <TableHead>{language === "vi" ? "Thanh toán" : "Payment"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Tổng tiền" : "Total"}</TableHead>
                          <TableHead>{language === "vi" ? "Ngày tạo" : "Created"}</TableHead>
                          <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id} data-testid={`row-po-${order.id}`}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{getSupplierName(order.supplierId)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(order.status)}
                                <StatusBadge status={order.status} />
                              </div>
                            </TableCell>
                            <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(order.totalAmount, language)}
                            </TableCell>
                            <TableCell>
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openOrderDetail(order)}
                                  data-testid={`button-view-${order.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
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

      {/* Create Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Tạo đơn đặt hàng" : "Create Purchase Order"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "vi" ? "Nhà cung cấp" : "Supplier"}</Label>
              <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                <SelectTrigger data-testid="select-supplier">
                  <SelectValue placeholder={language === "vi" ? "Chọn nhà cung cấp..." : "Select supplier..."} />
                </SelectTrigger>
                <SelectContent>
                  {[...suppliers].sort((a, b) => (a.name || "").localeCompare(b.name || "")).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{language === "vi" ? "Mặt hàng" : "Items"}</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  {language === "vi" ? "Thêm" : "Add"}
                </Button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-2 items-end">
                  <Select value={item.itemType} onValueChange={(v) => handleItemTypeChange(index, v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORCHID">{language === "vi" ? "Lan" : "Orchid"}</SelectItem>
                      <SelectItem value="POT">{language === "vi" ? "Chậu" : "Pot"}</SelectItem>
                      <SelectItem value="DECORATION">{language === "vi" ? "Trang trí" : "Decoration"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={item.catalogItemId} onValueChange={(v) => handleCatalogItemChange(index, v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "vi" ? "Chọn..." : "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableItemsForType(item.itemType).map((catalogItem) => (
                        <SelectItem key={catalogItem.id} value={catalogItem.id}>
                          {catalogItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder={language === "vi" ? "SL" : "Qty"}
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(index, "quantity", parseInt(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder={language === "vi" ? "Đơn giá" : "Price"}
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                  <div className="text-sm font-medium py-2">
                    {formatCurrency(item.subtotal, language)}
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveItem(index)}>
                    {language === "vi" ? "Xóa" : "Remove"}
                  </Button>
                </div>
              ))}
              {formData.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "vi" ? "Chưa có mặt hàng" : "No items added"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "vi" ? "Phí vận chuyển" : "Shipping Cost"}</Label>
                <Input
                  type="number"
                  value={formData.shippingCost}
                  onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Dự kiến giao" : "Expected Delivery"}</Label>
                <Input
                  type="date"
                  value={formData.expectedDelivery}
                  onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "vi" ? "Ghi chú" : "Notes"}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-lg font-bold">
                {language === "vi" ? "Tổng cộng: " : "Total: "}
                {formatCurrency(
                  formData.items.reduce((sum, item) => sum + item.subtotal, 0) + parseFloat(formData.shippingCost || "0"),
                  language
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel", language)}
              </Button>
              <Button
                type="submit"
                disabled={createOrderMutation.isPending || !formData.supplierId || formData.items.length === 0}
                data-testid="button-save-po"
              >
                {t("common.save", language)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === "vi" ? "Chi tiết đơn hàng" : "Order Details"} - {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "vi" ? "Nhà cung cấp" : "Supplier"}</p>
                  <p className="font-medium">{getSupplierName(selectedOrder.supplierId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "vi" ? "Trạng thái" : "Status"}</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{language === "vi" ? "Mặt hàng" : "Items"}</p>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                        <TableHead className="text-right">{language === "vi" ? "SL" : "Qty"}</TableHead>
                        <TableHead className="text-right">{language === "vi" ? "Đơn giá" : "Unit Price"}</TableHead>
                        <TableHead className="text-right">{language === "vi" ? "Thành tiền" : "Subtotal"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.sku && <span className="font-mono text-xs text-muted-foreground" data-testid={`text-sku-po-${index}`}>[{item.sku}]</span>}
                              <span data-testid={`text-itemname-${index}`}>{item.itemName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice, language)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.subtotal, language)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "vi" ? "Phí vận chuyển" : "Shipping"}</p>
                  <p>{formatCurrency(selectedOrder.shippingCost, language)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{language === "vi" ? "Tổng cộng" : "Total"}</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedOrder.totalAmount, language)}</p>
                </div>
              </div>

              {selectedOrder.status === "PENDING" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedOrder.id, status: "CONFIRMED" });
                      setDetailDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {language === "vi" ? "Xác nhận" : "Confirm"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedOrder.id, status: "CANCELLED" });
                      setDetailDialogOpen(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {language === "vi" ? "Hủy" : "Cancel"}
                  </Button>
                </div>
              )}

              {selectedOrder.status === "CONFIRMED" && (
                <Button
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedOrder.id, status: "SHIPPED" });
                    setDetailDialogOpen(false);
                  }}
                  className="w-full"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  {language === "vi" ? "Đánh dấu đang giao" : "Mark as Shipped"}
                </Button>
              )}

              {selectedOrder.status === "SHIPPED" && (
                <Button
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedOrder.id, status: "RECEIVED" });
                    setDetailDialogOpen(false);
                  }}
                  className="w-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  {language === "vi" ? "Xác nhận đã nhận hàng" : "Mark as Received"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
