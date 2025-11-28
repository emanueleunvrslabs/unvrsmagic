import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHeroNew } from "@/components/landing/LandingHeroNew";
import { LandingLearnMore } from "@/components/landing/LandingLearnMore";
import { LandingBrands } from "@/components/landing/LandingBrands";
import { LandingWorksNew } from "@/components/landing/LandingWorksNew";
import { LandingServicesNew } from "@/components/landing/LandingServicesNew";
import { LandingCTANew } from "@/components/landing/LandingCTANew";
import { LandingFooterNew } from "@/components/landing/LandingFooterNew";

const Landing = () => {
  return (
    <div className="bg-black min-h-screen">
      <LandingNav />
      <LandingHeroNew />
      <LandingLearnMore />
      <LandingBrands />
      <LandingServicesNew />
      <LandingWorksNew />
      <LandingCTANew />
      <LandingFooterNew />
    </div>
  );
};

export default Landing;
