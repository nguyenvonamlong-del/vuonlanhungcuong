import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Loader2, Settings as SettingsIcon, Save, Percent, Flower2, MessageCircle, Bell, Mail, Phone, MessageSquare, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { NotificationChannel } from "@shared/schema";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SettingsPage() {
  const { language, user } = useApp();
  const { openChatbot } = useChatbot();
  const { toast } = useToast();

  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const { data: notificationChannels = [], isLoading: loadingChannels } = useQuery<NotificationChannel[]>({
    queryKey: ["/api/notification-channels"],
  });

  const [taxEnabled, setTaxEnabled] = useState<boolean | null>(null);
  const [taxPercentage, setTaxPercentage] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState<boolean | null>(null);
  const [showWeight, setShowWeight] = useState<boolean | null>(null);

  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [channelForm, setChannelForm] = useState({
    nameVi: "",
    nameEn: "",
    type: "EMAIL" as string,
    descriptionVi: "",
    descriptionEn: "",
    status: "ACTIVE" as string,
  });

  const effectiveTaxEnabled = taxEnabled !== null ? taxEnabled : settings.tax_enabled === "true";
  const effectiveTaxPercentage = taxPercentage !== null ? taxPercentage : (settings.tax_percentage || "10");
  const effectiveShowDimensions = showDimensions !== null ? showDimensions : settings.show_premade_dimensions !== "false";
  const effectiveShowWeight = showWeight !== null ? showWeight : settings.show_premade_weight !== "false";

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest("PUT", `/api/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: language === "vi" ? "Đã lưu cài đặt" : "Settings saved",
        description: language === "vi" ? "Cài đặt đã được cập nhật thành công" : "Settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể lưu cài đặt" : "Could not save settings",
        variant: "destructive",
      });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: typeof channelForm) => {
      return apiRequest("POST", "/api/notification-channels", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-channels"] });
      setChannelDialogOpen(false);
      resetChannelForm();
      toast({
        title: language === "vi" ? "Đã tạo kênh" : "Channel created",
        description: language === "vi" ? "Kênh thông báo đã được tạo thành công" : "Notification channel created successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể tạo kênh" : "Could not create channel",
        variant: "destructive",
      });
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof channelForm }) => {
      return apiRequest("PUT", `/api/notification-channels/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-channels"] });
      setChannelDialogOpen(false);
      setEditingChannel(null);
      resetChannelForm();
      toast({
        title: language === "vi" ? "Đã cập nhật" : "Channel updated",
        description: language === "vi" ? "Kênh thông báo đã được cập nhật" : "Notification channel updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể cập nhật kênh" : "Could not update channel",
        variant: "destructive",
      });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/notification-channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-channels"] });
      toast({
        title: language === "vi" ? "Đã xóa" : "Channel deleted",
        description: language === "vi" ? "Kênh thông báo đã được xóa" : "Notification channel deleted",
      });
    },
    onError: () => {
      toast({
        title: language === "vi" ? "Lỗi" : "Error",
        description: language === "vi" ? "Không thể xóa kênh" : "Could not delete channel",
        variant: "destructive",
      });
    },
  });

  const resetChannelForm = () => {
    setChannelForm({
      nameVi: "",
      nameEn: "",
      type: "EMAIL",
      descriptionVi: "",
      descriptionEn: "",
      status: "ACTIVE",
    });
  };

  const openAddChannel = () => {
    setEditingChannel(null);
    resetChannelForm();
    setChannelDialogOpen(true);
  };

  const openEditChannel = (channel: NotificationChannel) => {
    setEditingChannel(channel);
    setChannelForm({
      nameVi: channel.nameVi,
      nameEn: channel.nameEn,
      type: channel.type,
      descriptionVi: channel.descriptionVi || "",
      descriptionEn: channel.descriptionEn || "",
      status: channel.status,
    });
    setChannelDialogOpen(true);
  };

  const handleSaveChannel = () => {
    if (editingChannel) {
      updateChannelMutation.mutate({ id: editingChannel.id, data: channelForm });
    } else {
      createChannelMutation.mutate(channelForm);
    }
  };

  const toggleChannelStatus = (channel: NotificationChannel) => {
    const newStatus = channel.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateChannelMutation.mutate({
      id: channel.id,
      data: {
        nameVi: channel.nameVi,
        nameEn: channel.nameEn,
        type: channel.type,
        descriptionVi: channel.descriptionVi || "",
        descriptionEn: channel.descriptionEn || "",
        status: newStatus,
      },
    });
  };

  const handleSave = async () => {
    if (taxEnabled !== null) {
      await updateSettingMutation.mutateAsync({ key: "tax_enabled", value: String(effectiveTaxEnabled) });
    }
    if (taxPercentage !== null) {
      await updateSettingMutation.mutateAsync({ key: "tax_percentage", value: effectiveTaxPercentage });
    }
    if (showDimensions !== null) {
      await updateSettingMutation.mutateAsync({ key: "show_premade_dimensions", value: String(effectiveShowDimensions) });
    }
    if (showWeight !== null) {
      await updateSettingMutation.mutateAsync({ key: "show_premade_weight", value: String(effectiveShowWeight) });
    }
    setTaxEnabled(null);
    setTaxPercentage(null);
    setShowDimensions(null);
    setShowWeight(null);
  };

  const hasChanges = taxEnabled !== null || taxPercentage !== null || showDimensions !== null || showWeight !== null;

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (user?.role !== "ADMIN") {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <StaffSidebar />
          <SidebarInset className="flex-1">
            <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-2">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h1 className="text-lg font-semibold">{language === "vi" ? "Cài đặt" : "Settings"}</h1>
              </div>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </header>
            <main className="p-8 text-center">
              <h2 className="text-xl font-semibold text-muted-foreground">
                {language === "vi" ? "Chỉ quản trị viên mới có quyền truy cập" : "Admin access required"}
              </h2>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <StaffSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-lg font-semibold">{language === "vi" ? "Cài đặt" : "Settings"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={openChatbot}
                data-testid="button-open-chatbot"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6" />
              <h1 className="text-2xl font-bold">
                {language === "vi" ? "Cài đặt hệ thống" : "System Settings"}
              </h1>
            </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                {language === "vi" ? "Cài đặt thuế" : "Tax Settings"}
              </CardTitle>
              <CardDescription>
                {language === "vi"
                  ? "Cấu hình thuế áp dụng cho đơn hàng"
                  : "Configure tax applied to orders"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="taxEnabled" className="text-base">
                    {language === "vi" ? "Bật thuế" : "Enable Tax"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "vi"
                      ? "Khi bật, thuế sẽ được tính trên mỗi đơn hàng"
                      : "When enabled, tax will be calculated on each order"}
                  </p>
                </div>
                <Switch
                  id="taxEnabled"
                  checked={effectiveTaxEnabled}
                  onCheckedChange={(checked) => setTaxEnabled(checked)}
                  data-testid="switch-tax-enabled"
                />
              </div>

              {effectiveTaxEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="taxPercentage">
                    {language === "vi" ? "Tỷ lệ thuế (%)" : "Tax Rate (%)"}
                  </Label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <Input
                      id="taxPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={effectiveTaxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      data-testid="input-tax-percentage"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "vi"
                      ? "Thuế được tính dựa trên tổng phụ + phí vận chuyển"
                      : "Tax is calculated on subtotal + shipping cost"}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateSettingMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {updateSettingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {language === "vi" ? "Lưu thay đổi" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flower2 className="h-5 w-5" />
                {language === "vi" ? "Hiển thị chậu có sẵn" : "Premade Pot Display"}
              </CardTitle>
              <CardDescription>
                {language === "vi"
                  ? "Cấu hình thông tin hiển thị cho chậu có sẵn"
                  : "Configure display information for premade pots"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showDimensions" className="text-base">
                    {language === "vi" ? "Hiển thị kích thước" : "Show Dimensions"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "vi"
                      ? "Hiển thị kích thước (D×R×C) trong chi tiết chậu"
                      : "Show dimensions (L×W×H) in pot details"}
                  </p>
                </div>
                <Switch
                  id="showDimensions"
                  checked={effectiveShowDimensions}
                  onCheckedChange={(checked) => setShowDimensions(checked)}
                  data-testid="switch-show-dimensions"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showWeight" className="text-base">
                    {language === "vi" ? "Hiển thị cân nặng" : "Show Weight"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "vi"
                      ? "Hiển thị cân nặng trong chi tiết chậu"
                      : "Show weight in pot details"}
                  </p>
                </div>
                <Switch
                  id="showWeight"
                  checked={effectiveShowWeight}
                  onCheckedChange={(checked) => setShowWeight(checked)}
                  data-testid="switch-show-weight"
                />
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateSettingMutation.isPending}
                  data-testid="button-save-display-settings"
                >
                  {updateSettingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {language === "vi" ? "Lưu thay đổi" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {language === "vi" ? "Kênh thông báo" : "Notification Channels"}
                </CardTitle>
                <CardDescription>
                  {language === "vi"
                    ? "Cấu hình các kênh gửi thông báo đến khách hàng"
                    : "Configure notification channels for customer communication"}
                </CardDescription>
              </div>
              <Button onClick={openAddChannel} data-testid="button-add-channel">
                <Plus className="h-4 w-4 mr-2" />
                {language === "vi" ? "Thêm kênh" : "Add Channel"}
              </Button>
            </CardHeader>
            <CardContent>
              {loadingChannels ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : notificationChannels.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {language === "vi" ? "Chưa có kênh thông báo" : "No notification channels configured"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "vi" ? "Loại" : "Type"}</TableHead>
                      <TableHead>{language === "vi" ? "Tên" : "Name"}</TableHead>
                      <TableHead>{language === "vi" ? "Mô tả" : "Description"}</TableHead>
                      <TableHead>{language === "vi" ? "Trạng thái" : "Status"}</TableHead>
                      <TableHead className="text-right">{language === "vi" ? "Hành động" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notificationChannels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {channel.type === "EMAIL" && <Mail className="h-4 w-4" />}
                            {channel.type === "SMS" && <Phone className="h-4 w-4" />}
                            {channel.type === "VOICEMAIL" && <Phone className="h-4 w-4" />}
                            {channel.type === "ZALO" && <MessageSquare className="h-4 w-4" />}
                            <span>{channel.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {language === "vi" ? channel.nameVi : channel.nameEn}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {language === "vi" ? channel.descriptionVi : channel.descriptionEn}
                        </TableCell>
                        <TableCell>
                          <Badge variant={channel.status === "ACTIVE" ? "default" : "secondary"}>
                            {channel.status === "ACTIVE" 
                              ? (language === "vi" ? "Hoạt động" : "Active") 
                              : (language === "vi" ? "Tắt" : "Inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleChannelStatus(channel)}
                              data-testid={`button-toggle-channel-${channel.id}`}
                            >
                              <Switch
                                checked={channel.status === "ACTIVE"}
                                onCheckedChange={() => toggleChannelStatus(channel)}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditChannel(channel)}
                              data-testid={`button-edit-channel-${channel.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteChannelMutation.mutate(channel.id)}
                              data-testid={`button-delete-channel-${channel.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingChannel
                    ? (language === "vi" ? "Chỉnh sửa kênh" : "Edit Channel")
                    : (language === "vi" ? "Thêm kênh mới" : "Add New Channel")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Loại kênh" : "Channel Type"}</Label>
                  <Select
                    value={channelForm.type}
                    onValueChange={(value) => setChannelForm({ ...channelForm, type: value })}
                  >
                    <SelectTrigger data-testid="select-channel-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
                      <SelectItem value="ZALO">Zalo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "vi" ? "Tên (Tiếng Việt)" : "Name (Vietnamese)"}</Label>
                    <Input
                      value={channelForm.nameVi}
                      onChange={(e) => setChannelForm({ ...channelForm, nameVi: e.target.value })}
                      data-testid="input-channel-name-vi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "vi" ? "Tên (Tiếng Anh)" : "Name (English)"}</Label>
                    <Input
                      value={channelForm.nameEn}
                      onChange={(e) => setChannelForm({ ...channelForm, nameEn: e.target.value })}
                      data-testid="input-channel-name-en"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "vi" ? "Mô tả (Tiếng Việt)" : "Description (Vietnamese)"}</Label>
                    <Textarea
                      value={channelForm.descriptionVi}
                      onChange={(e) => setChannelForm({ ...channelForm, descriptionVi: e.target.value })}
                      data-testid="input-channel-desc-vi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "vi" ? "Mô tả (Tiếng Anh)" : "Description (English)"}</Label>
                    <Textarea
                      value={channelForm.descriptionEn}
                      onChange={(e) => setChannelForm({ ...channelForm, descriptionEn: e.target.value })}
                      data-testid="input-channel-desc-en"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "vi" ? "Trạng thái" : "Status"}</Label>
                  <Select
                    value={channelForm.status}
                    onValueChange={(value) => setChannelForm({ ...channelForm, status: value })}
                  >
                    <SelectTrigger data-testid="select-channel-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{language === "vi" ? "Hoạt động" : "Active"}</SelectItem>
                      <SelectItem value="INACTIVE">{language === "vi" ? "Tắt" : "Inactive"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setChannelDialogOpen(false)}>
                  {language === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button
                  onClick={handleSaveChannel}
                  disabled={!channelForm.nameVi || !channelForm.nameEn || createChannelMutation.isPending || updateChannelMutation.isPending}
                  data-testid="button-save-channel"
                >
                  {(createChannelMutation.isPending || updateChannelMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {language === "vi" ? "Lưu" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
