import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooterNew } from "@/components/landing/LandingFooterNew";

interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  route: string;
}

const projectFeatures: Record<string, string[]> = {
  "ai-social": [
    "AI-powered image generation with Nano Banana Pro",
    "Video generation with Veo3.1 model",
    "Multi-platform social media publishing",
    "Automated workflow scheduling",
    "Real-time content gallery",
    "OpenAI prompt enhancement",
  ],
  "ai-art": [
    "Professional image generation powered by Nano Banana 2",
    "High-quality video creation with Veo3.1 Fast",
    "Multiple generation modes (text-to-image, image-to-image, text-to-video)",
    "Advanced aspect ratio and resolution controls",
    "First/last frame video generation support",
    "Reference-based video creation",
  ],
  "nkmt": [
    "Advanced AI trading agents",
    "Real-time market data analysis",
    "Risk management system",
    "Multi-exchange support",
    "Automated trading strategies",
    "Performance tracking dashboard",
  ],
};

const projectScreenshots: Record<string, string[]> = {
  "ai-social": [
    "/images/ai-social-dashboard.jpg",
    "/images/ai-social-content.jpg",
    "/images/ai-social-workflows.jpg",
  ],
  "ai-art": [
    "/images/ai-art-image-gen.jpg",
    "/images/ai-art-video-gen.jpg",
    "/images/ai-art-gallery.jpg",
  ],
  "nkmt": [
    "/images/nkmt-dashboard.jpg",
    "/images/nkmt-agents.jpg",
    "/images/nkmt-analytics.jpg",
  ],
};

const projectPricing: Record<string, { item: string; price: string }[]> = {
  "ai-art": [
    { item: "Image Generation", price: "€1" },
    { item: "Video Generation", price: "€10" },
  ],
  "ai-social": [
    { item: "Image Generation", price: "€1" },
    { item: "Video Generation", price: "€10" },
  ],
};

const projectHowItWorks: Record<string, { step: string; description: string }[]> = {
  "ai-social": [
    {
      step: "Create Content",
      description: "Generate stunning images and videos using AI-powered tools with simple text prompts.",
    },
    {
      step: "Customize & Edit",
      description: "Fine-tune your content with various parameters like aspect ratio, resolution, and style.",
    },
    {
      step: "Schedule & Publish",
      description: "Set up automated workflows to publish content across multiple social media platforms.",
    },
  ],
  "ai-art": [
    {
      step: "Choose Your Mode",
      description: "Select from multiple generation modes: text-to-image, image-to-image, or video creation with Nano Banana 2 and Veo3.1 Fast.",
    },
    {
      step: "Configure & Generate",
      description: "Set your desired parameters like aspect ratio, resolution, and style. Enter your creative prompt and let AI bring your vision to life.",
    },
    {
      step: "Download & Use",
      description: "Access your generated content instantly from the gallery. Download high-quality images and videos for your creative projects.",
    },
  ],
  "nkmt": [
    {
      step: "Connect Exchanges",
      description: "Link your trading accounts from supported exchanges securely.",
    },
    {
      step: "Configure Agents",
      description: "Set up AI agents with custom parameters and risk management rules.",
    },
    {
      step: "Monitor & Optimize",
      description: "Track performance in real-time and optimize strategies based on market data.",
    },
  ],
};

