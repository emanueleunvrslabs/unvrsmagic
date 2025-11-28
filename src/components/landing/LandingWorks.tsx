import { ArrowUpRight } from "lucide-react";

const projects = [
  { title: "WAA", link: "#" },
  { title: "AI Call", link: "#" },
  { title: "Future", link: "#" },
];

export function LandingWorks() {
  return (
    <section id="works" className="relative py-32 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-5xl md:text-7xl font-black tracking-[0.3em] text-white mb-20 text-center">
          WORKS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <a
              key={index}
              href={project.link}
              className="group relative aspect-[4/5] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden hover:bg-white/10 transition-all duration-500"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-wider">
                  {project.title}
                </h3>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors flex items-center gap-2">
                  View Work
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
