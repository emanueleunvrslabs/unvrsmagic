import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <LandingHeader />
      <LandingHero />
      <LandingFooter />
    </div>
  );
};

export default Landing;