export default function PublicProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("marketplace_projects")
        .select("id, name, description, icon, route")
        .eq("route", `/${projectId}`)
        .eq("published", true)
        .maybeSingle();

      if (!error && data) {
        setProject(data);
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          className="liquid-glass-pill p-6"
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-8 h-8 text-white/60" />
        </motion.div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="liquid-glass-card p-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Project Not Found
          </h1>
          <Link to="/" className="text-white/60 hover:text-white transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const features = projectFeatures[projectId || ""] || [];
  const howItWorks = projectHowItWorks[projectId || ""] || [];
  const screenshots = projectScreenshots[projectId || ""] || [];
  const pricing = projectPricing[projectId || ""] || [];

  return (
    <div className="min-h-screen bg-black">
      <LandingNav showBack backTo="/#works" />

      {/* Hero Section with Liquid Glass */}
      <section className="pt-32 pb-20 bg-black relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Image */}
            {project.icon && (
              <div className="liquid-glass-card liquid-glass-specular overflow-hidden mb-12 max-w-3xl mx-auto">
                <img 
                  src={project.icon} 
                  alt={project.name}
                  className="w-full h-[400px] object-cover"
                />
              </div>
            )}

            <h1
              className="text-5xl md:text-7xl font-bold text-white mb-6"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {project.name}
            </h1>

            <p 
              className="text-xl text-white/60 mb-12 max-w-2xl mx-auto"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {project.description}
            </p>

            <Link
              to="/auth"
              className="liquid-glass-btn inline-flex items-center gap-2 px-12 py-4 text-lg font-semibold hover:scale-105 transition-transform"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <Sparkles size={20} />
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section with Liquid Glass Cards */}
      {features.length > 0 && (
        <section className="py-24 bg-black relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <p
                className="text-white/60 text-sm mb-4 tracking-wider"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                What's Included
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold text-white"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Key Features
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="liquid-glass-card liquid-glass-interactive p-6 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="liquid-glass-pill flex-shrink-0 w-10 h-10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                      <Check size={18} className="text-white/80" />
                    </div>
                    <p
                      className="text-white/80 text-base leading-relaxed pt-2"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {feature}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Screenshots Section with Liquid Glass */}
      {screenshots.length > 0 && (
        <section className="py-24 bg-black relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <p
                className="text-white/60 text-sm mb-4 tracking-wider"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Platform Preview
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold text-white"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Dashboard Preview
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {screenshots.map((screenshot, index) => (
                <div
                  key={index}
                  className="liquid-glass-card liquid-glass-interactive liquid-glass-specular overflow-hidden group"
                >
                  <img
                    src={screenshot}
                    alt={`${project.name} screenshot ${index + 1}`}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section with Liquid Glass */}
      {pricing.length > 0 && (
        <section className="py-24 bg-black relative overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <p
                className="text-white/60 text-sm mb-4 tracking-wider"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Simple & Transparent
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold text-white"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Pricing
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="liquid-glass-card liquid-glass-specular p-8">
                <h3
                  className="text-2xl font-semibold text-white mb-4"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Usage-Based Billing
                </h3>
                <p
                  className="text-white/60 mb-8 leading-relaxed"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Pay only for what you generate. Costs are calculated based on actual content created.
                </p>
                <div className="space-y-4">
                  {pricing.map((item, index) => (
                    <div
                      key={index}
                      className="liquid-glass-pill flex items-center justify-between p-4"
                    >
                      <span
                        className="text-white/80 text-lg"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        {item.item}
                      </span>
                      <span
                        className="text-white font-semibold text-xl"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section with Liquid Glass */}
      {howItWorks.length > 0 && (
        <section className="py-24 bg-black relative overflow-hidden">
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <p
                className="text-white/60 text-sm mb-4 tracking-wider"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Getting Started
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold text-white"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                How It Works
              </h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {howItWorks.map((item, index) => (
                <div
                  key={index}
                  className="liquid-glass-card liquid-glass-interactive p-6 flex gap-6"
                >
                  <div className="flex-shrink-0">
                    <div
                      className="liquid-glass-pill w-14 h-14 flex items-center justify-center text-white font-bold text-xl"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3
                      className="text-2xl font-semibold text-white mb-3"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {item.step}
                    </h3>
                    <p
                      className="text-white/60 text-lg leading-relaxed"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section with Liquid Glass */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="liquid-glass-card liquid-glass-specular max-w-3xl mx-auto p-12 text-center">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Ready to Get Started?
            </h2>
            <p
              className="text-xl text-white/60 mb-8"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Join thousands of users already using {project.name} to transform their workflow.
            </p>
            <Link
              to="/auth"
              className="liquid-glass-btn inline-flex items-center gap-2 px-12 py-4 text-lg font-semibold hover:scale-105 transition-transform"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <Sparkles size={20} />
              Start Now
            </Link>
          </div>
        </div>
      </section>

      <LandingFooterNew />
    </div>
  );
}
