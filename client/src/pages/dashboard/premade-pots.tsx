import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Flower2, Star, StarOff, MessageCircle, Package, Palette, X, Upload, Loader2, Video, Tag, RefreshCw, LayoutGrid, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useChatbot } from "@/context/ChatbotContext";
import { t, formatCurrency } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PremadePot, InsertPremadePot, PotType, DecorationType, CatalogItem } from "@shared/schema";

const initialFormData: Partial<InsertPremadePot> & { videos?: string[]; tags?: string[] } = {
  nameVi: "",
  nameEn: "",
  descriptionVi: "",
  descriptionEn: "",
  price: "0",
  stockQuantity: 0,
  images: [],
  videos: [],
  tags: [],
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
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PremadePot | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PremadePot | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkVideos, setBulkVideos] = useState<File[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<Record<string, {
    nameVi?: string;
    orchidTypeId?: string;
    totalCost?: string;
    decorationTypeId?: string;
    potTypeId?: string;
  }>>({});
  const [bulkEditSaving, setBulkEditSaving] = useState<Record<string, boolean>>({});

  const { data: pots = [], isLoading } = useQuery<PremadePot[]>({
    queryKey: ["/api/premade-pots"],
  });

  const { data: potTypes = [] } = useQuery<PotType[]>({
    queryKey: ["/api/pot-types"],
  });

  const { data: decorationTypes = [] } = useQuery<DecorationType[]>({
    queryKey: ["/api/decoration-types"],
  });

  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
  });

  const { uploadFile, isUploading } = useUpload();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadFile(file);
    if (result?.objectPath) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), result.objectPath]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const result = await uploadFile(file);
      if (result?.objectPath) {
        setFormData(prev => ({
          ...prev,
          videos: [...(prev.videos || []), result.objectPath]
        }));
      }
    } finally {
      setIsUploadingVideo(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: (prev.videos || []).filter((_, i) => i !== index)
    }));
  };

  const [manualTag, setManualTag] = useState("");

  const regenerateTags = () => {
    const tags: string[] = [];
    if (formData.orchidComposition && Array.isArray(formData.orchidComposition)) {
      for (const item of formData.orchidComposition as any[]) {
        if (item.catalogItemId) {
          const tag = `orchid:${item.catalogItemId}`;
          if (!tags.includes(tag)) tags.push(tag);
        }
      }
    }
    if (formData.decorations && Array.isArray(formData.decorations)) {
      for (const item of formData.decorations as any[]) {
        if (item.decorationTypeId) {
          const tag = `decoration:${item.decorationTypeId}`;
          if (!tags.includes(tag)) tags.push(tag);
        }
      }
    }
    if (formData.potTypeId) {
      tags.push(`pot:${formData.potTypeId}`);
    }
    setFormData(prev => ({ ...prev, tags }));
  };

  const getTagLabel = (tag: string): string => {
    const [type, id] = tag.split(":");
    if (type === "orchid") {
      const item = catalogItems.find(c => c.id === id);
      if (item) return `${language === "vi" ? item.speciesNameVi : item.speciesNameEn}`;
      return tag;
    }
    if (type === "decoration") {
      const item = decorationTypes.find(d => d.id === id);
      if (item) return `${language === "vi" ? item.nameVi : item.nameEn}`;
      return tag;
    }
    if (type === "pot") {
      const item = potTypes.find(p => p.id === id);
      if (item) return `${language === "vi" ? item.nameVi : item.nameEn}`;
      return tag;
    }
    return tag;
  };

  const getTagIcon = (tag: string) => {
    const type = tag.split(":")[0];
    if (type === "orchid") return <Flower2 className="h-3 w-3" />;
    if (type === "decoration") return <Palette className="h-3 w-3" />;
    if (type === "pot") return <Package className="h-3 w-3" />;
    return <Tag className="h-3 w-3" />;
  };

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

  const getBulkEditValue = (potId: string, field: string, fallback: any) => {
    const data = bulkEditData[potId];
    if (data && field in data) return (data as any)[field];
    return fallback;
  };

  const updateBulkEditField = (potId: string, field: string, value: any) => {
    setBulkEditData(prev => ({
      ...prev,
      [potId]: { ...prev[potId], [field]: value },
    }));
  };

  const handleBulkEditSave = async (pot: PremadePot) => {
    const edits = bulkEditData[pot.id];
    if (!edits) return;

    const patchData: any = {};
    if (edits.nameVi !== undefined) patchData.nameVi = edits.nameVi;
    if (edits.totalCost !== undefined) patchData.totalCost = edits.totalCost;
    if (edits.potTypeId !== undefined) {
      patchData.potTypeId = edits.potTypeId || null;
      const pt = potTypes.find(p => p.id === edits.potTypeId);
      patchData.potTypeName = pt ? (language === "vi" ? pt.nameVi : pt.nameEn) : null;
    }
    if (edits.orchidTypeId !== undefined) {
      const cat = catalogItems.find(c => c.id === edits.orchidTypeId);
      if (cat) {
        patchData.orchidComposition = [{
          catalogItemId: cat.id,
          speciesNameVi: cat.speciesNameVi,
          speciesNameEn: cat.speciesNameEn,
          color: cat.color,
          quantity: 1,
        }];
      } else if (!edits.orchidTypeId) {
        patchData.orchidComposition = [];
      }
    }
    if (edits.decorationTypeId !== undefined) {
      const dec = decorationTypes.find(d => d.id === edits.decorationTypeId);
      if (dec) {
        patchData.decorations = [{
          decorationTypeId: dec.id,
          nameVi: dec.nameVi,
          nameEn: dec.nameEn,
        }];
      } else if (!edits.decorationTypeId) {
        patchData.decorations = [];
      }
    }

    if (Object.keys(patchData).length === 0) return;

    setBulkEditSaving(prev => ({ ...prev, [pot.id]: true }));
    try {
      await apiRequest("PATCH", `/api/premade-pots/${pot.id}`, patchData);
      queryClient.invalidateQueries({ queryKey: ["/api/premade-pots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/pots"] });
      setBulkEditData(prev => {
        const next = { ...prev };
        delete next[pot.id];
        return next;
      });
      toast({
        title: t("common.success", language),
        description: language === "vi" ? `Đã cập nhật "${pot.nameVi}"` : `Updated "${pot.nameEn}"`,
      });
    } catch {
      toast({
        title: t("common.error", language),
        description: language === "vi" ? "Không thể lưu" : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setBulkEditSaving(prev => ({ ...prev, [pot.id]: false }));
    }
  };

  const getFirstOrchidTypeId = (pot: PremadePot): string => {
    if (pot.orchidComposition && Array.isArray(pot.orchidComposition) && pot.orchidComposition.length > 0) {
      return (pot.orchidComposition[0] as any).catalogItemId || "";
    }
    return "";
  };

  const getFirstDecorationTypeId = (pot: PremadePot): string => {
    if (pot.decorations && Array.isArray(pot.decorations) && pot.decorations.length > 0) {
      return (pot.decorations[0] as any).decorationTypeId || "";
    }
    return "";
  };

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
      videos: (pot as any).videos || [],
      tags: (pot as any).tags || [],
      orchidTypes: pot.orchidTypes || [],
      orchidComposition: pot.orchidComposition || [],
      decorations: pot.decorations || [],
      potTypeId: pot.potTypeId || undefined,
      potTypeName: pot.potTypeName || undefined,
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

  const handleBulkVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBulkVideos(prev => [...prev, ...files]);
    if (e.target) e.target.value = "";
  };

  const removeBulkVideo = (index: number) => {
    setBulkVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkUpload = async () => {
    if (bulkVideos.length === 0) return;
    setBulkUploading(true);
    setBulkProgress({ current: 0, total: bulkVideos.length });

    let successCount = 0;
    for (let i = 0; i < bulkVideos.length; i++) {
      setBulkProgress({ current: i + 1, total: bulkVideos.length });
      try {
        const result = await uploadFile(bulkVideos[i]);
        if (result?.objectPath) {
          const videoName = bulkVideos[i].name.replace(/\.[^.]+$/, "");
          await apiRequest("POST", "/api/premade-pots", {
            nameVi: videoName,
            nameEn: videoName,
            descriptionVi: "",
            descriptionEn: "",
            price: "0",
            stockQuantity: 0,
            images: [],
            videos: [result.objectPath],
            tags: [],
            orchidTypes: [],
            potSize: "MEDIUM",
            difficultyLevel: "MEDIUM",
            careInstructionsVi: "",
            careInstructionsEn: "",
            status: "INACTIVE",
            featured: false,
          });
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to upload video ${bulkVideos[i].name}:`, err);
      }
    }

    const totalCount = bulkVideos.length;
    setBulkUploading(false);
    setBulkVideos([]);
    setBulkDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/premade-pots"] });
    queryClient.invalidateQueries({ queryKey: ["/api/shop/pots"] });
    toast({
      title: t("common.success", language),
      description: language === "vi"
        ? `Đã tạo ${successCount}/${totalCount} chậu từ video`
        : `Created ${successCount}/${totalCount} pots from videos`,
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
              <h1 className="font-semibold">{t("nav.premadePots", language)}</h1>
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
              <div className="flex gap-2 flex-wrap">
                <Button onClick={openCreate} data-testid="button-add-pot">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("common.add", language)}
                </Button>
                <Button variant="outline" onClick={() => { setBulkVideos([]); setBulkDialogOpen(true); }} data-testid="button-bulk-add">
                  <Video className="h-4 w-4 mr-2" />
                  {language === "vi" ? "Thêm hàng loạt" : "Bulk Add"}
                </Button>
                <Button
                  variant={bulkEditMode ? "default" : "outline"}
                  onClick={() => { setBulkEditMode(!bulkEditMode); setBulkEditData({}); }}
                  className={bulkEditMode ? "toggle-elevate toggle-elevated" : "toggle-elevate"}
                  data-testid="button-bulk-edit"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  {language === "vi" ? "Sửa hàng loạt" : "Bulk Edit"}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="text-center py-12">
                    <Flower2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{t("common.noData", language)}</p>
                  </div>
                </CardContent>
              </Card>
            ) : bulkEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="bulk-edit-grid">
                {filteredItems.map((pot) => {
                  const firstVideo = (pot as any).videos?.[0];
                  const firstImage = pot.images?.[0];
                  const isSaving = bulkEditSaving[pot.id] || false;
                  const hasEdits = !!bulkEditData[pot.id] && Object.keys(bulkEditData[pot.id]).length > 0;

                  return (
                    <Card key={pot.id} data-testid={`bulk-edit-card-${pot.id}`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center">
                          {firstVideo ? (
                            <video
                              src={firstVideo}
                              className="w-full h-full rounded-md object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              data-testid={`video-preview-${pot.id}`}
                            />
                          ) : firstImage ? (
                            <img
                              src={firstImage}
                              alt={pot.nameVi}
                              className="w-full h-full rounded-md object-cover"
                              data-testid={`image-preview-${pot.id}`}
                            />
                          ) : (
                            <Flower2 className="h-10 w-10 text-muted-foreground opacity-50" />
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={pot.status} />
                            {pot.featured && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">
                            {formatCurrency(pot.price, language)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {language === "vi" ? "Tên (Tiếng Việt)" : "Name (Vietnamese)"}
                            </Label>
                            <Input
                              value={getBulkEditValue(pot.id, "nameVi", pot.nameVi)}
                              onChange={(e) => updateBulkEditField(pot.id, "nameVi", e.target.value)}
                              data-testid={`bulk-edit-name-${pot.id}`}
                            />
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {language === "vi" ? "Loại lan" : "Orchid Type"}
                            </Label>
                            <Select
                              value={getBulkEditValue(pot.id, "orchidTypeId", getFirstOrchidTypeId(pot))}
                              onValueChange={(v) => updateBulkEditField(pot.id, "orchidTypeId", v)}
                            >
                              <SelectTrigger data-testid={`bulk-edit-orchid-${pot.id}`}>
                                <SelectValue placeholder={language === "vi" ? "Chọn loại lan" : "Select orchid"} />
                              </SelectTrigger>
                              <SelectContent>
                                {[...catalogItems.filter(c => c.status === "ACTIVE")].sort((a, b) => (language === "vi" ? a.speciesNameVi : a.speciesNameEn).localeCompare(language === "vi" ? b.speciesNameVi : b.speciesNameEn)).map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {language === "vi" ? item.speciesNameVi : item.speciesNameEn} - {item.color}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {language === "vi" ? "Tổng giá vốn" : "Total Cost"}
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={getBulkEditValue(pot.id, "totalCost", pot.totalCost || "")}
                              onChange={(e) => updateBulkEditField(pot.id, "totalCost", e.target.value)}
                              placeholder="VND"
                              data-testid={`bulk-edit-total-cost-${pot.id}`}
                            />
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {language === "vi" ? "Trang trí" : "Decoration"}
                            </Label>
                            <Select
                              value={getBulkEditValue(pot.id, "decorationTypeId", getFirstDecorationTypeId(pot))}
                              onValueChange={(v) => updateBulkEditField(pot.id, "decorationTypeId", v)}
                            >
                              <SelectTrigger data-testid={`bulk-edit-decoration-${pot.id}`}>
                                <SelectValue placeholder={language === "vi" ? "Chọn trang trí" : "Select decoration"} />
                              </SelectTrigger>
                              <SelectContent>
                                {[...decorationTypes.filter(d => d.status === "ACTIVE")].sort((a, b) => (language === "vi" ? a.nameVi : a.nameEn).localeCompare(language === "vi" ? b.nameVi : b.nameEn)).map((dec) => (
                                  <SelectItem key={dec.id} value={dec.id}>
                                    {language === "vi" ? dec.nameVi : dec.nameEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {language === "vi" ? "Loại chậu" : "Pot Type"}
                            </Label>
                            <Select
                              value={getBulkEditValue(pot.id, "potTypeId", pot.potTypeId || "")}
                              onValueChange={(v) => updateBulkEditField(pot.id, "potTypeId", v)}
                            >
                              <SelectTrigger data-testid={`bulk-edit-pot-type-${pot.id}`}>
                                <SelectValue placeholder={language === "vi" ? "Chọn loại chậu" : "Select pot type"} />
                              </SelectTrigger>
                              <SelectContent>
                                {[...potTypes.filter(p => p.status === "ACTIVE")].sort((a, b) => (language === "vi" ? a.nameVi : a.nameEn).localeCompare(language === "vi" ? b.nameVi : b.nameEn)).map((pt) => (
                                  <SelectItem key={pt.id} value={pt.id}>
                                    {language === "vi" ? pt.nameVi : pt.nameEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          disabled={!hasEdits || isSaving}
                          onClick={() => handleBulkEditSave(pot)}
                          data-testid={`bulk-edit-save-${pot.id}`}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {language === "vi" ? "Lưu" : "Save"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                          <TableHead>{language === "vi" ? "Loại chậu" : "Pot Type"}</TableHead>
                          <TableHead>{language === "vi" ? "Trang trí" : "Decoration"}</TableHead>
                          <TableHead>{language === "vi" ? "Nhãn" : "Tags"}</TableHead>
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
                              {pot.potTypeName || pot.potTypeId ? (
                                <div className="flex items-center gap-1">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{pot.potTypeName || "—"}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {pot.decorations && pot.decorations.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Palette className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{pot.decorations.length} items</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {(pot as any).tags && (pot as any).tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {(pot as any).tags.slice(0, 3).map((tag: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {getTagIcon(tag)}
                                      <span className="ml-1">{getTagLabel(tag)}</span>
                                    </Badge>
                                  ))}
                                  {(pot as any).tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">+{(pot as any).tags.length - 3}</Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
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
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEdit(pot)}
                                  data-testid={`button-edit-${pot.id}`}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                  {language === "vi" ? "Sửa" : "Edit"}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeletingItem(pot);
                                    setDeleteDialogOpen(true);
                                  }}
                                  data-testid={`button-delete-${pot.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  {language === "vi" ? "Xóa" : "Delete"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  value={formData.descriptionVi || ""}
                  onChange={(e) => setFormData({ ...formData, descriptionVi: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Mô tả (Tiếng Anh)" : "Description (English)"}</Label>
                <Textarea
                  value={formData.descriptionEn || ""}
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
            {/* Images Upload Section */}
            <div className="space-y-2">
              <Label>{language === "vi" ? "Hình ảnh sản phẩm" : "Product Images"}</Label>
              <div className="flex flex-wrap gap-2">
                {(formData.images || []).map((img, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover-elevate">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    data-testid="input-image-upload"
                  />
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </label>
              </div>
            </div>

            {/* Pot Type Selection */}
            <div className="space-y-2">
              <Label>{language === "vi" ? "Loại chậu" : "Pot Type"}</Label>
              <Select
                value={formData.potTypeId || ""}
                onValueChange={(v) => {
                  const selected = potTypes.find(p => p.id === v);
                  setFormData({ 
                    ...formData, 
                    potTypeId: v,
                    potTypeName: selected ? (language === "vi" ? selected.nameVi : selected.nameEn) : undefined
                  });
                }}
              >
                <SelectTrigger data-testid="select-pot-type">
                  <SelectValue placeholder={language === "vi" ? "Chọn loại chậu..." : "Select pot type..."} />
                </SelectTrigger>
                <SelectContent>
                  {potTypes.filter(p => p.status === "ACTIVE").map(pot => (
                    <SelectItem key={pot.id} value={pot.id}>
                      <div className="flex items-center gap-2">
                        {pot.imageUrl ? (
                          <img src={pot.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                        <span>{language === "vi" ? pot.nameVi : pot.nameEn}</span>
                        <span className="text-muted-foreground text-xs">({formatCurrency(pot.price, language)})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Decorations Selection */}
            <div className="space-y-2">
              <Label>{language === "vi" ? "Trang trí" : "Decorations"}</Label>
              <div className="flex flex-wrap gap-2">
                {(formData.decorations || []).map((dec, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    {language === "vi" ? dec.nameVi : dec.nameEn}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        decorations: (prev.decorations || []).filter((_, i) => i !== index)
                      }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <Select
                value=""
                onValueChange={(v) => {
                  const selected = decorationTypes.find(d => d.id === v);
                  if (selected) {
                    setFormData(prev => ({
                      ...prev,
                      decorations: [
                        ...(prev.decorations || []),
                        {
                          decorationTypeId: selected.id,
                          nameVi: selected.nameVi,
                          nameEn: selected.nameEn
                        }
                      ]
                    }));
                  }
                }}
              >
                <SelectTrigger data-testid="select-decoration-type">
                  <SelectValue placeholder={language === "vi" ? "Thêm trang trí..." : "Add decoration..."} />
                </SelectTrigger>
                <SelectContent>
                  {decorationTypes.filter(d => d.status === "ACTIVE").map(dec => (
                    <SelectItem key={dec.id} value={dec.id}>
                      <div className="flex items-center gap-2">
                        {dec.imageUrl ? (
                          <img src={dec.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                        ) : (
                          <Palette className="w-4 h-4" />
                        )}
                        <span>{language === "vi" ? dec.nameVi : dec.nameEn}</span>
                        <span className="text-muted-foreground text-xs">({formatCurrency(dec.price, language)})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Orchid Composition Selection */}
            <div className="space-y-2">
              <Label>{language === "vi" ? "Các loại lan trong chậu" : "Orchid Types in Pot"}</Label>
              <Select
                onValueChange={(value) => {
                  const item = catalogItems.find(i => i.id === value);
                  if (item) {
                    const existsInComposition = (formData.orchidComposition || []).some((o: any) => o.catalogItemId === item.id);
                    if (!existsInComposition) {
                      setFormData(prev => ({
                        ...prev,
                        orchidComposition: [
                          ...(prev.orchidComposition || [] as any[]),
                          { catalogItemId: item.id, speciesName: language === "vi" ? item.speciesNameVi : item.speciesNameEn, quantity: 1 }
                        ],
                        orchidTypes: [...(prev.orchidTypes || []), language === "vi" ? item.speciesNameVi : item.speciesNameEn]
                      }));
                    }
                  }
                }}
              >
                <SelectTrigger data-testid="select-orchid-type">
                  <SelectValue placeholder={language === "vi" ? "Chọn loại lan..." : "Select orchid type..."} />
                </SelectTrigger>
                <SelectContent>
                  {catalogItems.filter(item => item.status === "ACTIVE").map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {language === "vi" ? item.speciesNameVi : item.speciesNameEn} - {item.color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-2">
                {(formData.orchidComposition || []).map((comp: any, i: number) => {
                  const item = catalogItems.find(c => c.id === comp.catalogItemId);
                  const name = item ? (language === "vi" ? item.speciesNameVi : item.speciesNameEn) : comp.speciesName;
                  return (
                    <Badge key={i} variant="secondary" className="gap-1">
                      <Flower2 className="h-3 w-3" />
                      {name}
                      <span className="text-xs text-muted-foreground">x{comp.quantity}</span>
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            orchidComposition: (prev.orchidComposition || []).map((o: any, idx: number) =>
                              idx === i ? { ...o, quantity: Math.max(1, o.quantity - 1) } : o
                            )
                          }))}
                          className="text-xs"
                        >-</button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            orchidComposition: (prev.orchidComposition || []).map((o: any, idx: number) =>
                              idx === i ? { ...o, quantity: o.quantity + 1 } : o
                            )
                          }))}
                          className="text-xs"
                        >+</button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          orchidComposition: (prev.orchidComposition || []).filter((_: any, idx: number) => idx !== i),
                          orchidTypes: (prev.orchidTypes || []).filter((_, idx) => idx !== i)
                        }))}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                {(!formData.orchidComposition || formData.orchidComposition.length === 0) && (
                  <span className="text-sm text-muted-foreground">{language === "vi" ? "Chưa có loại lan" : "No orchid types specified"}</span>
                )}
              </div>
            </div>

            {/* Videos Upload Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                {language === "vi" ? "Video sản phẩm" : "Product Videos"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {(formData.videos || []).map((vid, index) => (
                  <div key={index} className="relative w-32 h-20 rounded-md overflow-hidden border bg-muted">
                    <video src={vid} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Video className="h-5 w-5 text-white" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => removeVideo(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="w-32 h-20 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover-elevate gap-1">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                    disabled={isUploadingVideo}
                    data-testid="input-video-upload"
                  />
                  {isUploadingVideo ? (
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

            {/* Tags Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {language === "vi" ? "Nhãn (Tags)" : "Tags"}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={regenerateTags} data-testid="button-regenerate-tags">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {language === "vi" ? "Tạo lại" : "Regenerate"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(formData.tags || []).map((tag, i) => (
                  <Badge key={i} variant="outline" className="flex items-center gap-1" data-testid={`badge-tag-${i}`}>
                    {getTagIcon(tag)}
                    <span className="text-xs">{getTagLabel(tag)}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        tags: (prev.tags || []).filter((_, idx) => idx !== i)
                      }))}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!formData.tags || formData.tags.length === 0) && (
                  <span className="text-sm text-muted-foreground">
                    {language === "vi" ? "Chưa có nhãn. Chọn loại lan, chậu, trang trí rồi bấm \"Tạo lại\"" : "No tags. Select orchids, pot, decorations then click \"Regenerate\""}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={language === "vi" ? "Thêm nhãn thủ công..." : "Add manual tag..."}
                  value={manualTag}
                  onChange={(e) => setManualTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualTag.trim()) {
                      e.preventDefault();
                      setFormData(prev => ({
                        ...prev,
                        tags: [...(prev.tags || []), manualTag.trim()]
                      }));
                      setManualTag("");
                    }
                  }}
                  data-testid="input-manual-tag"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (manualTag.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        tags: [...(prev.tags || []), manualTag.trim()]
                      }));
                      setManualTag("");
                    }
                  }}
                  data-testid="button-add-tag"
                >
                  <Plus className="h-3 w-3" />
                </Button>
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

      <Dialog open={bulkDialogOpen} onOpenChange={(open) => { if (!bulkUploading) setBulkDialogOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "vi" ? "Thêm hàng loạt video" : "Bulk Add Videos"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "vi"
                ? "Chọn nhiều video cùng lúc. Mỗi video sẽ tạo một sản phẩm mới ở trạng thái Không hoạt động để bạn bổ sung chi tiết sau."
                : "Select multiple videos at once. Each video will create a new product in Inactive status for you to add details later."}
            </p>
            <div>
              <Label className="block mb-2">
                {language === "vi" ? "Chọn video" : "Select Videos"}
              </Label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover-elevate transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleBulkVideoSelect}
                  className="hidden"
                  disabled={bulkUploading}
                  data-testid="input-bulk-videos"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {language === "vi" ? "Nhấn để chọn video (có thể chọn nhiều)" : "Click to select videos (multiple allowed)"}
                </span>
              </label>
            </div>
            {bulkVideos.length > 0 && (
              <div className="space-y-2">
                <Label>
                  {language === "vi" ? `${bulkVideos.length} video đã chọn` : `${bulkVideos.length} videos selected`}
                </Label>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {bulkVideos.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50" data-testid={`bulk-video-item-${idx}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeBulkVideo(idx)}
                        disabled={bulkUploading}
                        data-testid={`button-remove-bulk-video-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bulkUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {language === "vi"
                      ? `Đang tải lên ${bulkProgress.current}/${bulkProgress.total}...`
                      : `Uploading ${bulkProgress.current}/${bulkProgress.total}...`}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)} disabled={bulkUploading}>
              {t("common.cancel", language)}
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={bulkVideos.length === 0 || bulkUploading}
              data-testid="button-start-bulk-upload"
            >
              {bulkUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === "vi" ? "Đang tải..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {language === "vi" ? `Tải lên ${bulkVideos.length} video` : `Upload ${bulkVideos.length} videos`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
