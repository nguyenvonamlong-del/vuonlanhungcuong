import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Users, Phone, Mail, MapPin, ShoppingBag, MessageCircle, Plus, Pencil, Ban, CheckCircle, Star, Crown, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { t, formatCurrency } from "@/lib/i18n";
import type { Customer } from "@shared/schema";

interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  customerType: string;
}

const initialFormData: FormData = {
  fullName: "",
  phoneNumber: "",
  email: "",
  province: "",
  district: "",
  ward: "",
  streetAddress: "",
  customerType: "GUEST",
};

export default function CustomersPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã thêm khách hàng" : "Customer added",
      });
    },
    onError: () => {
      toast({
        title: t("common.error", language),
        description: language === "vi" ? "Không thể thêm khách hàng" : "Failed to add customer",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const response = await apiRequest("PUT", `/api/customers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setDialogOpen(false);
      setEditingCustomer(null);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật khách hàng" : "Customer updated",
      });
    },
    onError: () => {
      toast({
        title: t("common.error", language),
        description: language === "vi" ? "Không thể cập nhật" : "Failed to update",
        variant: "destructive",
      });
    },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      const response = await apiRequest("PUT", `/api/customers/${id}`, { isBlocked: blocked });
      return response.json();
    },
    onSuccess: (_, { blocked }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: t("common.success", language),
        description: blocked
          ? (language === "vi" ? "Đã chặn khách hàng" : "Customer blocked")
          : (language === "vi" ? "Đã bỏ chặn khách hàng" : "Customer unblocked"),
      });
    },
  });

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phoneNumber.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || customer.customerType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCustomers = customers.length;
  const vipCustomers = customers.filter(c => c.customerType === "VIP").length;
  const registeredCustomers = customers.filter(c => c.customerType === "REGISTERED").length;
  const totalRevenue = customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || "0"), 0);
  const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  const getCustomerTypeBadge = (type: string, isBlocked?: boolean) => {
    if (isBlocked) {
      return <Badge variant="destructive">{language === "vi" ? "Đã chặn" : "Blocked"}</Badge>;
    }
    switch (type) {
      case "VIP":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Crown className="h-3 w-3 mr-1" />VIP</Badge>;
      case "REGISTERED":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          <UserCheck className="h-3 w-3 mr-1" />{language === "vi" ? "Đã đăng ký" : "Registered"}
        </Badge>;
      default:
        return <Badge variant="outline">{language === "vi" ? "Khách" : "Guest"}</Badge>;
    }
  };

  const openCreateDialog = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      email: customer.email || "",
      province: customer.province || "",
      district: customer.district || "",
      ward: customer.ward || "",
      streetAddress: customer.streetAddress || "",
      customerType: customer.customerType,
    });
    setDialogOpen(true);
    setSelectedCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData });
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
              <h1 className="font-semibold">{t("nav.customers", language)}</h1>
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
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng khách hàng" : "Total Customers"}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Khách VIP" : "VIP Customers"}</CardTitle>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{vipCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Đã đăng ký" : "Registered"}</CardTitle>
                  <UserCheck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{registeredCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Chi tiêu TB" : "Avg. Spent"}</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrency(averageSpent, language)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4 flex-1">
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-type-filter">
                    <SelectValue placeholder={language === "vi" ? "Loại" : "Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="REGISTERED">{language === "vi" ? "Đã đăng ký" : "Registered"}</SelectItem>
                    <SelectItem value="GUEST">{language === "vi" ? "Khách" : "Guest"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openCreateDialog} data-testid="button-add-customer">
                <Plus className="h-4 w-4 mr-2" />
                {language === "vi" ? "Thêm khách hàng" : "Add Customer"}
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
                          <TableHead>{language === "vi" ? "Địa chỉ" : "Address"}</TableHead>
                          <TableHead className="text-center">{language === "vi" ? "Loại" : "Type"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Đơn hàng" : "Orders"}</TableHead>
                          <TableHead className="text-right">{language === "vi" ? "Tổng chi tiêu" : "Total Spent"}</TableHead>
                          <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
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
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {[customer.streetAddress, customer.ward, customer.district, customer.province]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </TableCell>
                            <TableCell className="text-center">{getCustomerTypeBadge(customer.customerType, customer.isBlocked)}</TableCell>
                            <TableCell className="text-right">{customer.totalOrders}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(customer.totalSpent, language)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(customer)}
                                  data-testid={`button-edit-${customer.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => blockMutation.mutate({ id: customer.id, blocked: !customer.isBlocked })}
                                  data-testid={`button-block-${customer.id}`}
                                >
                                  {customer.isBlocked ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Ban className="h-4 w-4 text-destructive" />
                                  )}
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

      {/* Customer Detail Dialog */}
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
                {getCustomerTypeBadge(selectedCustomer.customerType, selectedCustomer.isBlocked)}
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
                      {selectedCustomer.streetAddress}
                      {selectedCustomer.ward && `, ${selectedCustomer.ward}`}
                      {selectedCustomer.district && `, ${selectedCustomer.district}`}
                      {selectedCustomer.province && `, ${selectedCustomer.province}`}
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

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => openEditDialog(selectedCustomer)} className="flex-1">
                  <Pencil className="h-4 w-4 mr-2" />
                  {t("common.edit", language)}
                </Button>
                <Button
                  variant={selectedCustomer.isBlocked ? "default" : "destructive"}
                  onClick={() => {
                    blockMutation.mutate({ id: selectedCustomer.id, blocked: !selectedCustomer.isBlocked });
                    setSelectedCustomer(null);
                  }}
                >
                  {selectedCustomer.isBlocked ? (
                    <><CheckCircle className="h-4 w-4 mr-2" />{language === "vi" ? "Bỏ chặn" : "Unblock"}</>
                  ) : (
                    <><Ban className="h-4 w-4 mr-2" />{language === "vi" ? "Chặn" : "Block"}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer 
                ? (language === "vi" ? "Cập nhật khách hàng" : "Update Customer")
                : (language === "vi" ? "Thêm khách hàng" : "Add Customer")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>{t("form.fullName", language)} *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  data-testid="input-fullname"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form.phone", language)} *</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form.email", language)}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{language === "vi" ? "Loại khách hàng" : "Customer Type"}</Label>
                <Select value={formData.customerType} onValueChange={(v) => setFormData({ ...formData, customerType: v })}>
                  <SelectTrigger data-testid="select-customer-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUEST">{language === "vi" ? "Khách" : "Guest"}</SelectItem>
                    <SelectItem value="REGISTERED">{language === "vi" ? "Đã đăng ký" : "Registered"}</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("form.province", language)}</Label>
                <Input
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  data-testid="input-province"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form.district", language)}</Label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  data-testid="input-district"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form.ward", language)}</Label>
                <Input
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  data-testid="input-ward"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Địa chỉ đường" : "Street Address"}</Label>
                <Input
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  data-testid="input-address"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel", language)}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-customer"
              >
                {t("common.save", language)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
