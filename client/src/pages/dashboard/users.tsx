import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, UserCog, Shield, UserCheck, UserX, Users as UsersIcon, Eye, EyeOff, Link as LinkIcon } from "lucide-react";
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
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Technician } from "@shared/schema";

type SafeUser = Omit<User, "password">;

const initialFormData = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  role: "EMPLOYEE",
  status: "ACTIVE",
};

export default function UsersPage() {
  const { language } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SafeUser | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<SafeUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã thêm người dùng" : "User added",
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", language),
        description: error.message || (language === "vi" ? "Không thể thêm người dùng" : "Failed to add user"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật người dùng" : "User updated",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã xóa người dùng" : "User deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", language),
        description: error.message || (language === "vi" ? "Không thể xóa người dùng" : "Failed to delete user"),
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("common.success", language),
        description: language === "vi" ? "Đã cập nhật trạng thái" : "Status updated",
      });
    },
  });

  const getTechnicianForUser = (userId: string) => {
    return technicians.find(t => t.userId === userId);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: SafeUser) => {
    setEditingItem(user);
    setFormData({
      username: user.username,
      password: "",
      fullName: user.fullName,
      email: user.email || "",
      role: user.role,
      status: user.status,
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingItem) {
      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email || null,
        role: formData.role,
        status: formData.status,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: editingItem.id, data: updateData });
    } else {
      if (!formData.password) {
        toast({
          title: t("common.error", language),
          description: language === "vi" ? "Vui lòng nhập mật khẩu" : "Please enter password",
          variant: "destructive",
        });
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (user: SafeUser) => {
    setDeletingItem(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id);
    }
  };

  const toggleUserStatus = (user: SafeUser) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    statusMutation.mutate({ id: user.id, status: newStatus });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{language === "vi" ? "Quản trị viên" : "Admin"}</Badge>;
      case "MANAGER":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{language === "vi" ? "Quản lý" : "Manager"}</Badge>;
      default:
        return <Badge variant="secondary">{language === "vi" ? "Nhân viên" : "Employee"}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{language === "vi" ? "Hoạt động" : "Active"}</Badge>;
    }
    return <Badge variant="destructive">{language === "vi" ? "Vô hiệu" : "Inactive"}</Badge>;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "ACTIVE").length,
    admins: users.filter(u => u.role === "ADMIN").length,
    managers: users.filter(u => u.role === "MANAGER").length,
    employees: users.filter(u => u.role === "EMPLOYEE").length,
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <StaffSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-lg font-semibold">{language === "vi" ? "Quản lý người dùng" : "User Management"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">{language === "vi" ? "Tổng số" : "Total Users"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-xs text-muted-foreground">{language === "vi" ? "Đang hoạt động" : "Active"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.admins}</p>
                    <p className="text-xs text-muted-foreground">{language === "vi" ? "Quản trị viên" : "Admins"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.managers}</p>
                    <p className="text-xs text-muted-foreground">{language === "vi" ? "Quản lý" : "Managers"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.employees}</p>
                    <p className="text-xs text-muted-foreground">{language === "vi" ? "Nhân viên" : "Employees"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex flex-1 gap-4 flex-wrap">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={language === "vi" ? "Tìm người dùng..." : "Search users..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-users"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-40" data-testid="select-role-filter">
                        <SelectValue placeholder={language === "vi" ? "Vai trò" : "Role"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "vi" ? "Tất cả vai trò" : "All Roles"}</SelectItem>
                        <SelectItem value="ADMIN">{language === "vi" ? "Quản trị viên" : "Admin"}</SelectItem>
                        <SelectItem value="MANAGER">{language === "vi" ? "Quản lý" : "Manager"}</SelectItem>
                        <SelectItem value="EMPLOYEE">{language === "vi" ? "Nhân viên" : "Employee"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40" data-testid="select-status-filter">
                        <SelectValue placeholder={language === "vi" ? "Trạng thái" : "Status"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "vi" ? "Tất cả trạng thái" : "All Statuses"}</SelectItem>
                        <SelectItem value="ACTIVE">{language === "vi" ? "Hoạt động" : "Active"}</SelectItem>
                        <SelectItem value="INACTIVE">{language === "vi" ? "Vô hiệu" : "Inactive"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleOpenCreate} data-testid="button-add-user">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "vi" ? "Thêm người dùng" : "Add User"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <UsersIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                        ? (language === "vi" ? "Không tìm thấy người dùng" : "No users found")
                        : (language === "vi" ? "Chưa có người dùng" : "No users yet")}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "vi" ? "Tên đăng nhập" : "Username"}</TableHead>
                        <TableHead>{language === "vi" ? "Họ tên" : "Full Name"}</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>{language === "vi" ? "Vai trò" : "Role"}</TableHead>
                        <TableHead>{language === "vi" ? "Trạng thái" : "Status"}</TableHead>
                        <TableHead>{language === "vi" ? "Kỹ thuật viên" : "Technician"}</TableHead>
                        <TableHead className="text-right">{language === "vi" ? "Thao tác" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const linkedTech = getTechnicianForUser(user.id);
                        return (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.fullName}</TableCell>
                            <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell>
                              {linkedTech ? (
                                <div className="flex items-center gap-1">
                                  <LinkIcon className="h-3 w-3 text-green-500" />
                                  <span className="text-sm">{linkedTech.fullName}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleUserStatus(user)}
                                  title={user.status === "ACTIVE" 
                                    ? (language === "vi" ? "Vô hiệu hóa" : "Disable") 
                                    : (language === "vi" ? "Kích hoạt" : "Enable")}
                                  data-testid={`button-toggle-status-${user.id}`}
                                >
                                  {user.status === "ACTIVE" ? (
                                    <UserX className="h-4 w-4 text-orange-500" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(user)}
                                  data-testid={`button-edit-${user.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(user)}
                                  data-testid={`button-delete-${user.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? (language === "vi" ? "Chỉnh sửa người dùng" : "Edit User") 
                : (language === "vi" ? "Thêm người dùng" : "Add User")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">{language === "vi" ? "Tên đăng nhập" : "Username"} *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingItem}
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {language === "vi" ? "Mật khẩu" : "Password"} {!editingItem && "*"}
                {editingItem && <span className="text-muted-foreground text-xs ml-2">({language === "vi" ? "để trống nếu không đổi" : "leave empty to keep"})</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">{language === "vi" ? "Họ tên" : "Full Name"} *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                data-testid="input-fullname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "vi" ? "Vai trò" : "Role"}</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">{language === "vi" ? "Nhân viên" : "Employee"}</SelectItem>
                  <SelectItem value="MANAGER">{language === "vi" ? "Quản lý" : "Manager"}</SelectItem>
                  <SelectItem value="ADMIN">{language === "vi" ? "Quản trị viên" : "Admin"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "vi" ? "Trạng thái" : "Status"}</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{language === "vi" ? "Hoạt động" : "Active"}</SelectItem>
                  <SelectItem value="INACTIVE">{language === "vi" ? "Vô hiệu" : "Inactive"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.username || !formData.fullName || createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit-user"
            >
              {createMutation.isPending || updateMutation.isPending 
                ? (language === "vi" ? "Đang lưu..." : "Saving...") 
                : (editingItem ? t("common.update", language) : t("common.add", language))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "vi" ? "Xác nhận xóa" : "Confirm Delete"}</DialogTitle>
          </DialogHeader>
          <p>
            {language === "vi" 
              ? `Bạn có chắc muốn xóa người dùng "${deletingItem?.fullName}"?`
              : `Are you sure you want to delete user "${deletingItem?.fullName}"?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (language === "vi" ? "Đang xóa..." : "Deleting...") : t("common.delete", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
