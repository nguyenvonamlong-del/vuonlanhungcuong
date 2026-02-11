import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Flower2, Search, MessageCircle, Package, Palette, Truck, CreditCard, Flag, Video, X, Upload, Loader2, Tag } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { t, formatCurrency, formatPriceRange } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CatalogItem, InsertCatalogItem, PotType, DecorationType, ShippingType, PaymentType, PriorityType, Supplier } from "@shared/schema";

type CatalogTab = "orchid" | "pot" | "decoration" | "shipping" | "payment" | "priority";

const initialOrchidForm: InsertCatalogItem = {
  speciesNameVi: "",
  speciesNameEn: "",
  sku: "",
  genus: "Phalaenopsis",
  tradeName: "",
  color: "",
  colorCode: "",
  patternCode: "",
  sizeOptions: [],
  heightCm: 0,
  pricePerUnit: "0",
  costPerUnit: "",
  stockQuantity: 0,
  minOrderQuantity: 5,
  descriptionVi: "",
  descriptionEn: "",
  imageUrl: "",
  tags: [],
  status: "ACTIVE",
};

interface GenericFormData {
  nameVi: string;
  nameEn: string;
  sku?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  price?: string;
  priceMax?: string;
  imageUrl?: string;
  status: string;
  baseCost?: string;
  baseCostMax?: string;
  estimatedDays?: number;
  type?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  qrCodeUrl?: string;
  instructions?: string;
  level?: number;
  color?: string;
}

const initialGenericForm: GenericFormData = {
  nameVi: "",
  nameEn: "",
  sku: "",
  descriptionVi: "",
  descriptionEn: "",
  price: "0",
  priceMax: "",
  imageUrl: "",
  status: "ACTIVE",
  baseCost: "0",
  baseCostMax: "",
  estimatedDays: 3,
  type: "BANK_TRANSFER",
  bankName: "",
  accountNumber: "",
  accountName: "",
  qrCodeUrl: "",
  instructions: "",
  level: 1,
  color: "#808080",
};

