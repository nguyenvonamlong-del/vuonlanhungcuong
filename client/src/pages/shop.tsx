import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, SlidersHorizontal, Flower2, ShoppingCart, Star, X, ChevronLeft, ChevronRight, Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicHeader } from "@/components/public-header";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import type { PremadePot, PremadeOrchidItem, PremadeDecorationItem, CatalogItem, PotType, DecorationType } from "@shared/schema";

type ExtendedPremadePot = PremadePot & {
  orchidComposition?: PremadeOrchidItem[];
  potTypeName?: string;
  decorations?: PremadeDecorationItem[];
  lengthCm?: number;
  widthCm?: number;
  weightKg?: string;
};

function MediaGallery({
  images,
  videos,
  alt,
  externalIndex,
  onIndexChange,
}: {
  images?: string[] | null;
  videos?: string[] | null;
  alt: string;
  externalIndex?: number;
  onIndexChange?: (idx: number) => void;
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = externalIndex ?? internalIndex;
  const setCurrentIndex = (idx: number) => {
    setInternalIndex(idx);
    onIndexChange?.(idx);
  };
  const videoRef = useRef<HTMLVideoElement>(null);

  const allMedia: { type: "image" | "video"; url: string }[] = [];
  if (images) {
    for (const url of images) {
      allMedia.push({ type: "image", url });
    }
  }
  if (videos) {
    for (const url of videos) {
      allMedia.push({ type: "video", url });
    }
  }

  if (allMedia.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Flower2 className="h-24 w-24 text-muted-foreground opacity-50" />
      </div>
    );
  }

  const current = allMedia[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

  return (
    <div className="relative w-full h-full">
      {current.type === "image" ? (
        <img src={current.url} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          src={current.url}
          className="w-full h-full object-cover"
          controls
          playsInline
        />
      )}
      {allMedia.length > 1 && (
        <>
          {hasPrev && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-80"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(currentIndex - 1); }}
              data-testid="button-media-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {hasNext && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(currentIndex + 1); }}
              data-testid="button-media-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allMedia.map((media, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? "bg-white" : "bg-white/50"}`}
                data-testid={`button-media-dot-${idx}`}
              />
            ))}
          </div>
          {current.type === "video" && (
            <Badge variant="secondary" className="absolute top-2 right-2 gap-1 text-xs">
              <Play className="h-3 w-3" />
              Video
            </Badge>
          )}
        </>
      )}
      {allMedia.length > 1 && (
        <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
          {currentIndex + 1}/{allMedia.length}
        </Badge>
      )}
    </div>
  );
}

