import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_BASE = "https://amvbkkbqkzklrcynpwwm.supabase.co/storage/v1/object/public/uploads/9d8f65ef-58ef-47db-be8f-926f26411b39";

export function WebflowPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Webflow CSS files
    const loadCSS = (href: string) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    };

    // Load CSS files from public folder
    const css1 = loadCSS("/webflow/css/normalize.css");
    const css2 = loadCSS("/webflow/css/webflow.css");
    const css3 = loadCSS("/webflow/css/unvrs-labs.webflow.css");

    // Load Webflow JS
    const script = document.createElement("script");
    script.src = "/webflow/js/webflow.js";
    script.async = true;
    document.body.appendChild(script);

    // Load GSAP and other required scripts
    const gsapScript = document.createElement("script");
    gsapScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";
    gsapScript.async = true;
    document.head.appendChild(gsapScript);

    const scrollTriggerScript = document.createElement("script");
    scrollTriggerScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js";
    scrollTriggerScript.async = true;
    document.head.appendChild(scrollTriggerScript);

    return () => {
      document.head.removeChild(css1);
      document.head.removeChild(css2);
      document.head.removeChild(css3);
      document.body.removeChild(script);
      document.head.removeChild(gsapScript);
      document.head.removeChild(scrollTriggerScript);
    };
  }, []);

  const handleAccediClick = () => {
    navigate("/auth");
  };

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "auto" }}>
      <iframe
        src="/webflow/index.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none"
        }}
        title="UNVRS Labs"
        onLoad={(e) => {
          const iframe = e.currentTarget;
          try {
            const iframeDoc = iframe.contentDocument;
            if (iframeDoc) {
              // Add Accedi button
              const navMenu = iframeDoc.querySelector('.nav-menu');
              if (navMenu) {
                const accediWrapper = iframeDoc.createElement('div');
                accediWrapper.className = 'nav-link-wrapper w-inline-block';
                accediWrapper.style.cursor = 'pointer';
                accediWrapper.innerHTML = `
                  <div class="nav-link-block">
                    <p class="nav-link">ACCEDI</p>
                    <p class="nav-link hide-on-tab">ACCEDI</p>
                  </div>
                `;
                accediWrapper.onclick = () => handleAccediClick();
                navMenu.appendChild(accediWrapper);
              }
            }
          } catch (e) {
            console.error("Cannot modify iframe:", e);
          }
        }}
      />
    </div>
  );
}
