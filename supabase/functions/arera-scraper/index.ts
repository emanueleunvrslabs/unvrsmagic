import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ARERA_BASE_URL = "https://www.arera.it";
const ARERA_LIST_URL = `${ARERA_BASE_URL}/atti-e-provvedimenti?anno=&numero=&tipologia=Delibera&keyword=&settore=&orderby=&orderbydir=&numelements=50`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting ARERA scraper...");

    // Get owner's API keys (Anthropic for summarization, Firecrawl for scraping)
    const { data: ownerRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .single();

    if (!ownerRole) {
      throw new Error("Owner not found");
    }

    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("api_key, provider")
      .eq("user_id", ownerRole.user_id)
      .in("provider", ["anthropic", "firecrawl"]);

    const anthropicKey = apiKeys?.find(k => k.provider === "anthropic")?.api_key;
    const firecrawlKey = apiKeys?.find(k => k.provider === "firecrawl")?.api_key;

    if (!anthropicKey) {
      throw new Error("Anthropic API key not configured");
    }

    if (!firecrawlKey) {
      throw new Error("Firecrawl API key not configured");
    }

    // Fetch ARERA delibere list page using Firecrawl (50 items per page)
    console.log("Fetching ARERA delibere via Firecrawl...");
    
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: ARERA_LIST_URL,
        formats: ["html"],
      }),
    });

    if (!firecrawlResponse.ok) {
      const errText = await firecrawlResponse.text();
      console.error("Firecrawl error:", errText);
      throw new Error(`Failed to fetch ARERA page via Firecrawl: ${firecrawlResponse.status}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    const html = firecrawlData.data?.html || "";
    console.log("HTML fetched via Firecrawl, length:", html.length);

    // Parse delibere from HTML
    const delibere = parseDelibereList(html);
    console.log(`Found ${delibere.length} delibere`);

    // Get existing delibere codes
    const { data: existingDelibere } = await supabase
      .from("arera_delibere")
      .select("delibera_code");

    const existingCodes = new Set(existingDelibere?.map((d) => d.delibera_code) || []);

    // Filter new delibere
    const newDelibere = delibere.filter((d) => !existingCodes.has(d.code));
    console.log(`New delibere to process: ${newDelibere.length}`);

    const results = [];

    for (const delibera of newDelibere) { // Process all new delibere
      try {
        console.log(`Processing: ${delibera.code}`);

        // Insert initial record
        const { data: inserted, error: insertError } = await supabase
          .from("arera_delibere")
          .insert({
            user_id: ownerRole.user_id,
            delibera_code: delibera.code,
            publication_date: delibera.date,
            title: delibera.title,
            detail_url: delibera.detailUrl,
            status: "processing",
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Insert error for ${delibera.code}:`, insertError);
          continue;
        }

        // Fetch detail page via Firecrawl
        const detailHtml = await fetchDetailPage(delibera.detailUrl, firecrawlKey);
        const { description, files } = parseDetailPage(detailHtml);

        // Download files and upload to storage
        const uploadedFiles = [];
        for (const file of files.slice(0, 5)) { // Max 5 files per delibera
          try {
            const fileData = await downloadFile(file.url);
            if (fileData) {
              // Extract extension from original URL or default to pdf
              const urlExtension = file.url.split('.').pop()?.toLowerCase() || 'pdf';
              const extension = ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(urlExtension) ? urlExtension : 'pdf';
              const fileName = `${delibera.code.replace(/\//g, "-")}/${file.name}.${extension}`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from("arera-files")
                .upload(fileName, fileData, {
                  contentType: file.type || "application/pdf",
                  upsert: true,
                });

              if (!uploadError) {
                const { data: publicUrl } = supabase.storage
                  .from("arera-files")
                  .getPublicUrl(fileName);

                uploadedFiles.push({
                  name: file.name,
                  url: publicUrl.publicUrl,
                  originalUrl: file.url,
                });
              }
            }
          } catch (fileError) {
            console.error(`Error downloading file ${file.name}:`, fileError);
          }
        }

        // Generate summary with Anthropic
        let summary = "";
        if (description) {
          summary = await generateSummary(anthropicKey, delibera.title, description);
        }

        // Update record
        await supabase
          .from("arera_delibere")
          .update({
            description,
            summary,
            files: uploadedFiles,
            status: "completed",
          })
          .eq("id", inserted.id);

        results.push({
          code: delibera.code,
          status: "completed",
          filesCount: uploadedFiles.length,
        });

      } catch (error) {
        console.error(`Error processing ${delibera.code}:`, error);
        results.push({
          code: delibera.code,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalFound: delibere.length,
        newProcessed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scraper error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseDelibereList(html: string): Array<{
  code: string;
  date: string;
  title: string;
  detailUrl: string;
}> {
  const delibere: Array<{ code: string; date: string; title: string; detailUrl: string }> = [];
  
  // Pattern per blocchi delibera ARERA - struttura:
  // <a id="atto" href="https://www.arera.it/atti-e-provvedimenti/dettaglio/25/520-25">
  //   <p class="data-atto">25/11/2025</p>
  //   <h3 class="sigla-atto">520/2025/C/rif</h3>
  //   <p class="testo-atto">Titolo della delibera</p>
  // </a>
  
  const attoPattern = /<a[^>]*id="atto"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const datePattern = /<p[^>]*class="data-atto"[^>]*>([^<]+)<\/p>/i;
  const codePattern = /<h3[^>]*class="sigla-atto"[^>]*>([^<]+)<\/h3>/i;
  const titlePattern = /<p[^>]*class="testo-atto"[^>]*>([^<]+)<\/p>/i;

  let match;
  
  while ((match = attoPattern.exec(html)) !== null) {
    const href = match[1];
    const blockHtml = match[2];
    
    const dateMatch = datePattern.exec(blockHtml);
    const codeMatch = codePattern.exec(blockHtml);
    const titleMatch = titlePattern.exec(blockHtml);
    
    if (codeMatch) {
      const code = codeMatch[1].trim();
      const date = dateMatch ? formatDate(dateMatch[1].trim()) : new Date().toISOString().split("T")[0];
      const title = titleMatch ? titleMatch[1].trim() : code;
      
      delibere.push({
        code,
        date,
        title,
        detailUrl: href.startsWith("http") ? href : `${ARERA_BASE_URL}${href}`,
      });
    }
  }

  console.log(`Parser found ${delibere.length} delibere blocks`);
  return delibere;
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return new Date().toISOString().split("T")[0];
}

async function fetchDetailPage(url: string, firecrawlKey: string): Promise<string> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: url,
      formats: ["html"],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch detail page via Firecrawl: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.html || "";
}

function parseDetailPage(html: string): { description: string; files: Array<{ name: string; url: string; type?: string }> } {
  let description = "";
  const files: Array<{ name: string; url: string; type?: string }> = [];

  // Extract description from content area
  const contentMatch = /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
  if (contentMatch) {
    description = contentMatch[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
  }

  // Extract PDF/document links
  const filePattern = /<a[^>]*href="([^"]*\.(pdf|doc|docx|xls|xlsx))"[^>]*>([^<]*)<\/a>/gi;
  let fileMatch;
  
  while ((fileMatch = filePattern.exec(html)) !== null) {
    const url = fileMatch[1].startsWith("http") ? fileMatch[1] : `${ARERA_BASE_URL}${fileMatch[1]}`;
    const name = fileMatch[3].trim() || `document.${fileMatch[2]}`;
    
    if (!files.find(f => f.url === url)) {
      files.push({
        name,
        url,
        type: `application/${fileMatch[2]}`,
      });
    }
  }

  return { description, files };
}

async function downloadFile(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to download file: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("Download error:", error);
    return null;
  }
}

async function generateSummary(apiKey: string, title: string, description: string): Promise<string> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Sei un esperto di regolamentazione energetica italiana. Analizza questa delibera ARERA e crea un sommario in esattamente 3 bullet points concisi in italiano.

Titolo: ${title}

Contenuto: ${description.slice(0, 3000)}

Rispondi SOLO con i 3 bullet points, senza introduzioni o conclusioni. Ogni bullet point deve iniziare con "• " e essere su una riga separata.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", await response.text());
      return "";
    }

    const data = await response.json();
    return data.content?.[0]?.text || "";
  } catch (error) {
    console.error("Summary generation error:", error);
    return "";
  }
}