function MultiSelectFilter({
  label,
  options,
  selectedIds,
  onToggle,
  language,
  testIdPrefix,
  inline = false,
}: {
  label: string;
  options: { id: string; name: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  language: string;
  testIdPrefix: string;
  inline?: boolean;
}) {
  const content = (
    <div className="max-h-48 overflow-y-auto space-y-0.5">
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">{language === "vi" ? "Không có dữ liệu" : "No data"}</p>
      ) : (
        options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover-elevate"
            data-testid={`${testIdPrefix}-${opt.id}`}
          >
            <Checkbox
              checked={selectedIds.includes(opt.id)}
              onCheckedChange={() => onToggle(opt.id)}
              data-testid={`${testIdPrefix}-check-${opt.id}`}
            />
            <span className="text-sm truncate">{opt.name}</span>
          </label>
        ))
      )}
    </div>
  );

  if (inline) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="border rounded-md p-2">
          {content}
        </div>
        {selectedIds.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {selectedIds.length} {language === "vi" ? "đã chọn" : "selected"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-sm font-normal"
            data-testid={`${testIdPrefix}-trigger`}
          >
            <span className="truncate">
              {selectedIds.length === 0
                ? (language === "vi" ? "Chọn..." : "Select...")
                : `${selectedIds.length} ${language === "vi" ? "đã chọn" : "selected"}`}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-2" align="start">
          {content}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function ShopPage() {
  const { language, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [orchidFilter, setOrchidFilter] = useState<string[]>([]);
  const [potTypeFilter, setPotTypeFilter] = useState<string[]>([]);
  const [decorationFilter, setDecorationFilter] = useState<string[]>([]);
  const [selectedPot, setSelectedPot] = useState<ExtendedPremadePot | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: pots, isLoading } = useQuery<ExtendedPremadePot[]>({
    queryKey: ["/api/shop/pots"],
  });

  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog"],
  });

  const { data: potTypesData = [] } = useQuery<PotType[]>({
    queryKey: ["/api/pot-types"],
  });

  const { data: decorationTypesData = [] } = useQuery<DecorationType[]>({
    queryKey: ["/api/decoration-types"],
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const showDimensions = settings.show_premade_dimensions !== "false";
  const showWeight = settings.show_premade_weight !== "false";

  const activeOrchids = catalogItems.filter(c => c.status === "ACTIVE");
  const activePotTypes = potTypesData.filter(p => p.status === "ACTIVE");
  const activeDecorations = decorationTypesData.filter(d => d.status === "ACTIVE");

  const orchidOptions = activeOrchids.map(c => ({
    id: c.id,
    name: language === "vi" ? c.speciesNameVi : c.speciesNameEn,
  }));

  const potTypeOptions = activePotTypes.map(p => ({
    id: p.id,
    name: language === "vi" ? p.nameVi : p.nameEn,
  }));

  const decorationOptions = activeDecorations.map(d => ({
    id: d.id,
    name: language === "vi" ? d.nameVi : d.nameEn,
  }));

  const toggleFilter = (list: string[], setList: (v: string[]) => void, id: string) => {
    if (list.includes(id)) {
      setList(list.filter(v => v !== id));
    } else {
      setList([...list, id]);
    }
  };

  const hasActiveFilters = orchidFilter.length > 0 || potTypeFilter.length > 0 || decorationFilter.length > 0;

  const filteredPots = (pots || [])
    .filter((pot) => {
      const name = language === "vi" ? pot.nameVi : pot.nameEn;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOrchid = orchidFilter.length === 0 || orchidFilter.some(filterId =>
        pot.orchidComposition?.some(o => o.catalogItemId === filterId) ||
        pot.tags?.includes(`orchid:${filterId}`)
      );

      const matchesPotType = potTypeFilter.length === 0 || potTypeFilter.some(filterId =>
        pot.potTypeId === filterId ||
        pot.tags?.includes(`pot:${filterId}`)
      );

      const matchesDecoration = decorationFilter.length === 0 || decorationFilter.some(filterId =>
        pot.decorations?.some(d => d.decorationTypeId === filterId) ||
        pot.tags?.includes(`decoration:${filterId}`)
      );

      return matchesSearch && matchesOrchid && matchesPotType && matchesDecoration;
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

  const clearAllFilters = () => {
    setOrchidFilter([]);
    setPotTypeFilter([]);
    setDecorationFilter([]);
  };

  const FilterContent = ({ inline = false }: { inline?: boolean }) => (
    <div className="space-y-4">
      <MultiSelectFilter
        label={language === "vi" ? "Loại lan" : "Orchid Types"}
        options={orchidOptions}
        selectedIds={orchidFilter}
        onToggle={(id) => toggleFilter(orchidFilter, setOrchidFilter, id)}
        language={language}
        testIdPrefix="filter-orchid"
        inline={inline}
      />
      <MultiSelectFilter
        label={language === "vi" ? "Loại chậu" : "Pot Types"}
        options={potTypeOptions}
        selectedIds={potTypeFilter}
        onToggle={(id) => toggleFilter(potTypeFilter, setPotTypeFilter, id)}
        language={language}
        testIdPrefix="filter-pot-type"
        inline={inline}
      />
      <MultiSelectFilter
        label={language === "vi" ? "Trang trí" : "Decoration Types"}
        options={decorationOptions}
        selectedIds={decorationFilter}
        onToggle={(id) => toggleFilter(decorationFilter, setDecorationFilter, id)}
        language={language}
        testIdPrefix="filter-decoration"
        inline={inline}
      />
      <Button
        variant="outline"
        className="w-full"
        onClick={clearAllFilters}
        disabled={!hasActiveFilters}
        data-testid="button-clear-filters"
      >
        {language === "vi" ? "Xóa bộ lọc" : "Clear Filters"}
      </Button>
    </div>
  );

  const getCatalogName = (catalogItemId: string | undefined) => {
    if (!catalogItemId) return null;
    const item = catalogItems.find(c => c.id === catalogItemId);
    if (!item) return null;
    return language === "vi" ? item.speciesNameVi : item.speciesNameEn;
  };

  const getPotTypeName = (potTypeId: string | null | undefined, potTypeName: string | null | undefined) => {
    if (potTypeId) {
      const pt = potTypesData.find(p => p.id === potTypeId);
      if (pt) return language === "vi" ? pt.nameVi : pt.nameEn;
    }
    return potTypeName || null;
  };

  const getDecorationName = (dec: PremadeDecorationItem) => {
    if (dec.decorationTypeId) {
      const dt = decorationTypesData.find(d => d.id === dec.decorationTypeId);
      if (dt) return language === "vi" ? dt.nameVi : dt.nameEn;
    }
    return language === "vi" ? dec.nameVi : dec.nameEn;
  };

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
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="text-xs">
                      {orchidFilter.length + potTypeFilter.length + decorationFilter.length}
                    </Badge>
                  )}
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
                      {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                          {orchidFilter.length + potTypeFilter.length + decorationFilter.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>{t("shop.filter", language)}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FilterContent inline />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">{language === "vi" ? "Đang lọc:" : "Filtering:"}</span>
                {orchidFilter.map(id => {
                  const name = orchidOptions.find(o => o.id === id)?.name;
                  return name ? (
                    <Badge key={`o-${id}`} variant="secondary" className="gap-1" data-testid={`active-filter-orchid-${id}`}>
                      {name}
                      <button onClick={() => toggleFilter(orchidFilter, setOrchidFilter, id)} className="ml-0.5" data-testid={`button-remove-filter-orchid-${id}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
                {potTypeFilter.map(id => {
                  const name = potTypeOptions.find(o => o.id === id)?.name;
                  return name ? (
                    <Badge key={`p-${id}`} variant="secondary" className="gap-1" data-testid={`active-filter-pot-${id}`}>
                      {name}
                      <button onClick={() => toggleFilter(potTypeFilter, setPotTypeFilter, id)} className="ml-0.5" data-testid={`button-remove-filter-pot-${id}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
                {decorationFilter.map(id => {
                  const name = decorationOptions.find(o => o.id === id)?.name;
                  return name ? (
                    <Badge key={`d-${id}`} variant="secondary" className="gap-1" data-testid={`active-filter-dec-${id}`}>
                      {name}
                      <button onClick={() => toggleFilter(decorationFilter, setDecorationFilter, id)} className="ml-0.5" data-testid={`button-remove-filter-dec-${id}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
                <Button variant="ghost" size="sm" onClick={clearAllFilters} data-testid="button-clear-all-filters">
                  {language === "vi" ? "Xóa tất cả" : "Clear all"}
                </Button>
              </div>
            )}

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
                  <Card key={pot.id} className="group flex flex-col" data-testid={`card-product-${pot.id}`}>
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-t-lg">
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
                      {(pot.images?.length || 0) + (pot.videos?.length || 0) > 1 && (
                        <Badge variant="secondary" className="absolute top-3 right-3 text-xs gap-1">
                          {(pot.images?.length || 0) + (pot.videos?.length || 0)} {language === "vi" ? "ảnh/video" : "media"}
                        </Badge>
                      )}
                      {pot.stockQuantity <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="destructive">{t("shop.outOfStock", language)}</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2 flex-1">
                      <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-pot-name-${pot.id}`}>
                        {language === "vi" ? pot.nameVi : pot.nameEn}
                      </h3>

                      {pot.orchidComposition && pot.orchidComposition.length > 0 && (
                        <div className="space-y-0.5" data-testid={`orchid-composition-${pot.id}`}>
                          <span className="text-xs font-medium text-muted-foreground">
                            {language === "vi" ? "Lan:" : "Orchids:"}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {pot.orchidComposition.map((orchid, idx) => {
                              const resolvedName = getCatalogName(orchid.catalogItemId) ||
                                (language === "vi" ? orchid.speciesNameVi : orchid.speciesNameEn);
                              return (
                                <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-orchid-${pot.id}-${idx}`}>
                                  {resolvedName} x{orchid.quantity}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {getPotTypeName(pot.potTypeId, pot.potTypeName) && (
                        <div className="flex items-center gap-1.5" data-testid={`pot-type-${pot.id}`}>
                          <span className="text-xs font-medium text-muted-foreground">
                            {language === "vi" ? "Chậu:" : "Pot:"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getPotTypeName(pot.potTypeId, pot.potTypeName)}
                          </Badge>
                        </div>
                      )}

                      {pot.decorations && pot.decorations.length > 0 && (
                        <div className="space-y-0.5" data-testid={`decorations-${pot.id}`}>
                          <span className="text-xs font-medium text-muted-foreground">
                            {language === "vi" ? "Trang trí:" : "Decorations:"}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {pot.decorations.map((dec, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-decoration-${pot.id}-${idx}`}>
                                {getDecorationName(dec)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xl font-bold" data-testid={`text-price-${pot.id}`}>
                        {formatCurrency(pot.price, language)}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex flex-col gap-2 mt-auto">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => { setGalleryIndex(0); setSelectedPot(pot); }}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPot && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-detail-pot-name">
                  {language === "vi" ? selectedPot.nameVi : selectedPot.nameEn}
                </DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <MediaGallery
                    images={selectedPot.images}
                    videos={selectedPot.videos}
                    alt={language === "vi" ? selectedPot.nameVi : selectedPot.nameEn}
                    externalIndex={galleryIndex}
                    onIndexChange={setGalleryIndex}
                  />
                </div>
                <div className="space-y-4">
                  <div className="text-2xl font-bold" data-testid="text-detail-price">
                    {formatCurrency(selectedPot.price, language)}
                  </div>
                  {(language === "vi" ? selectedPot.descriptionVi : selectedPot.descriptionEn) && (
                    <p className="text-muted-foreground" data-testid="text-detail-description">
                      {language === "vi" ? selectedPot.descriptionVi : selectedPot.descriptionEn}
                    </p>
                  )}
                  <div className="space-y-3">
                    {selectedPot.orchidComposition && selectedPot.orchidComposition.length > 0 && (
                      <div data-testid="detail-orchid-composition">
                        <span className="text-sm font-medium">{language === "vi" ? "Thành phần lan:" : "Orchid Composition:"}</span>
                        <div className="mt-1.5 space-y-1">
                          {selectedPot.orchidComposition.map((orchid, idx) => {
                            const resolvedName = getCatalogName(orchid.catalogItemId) ||
                              (language === "vi" ? orchid.speciesNameVi : orchid.speciesNameEn);
                            return (
                              <div key={idx} className="flex items-center justify-between text-sm" data-testid={`detail-orchid-${idx}`}>
                                <span>{resolvedName}</span>
                                <div className="flex items-center gap-2">
                                  {orchid.color && (
                                    <Badge variant="outline" className="text-xs">{orchid.color}</Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">x{orchid.quantity}</Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {getPotTypeName(selectedPot.potTypeId, selectedPot.potTypeName) && (
                      <div className="flex items-center gap-2" data-testid="detail-pot-type">
                        <span className="text-sm font-medium">{language === "vi" ? "Loại chậu:" : "Pot Type:"}</span>
                        <Badge variant="outline">{getPotTypeName(selectedPot.potTypeId, selectedPot.potTypeName)}</Badge>
                      </div>
                    )}

                    {selectedPot.decorations && selectedPot.decorations.length > 0 && (
                      <div data-testid="detail-decorations">
                        <span className="text-sm font-medium">{language === "vi" ? "Trang trí:" : "Decorations:"}</span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {selectedPot.decorations.map((dec, idx) => (
                            <Badge key={idx} variant="outline" data-testid={`detail-decoration-${idx}`}>
                              {getDecorationName(dec)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {showDimensions && (selectedPot.lengthCm || selectedPot.widthCm || selectedPot.heightCm) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{language === "vi" ? "Kích thước (D×R×C):" : "Dimensions (L×W×H):"}</span>
                        <span className="text-sm">
                          {selectedPot.lengthCm || "-"}×{selectedPot.widthCm || "-"}×{selectedPot.heightCm || "-"} cm
                        </span>
                      </div>
                    )}

                    {showWeight && selectedPot.weightKg && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{language === "vi" ? "Cân nặng:" : "Weight:"}</span>
                        <span className="text-sm">{selectedPot.weightKg} kg</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2" data-testid="detail-stock">
                      <span className="text-sm text-muted-foreground">{language === "vi" ? "Còn lại" : "Stock"}:</span>
                      <span className="text-sm">{selectedPot.stockQuantity} {language === "vi" ? "chậu" : "pots"}</span>
                    </div>
                  </div>
                  {(language === "vi" ? selectedPot.careInstructionsVi : selectedPot.careInstructionsEn) && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">
                        {language === "vi" ? "Hướng dẫn chăm sóc" : "Care Instructions"}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid="text-detail-care">
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

              {(selectedPot.images?.length || 0) + (selectedPot.videos?.length || 0) > 1 && (() => {
                const imageCount = selectedPot.images?.length || 0;
                return (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">{language === "vi" ? "Tất cả ảnh & video" : "All Photos & Videos"}</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {selectedPot.images?.map((img, idx) => (
                        <button
                          key={`img-${idx}`}
                          className={`aspect-square rounded-md overflow-hidden bg-muted cursor-pointer ring-offset-background transition-all ${galleryIndex === idx ? "ring-2 ring-primary ring-offset-2" : ""}`}
                          onClick={() => setGalleryIndex(idx)}
                          data-testid={`thumb-image-${idx}`}
                        >
                          <img src={img} alt={`${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {selectedPot.videos?.map((vid, idx) => (
                        <button
                          key={`vid-${idx}`}
                          className={`aspect-square rounded-md overflow-hidden bg-muted relative cursor-pointer ring-offset-background transition-all ${galleryIndex === imageCount + idx ? "ring-2 ring-primary ring-offset-2" : ""}`}
                          onClick={() => setGalleryIndex(imageCount + idx)}
                          data-testid={`thumb-video-${idx}`}
                        >
                          <video src={vid} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
