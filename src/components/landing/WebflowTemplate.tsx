import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_BASE = "https://amvbkkbqkzklrcynpwwm.supabase.co/storage/v1/object/public/uploads/9d8f65ef-58ef-47db-be8f-926f26411b39";

export function WebflowTemplate() {
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-template-file', {
          body: { filePath: '9d8f65ef-58ef-47db-be8f-926f26411b39/1764321177805-index.html' }
        });

        if (error) throw error;
        
        if (data?.content) {
          // Sostituisci i path delle immagini con il path pubblico
          let processedHtml = data.content;
          processedHtml = processedHtml.replace(/src="images\//g, `src="${STORAGE_BASE}/`);
          processedHtml = processedHtml.replace(/srcset="images\//g, `srcset="${STORAGE_BASE}/`);
          processedHtml = processedHtml.replace(/href="images\//g, `href="${STORAGE_BASE}/`);
          
          // Sostituisci i link CSS con quelli pubblici
          processedHtml = processedHtml.replace(/href="css\//g, 'href="/css/');
          processedHtml = processedHtml.replace(/src="js\//g, 'src="/js/');
          processedHtml = processedHtml.replace(/data-src="documents\//g, `data-src="${STORAGE_BASE}/`);
          
          // Sostituisci i link delle pagine HTML con ancore per la SPA
          processedHtml = processedHtml.replace(/href="index\.html"/g, 'href="/"');
          processedHtml = processedHtml.replace(/href="about\.html"/g, 'href="#learn-more"');
          processedHtml = processedHtml.replace(/href="works\.html"/g, 'href="#works"');
          processedHtml = processedHtml.replace(/href="services\.html"/g, 'href="#services"');
          processedHtml = processedHtml.replace(/href="blog\.html"/g, 'href="#"');
          processedHtml = processedHtml.replace(/href="contact\.html"/g, 'href="#"');
          
          setHtmlContent(processedHtml);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, []);

  useEffect(() => {
    if (!htmlContent) return;

    // Aspetta che il DOM sia pronto e inizializza Webflow
    const timer = setTimeout(() => {
      if (window.Webflow) {
        console.log('Initializing Webflow...');
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('ix2').init();
        document.dispatchEvent(new Event('readystatechange'));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [htmlContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Caricamento template...</div>
      </div>
    );
  }

  return (
    <div 
      className="webflow-template"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

declare global {
  interface Window {
    Webflow: any;
  }
}
