import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingClaim } from "@/components/landing/LandingClaim";
import { LandingWorks } from "@/components/landing/LandingWorks";
import { LandingServices } from "@/components/landing/LandingServices";
import { LandingCreative } from "@/components/landing/LandingCreative";
import { LandingContact } from "@/components/landing/LandingContact";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <LandingHeader />
      <LandingHero />
      <LandingClaim />
      <LandingWorks />
      <LandingServices />
      <LandingCreative />
      <LandingContact />
      <LandingFooter />
    </div>
  );
};

export default Landing;
