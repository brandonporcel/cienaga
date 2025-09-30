import { AnimatedSection } from "@/components/animated-section";
import { DashboardPreview } from "@/components/dashboard-preview";
import { FAQSection } from "@/components/faq-section";
import { FooterSection } from "@/components/footer-section";
import Header from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import InstructionsSection from "@/components/instructions-section";
import { LargeTestimonial } from "@/components/large-testimonial";
import PublicScreenings from "@/components/public-screenings";
import { SocialProof } from "@/components/social-proof";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <main className="max-w-[1320px] mx-auto relative">
        <HeroSection />
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
        id="about-section"
        className="relative z-10 max-w-[1320px] mx-auto mt-16"
        delay={0.2}
      >
        <InstructionsSection />
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
        <PublicScreenings />
      </AnimatedSection>

      <AnimatedSection
        id="faq-section"
        className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
        delay={0.2}
      >
        <FAQSection />
      </AnimatedSection>

      <AnimatedSection
        className="relative z-10 mx-auto mt-8 md:mt-16 bg-neutral-50"
        delay={0.2}
      >
        <FooterSection />
      </AnimatedSection>
    </div>
  );
}
