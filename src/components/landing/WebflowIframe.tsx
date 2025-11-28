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

  useEffect(() => {
    // Intercetta gli eventi wheel del trackpad e passali all'iframe
    const handleWheel = (e: WheelEvent) => {
      if (iframeRef.current?.contentWindow) {
        // Invia l'evento wheel direttamente all'iframe
        iframeRef.current.contentWindow.scrollBy({
          top: e.deltaY,
          behavior: "auto" // Usa "auto" per scroll immediato senza smooth
        });
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

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
        pointerEvents: "auto",
      }}
      title="UNVRS Labs Landing Page"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}
