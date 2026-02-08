import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import {
  Flower2,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
  Loader2,
  ShoppingBag,
  Upload,
  ImageIcon,
  Video,
  ExternalLink,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/public-header";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import type { CatalogItem, ShippingType, OrderPot, OrderOrchid, PotType, DecorationType, PremadePot } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CompositionPot {
  id: string;
  name: string;
  potTypeId?: string;
  decorationTypeId?: string;
  orchids: {
    catalogId: string;
    speciesName: string;
    color: string;
    quantity: number;
    pricePerUnit: number;
  }[];
}

interface CustomerInfo {
  fullName: string;
  phoneNumber: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
}

const steps = [
  { key: "composition", labelKey: "checkout.step1" },
  { key: "info", labelKey: "checkout.step2" },
  { key: "shipping", labelKey: "checkout.step3" },
  { key: "payment", labelKey: "checkout.step4" },
  { key: "review", labelKey: "checkout.step5" },
];

export default function CheckoutPage() {
  const { language, cart, cartTotal, clearCart } = useApp();
  const search = useSearch();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isPremadeMode = search.includes("mode=premade") && cart.length > 0;

  const [currentStep, setCurrentStep] = useState(isPremadeMode ? 1 : 0);
  const [pots, setPots] = useState<CompositionPot[]>([
    { id: crypto.randomUUID(), name: language === "vi" ? "Chậu 1" : "Pot 1", orchids: [] },
  ]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: "",
    phoneNumber: "",
    email: "",
    province: "",
    district: "",
    ward: "",
    streetAddress: "",
  });
  const [selectedShipping, setSelectedShipping] = useState<string>("");
  const [orderResult, setOrderResult] = useState<{ orderNumber: string; trackingToken: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      setPaymentProofUrl(response.objectPath);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Tải ảnh lên thành công!" : "Image uploaded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error", language),
        description: language === "vi" ? "Không thể tải ảnh lên" : "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("common.error", language),
          description: language === "vi" ? "Vui lòng chọn file ảnh" : "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      await uploadFile(file);
    }
  };

  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
    enabled: !isPremadeMode,
  });

  const { data: potTypes = [] } = useQuery<PotType[]>({
    queryKey: ["/api/pot-types"],
    enabled: !isPremadeMode,
  });

  const { data: decorationTypes = [] } = useQuery<DecorationType[]>({
    queryKey: ["/api/decoration-types"],
    enabled: !isPremadeMode,
  });

  const { data: premadePots = [] } = useQuery<PremadePot[]>({
    queryKey: ["/api/shop/pots"],
    enabled: !isPremadeMode,
  });

  const { data: shippingTypes = [] } = useQuery<ShippingType[]>({
    queryKey: ["/api/shipping-types"],
  });

  const { data: appSettings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const taxEnabled = appSettings.tax_enabled === "true";
  const taxPercentage = parseFloat(appSettings.tax_percentage || "0");

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setOrderResult(data);
      if (isPremadeMode) clearCart();
    },
    onError: () => {
      toast({
        title: t("common.error", language),
        description: language === "vi" ? "Không thể tạo đơn hàng" : "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const activeItems = catalogItems.filter((item) => item.status === "ACTIVE" && item.stockQuantity > 0);

  const calculateSubtotal = () => {
    if (isPremadeMode) return cartTotal;
    return pots.reduce((sum, pot) => {
      const orchidTotal = pot.orchids.reduce((s, o) => s + o.quantity * o.pricePerUnit, 0);
      const potTypePrice = pot.potTypeId 
        ? parseFloat(potTypes.find(pt => pt.id === pot.potTypeId)?.price as string || "0") 
        : 0;
      const decorationPrice = pot.decorationTypeId 
        ? parseFloat(decorationTypes.find(dt => dt.id === pot.decorationTypeId)?.price as string || "0") 
        : 0;
      return sum + orchidTotal + potTypePrice + decorationPrice;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const selectedShippingType = shippingTypes.find((s) => s.id === selectedShipping);
  const shippingCost = selectedShippingType ? parseFloat(selectedShippingType.baseCost as string) : 0;
  const taxAmount = taxEnabled ? Math.ceil((subtotal + shippingCost) * taxPercentage / 100) : 0;
  const total = subtotal + shippingCost + taxAmount;
  const deposit = Math.ceil(total / 2);
  const remaining = total - deposit;

  const addPot = () => {
    const newPot: CompositionPot = {
      id: crypto.randomUUID(),
      name: language === "vi" ? `Chậu ${pots.length + 1}` : `Pot ${pots.length + 1}`,
      orchids: [],
    };
    setPots([...pots, newPot]);
  };

  const removePot = (potId: string) => {
    if (pots.length > 1) {
      setPots(pots.filter((p) => p.id !== potId));
    }
  };

  const addOrchidToPot = (potId: string, catalogItem: CatalogItem) => {
    setPots(
      pots.map((pot) => {
        if (pot.id !== potId) return pot;
        const existing = pot.orchids.find((o) => o.catalogId === catalogItem.id);
        if (existing) {
          return {
            ...pot,
            orchids: pot.orchids.map((o) =>
              o.catalogId === catalogItem.id ? { ...o, quantity: o.quantity + 1 } : o
            ),
          };
        }
        return {
          ...pot,
          orchids: [
            ...pot.orchids,
            {
              catalogId: catalogItem.id,
              speciesName: language === "vi" ? catalogItem.speciesNameVi : catalogItem.speciesNameEn,
              color: catalogItem.color,
              quantity: 5,
              pricePerUnit: parseFloat(catalogItem.pricePerUnit as string),
            },
          ],
        };
      })
    );
  };

  const updateOrchidQuantity = (potId: string, catalogId: string, quantity: number) => {
    if (quantity <= 0) {
      setPots(
        pots.map((pot) =>
          pot.id === potId ? { ...pot, orchids: pot.orchids.filter((o) => o.catalogId !== catalogId) } : pot
        )
      );
    } else {
      setPots(
        pots.map((pot) =>
          pot.id === potId
            ? { ...pot, orchids: pot.orchids.map((o) => (o.catalogId === catalogId ? { ...o, quantity } : o)) }
            : pot
        )
      );
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return isPremadeMode || pots.every((pot) => pot.orchids.reduce((sum, o) => sum + o.quantity, 0) >= 5);
      case 1:
        return (
          customerInfo.fullName &&
          /^0\d{9,10}$/.test(customerInfo.phoneNumber) &&
          customerInfo.province &&
          customerInfo.ward &&
          customerInfo.streetAddress
        );
      case 2:
        return !!selectedShipping;
      case 3:
        return !!paymentProofUrl;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 4) {
      const orderPots: OrderPot[] = isPremadeMode
        ? cart.map((item, idx) => ({
            potId: item.pot.id,
            potName: language === "vi" ? item.pot.nameVi : item.pot.nameEn,
            orchids: [],
            potSubtotal: parseFloat(item.pot.price as string) * item.quantity,
          }))
        : pots.map((pot) => {
            const potType = pot.potTypeId ? potTypes.find(pt => pt.id === pot.potTypeId) : null;
            const decorationType = pot.decorationTypeId ? decorationTypes.find(dt => dt.id === pot.decorationTypeId) : null;
            const orchidTotal = pot.orchids.reduce((sum, o) => sum + o.quantity * o.pricePerUnit, 0);
            const potTypePrice = potType ? parseFloat(potType.price as string) : 0;
            const decorationPrice = decorationType ? parseFloat(decorationType.price as string) : 0;
            
            return {
              potId: pot.id,
              potName: pot.name,
              potTypeId: pot.potTypeId,
              potTypeName: potType ? (language === "vi" ? potType.nameVi : potType.nameEn) : undefined,
              potTypePrice: potTypePrice || undefined,
              decorationTypeId: pot.decorationTypeId,
              decorationTypeName: decorationType ? (language === "vi" ? decorationType.nameVi : decorationType.nameEn) : undefined,
              decorationTypePrice: decorationPrice || undefined,
              orchids: pot.orchids.map((o) => ({
                catalogId: o.catalogId,
                speciesName: o.speciesName,
                color: o.color,
                quantity: o.quantity,
                pricePerUnit: o.pricePerUnit,
                subtotal: o.quantity * o.pricePerUnit,
              })),
              potSubtotal: orchidTotal + potTypePrice + decorationPrice,
            };
          });

      createOrderMutation.mutate({
        customerName: customerInfo.fullName,
        customerPhone: customerInfo.phoneNumber,
        customerEmail: customerInfo.email || undefined,
        province: customerInfo.province,
        district: customerInfo.district || "",
        ward: customerInfo.ward,
        streetAddress: customerInfo.streetAddress,
        pots: orderPots,
        subtotal,
        shippingCost,
        taxAmount: taxAmount || undefined,
        totalAmount: total,
        depositAmount: deposit,
        remainingAmount: remaining,
        paymentProofUrl: paymentProofUrl || undefined,
        orderType: isPremadeMode ? "PREMADE" : "WEBSITE",
      });
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        if (isPremadeMode) return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("checkout.step1", language)}</h2>
              <Button variant="outline" size="sm" onClick={addPot} data-testid="button-add-pot">
                <Plus className="h-4 w-4 mr-2" />
                {t("checkout.addPot", language)}
              </Button>
            </div>

            <Alert className="border-primary/50 bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {language === "vi" 
                  ? "Mỗi chậu cần tối thiểu 5 cành lan. Bạn có thể kết hợp nhiều loại lan khác nhau (ví dụ: 2 cành loại A + 3 cành loại B) hoặc chọn 5 cành cùng loại."
                  : "Each pot requires a minimum of 5 orchid stems. You can combine different orchid types (e.g., 2 type A + 3 type B) or choose 5 of the same type."}
              </AlertDescription>
            </Alert>

            {pots.map((pot, potIndex) => {
              const potTotal = pot.orchids.reduce((sum, o) => sum + o.quantity * o.pricePerUnit, 0);
              const potCount = pot.orchids.reduce((sum, o) => sum + o.quantity, 0);
              return (
                <Card key={pot.id} data-testid={`card-pot-${potIndex}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                    <div className="flex-1">
                      <Input
                        value={pot.name}
                        onChange={(e) =>
                          setPots(pots.map((p) => (p.id === pot.id ? { ...p, name: e.target.value } : p)))
                        }
                        className="font-semibold text-base h-9"
                        data-testid={`input-pot-name-${potIndex}`}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {potCount} {t("common.stems", language)} - {formatCurrency(potTotal, language)}
                        {potCount < 5 && (
                          <span className="text-destructive ml-2">({t("checkout.minQuantity", language)})</span>
                        )}
                      </p>
                    </div>
                    {pots.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePot(pot.id)}
                        className="text-destructive"
                        data-testid={`button-remove-pot-${potIndex}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">
                          {language === "vi" ? "Loại chậu" : "Pot Type"}
                        </Label>
                        <Select 
                          value={pot.potTypeId || ""} 
                          onValueChange={(id) => {
                            setPots(pots.map(p => p.id === pot.id ? { ...p, potTypeId: id } : p));
                          }}
                        >
                          <SelectTrigger data-testid={`select-pot-type-${potIndex}`}>
                            <SelectValue placeholder={language === "vi" ? "Chọn loại chậu" : "Select pot type"} />
                          </SelectTrigger>
                          <SelectContent>
                            {potTypes.map((pt) => (
                              <SelectItem key={pt.id} value={pt.id}>
                                {language === "vi" ? pt.nameVi : pt.nameEn} 
                                {parseFloat(pt.price as string) > 0 && ` (+${formatCurrency(pt.price, language)})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">
                          {language === "vi" ? "Loại trang trí" : "Decoration Type"}
                        </Label>
                        <Select 
                          value={pot.decorationTypeId || ""} 
                          onValueChange={(id) => {
                            setPots(pots.map(p => p.id === pot.id ? { ...p, decorationTypeId: id } : p));
                          }}
                        >
                          <SelectTrigger data-testid={`select-decoration-type-${potIndex}`}>
                            <SelectValue placeholder={language === "vi" ? "Chọn trang trí" : "Select decoration"} />
                          </SelectTrigger>
                          <SelectContent>
                            {decorationTypes.map((dt) => (
                              <SelectItem key={dt.id} value={dt.id}>
                                {language === "vi" ? dt.nameVi : dt.nameEn}
                                {parseFloat(dt.price as string) > 0 && ` (+${formatCurrency(dt.price, language)})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">
                          {language === "vi" ? "Thêm loại lan cho chậu" : "Add orchid types to pot"}
                        </Label>
                        {pot.orchids.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {pot.orchids.length} {language === "vi" ? "loại" : pot.orchids.length === 1 ? "type" : "types"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === "vi" 
                          ? "Bạn có thể chọn nhiều loại lan khác nhau cho mỗi chậu" 
                          : "You can select multiple orchid types for each pot"}
                      </p>
                      <Select 
                        key={`orchid-select-${pot.id}-${pot.orchids.length}`}
                        onValueChange={(id) => {
                          const item = activeItems.find((i) => i.id === id);
                          if (item) addOrchidToPot(pot.id, item);
                        }}
                      >
                        <SelectTrigger data-testid={`select-add-orchid-${potIndex}`}>
                          <SelectValue placeholder={language === "vi" ? "Nhấn để thêm loại lan..." : "Click to add orchid type..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {activeItems.map((item) => {
                            const alreadyAdded = pot.orchids.some(o => o.catalogId === item.id);
                            return (
                              <SelectItem key={item.id} value={item.id}>
                                {language === "vi" ? item.speciesNameVi : item.speciesNameEn} - {item.color} ({formatCurrency(item.pricePerUnit, language)})
                                {alreadyAdded && ` ✓`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {pot.orchids.length > 0 && (
                      <div className="space-y-2">
                        {pot.orchids.map((orchid) => (
                          <div
                            key={orchid.catalogId}
                            className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{orchid.speciesName}</p>
                              <p className="text-xs text-muted-foreground">
                                {orchid.color} - {formatCurrency(orchid.pricePerUnit, language)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateOrchidQuantity(pot.id, orchid.catalogId, orchid.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center text-sm">{orchid.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateOrchidQuantity(pot.id, orchid.catalogId, orchid.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reference Gallery - Matching Pre-made Pots */}
                    {(() => {
                      const selectedTags: string[] = [];
                      if (pot.potTypeId) selectedTags.push(`pot:${pot.potTypeId}`);
                      if (pot.decorationTypeId) selectedTags.push(`decoration:${pot.decorationTypeId}`);
                      pot.orchids.forEach(o => selectedTags.push(`orchid:${o.catalogId}`));
                      
                      if (selectedTags.length === 0) return null;
                      
                      const matchingPots = premadePots.filter((pp: any) => {
                        if (!pp.tags || pp.tags.length === 0) return false;
                        return selectedTags.some((st: string) => pp.tags.includes(st));
                      });
                      
                      if (matchingPots.length === 0) return null;
                      
                      return (
                        <div className="mt-4 space-y-3" data-testid={`reference-gallery-${potIndex}`}>
                          <Separator />
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-medium text-primary">
                              {language === "vi" ? "Chậu mẫu tham khảo" : "Reference Pre-made Pots"}
                            </Label>
                            <Badge variant="outline" className="text-xs">{matchingPots.length}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {language === "vi" 
                              ? "Những chậu mẫu sẵn có chứa các loại lan, chậu hoặc trang trí bạn đã chọn"
                              : "Pre-made pots that contain orchids, pot types or decorations you selected"}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {matchingPots.map((pp: any) => (
                              <Card key={pp.id} className="overflow-hidden" data-testid={`reference-pot-${pp.id}`}>
                                <div className="flex flex-col">
                                  {/* Media gallery */}
                                  <div className="flex gap-1 overflow-x-auto p-2 bg-muted/30">
                                    {(pp.images || []).slice(0, 3).map((img: string, idx: number) => (
                                      <img
                                        key={`img-${idx}`}
                                        src={img}
                                        alt=""
                                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                      />
                                    ))}
                                    {(pp.videos || []).slice(0, 2).map((vid: string, idx: number) => (
                                      <div key={`vid-${idx}`} className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-black">
                                        <video
                                          src={vid}
                                          className="w-full h-full object-cover"
                                          muted
                                          loop
                                          onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                                          onMouseOut={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                                        />
                                        <div className="absolute bottom-0.5 right-0.5">
                                          <Video className="h-3 w-3 text-white" />
                                        </div>
                                      </div>
                                    ))}
                                    {(!pp.images || pp.images.length === 0) && (!pp.videos || pp.videos.length === 0) && (
                                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                                        <Flower2 className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-3 space-y-1">
                                    <p className="font-medium text-sm">{language === "vi" ? pp.nameVi : pp.nameEn}</p>
                                    <p className="text-sm font-semibold text-primary">{formatCurrency(pp.price, language)}</p>
                                    {pp.tags && pp.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {pp.tags.filter((tag: string) => selectedTags.includes(tag)).map((tag: string, i: number) => {
                                          const [type, id] = tag.split(":");
                                          let label = tag;
                                          if (type === "orchid") {
                                            const item = catalogItems.find(c => c.id === id);
                                            if (item) label = language === "vi" ? item.speciesNameVi : item.speciesNameEn;
                                          } else if (type === "decoration") {
                                            const item = decorationTypes.find(d => d.id === id);
                                            if (item) label = language === "vi" ? item.nameVi : item.nameEn;
                                          } else if (type === "pot") {
                                            const item = potTypes.find(p => p.id === id);
                                            if (item) label = language === "vi" ? item.nameVi : item.nameEn;
                                          }
                                          return (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                              {label}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full mt-2"
                                      onClick={() => navigate("/shop")}
                                      data-testid={`button-view-pot-${pp.id}`}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      {language === "vi" ? "Xem & Mua ngay" : "View & Purchase"}
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">{t("checkout.step2", language)}</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("form.fullName", language)} *</Label>
                    <Input
                      id="fullName"
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                      data-testid="input-fullName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("form.phone", language)} *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phoneNumber}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phoneNumber: e.target.value })}
                      placeholder="0909123456"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("form.email", language)}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    data-testid="input-email"
                  />
                </div>
                <Separator />
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">{t("form.province", language)} *</Label>
                    <Input
                      id="province"
                      value={customerInfo.province}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, province: e.target.value })}
                      data-testid="input-province"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">{t("form.district", language)}</Label>
                    <Input
                      id="district"
                      value={customerInfo.district}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, district: e.target.value })}
                      placeholder={language === "vi" ? "(Không bắt buộc)" : "(Optional)"}
                      data-testid="input-district"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ward">{t("form.ward", language)} *</Label>
                    <Input
                      id="ward"
                      value={customerInfo.ward}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, ward: e.target.value })}
                      data-testid="input-ward"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("form.address", language)} *</Label>
                  <Input
                    id="address"
                    value={customerInfo.streetAddress}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, streetAddress: e.target.value })}
                    data-testid="input-address"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">{t("checkout.step3", language)}</h2>
            <div className="grid gap-4">
              {shippingTypes.map((shipping) => (
                <Card
                  key={shipping.id}
                  className={`cursor-pointer transition-colors hover-elevate ${
                    selectedShipping === shipping.id ? "border-primary ring-1 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedShipping(shipping.id)}
                  data-testid={`card-shipping-${shipping.id}`}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedShipping === shipping.id ? "border-primary" : "border-muted"
                        }`}
                      >
                        {selectedShipping === shipping.id && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {language === "vi" ? shipping.nameVi : shipping.nameEn}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "vi" ? shipping.descriptionVi : shipping.descriptionEn}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {shipping.estimatedDays} {language === "vi" ? "ngày" : "days"}
                        </p>
                      </div>
                    </div>
                    <div className="font-semibold">{formatCurrency(shipping.baseCost, language)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">{t("checkout.step4", language)}</h2>

            <Card>
              <CardHeader>
                <CardTitle>{language === "vi" ? "Thanh toán tiền cọc" : "Pay Deposit"}</CardTitle>
                <CardDescription>
                  {language === "vi" 
                    ? "Quét mã QR hoặc chuyển khoản để thanh toán tiền cọc, sau đó tải ảnh chứng từ thanh toán"
                    : "Scan QR code or transfer to pay deposit, then upload the payment proof image"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
                  <span className="font-medium">{language === "vi" ? "Số tiền cọc" : "Deposit amount"}</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(deposit, language)}</span>
                </div>

                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <img 
                      src="/assets/vietcombank-qr.png" 
                      alt="Vietcombank QR Payment" 
                      className="w-64 h-auto object-contain" 
                    />
                  </div>
                </div>

                <div className="text-left space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2.5 rounded bg-muted/50" data-testid="text-bank-name-pre">
                    <span className="text-muted-foreground">{t("payment.bankName", language)}</span>
                    <span className="font-medium">Vietcombank (VCB)</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-muted/50" data-testid="text-account-number-pre">
                    <span className="text-muted-foreground">{t("payment.accountNumber", language)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">9983270995</span>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy("9983270995", "acct-pre")} data-testid="button-copy-account-pre">
                        {copied === "acct-pre" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-muted/50" data-testid="text-account-holder-pre">
                    <span className="text-muted-foreground">{t("payment.accountHolder", language)}</span>
                    <span className="font-medium">LE THI THANH TU</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-primary/10" data-testid="text-deposit-amount-pre">
                    <span className="text-muted-foreground">{language === "vi" ? "Số tiền cọc" : "Deposit amount"}</span>
                    <span className="font-semibold text-primary">{formatCurrency(deposit, language)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>
                    {language === "vi" ? "Ảnh chứng từ thanh toán" : "Payment proof image"} *
                  </Label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-payment-proof-file"
                  />
                  
                  {!paymentProofUrl ? (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">
                        {language === "vi" 
                          ? "Tải ảnh chứng từ thanh toán của bạn"
                          : "Upload your payment proof image"}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        data-testid="button-upload-payment-proof"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {language === "vi" ? `Đang tải... ${progress}%` : `Uploading... ${progress}%`}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {language === "vi" ? "Chọn ảnh" : "Select Image"}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3">
                      <div className="relative">
                        <img 
                          src={paymentProofUrl} 
                          alt="Payment proof" 
                          className="max-w-full h-auto max-h-48 mx-auto object-contain rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setPaymentProofUrl("")}
                          data-testid="button-remove-payment-proof"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        {language === "vi" ? "Đã tải ảnh lên" : "Image uploaded"}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        if (orderResult) {
          return (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{t("checkout.orderSuccess", language)}</h2>
                <p className="text-muted-foreground">
                  {language === "vi"
                    ? "Đơn hàng của bạn đã được đặt thành công"
                    : "Your order has been placed successfully"}
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-sm text-muted-foreground">{t("orders.orderNumber", language)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{orderResult.orderNumber}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(orderResult.orderNumber, "order")} data-testid="button-copy-order-number">
                        {copied === "order" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                    <span className="text-sm">{t("checkout.trackingToken", language)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{orderResult.trackingToken}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(orderResult.trackingToken, "tracking")} data-testid="button-copy-tracking-token">
                        {copied === "tracking" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => navigate(`/tracking?token=${orderResult.trackingToken}`)} data-testid="button-track-order">
                {t("nav.trackOrder", language)}
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">{t("checkout.step5", language)}</h2>
            <Card>
              <CardHeader>
                <CardTitle>{language === "vi" ? "Thông tin khách hàng" : "Customer Information"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">{t("form.fullName", language)}:</span> {customerInfo.fullName}</p>
                <p><span className="text-muted-foreground">{t("form.phone", language)}:</span> {customerInfo.phoneNumber}</p>
                {customerInfo.email && <p><span className="text-muted-foreground">{t("form.email", language)}:</span> {customerInfo.email}</p>}
                <p><span className="text-muted-foreground">{t("form.address", language)}:</span> {[customerInfo.streetAddress, customerInfo.ward, customerInfo.district, customerInfo.province].filter(Boolean).join(", ")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === "vi" ? "Sản phẩm" : "Products"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPremadeMode ? (
                  cart.map((item) => (
                    <div key={item.pot.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <Flower2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{language === "vi" ? item.pot.nameVi : item.pot.nameEn}</p>
                          <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                        </div>
                      </div>
                      <div className="font-medium">{formatCurrency(parseFloat(item.pot.price as string) * item.quantity, language)}</div>
                    </div>
                  ))
                ) : (
                  pots.map((pot) => (
                    <div key={pot.id} className="space-y-2">
                      <p className="font-medium">{pot.name}</p>
                      {pot.orchids.map((orchid) => (
                        <div key={orchid.catalogId} className="flex justify-between text-sm pl-4">
                          <span>{orchid.speciesName} ({orchid.color}) x{orchid.quantity}</span>
                          <span>{formatCurrency(orchid.quantity * orchid.pricePerUnit, language)}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("checkout.subtotal", language)}</span>
                    <span>{formatCurrency(subtotal, language)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("checkout.shipping", language)}</span>
                    <span>{formatCurrency(shippingCost, language)}</span>
                  </div>
                  {taxEnabled && (
                    <div className="flex justify-between text-sm">
                      <span>{language === "vi" ? `Thuế (${taxPercentage}%)` : `Tax (${taxPercentage}%)`}</span>
                      <span>{formatCurrency(taxAmount, language)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>{t("checkout.total", language)}</span>
                    <span className="text-primary">{formatCurrency(total, language)}</span>
                  </div>
                </div>
                <div className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between p-3 rounded-lg bg-primary/10">
                    <span>{t("checkout.deposit", language)}</span>
                    <span className="font-semibold">{formatCurrency(deposit, language)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("checkout.remaining", language)}</span>
                    <span>{formatCurrency(remaining, language)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                if (isPremadeMode && index === 0) return null;
                return (
                  <div key={step.key} className="flex-1 flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        index <= currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index < currentStep ? <Check className="h-4 w-4" /> : isPremadeMode ? index : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded ${
                          index < currentStep ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              {steps.map((step, index) => {
                if (isPremadeMode && index === 0) return null;
                return (
                  <div key={step.key} className="flex-1 text-center">
                    <span className={`text-xs ${index <= currentStep ? "text-primary" : "text-muted-foreground"}`}>
                      {t(step.labelKey, language)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {renderStep()}

          {!orderResult && currentStep <= 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, isPremadeMode ? 1 : 0))}
                disabled={currentStep === (isPremadeMode ? 1 : 0)}
                data-testid="button-back"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t("checkout.back", language)}
              </Button>
              <Button onClick={handleNext} disabled={!canProceed() || createOrderMutation.isPending} data-testid="button-next">
                {createOrderMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : currentStep === 4 ? (
                  t("checkout.placeOrder", language)
                ) : (
                  <>
                    {t("checkout.next", language)}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
