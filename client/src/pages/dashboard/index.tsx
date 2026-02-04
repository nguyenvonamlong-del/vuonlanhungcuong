import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Flower2,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { t, formatCurrency } from "@/lib/i18n";
import type { DashboardStats, Order } from "@shared/schema";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label } from "recharts";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend !== undefined && (
          <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
            <ArrowUpRight className={`h-3 w-3 mr-1 ${trend < 0 ? "rotate-90" : ""}`} />
            {Math.abs(trend)}% vs last week
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const COLORS = ["#f59e0b", "#3b82f6", "#9333ea", "#06b6d4", "#f97316", "#22c55e", "#ef4444"];

export default function DashboardPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

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
              <h1 className="font-semibold">{t("dashboard.title", language)}</h1>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <StatCard
                    title={t("dashboard.totalRevenue", language)}
                    value={formatCurrency(stats?.totalRevenue || 0, language)}
                    icon={DollarSign}
                    trend={12}
                  />
                  <StatCard
                    title={t("dashboard.totalOrders", language)}
                    value={stats?.totalOrders || 0}
                    icon={ShoppingBag}
                    trend={8}
                  />
                  <StatCard
                    title={t("dashboard.activeTechnicians", language)}
                    value={stats?.activeTechnicians || 0}
                    icon={Users}
                  />
                  <StatCard
                    title={t("dashboard.lowStock", language)}
                    value={stats?.lowStockItems || 0}
                    icon={AlertTriangle}
                    description={language === "vi" ? "Cần nhập thêm hàng" : "Need restocking"}
                  />
                </>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t("dashboard.revenueChart", language)}</CardTitle>
                  <CardDescription>
                    {language === "vi" ? "Doanh thu trong 7 ngày qua" : "Revenue over the past 7 days"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.revenueByDay || []}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                    <p className="text-sm font-medium">{payload[0].payload.date}</p>
                                    <p className="text-sm text-primary">{formatCurrency(payload[0].value as number, language)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#9333ea"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.ordersByStatus", language)}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.ordersByStatus || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="count"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                              if (value === 0) return null;
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill="white"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fontSize={12}
                                  fontWeight="bold"
                                >
                                  {value}
                                </text>
                              );
                            }}
                            labelLine={false}
                          >
                            {(stats?.ordersByStatus || []).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                    <p className="text-sm font-medium">{t(`status.${data.status}`, language)}</p>
                                    <p className="text-sm text-muted-foreground">{data.count} {language === "vi" ? "đơn" : "orders"}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {(stats?.ordersByStatus || []).map((item, index) => (
                          <div key={item.status} className="flex items-center gap-1 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span>{t(`status.${item.status}`, language)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.recentOrders", language)}</CardTitle>
                  <CardDescription>
                    {language === "vi" ? "5 đơn hàng mới nhất" : "Latest 5 orders"}
                  </CardDescription>
                </div>
                <Link href="/dashboard/orders">
                  <Button variant="outline" size="sm" data-testid="link-view-all-orders">
                    {language === "vi" ? "Xem tất cả" : "View All"}
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (stats?.recentOrders?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Flower2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t("orders.noOrders", language)}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {stats?.recentOrders?.map((order: Order) => (
                      <div key={order.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{order.orderNumber}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatCurrency(order.totalAmount, language)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt!).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
