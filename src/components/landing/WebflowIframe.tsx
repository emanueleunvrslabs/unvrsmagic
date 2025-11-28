import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export function WebflowIframe() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "navigate-to-auth") {
        navigate("/auth");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return (
    <iframe
      ref={iframeRef}
      src="/webflow/index.html"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        display: "block",
        margin: 0,
        padding: 0,
        overflowY: "scroll",
        WebkitOverflowScrolling: "touch",
        scrollBehavior: "smooth",
      }}
      title="UNVRS Labs Landing Page"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}
