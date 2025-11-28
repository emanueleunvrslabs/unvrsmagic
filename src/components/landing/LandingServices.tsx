import { ArrowUpRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const services = [
  {
    title: "CLOUD & AUTOMATION",
    description: "Secure cloud solutions and advanced automations that ensure efficiency, flexibility, and reliability.",
    link: "#"
  },
  {
    title: "APP & WEB SOLUTIONS",
    description: "From mobile apps to web platforms, we create intuitive digital experiences tailored to your business.",
    link: "#"
  },
  {
    title: "AI INTEGRATIONS",
    description: "We connect your systems with Artificial Intelligence to automate workflows and unlock smarter decisions.",
    link: "#"
  },
  {
    title: "SOFTWARE DEVELOPMENT",
    description: "We design and build custom enterprise software to streamline operations and boost scalability.",
    link: "#"
  }
];

export function LandingServices() {
  const { ref, isVisible } = useScrollReveal();
  
  return (
    <section 
      ref={ref}
      id="services" 
      className={`relative py-32 bg-black transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
      }`}
    >
      <div className="container mx-auto px-6">
        <h2 className="text-5xl md:text-7xl font-black tracking-[0.3em] text-white mb-20 text-center">
          SERVICES
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <a
              key={index}
              href={service.link}
              className="group relative p-8 md:p-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500"
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-wide">
                    {service.title}
                  </h3>
                  <p className="text-sm md:text-base text-white/70 font-light leading-relaxed">
                    {service.description}
                  </p>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <ArrowUpRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