export default function CatalogPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<CatalogTab>("orchid");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [orchidDialogOpen, setOrchidDialogOpen] = useState(false);
  const [editingOrchid, setEditingOrchid] = useState<CatalogItem | null>(null);
  const [orchidForm, setOrchidForm] = useState<InsertCatalogItem>(initialOrchidForm);
  const [deleteOrchidDialogOpen, setDeleteOrchidDialogOpen] = useState(false);
  const [deletingOrchid, setDeletingOrchid] = useState<CatalogItem | null>(null);
  
  const [genericDialogOpen, setGenericDialogOpen] = useState(false);
  const [editingGeneric, setEditingGeneric] = useState<any | null>(null);
  const [genericForm, setGenericForm] = useState<GenericFormData>(initialGenericForm);
  const [deleteGenericDialogOpen, setDeleteGenericDialogOpen] = useState(false);
  const [deletingGeneric, setDeletingGeneric] = useState<any | null>(null);
  const [genericDialogType, setGenericDialogType] = useState<CatalogTab>("pot");

  const [skuLocked, setSkuLocked] = useState(false);
  const [orchidVideos, setOrchidVideos] = useState<string[]>([]);
  const [genericVideos, setGenericVideos] = useState<string[]>([]);
  const [isUploadingOrchidVideo, setIsUploadingOrchidVideo] = useState(false);
  const [isUploadingGenericVideo, setIsUploadingGenericVideo] = useState(false);
  const { uploadFile } = useUpload();

  const handleOrchidVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingOrchidVideo(true);
    try {
      const result = await uploadFile(file);
      if (result?.objectPath) {
        setOrchidVideos(prev => [...prev, result.objectPath]);
      }
    } finally {
      setIsUploadingOrchidVideo(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleGenericVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingGenericVideo(true);
    try {
      const result = await uploadFile(file);
      if (result?.objectPath) {
        setGenericVideos(prev => [...prev, result.objectPath]);
      }
    } finally {
      setIsUploadingGenericVideo(false);
      if (e.target) e.target.value = "";
    }
  };

  const { data: catalogItems = [], isLoading: loadingOrchids } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
  });

  const { data: potTypes = [], isLoading: loadingPots } = useQuery<PotType[]>({
    queryKey: ["/api/pot-types"],
  });

  const { data: decorationTypes = [], isLoading: loadingDecorations } = useQuery<DecorationType[]>({
    queryKey: ["/api/decoration-types"],
  });

  const { data: shippingTypes = [], isLoading: loadingShipping } = useQuery<ShippingType[]>({
    queryKey: ["/api/shipping-types"],
  });

  const { data: paymentTypes = [], isLoading: loadingPayments } = useQuery<PaymentType[]>({
    queryKey: ["/api/payment-types"],
  });

  const { data: priorityTypes = [], isLoading: loadingPriorities } = useQuery<PriorityType[]>({
    queryKey: ["/api/priority-types"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createOrchidMutation = useMutation({
    mutationFn: async (data: InsertCatalogItem) => {
      const response = await apiRequest("POST", "/api/catalog", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      setOrchidDialogOpen(false);
      setOrchidForm(initialOrchidForm);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã thêm loại lan mới" : "Orchid type added successfully",
      });
    },
  });

  const updateOrchidMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertCatalogItem }) => {
      const response = await apiRequest("PATCH", `/api/catalog/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      setOrchidDialogOpen(false);
      setEditingOrchid(null);
      setOrchidForm(initialOrchidForm);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật loại lan" : "Orchid type updated successfully",
      });
    },
  });

  const deleteOrchidMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/catalog/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      setDeleteOrchidDialogOpen(false);
      setDeletingOrchid(null);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã xóa loại lan" : "Orchid type deleted successfully",
      });
    },
  });

  const getApiEndpoint = (type: CatalogTab) => {
    switch (type) {
      case "pot": return "/api/pot-types";
      case "decoration": return "/api/decoration-types";
      case "shipping": return "/api/shipping-types";
      case "payment": return "/api/payment-types";
      case "priority": return "/api/priority-types";
      default: return "";
    }
  };

  const createGenericMutation = useMutation({
    mutationFn: async ({ type, data }: { type: CatalogTab; data: any }) => {
      const response = await apiRequest("POST", getApiEndpoint(type), data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [getApiEndpoint(variables.type)] });
      setGenericDialogOpen(false);
      setGenericForm(initialGenericForm);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã thêm mục mới" : "Item added successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể thêm mục" : "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const updateGenericMutation = useMutation({
    mutationFn: async ({ type, id, data }: { type: CatalogTab; id: string; data: any }) => {
      const response = await apiRequest("PUT", `${getApiEndpoint(type)}/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [getApiEndpoint(variables.type)] });
      setGenericDialogOpen(false);
      setEditingGeneric(null);
      setGenericForm(initialGenericForm);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật mục" : "Item updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể cập nhật mục" : "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const deleteGenericMutation = useMutation({
    mutationFn: async ({ type, id }: { type: CatalogTab; id: string }) => {
      const response = await apiRequest("DELETE", `${getApiEndpoint(type)}/${id}`);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [getApiEndpoint(variables.type)] });
      setDeleteGenericDialogOpen(false);
      setDeletingGeneric(null);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã xóa mục" : "Item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể xóa mục" : "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const filteredOrchids = catalogItems.filter((item) => {
    const name = language === "vi" ? item.speciesNameVi : item.speciesNameEn;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openOrchidCreate = () => {
    setEditingOrchid(null);
    setOrchidForm(initialOrchidForm);
    setOrchidVideos([]);
    setOrchidDialogOpen(true);
  };

  const openOrchidEdit = (item: CatalogItem) => {
    setEditingOrchid(item);
    setOrchidForm({
      speciesNameVi: item.speciesNameVi,
      speciesNameEn: item.speciesNameEn,
      sku: item.sku || "",
      genus: item.genus || "Phalaenopsis",
      tradeName: item.tradeName || "",
      color: item.color,
      colorCode: item.colorCode || "",
      patternCode: item.patternCode || "",
      sizeOptions: item.sizeOptions || [],
      heightCm: item.heightCm,
      pricePerUnit: String(item.pricePerUnit),
      costPerUnit: item.costPerUnit ? String(item.costPerUnit) : "",
      stockQuantity: item.stockQuantity,
      minOrderQuantity: item.minOrderQuantity,
      descriptionVi: item.descriptionVi || "",
      descriptionEn: item.descriptionEn || "",
      imageUrl: item.imageUrl || "",
      tags: item.tags || [],
      status: item.status,
    });
    setOrchidVideos(item.videos || []);
    setOrchidDialogOpen(true);
  };

  const handleOrchidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = { ...orchidForm, videos: orchidVideos };
    if (editingOrchid) {
      updateOrchidMutation.mutate({ id: editingOrchid.id, data: formData });
    } else {
      createOrchidMutation.mutate(formData);
    }
  };

  const openGenericCreate = (type: CatalogTab) => {
    setGenericDialogType(type);
    setEditingGeneric(null);
    setGenericForm(initialGenericForm);
    setGenericVideos([]);
    setGenericDialogOpen(true);
  };

  const openGenericEdit = (type: CatalogTab, item: any) => {
    setGenericDialogType(type);
    setEditingGeneric(item);
    setGenericForm({
      nameVi: item.nameVi || "",
      nameEn: item.nameEn || "",
      sku: item.sku || "",
      descriptionVi: item.descriptionVi || "",
      descriptionEn: item.descriptionEn || "",
      price: String(item.price || item.baseCost || "0"),
      priceMax: item.priceMax ? String(item.priceMax) : "",
      imageUrl: item.imageUrl || "",
      status: item.status || "ACTIVE",
      baseCost: String(item.baseCost || "0"),
      baseCostMax: item.baseCostMax ? String(item.baseCostMax) : "",
      estimatedDays: item.estimatedDays || 3,
      type: item.type || "BANK_TRANSFER",
      bankName: item.bankName || "",
      accountNumber: item.accountNumber || "",
      accountName: item.accountName || "",
      qrCodeUrl: item.qrCodeUrl || "",
      instructions: item.instructions || "",
      level: item.level || 1,
      color: item.color || "#808080",
    });
    setGenericVideos(item.videos || []);
    setSkuLocked(false);
    if (type === "pot" || type === "decoration") {
      const skuType = type === "pot" ? "pot-type" : "decoration-type";
      fetch(`/api/sku-lock/${skuType}/${item.id}`, { credentials: "include" })
        .then(r => r.json())
        .then(d => setSkuLocked(d.locked || false))
        .catch(() => setSkuLocked(false));
    }
    setGenericDialogOpen(true);
  };

  const handleGenericSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let data: any = {};
    
    if (genericDialogType === "pot" || genericDialogType === "decoration") {
      data = {
        nameVi: genericForm.nameVi,
        nameEn: genericForm.nameEn,
        sku: genericForm.sku,
        descriptionVi: genericForm.descriptionVi,
        descriptionEn: genericForm.descriptionEn,
        price: genericForm.price,
        priceMax: genericForm.priceMax || null,
        imageUrl: genericForm.imageUrl,
        videos: genericVideos,
        status: genericForm.status,
      };
    } else if (genericDialogType === "shipping") {
      data = {
        nameVi: genericForm.nameVi,
        nameEn: genericForm.nameEn,
        descriptionVi: genericForm.descriptionVi,
        descriptionEn: genericForm.descriptionEn,
        baseCost: genericForm.baseCost,
        baseCostMax: genericForm.baseCostMax || null,
        estimatedDays: genericForm.estimatedDays,
        status: genericForm.status,
      };
    } else if (genericDialogType === "payment") {
      data = {
        nameVi: genericForm.nameVi,
        nameEn: genericForm.nameEn,
        descriptionVi: genericForm.descriptionVi,
        descriptionEn: genericForm.descriptionEn,
        type: genericForm.type,
        bankName: genericForm.bankName,
        accountNumber: genericForm.accountNumber,
        accountName: genericForm.accountName,
        qrCodeUrl: genericForm.qrCodeUrl,
        instructions: genericForm.instructions,
        status: genericForm.status,
      };
    } else if (genericDialogType === "priority") {
      data = {
        nameVi: genericForm.nameVi,
        nameEn: genericForm.nameEn,
        descriptionVi: genericForm.descriptionVi,
        descriptionEn: genericForm.descriptionEn,
        level: genericForm.level,
        color: genericForm.color,
      };
    }
    
    if (editingGeneric) {
      updateGenericMutation.mutate({ type: genericDialogType, id: editingGeneric.id, data });
    } else {
      createGenericMutation.mutate({ type: genericDialogType, data });
    }
  };

  const getTabLabel = (tab: CatalogTab): string => {
    switch (tab) {
      case "orchid": return language === "vi" ? "Loại Lan" : "Orchid Types";
      case "pot": return language === "vi" ? "Loại Chậu" : "Pot Types";
      case "decoration": return language === "vi" ? "Trang Trí" : "Decorations";
      case "shipping": return language === "vi" ? "Vận Chuyển" : "Shipping";
      case "payment": return language === "vi" ? "Thanh Toán" : "Payment";
      case "priority": return language === "vi" ? "Độ Ưu Tiên" : "Priorities";
    }
  };

  const getAddLabel = (tab: CatalogTab): string => {
    switch (tab) {
      case "orchid": return language === "vi" ? "Thêm Loại Lan" : "Add Orchid Type";
      case "pot": return language === "vi" ? "Thêm Loại Chậu" : "Add Pot Type";
      case "decoration": return language === "vi" ? "Thêm Trang Trí" : "Add Decoration";
      case "shipping": return language === "vi" ? "Thêm Phí Ship" : "Add Shipping";
      case "payment": return language === "vi" ? "Thêm Phương Thức" : "Add Payment Method";
      case "priority": return language === "vi" ? "Thêm Độ Ưu Tiên" : "Add Priority Level";
    }
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const renderPriorityTable = () => (
    <Card>
      <CardContent className="p-0">
        {loadingPriorities ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : priorityTypes.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{language === "vi" ? "Chưa có dữ liệu" : "No priority levels found"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                  <TableHead>{language === "vi" ? "Cấp độ" : "Level"}</TableHead>
                  <TableHead>{language === "vi" ? "Màu sắc" : "Color"}</TableHead>
                  <TableHead>{language === "vi" ? "Mô tả" : "Description"}</TableHead>
                  <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityTypes.sort((a, b) => a.level - b.level).map((item) => (
                  <TableRow key={item.id} data-testid={`row-priority-${item.id}`}>
                    <TableCell className="font-medium">
                      {language === "vi" ? item.nameVi : item.nameEn}
                    </TableCell>
                    <TableCell>{item.level}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border" 
                          style={{ backgroundColor: item.color || "#808080" }}
                        />
                        <span className="text-sm text-muted-foreground">{item.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {language === "vi" ? item.descriptionVi : item.descriptionEn}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openGenericEdit("priority", item)} data-testid={`button-edit-priority-${item.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => { setDeletingGeneric({ ...item, type: "priority" }); setDeleteGenericDialogOpen(true); }}
                          data-testid={`button-delete-priority-${item.id}`}
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
  );

  const renderOrchidTable = () => (
    <Card>
      <CardContent className="p-0">
        {loadingOrchids ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredOrchids.length === 0 ? (
          <div className="text-center py-12">
            <Flower2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t("catalog.noItems", language)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{language === "vi" ? "Ảnh" : "Image"}</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>{t("catalog.species", language)}</TableHead>
                  <TableHead>{t("catalog.color", language)}</TableHead>
                  <TableHead className="text-right">{t("catalog.price", language)}</TableHead>
                  <TableHead className="text-right">{language === "vi" ? "Giá vốn" : "Cost"}</TableHead>
                  <TableHead className="text-right">{t("catalog.stock", language)}</TableHead>
                  <TableHead>{language === "vi" ? "Tags" : "Tags"}</TableHead>
                  <TableHead>{t("catalog.status", language)}</TableHead>
                  <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrchids.map((item) => (
                  <TableRow key={item.id} data-testid={`row-catalog-${item.id}`}>
                    <TableCell>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Flower2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {item.sku || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{language === "vi" ? item.speciesNameVi : item.speciesNameEn}</div>
                      {item.genus && <div className="text-xs text-muted-foreground">{item.genus}</div>}
                    </TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.pricePerUnit, language)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.costPerUnit ? formatCurrency(item.costPerUnit, language) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.stockQuantity < 50 ? "text-destructive font-medium" : ""}>
                        {item.stockQuantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {(item.tags || []).slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {(item.tags || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">+{(item.tags || []).length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openOrchidEdit(item)} data-testid={`button-edit-${item.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => { setDeletingOrchid(item); setDeleteOrchidDialogOpen(true); }}
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
  );

  const renderGenericTable = (items: any[], loading: boolean, type: CatalogTab) => {
    const Icon = type === "pot" ? Package : type === "decoration" ? Palette : type === "shipping" ? Truck : CreditCard;
    
    return (
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
              <Icon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">{language === "vi" ? "Chưa có dữ liệu" : "No items found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {(type === "pot" || type === "decoration") && (
                      <TableHead className="w-16">{language === "vi" ? "Ảnh" : "Image"}</TableHead>
                    )}
                    <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                    {(type === "pot" || type === "decoration") && (
                      <TableHead>SKU</TableHead>
                    )}
                    <TableHead>{language === "vi" ? "Mô tả" : "Description"}</TableHead>
                    {(type === "pot" || type === "decoration") && (
                      <TableHead className="text-right">{t("catalog.price", language)}</TableHead>
                    )}
                    {type === "shipping" && (
                      <>
                        <TableHead className="text-right">{language === "vi" ? "Phí" : "Cost"}</TableHead>
                        <TableHead className="text-right">{language === "vi" ? "Số ngày" : "Days"}</TableHead>
                      </>
                    )}
                    {type === "payment" && (
                      <TableHead>{language === "vi" ? "Loại" : "Type"}</TableHead>
                    )}
                    <TableHead>{t("catalog.status", language)}</TableHead>
                    <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} data-testid={`row-${type}-${item.id}`}>
                      {(type === "pot" || type === "decoration") && (
                        <TableCell>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              {type === "pot" ? <Package className="h-5 w-5 text-muted-foreground" /> : <Palette className="h-5 w-5 text-muted-foreground" />}
                            </div>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {language === "vi" ? item.nameVi : item.nameEn}
                      </TableCell>
                      {(type === "pot" || type === "decoration") && (
                        <TableCell><span className="font-mono text-xs" data-testid={`text-sku-${item.id}`}>{item.sku || "-"}</span></TableCell>
                      )}
                      <TableCell className="max-w-xs truncate">
                        {language === "vi" ? item.descriptionVi : item.descriptionEn}
                      </TableCell>
                      {(type === "pot" || type === "decoration") && (
                        <TableCell className="text-right">{formatPriceRange(item.price, item.priceMax, language)}</TableCell>
                      )}
                      {type === "shipping" && (
                        <>
                          <TableCell className="text-right">{formatPriceRange(item.baseCost, item.baseCostMax, language)}</TableCell>
                          <TableCell className="text-right">{item.estimatedDays} {language === "vi" ? "ngày" : "days"}</TableCell>
                        </>
                      )}
                      {type === "payment" && (
                        <TableCell>{item.type}</TableCell>
                      )}
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openGenericEdit(type, item)} data-testid={`button-edit-${type}-${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => { setDeletingGeneric({ ...item, type }); setDeleteGenericDialogOpen(true); }}
                            data-testid={`button-delete-${type}-${item.id}`}
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
    );
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
              <Button variant="ghost" size="icon" onClick={openChatbot} data-testid="button-header-chatbot">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CatalogTab)}>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <TabsList className="h-auto flex-wrap">
                  <TabsTrigger value="orchid" className="gap-2" data-testid="tab-orchid">
                    <Flower2 className="h-4 w-4" />
                    {getTabLabel("orchid")}
                  </TabsTrigger>
                  <TabsTrigger value="pot" className="gap-2" data-testid="tab-pot">
                    <Package className="h-4 w-4" />
                    {getTabLabel("pot")}
                  </TabsTrigger>
                  <TabsTrigger value="decoration" className="gap-2" data-testid="tab-decoration">
                    <Palette className="h-4 w-4" />
                    {getTabLabel("decoration")}
                  </TabsTrigger>
                  <TabsTrigger value="shipping" className="gap-2" data-testid="tab-shipping">
                    <Truck className="h-4 w-4" />
                    {getTabLabel("shipping")}
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="gap-2" data-testid="tab-payment">
                    <CreditCard className="h-4 w-4" />
                    {getTabLabel("payment")}
                  </TabsTrigger>
                  <TabsTrigger value="priority" className="gap-2" data-testid="tab-priority">
                    <Flag className="h-4 w-4" />
                    {getTabLabel("priority")}
                  </TabsTrigger>
                </TabsList>
                <Button
                  onClick={() => activeTab === "orchid" ? openOrchidCreate() : openGenericCreate(activeTab)}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {getAddLabel(activeTab)}
                </Button>
              </div>

              {activeTab === "orchid" && (
                <div className="mt-4">
                  <div className="relative max-w-md mb-4">
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
              )}

              <TabsContent value="orchid" className="mt-4">
                {renderOrchidTable()}
              </TabsContent>

              <TabsContent value="pot" className="mt-4">
                {renderGenericTable(potTypes, loadingPots, "pot")}
              </TabsContent>

              <TabsContent value="decoration" className="mt-4">
                {renderGenericTable(decorationTypes, loadingDecorations, "decoration")}
              </TabsContent>

              <TabsContent value="shipping" className="mt-4">
                {renderGenericTable(shippingTypes, loadingShipping, "shipping")}
              </TabsContent>

              <TabsContent value="payment" className="mt-4">
                {renderGenericTable(paymentTypes, loadingPayments, "payment")}
              </TabsContent>

              <TabsContent value="priority" className="mt-4">
                {renderPriorityTable()}
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>

      {/* Orchid Dialog */}
      <Dialog open={orchidDialogOpen} onOpenChange={setOrchidDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOrchid ? (language === "vi" ? "Sửa Loại Lan" : "Edit Orchid Type") : (language === "vi" ? "Thêm Loại Lan" : "Add Orchid Type")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOrchidSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("catalog.species", language)} (VI)</Label>
                <Input
                  value={orchidForm.speciesNameVi}
                  onChange={(e) => setOrchidForm({ ...orchidForm, speciesNameVi: e.target.value })}
                  required
                  data-testid="input-speciesNameVi"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("catalog.species", language)} (EN)</Label>
                <Input
                  value={orchidForm.speciesNameEn}
                  onChange={(e) => setOrchidForm({ ...orchidForm, speciesNameEn: e.target.value })}
                  required
                  data-testid="input-speciesNameEn"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={orchidForm.sku || ""}
                  onChange={(e) => setOrchidForm({ ...orchidForm, sku: e.target.value })}
                  placeholder="PHA-PP-HYAN-SL-35"
                  data-testid="input-sku"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Chi" : "Genus"}</Label>
                <Input
                  value={orchidForm.genus || ""}
                  onChange={(e) => setOrchidForm({ ...orchidForm, genus: e.target.value })}
                  placeholder="Phalaenopsis"
                  data-testid="input-genus"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Tên thương mại" : "Trade Name"}</Label>
                <Input
                  value={orchidForm.tradeName || ""}
                  onChange={(e) => setOrchidForm({ ...orchidForm, tradeName: e.target.value })}
                  data-testid="input-tradeName"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("catalog.color", language)}</Label>
                <Input
                  value={orchidForm.color}
                  onChange={(e) => setOrchidForm({ ...orchidForm, color: e.target.value })}
                  required
                  data-testid="input-color"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("catalog.height", language)} (cm)</Label>
                <Input
                  type="number"
                  value={orchidForm.heightCm}
                  onChange={(e) => setOrchidForm({ ...orchidForm, heightCm: parseInt(e.target.value) || 0 })}
                  required
                  data-testid="input-height"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "vi" ? "Mã màu" : "Color Code"}</Label>
                <Input
                  value={orchidForm.colorCode || ""}
                  onChange={(e) => setOrchidForm({ ...orchidForm, colorCode: e.target.value })}
                  placeholder="PP, PK, WH..."
                  data-testid="input-colorCode"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Mã mẫu" : "Pattern Code"}</Label>
                <Input
                  value={orchidForm.patternCode || ""}
                  onChange={(e) => setOrchidForm({ ...orchidForm, patternCode: e.target.value })}
                  placeholder="SL, ST..."
                  data-testid="input-patternCode"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === "vi" ? "Kích cỡ (inch)" : "Size Options (inches)"}</Label>
              <Input
                value={(orchidForm.sizeOptions || []).join(", ")}
                onChange={(e) => {
                  const vals = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                  setOrchidForm({ ...orchidForm, sizeOptions: vals });
                }}
                placeholder="3.5, 4.0"
                data-testid="input-sizeOptions"
              />
            </div>
            <ImageUpload
              value={orchidForm.imageUrl || ""}
              onChange={(url) => setOrchidForm({ ...orchidForm, imageUrl: url })}
              label={language === "vi" ? "Hình ảnh" : "Image"}
            />
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                {language === "vi" ? "Video sản phẩm" : "Product Videos"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {orchidVideos.map((vid, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-md overflow-visible bg-muted">
                    <video src={vid} className="w-full h-full object-cover rounded-md" muted />
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                      <Video className="h-5 w-5 text-white" />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full z-10"
                      onClick={() => setOrchidVideos(prev => prev.filter((_, i) => i !== index))}
                      data-testid={`button-remove-orchid-video-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="w-24 h-24 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover-elevate">
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleOrchidVideoUpload}
                    disabled={isUploadingOrchidVideo}
                    data-testid="input-orchid-video-upload"
                  />
                  {isUploadingOrchidVideo ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{language === "vi" ? "Thêm video" : "Add video"}</span>
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t("catalog.price", language)}</Label>
                <Input
                  type="number"
                  value={orchidForm.pricePerUnit}
                  onChange={(e) => setOrchidForm({ ...orchidForm, pricePerUnit: e.target.value })}
                  required
                  data-testid="input-price"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Giá vốn" : "Cost"}</Label>
                <Input
                  type="number"
                  value={orchidForm.costPerUnit || ""}
                  onChange={(e) => setOrchidForm({ ...orchidForm, costPerUnit: e.target.value })}
                  data-testid="input-cost"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("catalog.stock", language)}</Label>
                <Input
                  type="number"
                  value={orchidForm.stockQuantity}
                  onChange={(e) => setOrchidForm({ ...orchidForm, stockQuantity: parseInt(e.target.value) || 0 })}
                  required
                  data-testid="input-stock"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("catalog.status", language)}</Label>
                <Select value={orchidForm.status} onValueChange={(v) => setOrchidForm({ ...orchidForm, status: v })}>
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
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(orchidForm.tags || []).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setOrchidForm({ ...orchidForm, tags: (orchidForm.tags || []).filter((_, idx) => idx !== i) })}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={language === "vi" ? "Nhập tag rồi Enter" : "Type tag and press Enter"}
                  data-testid="input-tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !(orchidForm.tags || []).includes(val)) {
                        setOrchidForm({ ...orchidForm, tags: [...(orchidForm.tags || []), val] });
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOrchidDialogOpen(false)}>
                {t("common.cancel", language)}
              </Button>
              <Button type="submit" disabled={createOrchidMutation.isPending || updateOrchidMutation.isPending} data-testid="button-save-orchid">
                {t("common.save", language)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generic Dialog for Pot/Decoration/Shipping/Payment */}
      <Dialog open={genericDialogOpen} onOpenChange={setGenericDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGeneric ? (language === "vi" ? "Sửa" : "Edit") : getAddLabel(genericDialogType)}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenericSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "vi" ? "Tên (VI)" : "Name (VI)"}</Label>
                <Input
                  value={genericForm.nameVi}
                  onChange={(e) => setGenericForm({ ...genericForm, nameVi: e.target.value })}
                  required
                  data-testid="input-nameVi"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Tên (EN)" : "Name (EN)"}</Label>
                <Input
                  value={genericForm.nameEn}
                  onChange={(e) => setGenericForm({ ...genericForm, nameEn: e.target.value })}
                  required
                  data-testid="input-nameEn"
                />
              </div>
            </div>

            {(genericDialogType === "pot" || genericDialogType === "decoration") && (
              <div>
                <Label className="flex items-center gap-2">
                  {language === "vi" ? "Mã SKU" : "SKU Code"}
                  {editingGeneric && skuLocked && (
                    <Badge variant="secondary" className="text-xs">
                      {language === "vi" ? "Đã khóa" : "Locked"}
                    </Badge>
                  )}
                </Label>
                <Input
                  value={genericForm.sku || ""}
                  onChange={(e) => setGenericForm({ ...genericForm, sku: e.target.value.toUpperCase() })}
                  placeholder="PT-BT-WH-M"
                  className="font-mono"
                  disabled={editingGeneric && skuLocked}
                  data-testid="input-sku"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editingGeneric && skuLocked
                    ? (language === "vi" ? "SKU không thể thay đổi - đã được sử dụng trong đơn hàng" : "SKU cannot be changed - referenced by orders")
                    : (language === "vi" ? "Để trống để tự động tạo" : "Leave empty to auto-generate")}
                </p>
              </div>
            )}

            {(genericDialogType === "pot" || genericDialogType === "decoration") && (
              <>
                <ImageUpload
                  value={genericForm.imageUrl || ""}
                  onChange={(url) => setGenericForm({ ...genericForm, imageUrl: url })}
                  label={language === "vi" ? "Hình ảnh" : "Image"}
                />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    {language === "vi" ? "Video sản phẩm" : "Product Videos"}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {genericVideos.map((vid, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-md overflow-visible bg-muted">
                        <video src={vid} className="w-full h-full object-cover rounded-md" muted />
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                          <Video className="h-5 w-5 text-white" />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full z-10"
                          onClick={() => setGenericVideos(prev => prev.filter((_, i) => i !== index))}
                          data-testid={`button-remove-generic-video-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="w-24 h-24 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover-elevate">
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={handleGenericVideoUpload}
                        disabled={isUploadingGenericVideo}
                        data-testid="input-generic-video-upload"
                      />
                      {isUploadingGenericVideo ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Video className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{language === "vi" ? "Thêm video" : "Add video"}</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Giá (hoặc giá tối thiểu)" : "Price (or min price)"}</Label>
                  <Input
                    type="number"
                    value={genericForm.price}
                    onChange={(e) => setGenericForm({ ...genericForm, price: e.target.value })}
                    required
                    data-testid="input-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Giá tối đa (để trống nếu giá cố định)" : "Max price (leave empty for fixed price)"}</Label>
                  <Input
                    type="number"
                    value={genericForm.priceMax || ""}
                    onChange={(e) => setGenericForm({ ...genericForm, priceMax: e.target.value })}
                    placeholder={language === "vi" ? "Để trống = giá cố định" : "Empty = fixed price"}
                    data-testid="input-priceMax"
                  />
                </div>
              </>
            )}

            {genericDialogType === "shipping" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "vi" ? "Phí vận chuyển (hoặc phí tối thiểu)" : "Shipping cost (or min cost)"}</Label>
                    <Input
                      type="number"
                      value={genericForm.baseCost}
                      onChange={(e) => setGenericForm({ ...genericForm, baseCost: e.target.value })}
                      required
                      data-testid="input-baseCost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "vi" ? "Phí tối đa (để trống nếu cố định)" : "Max cost (leave empty for fixed)"}</Label>
                    <Input
                      type="number"
                      value={genericForm.baseCostMax || ""}
                      onChange={(e) => setGenericForm({ ...genericForm, baseCostMax: e.target.value })}
                      placeholder={language === "vi" ? "Để trống = phí cố định" : "Empty = fixed cost"}
                      data-testid="input-baseCostMax"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Số ngày giao" : "Estimated days"}</Label>
                  <Input
                    type="number"
                    value={genericForm.estimatedDays}
                    onChange={(e) => setGenericForm({ ...genericForm, estimatedDays: parseInt(e.target.value) || 3 })}
                    required
                    data-testid="input-estimatedDays"
                  />
                </div>
              </div>
            )}

            {genericDialogType === "payment" && (
              <>
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Loại thanh toán" : "Payment type"}</Label>
                  <Select value={genericForm.type} onValueChange={(v) => setGenericForm({ ...genericForm, type: v })}>
                    <SelectTrigger data-testid="select-paymentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">{language === "vi" ? "Chuyển khoản" : "Bank Transfer"}</SelectItem>
                      <SelectItem value="CASH">{language === "vi" ? "Tiền mặt" : "Cash"}</SelectItem>
                      <SelectItem value="MOMO">MoMo</SelectItem>
                      <SelectItem value="ZALO_PAY">ZaloPay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "vi" ? "Tên ngân hàng" : "Bank name"}</Label>
                    <Input
                      value={genericForm.bankName}
                      onChange={(e) => setGenericForm({ ...genericForm, bankName: e.target.value })}
                      data-testid="input-bankName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "vi" ? "Số tài khoản" : "Account number"}</Label>
                    <Input
                      value={genericForm.accountNumber}
                      onChange={(e) => setGenericForm({ ...genericForm, accountNumber: e.target.value })}
                      data-testid="input-accountNumber"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Tên chủ tài khoản" : "Account holder"}</Label>
                  <Input
                    value={genericForm.accountName}
                    onChange={(e) => setGenericForm({ ...genericForm, accountName: e.target.value })}
                    data-testid="input-accountName"
                  />
                </div>
              </>
            )}

            {genericDialogType === "priority" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Cấp độ" : "Level"}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={genericForm.level}
                    onChange={(e) => setGenericForm({ ...genericForm, level: parseInt(e.target.value) || 1 })}
                    required
                    data-testid="input-level"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Màu sắc" : "Color"}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={genericForm.color}
                      onChange={(e) => setGenericForm({ ...genericForm, color: e.target.value })}
                      className="w-14 h-9 p-1"
                      data-testid="input-color-picker"
                    />
                    <Input
                      value={genericForm.color}
                      onChange={(e) => setGenericForm({ ...genericForm, color: e.target.value })}
                      placeholder="#808080"
                      data-testid="input-color"
                    />
                  </div>
                </div>
              </div>
            )}

            {genericDialogType !== "priority" && (
              <div className="space-y-2">
                <Label>{t("catalog.status", language)}</Label>
                <Select value={genericForm.status} onValueChange={(v) => setGenericForm({ ...genericForm, status: v })}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t("catalog.active", language)}</SelectItem>
                    <SelectItem value="INACTIVE">{t("catalog.inactive", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGenericDialogOpen(false)}>
                {t("common.cancel", language)}
              </Button>
              <Button type="submit" disabled={createGenericMutation.isPending || updateGenericMutation.isPending} data-testid="button-save-generic">
                {t("common.save", language)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Orchid Dialog */}
      <Dialog open={deleteOrchidDialogOpen} onOpenChange={setDeleteOrchidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirm", language)}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {language === "vi"
              ? `Bạn có chắc chắn muốn xóa "${deletingOrchid?.speciesNameVi}"?`
              : `Are you sure you want to delete "${deletingOrchid?.speciesNameEn}"?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOrchidDialogOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingOrchid && deleteOrchidMutation.mutate(deletingOrchid.id)}
              disabled={deleteOrchidMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {t("common.delete", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Generic Dialog */}
      <Dialog open={deleteGenericDialogOpen} onOpenChange={setDeleteGenericDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirm", language)}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {language === "vi"
              ? `Bạn có chắc chắn muốn xóa "${deletingGeneric?.nameVi}"?`
              : `Are you sure you want to delete "${deletingGeneric?.nameEn}"?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGenericDialogOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingGeneric && deleteGenericMutation.mutate({ type: deletingGeneric.type, id: deletingGeneric.id })}
              disabled={deleteGenericMutation.isPending}
              data-testid="button-confirm-delete-generic"
            >
              {t("common.delete", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
