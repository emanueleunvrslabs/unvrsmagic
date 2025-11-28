import { useEffect } from "react";
import { WebflowIframe } from "@/components/landing/WebflowIframe";

const Landing = () => {
  useEffect(() => {
    // Blocca lo scroll del body principale per evitare il double-scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return <WebflowIframe />;
};

export default Landing;
