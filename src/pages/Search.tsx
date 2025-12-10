import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Building2, FolderKanban, FileText, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

interface SearchResult {
  id: string;
  type: "project" | "client" | "delibera" | "workflow";
  title: string;
  subtitle?: string;
  route: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { isOwner } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search marketplace projects
        const { data: projects } = await supabase
          .from("marketplace_projects")
          .select("id, name, description, route")
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        if (projects) {
          projects.forEach((p) => {
            searchResults.push({
              id: p.id,
              type: "project",
              title: p.name,
              subtitle: p.description || undefined,
              route: p.route,
            });
          });
        }

        // Search clients (owner only)
        if (isOwner) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id, company_name, vat_number, city")
            .or(`company_name.ilike.%${query}%,vat_number.ilike.%${query}%`)
            .limit(5);

          if (clients) {
            clients.forEach((c) => {
              searchResults.push({
                id: c.id,
                type: "client",
                title: c.company_name,
                subtitle: `${c.vat_number} • ${c.city}`,
                route: "/admin/clients",
              });
            });
          }

          // Search delibere ARERA
          const { data: delibere } = await supabase
            .from("arera_delibere")
            .select("id, delibera_code, title")
            .or(`title.ilike.%${query}%,delibera_code.ilike.%${query}%`)
            .limit(5);

          if (delibere) {
            delibere.forEach((d) => {
              searchResults.push({
                id: d.id,
                type: "delibera",
                title: d.delibera_code,
                subtitle: d.title,
                route: "/delibere-arera",
              });
            });
          }
        }

        // Search workflows
        const { data: workflows } = await supabase
          .from("ai_social_workflows")
          .select("id, name, description, content_type")
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        if (workflows) {
          workflows.forEach((w) => {
            searchResults.push({
              id: w.id,
              type: "workflow",
              title: w.name,
              subtitle: `${w.content_type} workflow`,
              route: "/ai-social/workflows",
            });
          });
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, isOwner]);

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    navigate(result.route);
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "project":
        return <FolderKanban className="h-5 w-5" />;
      case "client":
        return <Building2 className="h-5 w-5" />;
      case "delibera":
        return <FileText className="h-5 w-5" />;
      case "workflow":
        return <Users className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "project":
        return "Project";
      case "client":
        return "Client";
      case "delibera":
        return "Delibera";
      case "workflow":
        return "Workflow";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
          <Input
            type="text"
            placeholder="Search projects, clients, workflows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-14 text-lg bg-white/5 border-white/10 rounded-xl focus:border-[#0a84ff] focus:ring-[#0a84ff]/20"
            autoFocus
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 animate-spin" />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-white/50 mb-4">{results.length} results</p>
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/70">
                  {getIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white/90 truncate">{result.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  {result.subtitle && (
                    <p className="text-sm text-white/50 truncate">{result.subtitle}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {query.length >= 2 && results.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No results found for "{query}"</p>
          </div>
        )}

        {/* Recent Searches */}
        {query.length < 2 && recentSearches.length > 0 && (
          <div>
            <p className="text-sm text-white/50 mb-4">Recent searches</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(search)}
                  className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 transition-all"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        {query.length < 2 && (
          <div className="mt-8">
            <p className="text-sm text-white/50 mb-4">Quick links</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/marketplace")}
                className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left"
              >
                <FolderKanban className="h-5 w-5 text-white/70" />
                <span className="text-white/90">Marketplace</span>
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={() => navigate("/admin/clients")}
                    className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left"
                  >
                    <Building2 className="h-5 w-5 text-white/70" />
                    <span className="text-white/90">Clients</span>
                  </button>
                  <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left"
                  >
                    <Users className="h-5 w-5 text-white/70" />
                    <span className="text-white/90">Dashboard</span>
                  </button>
                </>
              )}
              <button
                onClick={() => navigate("/wallet")}
                className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left"
              >
                <FileText className="h-5 w-5 text-white/70" />
                <span className="text-white/90">Wallet</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
