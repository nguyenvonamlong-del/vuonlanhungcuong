import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Building2, Search, MessageCircle, Phone, Mail, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { formatCurrency } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Supplier, InsertSupplier } from "@shared/schema";

const initialFormData: Partial<InsertSupplier> = {
  name: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  address: "",
  supplierType: "ORCHID",
  rating: undefined,
  notes: "",
  status: "ACTIVE",
};

export default function SuppliersPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<InsertSupplier>>(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertSupplier>) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: language === "vi" ? "Thành công" : "Success",
        description: language === "vi" ? "Đã thêm nhà cung cấp" : "Supplier added successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể thêm nhà cung cấp" : "Failed to add supplier",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSupplier> }) => {
      const response = await apiRequest("PUT", `/api/suppliers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
      toast({
        title: language === "vi" ? "Thành công" : "Success",
        description: language === "vi" ? "Đã cập nhật nhà cung cấp" : "Supplier updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể cập nhật nhà cung cấp" : "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      toast({
        title: language === "vi" ? "Thành công" : "Success",
        description: language === "vi" ? "Đã xóa nhà cung cấp" : "Supplier deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể xóa nhà cung cấp" : "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const filteredItems = suppliers.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.contactPerson || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEdit = (item: Supplier) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      contactPerson: item.contactPerson || "",
      phoneNumber: item.phoneNumber,
      email: item.email || "",
      address: item.address || "",
      supplierType: item.supplierType,
      rating: item.rating || undefined,
      notes: item.notes || "",
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getSupplierTypeLabel = (type: string) => {
    const labels: Record<string, { vi: string; en: string }> = {
      ORCHID: { vi: "Lan", en: "Orchid" },
      POT: { vi: "Chậu", en: "Pot" },
      DECORATION: { vi: "Trang trí", en: "Decoration" },
      GENERAL: { vi: "Tổng hợp", en: "General" },
    };
    return labels[type]?.[language] || type;
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
                {language === "vi" ? "Quản Lý Nhà Cung Cấp" : "Supplier Management"}
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
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={(language === "vi" ? "Tìm kiếm" : "Search") + "..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Button onClick={openCreate} data-testid="button-add-supplier">
                <Plus className="h-4 w-4 mr-2" />
                {language === "vi" ? "Thêm Nhà Cung Cấp" : "Add Supplier"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {language === "vi" ? "Chưa có nhà cung cấp" : "No suppliers found"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                          <TableHead>{language === "vi" ? "Người liên hệ" : "Contact"}</TableHead>
                          <TableHead>{language === "vi" ? "Loại" : "Type"}</TableHead>
                          <TableHead className="text-center">{language === "vi" ? "Đánh giá" : "Rating"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Đơn hàng" : "Orders"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Chi tiêu" : "Spent"}</TableHead>
                          <TableHead>{language === "vi" ? "Trạng thái" : "Status"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Thao tác" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id} data-testid={`row-supplier-${item.id}`}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{item.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {item.phoneNumber}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>{item.contactPerson || "-"}</div>
                                {item.email && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {item.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{getSupplierTypeLabel(item.supplierType)}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.rating ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{item.rating}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{item.totalOrders}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.totalSpent, language)}</TableCell>
                            <TableCell>
                              <StatusBadge status={item.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(item)} data-testid={`button-edit-${item.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}
                                  data-testid={`button-delete-${item.id}`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? (language === "vi" ? "Sửa Nhà Cung Cấp" : "Edit Supplier")
                : (language === "vi" ? "Thêm Nhà Cung Cấp" : "Add Supplier")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "vi" ? "Tên công ty/cá nhân" : "Company/Individual name"} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "vi" ? "Người liên hệ" : "Contact person"}</Label>
                <Input
                  value={formData.contactPerson || ""}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  data-testid="input-contactPerson"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Số điện thoại" : "Phone number"} *</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  data-testid="input-phoneNumber"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label>{language === "vi" ? "Địa chỉ" : "Address"}</Label>
              <Input
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                data-testid="input-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "vi" ? "Loại nhà cung cấp" : "Supplier type"}</Label>
                <Select
                  value={formData.supplierType}
                  onValueChange={(v) => setFormData({ ...formData, supplierType: v })}
                >
                  <SelectTrigger data-testid="select-supplierType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORCHID">{language === "vi" ? "Lan" : "Orchid"}</SelectItem>
                    <SelectItem value="POT">{language === "vi" ? "Chậu" : "Pot"}</SelectItem>
                    <SelectItem value="DECORATION">{language === "vi" ? "Trang trí" : "Decoration"}</SelectItem>
                    <SelectItem value="GENERAL">{language === "vi" ? "Tổng hợp" : "General"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Trạng thái" : "Status"}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{language === "vi" ? "Hoạt động" : "Active"}</SelectItem>
                    <SelectItem value="INACTIVE">{language === "vi" ? "Ngừng hoạt động" : "Inactive"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "vi" ? "Ghi chú" : "Notes"}</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                data-testid="input-notes"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {language === "vi" ? "Hủy" : "Cancel"}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-supplier">
                {language === "vi" ? "Lưu" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Xác nhận xóa" : "Confirm Delete"}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {language === "vi"
              ? `Bạn có chắc chắn muốn xóa nhà cung cấp "${deletingItem?.name}"?`
              : `Are you sure you want to delete supplier "${deletingItem?.name}"?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {language === "vi" ? "Hủy" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {language === "vi" ? "Xóa" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
