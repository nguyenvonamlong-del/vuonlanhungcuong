import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings as SettingsIcon, Save, Percent, Flower2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SettingsPage() {
  const { language, user } = useApp();
  const { toast } = useToast();

  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const [taxEnabled, setTaxEnabled] = useState<boolean | null>(null);
  const [taxPercentage, setTaxPercentage] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState<boolean | null>(null);
  const [showWeight, setShowWeight] = useState<boolean | null>(null);

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

  if (user?.role !== "ADMIN") {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {language === "vi" ? "Chỉ quản trị viên mới có quyền truy cập" : "Admin access required"}
        </h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
        </div>
      )}
    </div>
  );
}
