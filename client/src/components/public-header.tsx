import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, MessageCircle } from "lucide-react";
import { Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useChatbot } from "@/context/ChatbotContext";

export function PublicHeader() {
  const { language, cart, cartCount, cartTotal, removeFromCart, updateCartQuantity, clearCart } = useApp();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openChatbot } = useChatbot();

  const navLinks = [
    { href: "/", label: t("nav.home", language) },
    { href: "/shop", label: t("nav.shop", language) },
    { href: "/checkout", label: t("checkout.title", language) },
    { href: "/tracking", label: t("nav.trackOrder", language) },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/assets/logo.png" alt="Hùng Cường" className="h-10 w-10 rounded-lg object-contain" />
          <span className="hidden font-semibold text-lg sm:inline-block">
            {t("landing.heroTitle", language)}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={location === link.href ? "secondary" : "ghost"}
                size="sm"
                data-testid={`link-nav-${link.href.replace("/", "") || "home"}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
          <Link href="/login">
            <Button variant="ghost" size="sm" data-testid="link-login">
              {t("nav.login", language)}
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle>{t("shop.cart", language)}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto py-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t("shop.emptyCart", language)}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.pot.id} className="flex gap-3 p-3 rounded-lg bg-card border">
                        {item.pot.images?.[0] ? (
                          <img
                            src={item.pot.images[0]}
                            alt={language === "vi" ? item.pot.nameVi : item.pot.nameEn}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            <Flower2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {language === "vi" ? item.pot.nameVi : item.pot.nameEn}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.pot.price, language)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartQuantity(item.pot.id, item.quantity - 1)}
                              data-testid={`button-decrease-${item.pot.id}`}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartQuantity(item.pot.id, item.quantity + 1)}
                              data-testid={`button-increase-${item.pot.id}`}
                            >
                              +
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-auto text-destructive"
                              onClick={() => removeFromCart(item.pot.id)}
                              data-testid={`button-remove-${item.pot.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>{t("checkout.total", language)}</span>
                    <span>{formatCurrency(cartTotal, language)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={clearCart}
                      data-testid="button-clear-cart"
                    >
                      {t("common.cancel", language)}
                    </Button>
                    <Link href="/checkout?mode=premade" className="flex-1">
                      <Button className="w-full" data-testid="button-checkout">
                        {t("shop.checkout", language)}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            onClick={openChatbot}
            data-testid="button-header-chatbot"
            title={language === "vi" ? "Trợ lý chat" : "Chat assistant"}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <LanguageToggle />
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto py-4 px-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <Link href="/login">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.login", language)}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
