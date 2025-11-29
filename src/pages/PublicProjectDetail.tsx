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
  const screenshots = projectScreenshots[projectId || ""] || [];
  const pricing = projectPricing[projectId || ""] || [];

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
            <h1
              className="text-5xl md:text-7xl font-bold text-white mb-12"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {project.name}
            </h1>

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

      {/* Screenshots Section */}
      {screenshots.length > 0 && (
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
              Dashboard Preview
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {screenshots.map((screenshot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  className="group relative overflow-hidden rounded-xl border border-white/10 hover:border-white/30 transition-all"
                >
                  <img
                    src={screenshot}
                    alt={`${project.name} screenshot ${index + 1}`}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {pricing.length > 0 && (
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
              Pricing
            </motion.h2>

            <div className="max-w-2xl mx-auto">
              <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <h3
                  className="text-2xl font-semibold text-white mb-6"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Usage-Based Billing
                </h3>
                <p
                  className="text-white/70 mb-8 leading-relaxed"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Pay only for what you generate. Costs are calculated based on actual content created.
                </p>
                <div className="space-y-4">
                  {pricing.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
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
