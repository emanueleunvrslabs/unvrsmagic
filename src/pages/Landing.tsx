import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingServices } from "@/components/landing/LandingServices";
import { LandingWorks } from "@/components/landing/LandingWorks";
import { LandingAbout } from "@/components/landing/LandingAbout";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <LandingHero />
      <LandingServices />
      <LandingWorks />
      <LandingAbout />
      <LandingFooter />
    </div>
  );
};

export default Landing;
