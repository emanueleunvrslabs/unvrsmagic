import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  route: string;
}

export function LandingWorksNew() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
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
    <section id="works" ref={ref} className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold text-white text-center mb-16"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Progetti
        </motion.h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/30 transition-all cursor-pointer"
            >
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                {project.icon ? (
                  <img
                    src={project.icon}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-6xl" style={{ fontFamily: "Orbitron, sans-serif" }}>
                    {project.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {project.name}
                </h3>
                <p className="text-white/60 mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {project.description || "Soluzione aziendale"}
                </p>
                <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                  <span className="text-sm font-medium" style={{ fontFamily: "Orbitron, sans-serif" }}>Vedi Progetto</span>
                  <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
