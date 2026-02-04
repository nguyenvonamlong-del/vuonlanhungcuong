import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, ShoppingBag, Wrench, Building2, Calendar, Download, MessageCircle, DollarSign, Package, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { formatCurrency } from "@/lib/i18n";
import type { Order, Customer, Technician, Supplier } from "@shared/schema";

export default function ReportsPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const [timeRange, setTimeRange] = useState("30");

  const { data: orders = [], isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: customers = [], isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: technicians = [], isLoading: loadingTechnicians } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const isLoading = loadingOrders || loadingCustomers || loadingTechnicians || loadingSuppliers;

  // Filter orders by date range
  const now = new Date();
  const daysAgo = parseInt(timeRange);
  const filteredOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const orderDate = new Date(o.createdAt);
    const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= daysAgo;
  });

  // Sales metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
  const completedOrders = filteredOrders.filter(o => o.status === "COMPLETED");
  const completedRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const paidAmount = filteredOrders.reduce((sum, o) => {
    let paid = 0;
    if (o.depositPaid) paid += parseFloat(o.depositAmount || "0");
    if (o.remainingPaid) paid += parseFloat(o.remainingAmount || "0");
    return sum + paid;
  }, 0);
  const pendingPayment = totalRevenue - paidAmount;

  // Order status breakdown
  const ordersByStatus = {
    PENDING: filteredOrders.filter(o => o.status === "PENDING").length,
    CONFIRMED: filteredOrders.filter(o => o.status === "CONFIRMED").length,
    IN_PROGRESS: filteredOrders.filter(o => o.status === "IN_PROGRESS").length,
    COMPLETED: filteredOrders.filter(o => o.status === "COMPLETED").length,
    CANCELLED: filteredOrders.filter(o => o.status === "CANCELLED").length,
  };

  // Customer metrics
  const newCustomers = customers.filter(c => {
    if (!c.createdAt) return false;
    const diffDays = (now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= daysAgo;
  }).length;
  const vipCustomers = customers.filter(c => c.customerType === "VIP").length;
  const topCustomers = [...customers].sort((a, b) => parseFloat(b.totalSpent || "0") - parseFloat(a.totalSpent || "0")).slice(0, 5);

  // Technician metrics
  const activeTechnicians = technicians.filter(t => t.status === "ACTIVE").length;
  const busyTechnicians = technicians.filter(t => t.status === "ACTIVE" && t.currentWorkload >= t.maxWorkload).length;
  const totalWorkload = technicians.reduce((sum, t) => sum + t.currentWorkload, 0);
  const avgRating = technicians.length > 0 
    ? technicians.reduce((sum, t) => sum + parseFloat(t.performanceRating || "0"), 0) / technicians.length 
    : 0;

  // Supplier metrics
  const activeSuppliers = suppliers.filter(s => s.status === "ACTIVE").length;
  const avgSupplierRating = suppliers.length > 0
    ? suppliers.reduce((sum, s) => sum + parseFloat(s.rating || "0"), 0) / suppliers.length
    : 0;

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
              <h1 className="font-semibold">{language === "vi" ? "Báo cáo" : "Reports"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]" data-testid="select-time-range">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{language === "vi" ? "7 ngày" : "7 days"}</SelectItem>
                  <SelectItem value="30">{language === "vi" ? "30 ngày" : "30 days"}</SelectItem>
                  <SelectItem value="90">{language === "vi" ? "90 ngày" : "90 days"}</SelectItem>
                  <SelectItem value="365">{language === "vi" ? "1 năm" : "1 year"}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={openChatbot} data-testid="button-header-chatbot">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="sales" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="sales" className="flex items-center gap-2" data-testid="tab-sales">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">{language === "vi" ? "Doanh thu" : "Sales"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="flex items-center gap-2" data-testid="tab-orders">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="hidden sm:inline">{language === "vi" ? "Đơn hàng" : "Orders"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="flex items-center gap-2" data-testid="tab-customers">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">{language === "vi" ? "Khách hàng" : "Customers"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="technicians" className="flex items-center gap-2" data-testid="tab-technicians">
                    <Wrench className="h-4 w-4" />
                    <span className="hidden sm:inline">{language === "vi" ? "Kỹ thuật" : "Technicians"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="suppliers" className="flex items-center gap-2" data-testid="tab-suppliers">
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{language === "vi" ? "Nhà cung cấp" : "Suppliers"}</span>
                  </TabsTrigger>
                </TabsList>

                {/* Sales Tab */}
                <TabsContent value="sales" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng doanh thu" : "Total Revenue"}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue, language)}</div>
                        <p className="text-xs text-muted-foreground">
                          {language === "vi" ? `${daysAgo} ngày qua` : `Last ${daysAgo} days`}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Đã hoàn thành" : "Completed"}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(completedRevenue, language)}</div>
                        <p className="text-xs text-muted-foreground">
                          {completedOrders.length} {language === "vi" ? "đơn" : "orders"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Giá trị TB/đơn" : "Avg Order Value"}</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(avgOrderValue, language)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Chờ thanh toán" : "Pending Payment"}</CardTitle>
                        <DollarSign className="h-4 w-4 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingPayment, language)}</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === "vi" ? "Doanh thu theo trạng thái thanh toán" : "Revenue by Payment Status"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>{language === "vi" ? "Đã thanh toán" : "Paid"}</span>
                          <span className="font-bold text-green-600">{formatCurrency(paidAmount, language)}</span>
                        </div>
                        <Progress value={totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0} className="h-3" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{((paidAmount / totalRevenue) * 100 || 0).toFixed(1)}% {language === "vi" ? "đã thu" : "collected"}</span>
                          <span>{formatCurrency(pendingPayment, language)} {language === "vi" ? "còn lại" : "remaining"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-5">
                    {Object.entries(ordersByStatus).map(([status, count]) => (
                      <Card key={status}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">{status}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{count}</div>
                          <Progress 
                            value={filteredOrders.length > 0 ? (count / filteredOrders.length) * 100 : 0} 
                            className="h-2 mt-2" 
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>{language === "vi" ? "Tổng quan đơn hàng" : "Order Overview"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold">{filteredOrders.length}</div>
                          <p className="text-sm text-muted-foreground">{language === "vi" ? "Tổng đơn hàng" : "Total Orders"}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <div className="text-3xl font-bold text-green-600">{ordersByStatus.COMPLETED}</div>
                          <p className="text-sm text-muted-foreground">{language === "vi" ? "Hoàn thành" : "Completed"}</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div className="text-3xl font-bold text-red-600">{ordersByStatus.CANCELLED}</div>
                          <p className="text-sm text-muted-foreground">{language === "vi" ? "Đã hủy" : "Cancelled"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Customers Tab */}
                <TabsContent value="customers" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng khách hàng" : "Total Customers"}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{customers.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Khách mới" : "New Customers"}</CardTitle>
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">+{newCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                          {language === "vi" ? `${daysAgo} ngày qua` : `Last ${daysAgo} days`}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Khách VIP" : "VIP Customers"}</CardTitle>
                        <Badge className="bg-yellow-100 text-yellow-800">VIP</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{vipCustomers}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng doanh thu KH" : "Customer Revenue"}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || "0"), 0), language)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>{language === "vi" ? "Top 5 khách hàng" : "Top 5 Customers"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                            <TableHead>{language === "vi" ? "Loại" : "Type"}</TableHead>
                            <TableHead className="text-center">{language === "vi" ? "Đơn hàng" : "Orders"}</TableHead>
                            <TableHead className="text-right">{language === "vi" ? "Tổng chi tiêu" : "Total Spent"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topCustomers.map((customer) => (
                            <TableRow key={customer.id}>
                              <TableCell className="font-medium">{customer.fullName}</TableCell>
                              <TableCell>
                                <Badge variant={customer.customerType === "VIP" ? "default" : "secondary"}>
                                  {customer.customerType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{customer.totalOrders}</TableCell>
                              <TableCell className="text-right font-bold">
                                {formatCurrency(customer.totalSpent, language)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Technicians Tab */}
                <TabsContent value="technicians" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng số" : "Total"}</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{technicians.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Đang hoạt động" : "Active"}</CardTitle>
                        <Badge className="bg-green-100 text-green-800">{language === "vi" ? "Hoạt động" : "Active"}</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeTechnicians}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Đang bận" : "Busy"}</CardTitle>
                        <Badge variant="destructive">{language === "vi" ? "Bận" : "Busy"}</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">{busyTechnicians}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Đánh giá TB" : "Avg Rating"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>{language === "vi" ? "Phân bổ công việc" : "Workload Distribution"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                            <TableHead>{language === "vi" ? "Trạng thái" : "Status"}</TableHead>
                            <TableHead>{language === "vi" ? "Công việc" : "Workload"}</TableHead>
                            <TableHead className="text-right">{language === "vi" ? "Đánh giá" : "Rating"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {technicians.map((tech) => (
                            <TableRow key={tech.id}>
                              <TableCell className="font-medium">{tech.fullName}</TableCell>
                              <TableCell>
                                <Badge variant={tech.status === "ACTIVE" ? "default" : "secondary"}>
                                  {tech.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={(tech.currentWorkload / tech.maxWorkload) * 100} 
                                    className="w-20 h-2" 
                                  />
                                  <span className="text-sm">{tech.currentWorkload}/{tech.maxWorkload}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{tech.performanceRating || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Suppliers Tab */}
                <TabsContent value="suppliers" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng số" : "Total"}</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{suppliers.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Đang hoạt động" : "Active"}</CardTitle>
                        <Badge className="bg-green-100 text-green-800">{language === "vi" ? "Hoạt động" : "Active"}</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeSuppliers}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                        <CardTitle className="text-sm font-medium">{language === "vi" ? "Đánh giá TB" : "Avg Rating"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{avgSupplierRating.toFixed(1)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>{language === "vi" ? "Danh sách nhà cung cấp" : "Supplier List"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                            <TableHead>{language === "vi" ? "Loại" : "Type"}</TableHead>
                            <TableHead>{language === "vi" ? "Trạng thái" : "Status"}</TableHead>
                            <TableHead className="text-right">{language === "vi" ? "Đánh giá" : "Rating"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {suppliers.map((supplier) => (
                            <TableRow key={supplier.id}>
                              <TableCell className="font-medium">{supplier.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{supplier.supplierType}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={supplier.status === "ACTIVE" ? "default" : "secondary"}>
                                  {supplier.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{supplier.rating || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
