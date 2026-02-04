import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Flower2, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import type { CatalogItem, InsertCatalogItem } from "@shared/schema";

const initialFormData: InsertCatalogItem = {
  speciesNameVi: "",
  speciesNameEn: "",
  color: "",
  heightCm: 0,
  pricePerUnit: "0",
  stockQuantity: 0,
  minOrderQuantity: 5,
  descriptionVi: "",
  descriptionEn: "",
  imageUrl: "",
  status: "ACTIVE",
};

export default function CatalogPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<InsertCatalogItem>(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);

  const { data: catalogItems = [], isLoading } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCatalogItem) => {
      const response = await apiRequest("POST", "/api/catalog", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      setDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã thêm sản phẩm mới" : "Product added successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertCatalogItem }) => {
      const response = await apiRequest("PATCH", `/api/catalog/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật sản phẩm" : "Product updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/catalog/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã xóa sản phẩm" : "Product deleted successfully",
      });
    },
  });

  const filteredItems = catalogItems.filter((item) => {
    const name = language === "vi" ? item.speciesNameVi : item.speciesNameEn;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      speciesNameVi: item.speciesNameVi,
      speciesNameEn: item.speciesNameEn,
      color: item.color,
      heightCm: item.heightCm,
      pricePerUnit: String(item.pricePerUnit),
      stockQuantity: item.stockQuantity,
      minOrderQuantity: item.minOrderQuantity,
      descriptionVi: item.descriptionVi || "",
      descriptionEn: item.descriptionEn || "",
      imageUrl: item.imageUrl || "",
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
              <h1 className="font-semibold">{t("catalog.title", language)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={openChatbot}
                data-testid="button-header-chatbot"
              >
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
                  placeholder={t("common.search", language) + "..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Button onClick={openCreate} data-testid="button-add-catalog">
                <Plus className="h-4 w-4 mr-2" />
                {t("catalog.addNew", language)}
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
                    <Flower2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{t("catalog.noItems", language)}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("catalog.species", language)}</TableHead>
                          <TableHead>{t("catalog.color", language)}</TableHead>
                          <TableHead className="text-right">{t("catalog.height", language)}</TableHead>
                          <TableHead className="text-right">{t("catalog.price", language)}</TableHead>
                          <TableHead className="text-right">{t("catalog.stock", language)}</TableHead>
                          <TableHead>{t("catalog.status", language)}</TableHead>
                          <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id} data-testid={`row-catalog-${item.id}`}>
                            <TableCell className="font-medium">
                              {language === "vi" ? item.speciesNameVi : item.speciesNameEn}
                            </TableCell>
                            <TableCell>{item.color}</TableCell>
                            <TableCell className="text-right">{item.heightCm} cm</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.pricePerUnit, language)}</TableCell>
                            <TableCell className="text-right">
                              <span className={item.stockQuantity < 50 ? "text-destructive font-medium" : ""}>
                                {item.stockQuantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={item.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(item)}
                                  data-testid={`button-edit-${item.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeletingItem(item);
                                    setDeleteDialogOpen(true);
                                  }}
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
              {editingItem ? t("catalog.edit", language) : t("catalog.addNew", language)}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("catalog.species", language)} (VI)</Label>
                <Input
                  value={formData.speciesNameVi}
                  onChange={(e) => setFormData({ ...formData, speciesNameVi: e.target.value })}
                  required
                  data-testid="input-speciesNameVi"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("catalog.species", language)} (EN)</Label>
                <Input
                  value={formData.speciesNameEn}
                  onChange={(e) => setFormData({ ...formData, speciesNameEn: e.target.value })}
                  required
                  data-testid="input-speciesNameEn"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("catalog.color", language)}</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  required
                  data-testid="input-color"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("catalog.height", language)} (cm)</Label>
                <Input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: parseInt(e.target.value) || 0 })}
                  required
                  data-testid="input-height"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("catalog.price", language)}</Label>
                <Input
                  type="number"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                  required
                  data-testid="input-price"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("catalog.stock", language)}</Label>
                <Input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  required
                  data-testid="input-stock"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("catalog.status", language)}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t("catalog.active", language)}</SelectItem>
                    <SelectItem value="INACTIVE">{t("catalog.inactive", language)}</SelectItem>
                    <SelectItem value="DISCONTINUED">{t("catalog.discontinued", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel", language)}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-catalog"
              >
                {t("common.save", language)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirm", language)}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {language === "vi"
              ? `Bạn có chắc chắn muốn xóa "${deletingItem?.speciesNameVi}"?`
              : `Are you sure you want to delete "${deletingItem?.speciesNameEn}"?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {t("common.delete", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
