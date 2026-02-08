import { Link } from "wouter";
import { Flower2, Truck, ShieldCheck, HeadphonesIcon, Star, ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";

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

export default function LandingPage() {
  const { language } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-orchid-100 via-orchid-50 to-background dark:from-orchid-900/20 dark:via-orchid-800/10 dark:to-background">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239333EA%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50 dark:opacity-30" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Flower2 className="h-4 w-4" />
              {language === "vi" ? "Lan Hồ Điệp Cao Cấp" : "Premium Phalaenopsis"}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t("landing.heroTitle", language)}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.heroSubtitle", language)}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/shop">
                <Button size="lg" className="gap-2 text-base" data-testid="button-hero-cta">
                  {t("landing.heroCta", language)}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/checkout">
                <Button size="lg" variant="outline" className="gap-2 text-base" data-testid="button-custom-order">
                  {language === "vi" ? "Đặt chậu riêng" : "Custom Order"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
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

      <section className="py-20 md:py-28 bg-card">
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
                  <div className="text-3xl font-bold text-primary">10+</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "vi" ? "Năm kinh nghiệm" : "Years Experience"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">5000+</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "vi" ? "Đơn hàng thành công" : "Successful Orders"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "vi" ? "Loại lan cao cấp" : "Premium Varieties"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "vi" ? "Khách hàng hài lòng" : "Customer Satisfaction"}
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-orchid-200 to-orchid-100 dark:from-orchid-800/30 dark:to-orchid-700/20 flex items-center justify-center overflow-hidden">
                <div className="relative z-10 text-center space-y-4">
                  <img src="/assets/logo.png" alt="Hùng Cường Orchid Garden" className="w-32 h-32 mx-auto object-contain" />
                  <p className="font-semibold text-lg">
                    {language === "vi" ? "Vườn Lan Hùng Cường" : "Orchid Garden"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
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

      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
