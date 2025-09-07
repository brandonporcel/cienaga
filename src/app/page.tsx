import { AnimatedSection } from "@/components/animated-section";
import { DashboardPreview } from "@/components/dashboard-preview";
import Header from "@/components/header";
import { HeroSectionn } from "@/components/hero-sectionn";
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

      {/* Dashboard Preview */}
      <section className="px-4 pb-16">
        {new Array(40).fill(null).map((_, i) => (
          <p key={i}>{i}</p>
        ))}
      </section>
    </div>
  );
}
