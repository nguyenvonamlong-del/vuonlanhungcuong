import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Flower2, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PremadePot, InsertPremadePot } from "@shared/schema";

const initialFormData: Partial<InsertPremadePot> = {
  nameVi: "",
  nameEn: "",
  descriptionVi: "",
  descriptionEn: "",
  price: "0",
  stockQuantity: 0,
  images: [],
  orchidTypes: [],
  potSize: "MEDIUM",
  heightCm: undefined,
  difficultyLevel: "MEDIUM",
  careInstructionsVi: "",
  careInstructionsEn: "",
  status: "ACTIVE",
  featured: false,
};

export default function PremadePotsPage() {
  const { language } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PremadePot | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PremadePot | null>(null);

  const { data: pots = [], isLoading } = useQuery<PremadePot[]>({
    queryKey: ["/api/premade-pots"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/premade-pots", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/premade-pots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/pots"] });
      setDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã thêm chậu mới" : "Pot added",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/premade-pots/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/premade-pots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/pots"] });
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật chậu" : "Pot updated",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/premade-pots/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/premade-pots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/pots"] });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã xóa chậu" : "Pot deleted",
      });
    },
  });

  const filteredItems = pots.filter((pot) => {
    const name = language === "vi" ? pot.nameVi : pot.nameEn;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEdit = (pot: PremadePot) => {
    setEditingItem(pot);
    setFormData({
      nameVi: pot.nameVi,
      nameEn: pot.nameEn,
      descriptionVi: pot.descriptionVi || "",
      descriptionEn: pot.descriptionEn || "",
      price: String(pot.price),
      stockQuantity: pot.stockQuantity,
      images: pot.images || [],
      orchidTypes: pot.orchidTypes || [],
      potSize: pot.potSize,
      heightCm: pot.heightCm || undefined,
      difficultyLevel: pot.difficultyLevel,
      careInstructionsVi: pot.careInstructionsVi || "",
      careInstructionsEn: pot.careInstructionsEn || "",
      status: pot.status,
      featured: pot.featured,
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
              <h1 className="font-semibold">{t("nav.premadePots", language)}</h1>
            </div>
            <div className="flex items-center gap-2">
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
              <Button onClick={openCreate} data-testid="button-add-pot">
                <Plus className="h-4 w-4 mr-2" />
                {t("common.add", language)}
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
                    <p className="text-muted-foreground">{t("common.noData", language)}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                          <TableHead>{t("shop.size", language)}</TableHead>
                          <TableHead className="text-right">{t("catalog.price", language)}</TableHead>
                          <TableHead className="text-right">{t("catalog.stock", language)}</TableHead>
                          <TableHead className="text-center">{t("shop.featured", language)}</TableHead>
                          <TableHead>{t("catalog.status", language)}</TableHead>
                          <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((pot) => (
                          <TableRow key={pot.id} data-testid={`row-pot-${pot.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {pot.images?.[0] ? (
                                  <img
                                    src={pot.images[0]}
                                    alt=""
                                    className="w-10 h-10 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                    <Flower2 className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="font-medium">
                                  {language === "vi" ? pot.nameVi : pot.nameEn}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={pot.potSize} />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(pot.price, language)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={pot.stockQuantity < 5 ? "text-destructive font-medium" : ""}>
                                {pot.stockQuantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {pot.featured ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mx-auto" />
                              ) : (
                                <StarOff className="h-4 w-4 text-muted-foreground mx-auto" />
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={pot.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(pot)}
                                  data-testid={`button-edit-${pot.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeletingItem(pot);
                                    setDeleteDialogOpen(true);
                                  }}
                                  data-testid={`button-delete-${pot.id}`}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? (language === "vi" ? "Sửa chậu" : "Edit Pot")
                : (language === "vi" ? "Thêm chậu mới" : "Add New Pot")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "vi" ? "Tên (Tiếng Việt)" : "Name (Vietnamese)"}</Label>
                <Input
                  value={formData.nameVi}
                  onChange={(e) => setFormData({ ...formData, nameVi: e.target.value })}
                  required
                  data-testid="input-nameVi"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Tên (Tiếng Anh)" : "Name (English)"}</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                  data-testid="input-nameEn"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "vi" ? "Mô tả (Tiếng Việt)" : "Description (Vietnamese)"}</Label>
                <Textarea
                  value={formData.descriptionVi}
                  onChange={(e) => setFormData({ ...formData, descriptionVi: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Mô tả (Tiếng Anh)" : "Description (English)"}</Label>
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("catalog.price", language)}</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                <Label>{language === "vi" ? "Chiều cao (cm)" : "Height (cm)"}</Label>
                <Input
                  type="number"
                  value={formData.heightCm || ""}
                  onChange={(e) => setFormData({ ...formData, heightCm: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("shop.size", language)}</Label>
                <Select
                  value={formData.potSize}
                  onValueChange={(v) => setFormData({ ...formData, potSize: v })}
                >
                  <SelectTrigger data-testid="select-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">{t("shop.small", language)}</SelectItem>
                    <SelectItem value="MEDIUM">{t("shop.medium", language)}</SelectItem>
                    <SelectItem value="LARGE">{t("shop.large", language)}</SelectItem>
                    <SelectItem value="XLARGE">{t("shop.xlarge", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("shop.difficulty", language)}</Label>
                <Select
                  value={formData.difficultyLevel}
                  onValueChange={(v) => setFormData({ ...formData, difficultyLevel: v })}
                >
                  <SelectTrigger data-testid="select-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">{t("shop.easy", language)}</SelectItem>
                    <SelectItem value="MEDIUM">{t("shop.medium", language)}</SelectItem>
                    <SelectItem value="HARD">{t("shop.hard", language)}</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="OUT_OF_STOCK">{t("shop.outOfStock", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                data-testid="switch-featured"
              />
              <Label>{t("shop.featured", language)}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel", language)}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-pot"
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
              ? `Bạn có chắc chắn muốn xóa "${deletingItem?.nameVi}"?`
              : `Are you sure you want to delete "${deletingItem?.nameEn}"?`}
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
