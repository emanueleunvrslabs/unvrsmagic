import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHeroNew } from "@/components/landing/LandingHeroNew";
import { LandingBrands } from "@/components/landing/LandingBrands";
import { LandingClaim } from "@/components/landing/LandingClaim";
import { LandingWorksNew } from "@/components/landing/LandingWorksNew";
import { LandingServicesNew } from "@/components/landing/LandingServicesNew";
import { LandingReviews } from "@/components/landing/LandingReviews";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingCTANew } from "@/components/landing/LandingCTANew";
import { LandingFooterNew } from "@/components/landing/LandingFooterNew";

const Landing = () => {
  return (
    <div className="bg-black min-h-screen">
      <LandingNav />
      <LandingHeroNew />
      <LandingBrands />
      <LandingClaim />
      <LandingServicesNew />
      <LandingWorksNew />
      <LandingReviews />
      <LandingStats />
      <LandingCTANew />
      <LandingFooterNew />
    </div>
  );
};

export default Landing;
