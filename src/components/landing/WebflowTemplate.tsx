import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
          setHtmlContent(data.content);
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

    // Inject CSS files
    const cssFiles = [
      '9d8f65ef-58ef-47db-be8f-926f26411b39/1764321173717-normalize.css',
      '9d8f65ef-58ef-47db-be8f-926f26411b39/1764321174825-webflow.css',
      '9d8f65ef-58ef-47db-be8f-926f26411b39/1764321175774-unvrs-labs-7ccf5c.webflow.css'
    ];

    cssFiles.forEach(async (cssPath) => {
      const { data } = await supabase.functions.invoke('get-template-file', {
        body: { filePath: cssPath }
      });
      
      if (data?.content) {
        const style = document.createElement('style');
        style.textContent = data.content;
        document.head.appendChild(style);
      }
    });

    // Inject Webflow JS
    const loadScript = async () => {
      const { data } = await supabase.functions.invoke('get-template-file', {
        body: { filePath: '9d8f65ef-58ef-47db-be8f-926f26411b39/1764321176747-webflow.js' }
      });
      
      if (data?.content) {
        const script = document.createElement('script');
        script.textContent = data.content;
        document.body.appendChild(script);
      }
    };

    loadScript();
  }, [htmlContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading template...</div>
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
