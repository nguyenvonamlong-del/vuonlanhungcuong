import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, SlidersHorizontal, Flower2, ShoppingCart, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PublicHeader } from "@/components/public-header";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import type { PremadePot } from "@shared/schema";

export default function ShopPage() {
  const { language, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedPot, setSelectedPot] = useState<PremadePot | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: pots, isLoading } = useQuery<PremadePot[]>({
    queryKey: ["/api/shop/pots"],
  });

  const filteredPots = (pots || [])
    .filter((pot) => {
      const name = language === "vi" ? pot.nameVi : pot.nameEn;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSize = sizeFilter === "all" || pot.potSize === sizeFilter;
      const matchesDifficulty = difficultyFilter === "all" || pot.difficultyLevel === difficultyFilter;
      return matchesSearch && matchesSize && matchesDifficulty;
    })
    .sort((a, b) => {
      if (sortBy === "featured") {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      }
      if (sortBy === "price-low") {
        return parseFloat(a.price as string) - parseFloat(b.price as string);
      }
      if (sortBy === "price-high") {
        return parseFloat(b.price as string) - parseFloat(a.price as string);
      }
      return 0;
    });

  const handleAddToCart = (pot: PremadePot) => {
    addToCart(pot, 1);
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("shop.size", language)}</label>
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger data-testid="select-size-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
            <SelectItem value="SMALL">{t("shop.small", language)}</SelectItem>
            <SelectItem value="MEDIUM">{t("shop.medium", language)}</SelectItem>
            <SelectItem value="LARGE">{t("shop.large", language)}</SelectItem>
            <SelectItem value="XLARGE">{t("shop.xlarge", language)}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("shop.difficulty", language)}</label>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger data-testid="select-difficulty-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "vi" ? "Tất cả" : "All"}</SelectItem>
            <SelectItem value="EASY">{t("shop.easy", language)}</SelectItem>
            <SelectItem value="MEDIUM">{t("shop.medium", language)}</SelectItem>
            <SelectItem value="HARD">{t("shop.hard", language)}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSizeFilter("all");
          setDifficultyFilter("all");
        }}
        data-testid="button-clear-filters"
      >
        {language === "vi" ? "Xóa bộ lọc" : "Clear Filters"}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="hidden md:block w-64 shrink-0">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t("shop.filter", language)}
                </h3>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("shop.search", language) + "..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <SelectValue placeholder={t("shop.sortBy", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">{t("shop.featured", language)}</SelectItem>
                    <SelectItem value="price-low">{t("shop.priceLowHigh", language)}</SelectItem>
                    <SelectItem value="price-high">{t("shop.priceHighLow", language)}</SelectItem>
                  </SelectContent>
                </Select>

                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden" data-testid="button-mobile-filter">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>{t("shop.filter", language)}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="aspect-[4/3] rounded-t-lg" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPots.length === 0 ? (
              <div className="text-center py-16">
                <Flower2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{t("common.noData", language)}</h3>
                <p className="text-muted-foreground">
                  {language === "vi" ? "Không tìm thấy sản phẩm phù hợp" : "No products found matching your criteria"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPots.map((pot) => (
                  <Card key={pot.id} className="group hover-elevate overflow-hidden" data-testid={`card-product-${pot.id}`}>
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      {pot.images?.[0] ? (
                        <img
                          src={pot.images[0]}
                          alt={language === "vi" ? pot.nameVi : pot.nameEn}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Flower2 className="h-16 w-16 text-muted-foreground opacity-50" />
                        </div>
                      )}
                      {pot.featured && (
                        <Badge className="absolute top-3 left-3 gap-1">
                          <Star className="h-3 w-3" />
                          {t("shop.featured", language)}
                        </Badge>
                      )}
                      {pot.stockQuantity <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="destructive">{t("shop.outOfStock", language)}</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {language === "vi" ? pot.nameVi : pot.nameEn}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {language === "vi" ? pot.descriptionVi : pot.descriptionEn}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={pot.potSize} />
                        <StatusBadge status={pot.difficultyLevel} />
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(pot.price, language)}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedPot(pot)}
                        data-testid={`button-view-${pot.id}`}
                      >
                        {t("shop.viewDetails", language)}
                      </Button>
                      <Button
                        className="w-full gap-2"
                        disabled={pot.stockQuantity <= 0}
                        onClick={() => handleAddToCart(pot)}
                        data-testid={`button-add-cart-${pot.id}`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {t("shop.addToCart", language)}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Dialog open={!!selectedPot} onOpenChange={(open) => !open && setSelectedPot(null)}>
        <DialogContent className="max-w-2xl">
          {selectedPot && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {language === "vi" ? selectedPot.nameVi : selectedPot.nameEn}
                </DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {selectedPot.images?.[0] ? (
                    <img
                      src={selectedPot.images[0]}
                      alt={language === "vi" ? selectedPot.nameVi : selectedPot.nameEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Flower2 className="h-24 w-24 text-muted-foreground opacity-50" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedPot.price, language)}
                  </div>
                  <p className="text-muted-foreground">
                    {language === "vi" ? selectedPot.descriptionVi : selectedPot.descriptionEn}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("shop.size", language)}:</span>
                      <StatusBadge status={selectedPot.potSize} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("shop.difficulty", language)}:</span>
                      <StatusBadge status={selectedPot.difficultyLevel} />
                    </div>
                    {selectedPot.heightCm && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{language === "vi" ? "Chiều cao" : "Height"}:</span>
                        <span className="text-sm">{selectedPot.heightCm} cm</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{language === "vi" ? "Còn lại" : "Stock"}:</span>
                      <span className="text-sm">{selectedPot.stockQuantity} {language === "vi" ? "chậu" : "pots"}</span>
                    </div>
                  </div>
                  {(language === "vi" ? selectedPot.careInstructionsVi : selectedPot.careInstructionsEn) && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">
                        {language === "vi" ? "Hướng dẫn chăm sóc" : "Care Instructions"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {language === "vi" ? selectedPot.careInstructionsVi : selectedPot.careInstructionsEn}
                      </p>
                    </div>
                  )}
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    disabled={selectedPot.stockQuantity <= 0}
                    onClick={() => {
                      handleAddToCart(selectedPot);
                      setSelectedPot(null);
                    }}
                    data-testid="button-add-cart-modal"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {t("shop.addToCart", language)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
