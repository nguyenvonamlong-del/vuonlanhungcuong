import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PublicHeader } from "@/components/public-header";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CatalogItem, ShippingType, OrderPot, OrderOrchid } from "@shared/schema";

interface CompositionPot {
  id: string;
  name: string;
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
  { key: "review", labelKey: "checkout.step4" },
  { key: "payment", labelKey: "checkout.step5" },
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

  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
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
      setCurrentStep(4);
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
      return sum + pot.orchids.reduce((s, o) => s + o.quantity * o.pricePerUnit, 0);
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
              quantity: 1,
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
    if (currentStep === 3) {
      const orderPots: OrderPot[] = isPremadeMode
        ? cart.map((item, idx) => ({
            potId: item.pot.id,
            potName: language === "vi" ? item.pot.nameVi : item.pot.nameEn,
            orchids: [],
            potSubtotal: parseFloat(item.pot.price as string) * item.quantity,
          }))
        : pots.map((pot) => ({
            potId: pot.id,
            potName: pot.name,
            orchids: pot.orchids.map((o) => ({
              catalogId: o.catalogId,
              speciesName: o.speciesName,
              color: o.color,
              quantity: o.quantity,
              pricePerUnit: o.pricePerUnit,
              subtotal: o.quantity * o.pricePerUnit,
            })),
            potSubtotal: pot.orchids.reduce((sum, o) => sum + o.quantity * o.pricePerUnit, 0),
          }));

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
                    <Select onValueChange={(id) => {
                      const item = activeItems.find((i) => i.id === id);
                      if (item) addOrchidToPot(pot.id, item);
                    }}>
                      <SelectTrigger data-testid={`select-add-orchid-${potIndex}`}>
                        <SelectValue placeholder={t("checkout.selectOrchid", language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {activeItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {language === "vi" ? item.speciesNameVi : item.speciesNameEn} - {item.color} ({formatCurrency(item.pricePerUnit, language)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

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

            <Card>
              <CardHeader>
                <CardTitle>{language === "vi" ? "Thanh toán tiền cọc" : "Pay Deposit"}</CardTitle>
                <CardDescription>
                  {language === "vi" 
                    ? "Quét mã QR hoặc chuyển khoản để thanh toán tiền cọc, sau đó nhập link ảnh chứng từ thanh toán"
                    : "Scan QR code or transfer to pay deposit, then enter the payment proof image URL"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <img 
                      src={`https://img.vietqr.io/image/VCB-1234567890-compact2.jpg?amount=${deposit}&addInfo=ORCHID%20DEPOSIT&accountName=VUON%20LAN%20HUNG%20CUONG`} 
                      alt="VietQR Payment" 
                      className="w-48 h-48 object-contain" 
                    />
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  <p>{language === "vi" ? "Số tiền cọc:" : "Deposit amount:"} <strong>{formatCurrency(deposit, language)}</strong></p>
                  <p>Vietcombank (VCB) - 1234567890</p>
                  <p>VUON LAN HUNG CUONG</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="paymentProof">
                    {language === "vi" ? "Ảnh chứng từ thanh toán (URL)" : "Payment proof image (URL)"} *
                  </Label>
                  <Input
                    id="paymentProof"
                    value={paymentProofUrl}
                    onChange={(e) => setPaymentProofUrl(e.target.value)}
                    placeholder={language === "vi" ? "Nhập URL ảnh chứng từ thanh toán" : "Enter payment proof image URL"}
                    data-testid="input-payment-proof"
                  />
                  {paymentProofUrl && (
                    <div className="mt-2 p-2 border rounded-lg">
                      <img 
                        src={paymentProofUrl} 
                        alt="Payment proof" 
                        className="max-w-full h-auto max-h-48 mx-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === "vi" 
                      ? "Bạn có thể tải ảnh lên dịch vụ lưu trữ miễn phí như imgur.com và dán URL vào đây"
                      : "You can upload image to free hosting like imgur.com and paste URL here"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        if (!orderResult) return null;
        const qrUrl = `https://img.vietqr.io/image/VCB-1234567890-compact2.jpg?amount=${deposit}&addInfo=ORCHID%20${orderResult.orderNumber}&accountName=VUON%20LAN%20HUNG%20CUONG`;
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
                  ? "Vui lòng thanh toán tiền cọc để xác nhận đơn hàng"
                  : "Please pay the deposit to confirm your order"}
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm text-muted-foreground">{t("orders.orderNumber", language)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{orderResult.orderNumber}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(orderResult.orderNumber, "order")}>
                      {copied === "order" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <span className="text-sm">{t("checkout.trackingToken", language)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{orderResult.trackingToken}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(orderResult.trackingToken, "tracking")}>
                      {copied === "tracking" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("payment.scanQR", language)}</CardTitle>
                <CardDescription>{t("checkout.deposit", language)}: {formatCurrency(deposit, language)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <img src={qrUrl} alt="VietQR Payment" className="w-64 h-64 object-contain" />
                  </div>
                </div>
                <Separator />
                <div className="text-left space-y-3">
                  <h4 className="font-medium">{t("payment.bankInfo", language)}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">{t("payment.bankName", language)}</span>
                      <span className="font-medium">Vietcombank (VCB)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">{t("payment.accountNumber", language)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">1234567890</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy("1234567890", "account")}>
                          {copied === "account" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">{t("payment.accountHolder", language)}</span>
                      <span className="font-medium">VUON LAN HUNG CUONG</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">{t("payment.amount", language)}</span>
                      <span className="font-semibold text-primary">{formatCurrency(deposit, language)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">{t("payment.description", language)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">ORCHID {orderResult.orderNumber}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(`ORCHID ${orderResult.orderNumber}`, "desc")}>
                          {copied === "desc" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={() => navigate(`/tracking?token=${orderResult.trackingToken}`)} data-testid="button-track-order">
              {t("nav.trackOrder", language)}
            </Button>
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

          {currentStep < 4 && (
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
                ) : currentStep === 3 ? (
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
