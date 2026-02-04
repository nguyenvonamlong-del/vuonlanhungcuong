import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, Clock, Package, Truck, MapPin, XCircle, Flower2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PublicHeader } from "@/components/public-header";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import type { Order } from "@shared/schema";

const statusTimeline = [
  { status: "PENDING", icon: Clock, labelKey: "status.PENDING" },
  { status: "CONFIRMED", icon: Check, labelKey: "status.CONFIRMED" },
  { status: "PREPARING", icon: Flower2, labelKey: "status.PREPARING" },
  { status: "READY", icon: Package, labelKey: "status.READY" },
  { status: "SHIPPING", icon: Truck, labelKey: "status.SHIPPING" },
  { status: "DELIVERED", icon: MapPin, labelKey: "status.DELIVERED" },
];

const statusOrder = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SHIPPING", "DELIVERED"];

export default function TrackingPage() {
  const { language } = useApp();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tokenFromUrl = params.get("token") || "";

  const [searchMode, setSearchMode] = useState<"token" | "contact">(tokenFromUrl ? "token" : "token");
  const [trackingToken, setTrackingToken] = useState(tokenFromUrl);
  const [searchToken, setSearchToken] = useState(tokenFromUrl);
  const [contactSearch, setContactSearch] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      setTrackingToken(tokenFromUrl);
      setSearchToken(tokenFromUrl);
      setSearchMode("token");
    }
  }, [tokenFromUrl]);

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: [`/api/orders/track/${searchToken}`],
    enabled: !!searchToken && searchMode === "token",
  });

  const { data: activeOrders = [], isLoading: isLoadingOrders, error: ordersError } = useQuery<Order[]>({
    queryKey: [`/api/orders/search?q=${encodeURIComponent(searchContact)}`],
    enabled: !!searchContact && searchMode === "contact",
  });

  const handleSearch = () => {
    if (trackingToken.trim()) {
      setSearchToken(trackingToken.trim());
      setSelectedOrder(null);
    }
  };

  const handleContactSearch = () => {
    if (contactSearch.trim()) {
      setSearchContact(contactSearch.trim());
      setSelectedOrder(null);
    }
  };

  const displayOrder = searchMode === "token" ? order : selectedOrder;

  const getCurrentStatusIndex = () => {
    if (!displayOrder) return -1;
    return statusOrder.indexOf(displayOrder.status);
  };

  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("tracking.title", language)}</h1>
            <p className="text-muted-foreground">
              {language === "vi"
                ? "Tra cứu đơn hàng bằng mã theo dõi hoặc số điện thoại/email"
                : "Track your order by tracking code or phone/email"}
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-4">
              <Tabs value={searchMode} onValueChange={(v) => { setSearchMode(v as "token" | "contact"); setSelectedOrder(null); }}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="token" data-testid="tab-tracking-token">
                    <Package className="h-4 w-4 mr-2" />
                    {language === "vi" ? "Mã theo dõi" : "Tracking Code"}
                  </TabsTrigger>
                  <TabsTrigger value="contact" data-testid="tab-contact">
                    <Phone className="h-4 w-4 mr-2" />
                    {language === "vi" ? "SĐT / Email" : "Phone / Email"}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="token" className="mt-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("tracking.enterCode", language)}
                      value={trackingToken}
                      onChange={(e) => setTrackingToken(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="flex-1"
                      data-testid="input-tracking-code"
                    />
                    <Button onClick={handleSearch} data-testid="button-track">
                      <Search className="h-4 w-4 mr-2" />
                      {t("tracking.track", language)}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="mt-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder={language === "vi" ? "Nhập số điện thoại hoặc email" : "Enter phone number or email"}
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleContactSearch()}
                      className="flex-1"
                      data-testid="input-contact-search"
                    />
                    <Button onClick={handleContactSearch} data-testid="button-search-contact">
                      <Search className="h-4 w-4 mr-2" />
                      {t("tracking.track", language)}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {language === "vi" 
                      ? "Chỉ hiển thị đơn hàng đang xử lý (chưa giao hoặc hủy)"
                      : "Only shows active orders (not delivered or cancelled)"}
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {(isLoading || isLoadingOrders) && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}

          {error && !isLoading && searchToken && searchMode === "token" && (
            <Card className="text-center py-12">
              <CardContent>
                <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
                <h3 className="text-xl font-semibold mb-2">{t("tracking.notFound", language)}</h3>
                <p className="text-muted-foreground">
                  {language === "vi"
                    ? "Không tìm thấy đơn hàng với mã theo dõi này"
                    : "No order found with this tracking code"}
                </p>
              </CardContent>
            </Card>
          )}

          {searchMode === "contact" && searchContact && !isLoadingOrders && activeOrders.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <XCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  {language === "vi" ? "Không có đơn hàng đang xử lý" : "No active orders"}
                </h3>
                <p className="text-muted-foreground">
                  {language === "vi"
                    ? "Không tìm thấy đơn hàng đang xử lý với số điện thoại hoặc email này"
                    : "No active orders found with this phone number or email"}
                </p>
              </CardContent>
            </Card>
          )}

          {searchMode === "contact" && activeOrders.length > 0 && !selectedOrder && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">
                {language === "vi" 
                  ? `Tìm thấy ${activeOrders.length} đơn hàng đang xử lý` 
                  : `Found ${activeOrders.length} active order${activeOrders.length > 1 ? "s" : ""}`}
              </h3>
              {activeOrders.map((o) => (
                <Card 
                  key={o.id} 
                  className="cursor-pointer hover-elevate transition-colors"
                  onClick={() => setSelectedOrder(o)}
                  data-testid={`order-card-${o.orderNumber}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold">{o.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(o.createdAt!).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{formatCurrency(Number(o.totalAmount), language)}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedOrder && searchMode === "contact" && (
            <Button 
              variant="outline" 
              className="mb-4"
              onClick={() => setSelectedOrder(null)}
              data-testid="button-back-to-list"
            >
              {language === "vi" ? "← Quay lại danh sách" : "← Back to list"}
            </Button>
          )}

          {displayOrder && !(isLoading || isLoadingOrders) && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {t("orders.orderNumber", language)}: {displayOrder.orderNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(displayOrder.createdAt!).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={displayOrder.status} />
                </CardHeader>
                <CardContent>
                  {displayOrder.status === "CANCELLED" ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                      <XCircle className="h-6 w-6" />
                      <div>
                        <p className="font-medium">{t("status.CANCELLED", language)}</p>
                        {displayOrder.cancelReason && (
                          <p className="text-sm mt-1">{displayOrder.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-[18px] top-[40px] bottom-[40px] w-0.5 bg-muted" />
                      <div className="space-y-6">
                        {statusTimeline.map((step, index) => {
                          const isCompleted = index <= currentStatusIndex;
                          const isCurrent = index === currentStatusIndex;
                          const Icon = step.icon;
                          return (
                            <div key={step.status} className="flex items-center gap-4 relative">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center z-10 ${
                                  isCompleted
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                } ${isCurrent ? "ring-4 ring-primary/30" : ""}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${isCompleted ? "" : "text-muted-foreground"}`}>
                                  {t(step.labelKey, language)}
                                </p>
                                {isCurrent && (
                                  <p className="text-sm text-primary">
                                    {language === "vi" ? "Trạng thái hiện tại" : "Current status"}
                                  </p>
                                )}
                              </div>
                              {isCompleted && <Check className="h-5 w-5 text-primary" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("tracking.orderDetails", language)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("orders.customer", language)}</p>
                      <p className="font-medium">{displayOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("form.phone", language)}</p>
                      <p className="font-medium">{displayOrder.customerPhone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("form.address", language)}</p>
                    <p className="font-medium">
                      {[displayOrder.streetAddress, displayOrder.ward, displayOrder.district, displayOrder.province].filter(Boolean).join(", ")}
                    </p>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("checkout.subtotal", language)}</span>
                      <span>{formatCurrency(displayOrder.subtotal, language)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("checkout.shipping", language)}</span>
                      <span>{formatCurrency(displayOrder.shippingCost, language)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>{t("checkout.total", language)}</span>
                      <span className="text-primary">{formatCurrency(displayOrder.totalAmount, language)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-1">{t("checkout.deposit", language)}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{formatCurrency(displayOrder.depositAmount, language)}</span>
                          {displayOrder.depositPaid ? (
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
                        <p className="text-sm text-muted-foreground mb-1">{t("checkout.remaining", language)}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{formatCurrency(displayOrder.remainingAmount, language)}</span>
                          {displayOrder.remainingPaid ? (
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
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
