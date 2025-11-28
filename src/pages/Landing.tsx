import { useEffect } from "react";
import { WebflowIframe } from "@/components/landing/WebflowIframe";

const Landing = () => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return <WebflowIframe />;
};

export default Landing;
