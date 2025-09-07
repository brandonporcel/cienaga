import { AnimatedSection } from "@/components/animated-section";
import { BentoSection } from "@/components/bento-section";
import { CTASection } from "@/components/cta-section";
import { DashboardPreview } from "@/components/dashboard-preview";
import { FAQSection } from "@/components/faq-section";
import { FooterSection } from "@/components/footer-section";
import Header from "@/components/header";
import { HeroSectionn } from "@/components/hero-sectionn";
import { LargeTestimonial } from "@/components/large-testimonial";
import { SocialProof } from "@/components/social-proof";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* <Header /> */}

      {/* Hero Section */}
      <main className="max-w-[1320px] mx-auto relative">
        <HeroSectionn />
        {/* Dashboard Preview Wrapper */}
        <div className="absolute bottom-[-150px] md:bottom-[-400px] left-1/2 transform -translate-x-1/2 z-30">
          <AnimatedSection>
            <DashboardPreview />
          </AnimatedSection>
        </div>
      </main>

      <AnimatedSection
        className="relative z-10 max-w-[1320px] mx-auto px-6 mt-[411px] md:mt-[400px]"
        delay={0.1}
      >
        <SocialProof />
      </AnimatedSection>

      <AnimatedSection
        id="features-section"
        className="relative z-10 max-w-[1320px] mx-auto mt-16"
        delay={0.2}
      >
        <BentoSection />
      </AnimatedSection>

      <AnimatedSection
        className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
        delay={0.2}
      >
        <LargeTestimonial />
      </AnimatedSection>

      <AnimatedSection
        id="faq-section"
        className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
        delay={0.2}
      >
        <FAQSection />
      </AnimatedSection>

      <AnimatedSection
        className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
        delay={0.2}
      >
        <CTASection />
      </AnimatedSection>

      <AnimatedSection
        className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
        delay={0.2}
      >
        <FooterSection />
      </AnimatedSection>
    </div>
  );
}
