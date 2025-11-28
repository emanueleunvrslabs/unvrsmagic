import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
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
  "nkmt": [
    "Advanced AI trading agents",
    "Real-time market data analysis",
    "Risk management system",
    "Multi-exchange support",
    "Automated trading strategies",
    "Performance tracking dashboard",
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
  const navigate = useNavigate();
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Project Not Found</h1>
          <Link to="/" className="text-white/60 hover:text-white">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const features = projectFeatures[projectId || ""] || [];
  const howItWorks = projectHowItWorks[projectId || ""] || [];

  return (
    <div className="min-h-screen bg-black">
      <LandingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-black">
        <div className="container mx-auto px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span style={{ fontFamily: "Orbitron, sans-serif" }}>Back</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            {project.icon && (
              <div className="mb-8 flex justify-center">
                <img
                  src={project.icon}
                  alt={project.name}
                  className="w-full max-w-2xl h-64 object-cover rounded-2xl"
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
              className="text-xl md:text-2xl text-white/70 mb-12 leading-relaxed"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {project.description}
            </p>

            <Link
              to="/auth"
              className="inline-block px-12 py-4 bg-white text-black text-lg font-semibold rounded-full hover:bg-white/90 transition-all hover:scale-105"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      {features.length > 0 && (
        <section className="py-20 bg-black border-t border-white/10">
          <div className="container mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Key Features
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-1">
                      <Check size={16} className="text-white" />
                    </div>
                    <p
                      className="text-white/80 text-base leading-relaxed"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {feature}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      {howItWorks.length > 0 && (
        <section className="py-20 bg-black border-t border-white/10">
          <div className="container mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              How It Works
            </motion.h2>

            <div className="max-w-4xl mx-auto space-y-12">
              {howItWorks.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xl"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3
                      className="text-2xl font-semibold text-white mb-3"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {item.step}
                    </h3>
                    <p
                      className="text-white/70 text-lg leading-relaxed"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-black border-t border-white/10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Ready to Get Started?
            </h2>
            <p
              className="text-xl text-white/70 mb-8"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Join thousands of users already using {project.name} to transform their workflow.
            </p>
            <Link
              to="/auth"
              className="inline-block px-12 py-4 bg-white text-black text-lg font-semibold rounded-full hover:bg-white/90 transition-all hover:scale-105"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Start Now
            </Link>
          </motion.div>
        </div>
      </section>

      <LandingFooterNew />
    </div>
  );
}
