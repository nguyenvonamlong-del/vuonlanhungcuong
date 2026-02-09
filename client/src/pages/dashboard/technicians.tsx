import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Wrench, Star, Phone, MessageCircle, Clock, CheckCircle, UserCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Technician, InsertTechnician } from "@shared/schema";

const initialFormData = {
  fullName: "",
  phoneNumber: "",
  specialization: [] as string[],
  status: "ACTIVE",
  maxWorkload: 5,
  performanceRating: "4.0",
  userId: "",
};

type SafeUser = { id: string; username: string; fullName: string; role: string; status: string };

export default function TechniciansPage() {
  const { language } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Technician | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Technician | null>(null);

  const { data: technicians = [], isLoading } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: users = [], isError: usersError } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/technicians", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã thêm kỹ thuật viên" : "Technician added",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/technicians/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật kỹ thuật viên" : "Technician updated",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/technicians/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã xóa kỹ thuật viên" : "Technician deleted",
      });
    },
  });

  const getAvailabilityBadge = (tech: Technician) => {
    const workloadPercent = (tech.currentWorkload / tech.maxWorkload) * 100;
    if (tech.status !== "ACTIVE") {
      return <Badge variant="secondary">{language === "vi" ? "Không hoạt động" : "Inactive"}</Badge>;
    }
    if (workloadPercent >= 100) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {language === "vi" ? "Bận" : "Busy"}
      </Badge>;
    }
    if (workloadPercent >= 80) {
      return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {language === "vi" ? "Gần đầy" : "Near Full"}
      </Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      {language === "vi" ? "Sẵn sàng" : "Available"}
    </Badge>;
  };

  const filteredItems = technicians.filter((tech) => {
    const matchesSearch = tech.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.phoneNumber.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "available" && tech.status === "ACTIVE" && tech.currentWorkload < tech.maxWorkload) ||
      (statusFilter === "busy" && tech.currentWorkload >= tech.maxWorkload) ||
      tech.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalTechnicians = technicians.length;
  const activeTechnicians = technicians.filter(t => t.status === "ACTIVE").length;
  const busyTechnicians = technicians.filter(t => t.status === "ACTIVE" && t.currentWorkload >= t.maxWorkload).length;
  const availableTechnicians = technicians.filter(t => t.status === "ACTIVE" && t.currentWorkload < t.maxWorkload).length;
  const avgRating = technicians.length > 0
    ? technicians.reduce((sum, t) => sum + parseFloat(t.performanceRating || "0"), 0) / technicians.length
    : 0;
  const totalWorkload = technicians.reduce((sum, t) => sum + t.currentWorkload, 0);

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEdit = (tech: Technician) => {
    setEditingItem(tech);
    setFormData({
      fullName: tech.fullName,
      phoneNumber: tech.phoneNumber,
      specialization: tech.specialization || [],
      status: tech.status,
      maxWorkload: tech.maxWorkload,
      performanceRating: String(tech.performanceRating || "4.0"),
      userId: tech.userId || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      userId: formData.userId === "none" || formData.userId === "" ? null : formData.userId,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
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
              <h1 className="font-semibold">{t("nav.technicians", language)}</h1>
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
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Tổng số" : "Total"}</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTechnicians}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Sẵn sàng" : "Available"}</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{availableTechnicians}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Đang bận" : "Busy"}</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{busyTechnicians}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Đơn đang xử lý" : "Active Orders"}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalWorkload}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                  <CardTitle className="text-sm font-medium">{language === "vi" ? "Đánh giá TB" : "Avg Rating"}</CardTitle>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                    <SelectValue placeholder={language === "vi" ? "Trạng thái" : "Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
                    <SelectItem value="available">{language === "vi" ? "Sẵn sàng" : "Available"}</SelectItem>
                    <SelectItem value="busy">{language === "vi" ? "Đang bận" : "Busy"}</SelectItem>
                    <SelectItem value="ACTIVE">{t("catalog.active", language)}</SelectItem>
                    <SelectItem value="INACTIVE">{t("catalog.inactive", language)}</SelectItem>
                    <SelectItem value="ON_LEAVE">{language === "vi" ? "Nghỉ phép" : "On Leave"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openCreate} data-testid="button-add-technician">
                <Plus className="h-4 w-4 mr-2" />
                {t("common.add", language)}
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
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{t("common.noData", language)}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("form.fullName", language)}</TableHead>
                          <TableHead>{t("form.phone", language)}</TableHead>
                          <TableHead>{language === "vi" ? "Tình trạng" : "Availability"}</TableHead>
                          <TableHead>{language === "vi" ? "Khối lượng công việc" : "Workload"}</TableHead>
                          <TableHead className="text-center">{language === "vi" ? "Đánh giá" : "Rating"}</TableHead>
                          <TableHead>{t("catalog.status", language)}</TableHead>
                          <TableHead className="text-right">{t("catalog.actions", language)}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((tech) => {
                          const workloadPercent = (tech.currentWorkload / tech.maxWorkload) * 100;
                          return (
                            <TableRow key={tech.id} data-testid={`row-technician-${tech.id}`}>
                              <TableCell className="font-medium">{tech.fullName}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {tech.phoneNumber}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getAvailabilityBadge(tech)}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 min-w-[120px]">
                                  <div className="flex items-center justify-between text-xs">
                                    <span>{tech.currentWorkload}/{tech.maxWorkload}</span>
                                    <span className="text-muted-foreground">{Math.round(workloadPercent)}%</span>
                                  </div>
                                  <Progress 
                                    value={workloadPercent} 
                                    className={`h-2 ${workloadPercent >= 100 ? '[&>div]:bg-destructive' : workloadPercent >= 80 ? '[&>div]:bg-yellow-500' : ''}`}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{tech.performanceRating || "-"}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={tech.status} />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEdit(tech)}
                                    data-testid={`button-edit-${tech.id}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => {
                                      setDeletingItem(tech);
                                      setDeleteDialogOpen(true);
                                    }}
                                    data-testid={`button-delete-${tech.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? (language === "vi" ? "Sửa kỹ thuật viên" : "Edit Technician")
                : (language === "vi" ? "Thêm kỹ thuật viên" : "Add Technician")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("form.fullName", language)}</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                data-testid="input-fullName"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("form.phone", language)}</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
                data-testid="input-phone"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "vi" ? "Số đơn tối đa" : "Max Workload"}</Label>
                <Input
                  type="number"
                  value={formData.maxWorkload}
                  onChange={(e) => setFormData({ ...formData, maxWorkload: parseInt(e.target.value) || 5 })}
                  data-testid="input-maxWorkload"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "vi" ? "Đánh giá" : "Rating"}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.performanceRating}
                  onChange={(e) => setFormData({ ...formData, performanceRating: e.target.value })}
                  data-testid="input-rating"
                />
              </div>
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
                  <SelectItem value="ON_LEAVE">{language === "vi" ? "Nghỉ phép" : "On Leave"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!usersError && users.length > 0 && (
              <div className="space-y-2">
                <Label>{language === "vi" ? "Tài khoản người dùng" : "User Account"}</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(v) => setFormData({ ...formData, userId: v })}
                >
                  <SelectTrigger data-testid="select-userId">
                    <SelectValue placeholder={language === "vi" ? "Chọn tài khoản..." : "Select account..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{language === "vi" ? "Không liên kết" : "No link"}</SelectItem>
                    {[...users.filter(u => u.status === "ACTIVE")].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "")).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel", language)}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-technician"
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
              ? `Bạn có chắc chắn muốn xóa "${deletingItem?.fullName}"?`
              : `Are you sure you want to delete "${deletingItem?.fullName}"?`}
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
    </SidebarProvider>
  );
}
