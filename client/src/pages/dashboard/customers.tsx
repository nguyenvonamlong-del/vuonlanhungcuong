import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Phone, Mail, MapPin, ShoppingBag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { t, formatCurrency } from "@/lib/i18n";
import type { Customer } from "@shared/schema";

export default function CustomersPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const filteredCustomers = customers.filter((customer) =>
    customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phoneNumber.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCustomerTypeBadge = (type: string) => {
    switch (type) {
      case "VIP":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">VIP</Badge>;
      case "REGISTERED":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          {language === "vi" ? "Đã đăng ký" : "Registered"}
        </Badge>;
      default:
        return <Badge variant="outline">{language === "vi" ? "Khách" : "Guest"}</Badge>;
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
              <h1 className="font-semibold">{t("nav.customers", language)}</h1>
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
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{t("common.noData", language)}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("form.fullName", language)}</TableHead>
                          <TableHead>{t("form.phone", language)}</TableHead>
                          <TableHead>{t("form.email", language)}</TableHead>
                          <TableHead className="text-center">{language === "vi" ? "Loại" : "Type"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Đơn hàng" : "Orders"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Tổng chi tiêu" : "Total Spent"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((customer) => (
                          <TableRow
                            key={customer.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedCustomer(customer)}
                            data-testid={`row-customer-${customer.id}`}
                          >
                            <TableCell className="font-medium">{customer.fullName}</TableCell>
                            <TableCell>{customer.phoneNumber}</TableCell>
                            <TableCell className="text-muted-foreground">{customer.email || "-"}</TableCell>
                            <TableCell className="text-center">{getCustomerTypeBadge(customer.customerType)}</TableCell>
                            <TableCell className="text-right">{customer.totalOrders}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(customer.totalSpent, language)}
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

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">{selectedCustomer?.fullName.charAt(0)}</span>
              </div>
              {selectedCustomer?.fullName}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {getCustomerTypeBadge(selectedCustomer.customerType)}
                <span className="text-sm text-muted-foreground">
                  {language === "vi" ? "Khách hàng từ" : "Customer since"}{" "}
                  {new Date(selectedCustomer.createdAt!).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCustomer.phoneNumber}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.streetAddress && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>
                      {selectedCustomer.streetAddress}, {selectedCustomer.ward}, {selectedCustomer.district}, {selectedCustomer.province}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <Card>
                  <CardContent className="p-4 text-center">
                    <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === "vi" ? "Đơn hàng" : "Orders"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="h-6 w-6 mx-auto mb-2 text-muted-foreground font-bold text-lg">₫</div>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(selectedCustomer.totalSpent, language)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "vi" ? "Tổng chi tiêu" : "Total Spent"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">{language === "vi" ? "Nhãn" : "Tags"}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
