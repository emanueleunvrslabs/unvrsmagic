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
import { StarfieldBackground } from "@/components/landing/StarfieldBackground";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { TechStackOrbit } from "@/components/landing/TechStackOrbit";
import { InteractiveTimeline } from "@/components/landing/InteractiveTimeline";
import { MatrixRain } from "@/components/landing/MatrixRain";

const Landing = () => {
  return (
    <div className="bg-black min-h-screen relative" style={{ cursor: "none" }}>
      {/* Background Effects */}
      <MatrixRain />
      <StarfieldBackground />
      
      {/* Custom Cursor */}
      <CustomCursor />
      
      {/* Content */}
      <LandingNav />
      <LandingHeroNew />
      <LandingClaim />
      <LandingBrands />
      <TechStackOrbit />
      <LandingServicesNew />
      <LandingWorksNew />
      <InteractiveTimeline />
      <LandingReviews />
      <LandingStats />
      <LandingCTANew />
      <LandingFooterNew />
    </div>
  );
};

export default Landing;
