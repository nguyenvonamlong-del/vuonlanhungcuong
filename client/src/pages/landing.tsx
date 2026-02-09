import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { Flower2, Truck, ShieldCheck, HeadphonesIcon, Star, ArrowRight, Phone, Mail, MapPin, ChevronLeft, ChevronRight, Play, Pause, X, ShoppingCart, Palette, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/public-header";
import { useApp } from "@/context/AppContext";
import { t, formatCurrency } from "@/lib/i18n";
import type { PremadePot } from "@shared/schema";

const features = [
  { icon: Flower2, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
  { icon: Truck, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
  { icon: ShieldCheck, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
  { icon: HeadphonesIcon, titleKey: "landing.feature4Title", descKey: "landing.feature4Desc" },
];

const testimonials = [
  {
    name: "Nguyễn Văn A",
    role: { vi: "Khách hàng VIP", en: "VIP Customer" },
    content: {
      vi: "Lan rất đẹp, chất lượng tuyệt vời. Tôi đã đặt nhiều lần và luôn hài lòng!",
      en: "Beautiful orchids, excellent quality. I've ordered many times and always satisfied!",
    },
    rating: 5,
  },
  {
    name: "Trần Thị B",
    role: { vi: "Nhà thiết kế nội thất", en: "Interior Designer" },
    content: {
      vi: "Dịch vụ chuyên nghiệp, giao hàng đúng hẹn. Lan tươi và đẹp như mô tả.",
      en: "Professional service, on-time delivery. Fresh and beautiful orchids as described.",
    },
    rating: 5,
  },
  {
    name: "Lê Văn C",
    role: { vi: "Chủ văn phòng", en: "Office Owner" },
    content: {
      vi: "Đã mua nhiều chậu lan để trang trí văn phòng. Nhân viên tư vấn nhiệt tình.",
      en: "Bought many pots to decorate the office. Staff provides enthusiastic consultation.",
    },
    rating: 5,
  },
];

function MediaLightbox({ mediaSrc, mediaType, pot, language, onClose }: { mediaSrc: string; mediaType: "video" | "photo"; pot: PremadePot; language: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (mediaType === "video") {
      const video = videoRef.current;
      if (video) {
        video.muted = true;
        video.play().then(() => {
          setIsPlaying(true);
          video.muted = false;
          setIsMuted(false);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }
    return () => { document.body.style.overflow = ""; };
  }, [mediaType]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " " && mediaType === "video") { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, mediaType]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
      data-testid={`lightbox-overlay-${pot.id}`}
    >
      <div
        className="relative w-full max-w-3xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-lg overflow-hidden bg-black">
          {mediaType === "video" ? (
            <>
              <video
                ref={videoRef}
                src={mediaSrc}
                className="w-full max-h-[80vh] object-contain"
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                data-testid={`lightbox-video-${pot.id}`}
              />
              <button
                className="absolute inset-0 flex items-center justify-center transition-opacity"
                style={{ opacity: isPlaying ? 0 : 1 }}
                onClick={togglePlay}
                data-testid={`button-lightbox-play-${pot.id}`}
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="h-7 w-7 text-foreground fill-foreground" />
                  ) : (
                    <Play className="h-7 w-7 text-foreground fill-foreground ml-0.5" />
                  )}
                </div>
              </button>
            </>
          ) : (
            <img
              src={mediaSrc}
              alt={language === "vi" ? pot.nameVi : pot.nameEn}
              className="w-full max-h-[80vh] object-contain"
              data-testid={`lightbox-image-${pot.id}`}
            />
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            {mediaType === "video" && (
              <Button
                size="icon"
                variant="outline"
                className="bg-black/50 border-white/30 text-white backdrop-blur-sm"
                onClick={toggleMute}
                data-testid={`button-mute-${pot.id}`}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            )}
            <Button
              size="icon"
              variant="outline"
              className="bg-black/50 border-white/30 text-white backdrop-blur-sm"
              onClick={onClose}
              data-testid={`button-close-lightbox-${pot.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 text-center">
          <h3 className="text-white font-semibold text-lg" data-testid={`lightbox-name-${pot.id}`}>
            {language === "vi" ? pot.nameVi : pot.nameEn}
          </h3>
          <p className="text-white/80 font-bold" data-testid={`lightbox-price-${pot.id}`}>
            {formatCurrency(pot.price, language as any)}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ShowcaseCard({ pot, language }: { pot: PremadePot; language: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasVideo = (pot as any).videos?.length > 0;
  const hasImage = (pot.images?.length ?? 0) > 0;

  const openLightbox = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const mediaType = hasVideo ? "video" as const : "photo" as const;
  const mediaSrc = hasVideo ? (pot as any).videos[0] : hasImage ? pot.images![0] : "";

  return (
    <>
      <div
        className="shrink-0 w-64 md:w-72 snap-start rounded-lg bg-card border cursor-pointer"
        data-testid={`showcase-product-${pot.id}`}
      >
        <div className="relative aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
          {hasVideo ? (
            <>
              <video
                src={(pot as any).videos[0]}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
                data-testid={`showcase-video-${pot.id}`}
              />
              <button
                onClick={openLightbox}
                aria-label="Play video"
                className="absolute inset-0 flex items-center justify-center bg-black/20"
                data-testid={`button-play-${pot.id}`}
              >
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-5 w-5 text-foreground fill-foreground ml-0.5" />
                </div>
              </button>
            </>
          ) : hasImage ? (
            <>
              <img
                src={pot.images![0]}
                alt={language === "vi" ? pot.nameVi : pot.nameEn}
                className="w-full h-full object-cover"
                data-testid={`showcase-img-${pot.id}`}
              />
              <button
                onClick={openLightbox}
                aria-label="Enlarge photo"
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group/enlarge"
                data-testid={`button-enlarge-${pot.id}`}
              >
                <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover/enlarge:opacity-100 transition-opacity">
                  <Maximize2 className="h-4 w-4 text-foreground" />
                </div>
              </button>
            </>
          ) : null}
        </div>
        <div className="p-3 space-y-1">
          <h3 className="font-semibold text-sm line-clamp-1" data-testid={`showcase-name-${pot.id}`}>
            {language === "vi" ? pot.nameVi : pot.nameEn}
          </h3>
          <p className="text-sm font-bold" data-testid={`showcase-price-${pot.id}`}>
            {formatCurrency(pot.price, language as any)}
          </p>
        </div>
      </div>
      {lightboxOpen && mediaSrc && (
        <MediaLightbox
          mediaSrc={mediaSrc}
          mediaType={mediaType}
          pot={pot}
          language={language}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}

function ProductShowcase({ language }: { language: string }) {
  const { data: pots = [] } = useQuery<PremadePot[]>({
    queryKey: ["/api/shop/pots"],
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const activePots = pots.filter(p => p.status === "ACTIVE" && ((p as any).videos?.length > 0 || (p.images?.length ?? 0) > 0));

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => { if (el) el.removeEventListener("scroll", checkScroll); };
  }, [activePots.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (activePots.length === 0) return null;

  return (
    <div data-testid="section-product-showcase">
      <div className="text-center mb-3">
        <h2 className="text-lg md:text-xl font-bold mb-1">
          {language === "vi" ? "Sản phẩm nổi bật" : "Featured Products"}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          {language === "vi"
            ? "Khám phá bộ sưu tập lan hồ điệp tuyệt đẹp của chúng tôi"
            : "Explore our beautiful phalaenopsis orchid collection"}
        </p>
      </div>
      <div className="relative">
        {canScrollLeft && (
          <Button
            size="icon"
            variant="outline"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
            onClick={() => scroll("left")}
            data-testid="button-showcase-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {canScrollRight && (
          <Button
            size="icon"
            variant="outline"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
            onClick={() => scroll("right")}
            data-testid="button-showcase-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {activePots.map((pot) => (
            <ShowcaseCard key={pot.id} pot={pot} language={language} />
          ))}
        </div>
      </div>
      <div className="text-center mt-3">
        <Link href="/shop">
          <Button size="sm" variant="outline" className="gap-2" data-testid="button-view-all-products">
            <ShoppingCart className="h-3.5 w-3.5" />
            {language === "vi" ? "Xem tất cả sản phẩm" : "View All Products"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { language } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <section className="bg-gradient-to-b from-orchid-50 to-background dark:from-orchid-900/10 dark:to-background" data-testid="section-center-actions">
        <div className="container mx-auto px-4 pt-4 pb-4 md:pt-6 md:pb-6">
          <div className="text-center mb-3 md:hidden">
            <h1 className="text-2xl font-bold tracking-tight">
              {t("landing.heroTitle", language)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("landing.heroSubtitle", language)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-5 max-w-lg md:max-w-xl mx-auto mb-5 md:mb-6">
            <Link href="/shop">
              <Card className="hover-elevate group h-full">
                <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ShoppingCart className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm md:text-lg">
                    {language === "vi" ? "Chậu Lan Có Sẵn" : "Premade Products"}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                    {language === "vi"
                      ? "Bộ sưu tập lan hồ điệp trang trí sẵn"
                      : "Ready-made orchid arrangements"}
                  </p>
                  <Button className="gap-2 mt-auto" data-testid="button-hero-cta">
                    {language === "vi" ? "Xem sản phẩm" : "Browse Products"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
            <Link href="/checkout">
              <Card className="hover-elevate group h-full">
                <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Palette className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm md:text-lg">
                    {language === "vi" ? "Đặt Chậu Riêng" : "Custom Order"}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                    {language === "vi"
                      ? "Thiết kế chậu lan theo ý thích"
                      : "Design your own arrangement"}
                  </p>
                  <Button variant="outline" className="gap-2 mt-auto" data-testid="button-custom-order">
                    {language === "vi" ? "Bắt đầu thiết kế" : "Start Designing"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          <ProductShowcase language={language} />
        </div>
      </section>

      <section className="py-16 md:py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("landing.featuresTitle", language)}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === "vi"
                ? "Chúng tôi cam kết mang đến trải nghiệm mua sắm tốt nhất cho khách hàng"
                : "We are committed to providing the best shopping experience for our customers"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate group">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t(feature.titleKey, language)}</h3>
                  <p className="text-muted-foreground text-sm">{t(feature.descKey, language)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                {t("landing.aboutTitle", language)}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("landing.aboutDesc", language)}
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">20+</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "vi" ? "Năm kinh nghiệm" : "Years Experience"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">100K+</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "vi" ? "Đơn hàng thành công" : "Successful Orders"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">20+</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "vi" ? "Loại lan cao cấp" : "Premium Varieties"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "vi" ? "Khách hàng hài lòng" : "Customer Satisfaction"}
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden">
                <img
                  src="/assets/founder.png"
                  alt={language === "vi" ? "Anh Hùng Cường và vợ - Nhà sáng lập Vườn Lan" : "Mr. Hùng Cường and his spouse - Orchid Garden Founders"}
                  className="w-full h-auto rounded-2xl object-cover"
                  data-testid="img-founder"
                />
              </div>
              <div className="mt-4 text-center">
                <p className="font-semibold text-lg">
                  {language === "vi" ? "Nhà sáng lập Vườn Lan Hùng Cường" : "Founders of Hùng Cường Orchid Garden"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "vi" ? "Đội 10, Xích Đằng, Lam Sơn, TP. Hưng Yên" : "Doi 10, Xich Dang, Lam Son, Hung Yen City"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("landing.testimonialsTitle", language)}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">
                    "{testimonial.content[language]}"
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary text-sm">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role[language]}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {t("landing.contactTitle", language)}
              </h2>
              <p className="text-muted-foreground">
                {language === "vi"
                  ? "Liên hệ với chúng tôi để được tư vấn và hỗ trợ"
                  : "Contact us for consultation and support"}
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="hover-elevate">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">
                    {language === "vi" ? "Điện thoại" : "Phone"}
                  </h3>
                  <p className="text-muted-foreground text-sm">0983 270 995</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-muted-foreground text-sm">Thanhtusky147@gmail.com</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">
                    {language === "vi" ? "Địa chỉ" : "Address"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Đội 10, Xích Đằng, phường Lam Sơn, TP. Hưng Yên, tỉnh Hưng Yên
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="Hùng Cường" className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-semibold">{t("landing.heroTitle", language)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 {t("landing.heroTitle", language)}.{" "}
              {language === "vi" ? "Tất cả quyền được bảo lưu." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
