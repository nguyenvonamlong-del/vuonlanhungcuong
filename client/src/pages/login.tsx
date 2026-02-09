import { useState } from "react";
import { Link } from "wouter";
import { Flower2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { apiRequest } from "@/lib/queryClient";

export default function LoginPage() {
  const { language, setUser } = useApp();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const user = await response.json();
      
      if (user.id) {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        toast({
          title: t("common.success", language),
          description: language === "vi" ? "Đăng nhập thành công!" : "Login successful!",
        });
        window.location.href = "/dashboard";
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      toast({
        title: t("common.error", language),
        description: t("login.error", language),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orchid-100 via-orchid-50 to-background dark:from-orchid-900/20 dark:via-orchid-800/10 dark:to-background p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src="/assets/logo.png" alt="Hùng Cường" className="h-16 w-16 rounded-xl object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t("login.title", language)}</CardTitle>
            <CardDescription>
              {language === "vi"
                ? "Đăng nhập để quản lý cửa hàng"
                : "Sign in to manage your store"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("login.username", language)}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === "vi" ? "Nhập tên đăng nhập" : "Enter username"}
                required
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password", language)}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === "vi" ? "Nhập mật khẩu" : "Enter password"}
                required
                data-testid="input-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading", language)}
                </>
              ) : (
                t("login.submit", language)
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground mb-2">
              {language === "vi" ? "Tài khoản demo:" : "Demo accounts:"}
            </p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Admin:</span> admin / Admin123456</p>
              <p><span className="font-medium">Manager:</span> manager / manager123</p>
              <p><span className="font-medium">Employee:</span> employee / employee123</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground" data-testid="link-back-home">
                {language === "vi" ? "← Quay lại trang chủ" : "← Back to Homepage"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
