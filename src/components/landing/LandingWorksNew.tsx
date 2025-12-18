import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  route: string;
}

export function LandingWorksNew() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("marketplace_projects")
        .select("id, name, description, icon, route")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
    };

    fetchProjects();
  }, []);

  return (
    <section id="works" className="py-32 bg-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6">
        <div className="mb-16">
          <p
            className="text-white/60 text-sm mb-4 tracking-wider"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Our Solutions
          </p>
          <h2
            className="text-5xl md:text-7xl font-bold text-white"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Magic AI
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="liquid-glass-card liquid-glass-interactive liquid-glass-specular overflow-hidden cursor-pointer group"
              onClick={() => window.location.href = `/project/${project.route.replace('/', '')}`}
            >
              {/* Image area */}
              <div className="aspect-video overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20" />
                {project.icon ? (
                  <img
                    src={project.icon}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span 
                      className="text-6xl text-white/60"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {project.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content area */}
              <div className="p-6 relative z-10">
                <div className="absolute top-4 right-4">
                  <div className="liquid-glass-pill flex items-center gap-1 px-3 py-1.5 text-white/80 group-hover:text-white group-hover:bg-white/10 transition-all">
                    <span className="text-xs font-medium" style={{ fontFamily: "Orbitron, sans-serif" }}>View</span>
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 pr-20 group-hover:text-white/90 transition-colors" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {project.name}
                </h3>
                <p className="text-white/60 text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {project.description || "Enterprise solution"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
