import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_BASE = "https://amvbkkbqkzklrcynpwwm.supabase.co/storage/v1/object/public/uploads/9d8f65ef-58ef-47db-be8f-926f26411b39";

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
      src={`${STORAGE_BASE}/1764321177805-index.html`}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        display: "block",
        margin: 0,
        padding: 0
      }}
      title="UNVRS Labs Landing Page"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}
