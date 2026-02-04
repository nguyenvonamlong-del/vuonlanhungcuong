import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, AlertTriangle, Search, MessageCircle, Flower2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { t, formatCurrency } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CatalogItem, PremadePot, PotType, DecorationType } from "@shared/schema";

type InventoryTab = "orchids" | "premade" | "pots" | "decorations" | "general" | "alerts";

interface InventoryItem {
  id: string;
  name: string;
  type: "orchid" | "premade" | "pot" | "decoration";
  stock: number;
  minStock: number;
  maxStock: number;
  price: string;
  status: string;
  imageUrl?: string | null;
}

const LOW_STOCK_THRESHOLD = 50;
const CRITICAL_STOCK_THRESHOLD = 10;

export default function InventoryPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<InventoryTab>("orchids");
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const { data: catalogItems = [], isLoading: loadingCatalog } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
  });

  const { data: premadePots = [], isLoading: loadingPremade } = useQuery<PremadePot[]>({
    queryKey: ["/api/premade-pots"],
  });

  const { data: potTypes = [], isLoading: loadingPots } = useQuery<PotType[]>({
    queryKey: ["/api/pot-types"],
  });

  const { data: decorationTypes = [], isLoading: loadingDecorations } = useQuery<DecorationType[]>({
    queryKey: ["/api/decoration-types"],
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ type, id, stock }: { type: "orchid" | "premade"; id: string; stock: number }) => {
      const endpoint = type === "orchid" ? `/api/catalog/${id}` : `/api/premade-pots/${id}`;
      const response = await apiRequest("PATCH", endpoint, { stockQuantity: stock });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/premade-pots"] });
      setAdjustDialogOpen(false);
      setAdjustingItem(null);
      setAdjustmentAmount(0);
      setAdjustmentReason("");
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật số lượng tồn kho" : "Stock quantity updated",
      });
    },
    onError: () => {
      toast({
        title: t("common.error", language),
        description: language === "vi" ? "Không thể cập nhật tồn kho" : "Failed to update stock",
        variant: "destructive",
      });
    },
  });

  const orchidInventory: InventoryItem[] = catalogItems.map((item) => ({
    id: item.id,
    name: language === "vi" ? item.speciesNameVi : item.speciesNameEn,
    type: "orchid" as const,
    stock: item.stockQuantity,
    minStock: item.minOrderQuantity || 5,
    maxStock: 500,
    price: item.pricePerUnit,
    status: item.status,
    imageUrl: item.imageUrl,
  }));

  const premadeInventory: InventoryItem[] = premadePots.map((pot) => ({
    id: pot.id,
    name: language === "vi" ? pot.nameVi : pot.nameEn,
    type: "premade" as const,
    stock: pot.stockQuantity,
    minStock: 1,
    maxStock: 100,
    price: pot.price,
    status: pot.status,
    imageUrl: pot.images?.[0],
  }));

  const potsInventory: InventoryItem[] = potTypes.map((pot) => ({
    id: pot.id,
    name: language === "vi" ? pot.nameVi : pot.nameEn,
    type: "pot" as const,
    stock: 0, // Pot types don't have stock tracking by default
    minStock: 0,
    maxStock: 100,
    price: pot.price || "0",
    status: pot.status,
    imageUrl: pot.imageUrl,
  }));

  const decorationsInventory: InventoryItem[] = decorationTypes.map((dec) => ({
    id: dec.id,
    name: language === "vi" ? dec.nameVi : dec.nameEn,
    type: "decoration" as const,
    stock: 0, // Decoration types don't have stock tracking by default
    minStock: 0,
    maxStock: 100,
    price: dec.price || "0",
    status: dec.status,
    imageUrl: dec.imageUrl,
  }));

  const allInventory = [...orchidInventory, ...premadeInventory];

  const lowStockItems = allInventory.filter((item) => item.stock <= LOW_STOCK_THRESHOLD && item.status === "ACTIVE");
  const criticalStockItems = allInventory.filter((item) => item.stock <= CRITICAL_STOCK_THRESHOLD && item.status === "ACTIVE");

  const filteredOrchids = orchidInventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPremade = premadeInventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPots = potsInventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDecorations = decorationsInventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockLevel = (stock: number): "critical" | "low" | "normal" | "high" => {
    if (stock <= CRITICAL_STOCK_THRESHOLD) return "critical";
    if (stock <= LOW_STOCK_THRESHOLD) return "low";
    if (stock >= 200) return "high";
    return "normal";
  };

  const getStockBadge = (stock: number) => {
    const level = getStockLevel(stock);
    switch (level) {
      case "critical":
        return <Badge variant="destructive">{language === "vi" ? "Rất thấp" : "Critical"}</Badge>;
      case "low":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{language === "vi" ? "Thấp" : "Low"}</Badge>;
      case "high":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{language === "vi" ? "Đủ" : "Good"}</Badge>;
      default:
        return null;
    }
  };

  const openAdjustDialog = (item: InventoryItem) => {
    // Only allow adjustment for orchid and premade items
    if (item.type !== "orchid" && item.type !== "premade") return;
    setAdjustingItem(item);
    setAdjustmentAmount(0);
    setAdjustmentReason("");
    setAdjustDialogOpen(true);
  };

  const handleAdjustStock = () => {
    if (!adjustingItem) return;
    // Guard against non-adjustable types
    if (adjustingItem.type !== "orchid" && adjustingItem.type !== "premade") return;
    const newStock = Math.max(0, adjustingItem.stock + adjustmentAmount);
    updateStockMutation.mutate({
      type: adjustingItem.type as "orchid" | "premade",
      id: adjustingItem.id,
      stock: newStock,
    });
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const totalOrchidValue = orchidInventory.reduce((sum, item) => sum + (item.stock * parseFloat(item.price)), 0);
  const totalPremadeValue = premadeInventory.reduce((sum, item) => sum + (item.stock * parseFloat(item.price)), 0);

  const renderInventoryTable = (items: InventoryItem[], loading: boolean) => (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t("common.noData", language)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "vi" ? "Sản phẩm" : "Product"}</TableHead>
                  <TableHead className="text-right">{language === "vi" ? "Tồn kho" : "Stock"}</TableHead>
                  <TableHead>{language === "vi" ? "Mức độ" : "Level"}</TableHead>
                  <TableHead className="text-right">{language === "vi" ? "Giá trị" : "Value"}</TableHead>
                  <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`} data-testid={`row-inventory-${item.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                            {item.type === "orchid" ? (
                              <Flower2 className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.type === "orchid" ? (language === "vi" ? "Loại lan" : "Orchid") : 
                             item.type === "premade" ? (language === "vi" ? "Chậu sẵn" : "Premade") :
                             item.type === "pot" ? (language === "vi" ? "Loại chậu" : "Pot Type") :
                             (language === "vi" ? "Trang trí" : "Decoration")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={getStockLevel(item.stock) === "critical" ? "text-destructive font-bold" : getStockLevel(item.stock) === "low" ? "text-yellow-600 dark:text-yellow-400 font-medium" : ""}>
                        {item.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStockBadge(item.stock)}
                        <Progress 
                          value={Math.min(100, (item.stock / item.maxStock) * 100)} 
                          className="w-20 h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.stock * parseFloat(item.price), language)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(item.type === "orchid" || item.type === "premade") ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustDialog(item)}
                          data-testid={`button-adjust-${item.id}`}
                        >
                          {language === "vi" ? "Điều chỉnh" : "Adjust"}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {language === "vi" ? "Không theo dõi" : "Not tracked"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <StaffSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 h-14 px-4 border-b bg-background shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="font-semibold">{language === "vi" ? "Quản lý tồn kho" : "Inventory Management"}</h1>
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
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng loại lan" : "Total Orchids"}</CardTitle>
                  <Flower2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orchidInventory.reduce((sum, i) => sum + i.stock, 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalOrchidValue, language)} {language === "vi" ? "giá trị" : "value"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng chậu sẵn" : "Total Premade"}</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{premadeInventory.reduce((sum, i) => sum + i.stock, 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalPremadeValue, language)} {language === "vi" ? "giá trị" : "value"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Hàng sắp hết" : "Low Stock"}</CardTitle>
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lowStockItems.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === "vi" ? `≤${LOW_STOCK_THRESHOLD} đơn vị` : `≤${LOW_STOCK_THRESHOLD} units`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Cảnh báo" : "Critical"}</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{criticalStockItems.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === "vi" ? `≤${CRITICAL_STOCK_THRESHOLD} đơn vị` : `≤${CRITICAL_STOCK_THRESHOLD} units`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Tabs */}
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
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InventoryTab)}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="orchids" className="flex items-center gap-2">
                  <Flower2 className="h-4 w-4" />
                  {language === "vi" ? "Loại Lan" : "Orchids"}
                </TabsTrigger>
                <TabsTrigger value="premade" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {language === "vi" ? "Chậu Sẵn" : "Premade Pots"}
                </TabsTrigger>
                <TabsTrigger value="pots" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {language === "vi" ? "Loại Chậu" : "Pots"}
                </TabsTrigger>
                <TabsTrigger value="decorations" className="flex items-center gap-2">
                  <Flower2 className="h-4 w-4" />
                  {language === "vi" ? "Trang Trí" : "Decorations"}
                </TabsTrigger>
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {language === "vi" ? "Chung" : "General"}
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {language === "vi" ? "Cảnh báo" : "Alerts"}
                  {criticalStockItems.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{criticalStockItems.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orchids" className="mt-4">
                {renderInventoryTable(filteredOrchids, loadingCatalog)}
              </TabsContent>

              <TabsContent value="premade" className="mt-4">
                {renderInventoryTable(filteredPremade, loadingPremade)}
              </TabsContent>

              <TabsContent value="pots" className="mt-4">
                {renderInventoryTable(filteredPots, loadingPots)}
              </TabsContent>

              <TabsContent value="decorations" className="mt-4">
                {renderInventoryTable(filteredDecorations, loadingDecorations)}
              </TabsContent>

              <TabsContent value="general" className="mt-4">
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        {language === "vi" ? "Chức năng quản lý hàng tổng quát đang được phát triển" : "General inventory management coming soon"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="mt-4">
                {renderInventoryTable(lowStockItems, loadingCatalog || loadingPremade)}
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Điều chỉnh tồn kho" : "Adjust Stock"}</DialogTitle>
          </DialogHeader>
          {adjustingItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {adjustingItem.imageUrl ? (
                  <img src={adjustingItem.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-background flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{adjustingItem.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "vi" ? "Tồn kho hiện tại:" : "Current stock:"} {adjustingItem.stock}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Số lượng điều chỉnh" : "Adjustment Amount"}</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustmentAmount(adjustmentAmount - 10)}
                  >
                    -10
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustmentAmount(adjustmentAmount - 1)}
                  >
                    -1
                  </Button>
                  <Input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                    className="w-24 text-center"
                    data-testid="input-adjustment"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustmentAmount(adjustmentAmount + 1)}
                  >
                    +1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustmentAmount(adjustmentAmount + 10)}
                  >
                    +10
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === "vi" ? "Số lượng mới:" : "New quantity:"}{" "}
                  <span className={adjustmentAmount >= 0 ? "text-green-600" : "text-red-600"}>
                    {Math.max(0, adjustingItem.stock + adjustmentAmount)}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Lý do" : "Reason"}</Label>
                <Input
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder={language === "vi" ? "Nhập lý do điều chỉnh..." : "Enter reason..."}
                  data-testid="input-reason"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button
              onClick={handleAdjustStock}
              disabled={updateStockMutation.isPending || adjustmentAmount === 0}
              data-testid="button-confirm-adjust"
            >
              {adjustmentAmount >= 0 ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
              {t("common.save", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
