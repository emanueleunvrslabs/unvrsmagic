import React from "react";

interface WorkflowBadgeProps {
  type: "openai" | "nano" | "veo3" | "instagram" | "linkedin" | "facebook" | "twitter";
  isActive?: boolean;
}

const badgeStyles = {
  openai: {
    active: "bg-emerald-500/30 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    inactive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  nano: {
    active: "bg-yellow-500/30 text-yellow-300 border-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.5)]",
    inactive: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  veo3: {
    active: "bg-purple-500/30 text-purple-300 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
    inactive: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  instagram: {
    active: "bg-pink-500/30 text-pink-300 border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.5)]",
    inactive: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  linkedin: {
    active: "bg-[#0A66C2]/30 text-[#0A66C2] border-[#0A66C2]/50 shadow-[0_0_15px_rgba(10,102,194,0.5)]",
    inactive: "bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20",
  },
  facebook: {
    active: "bg-blue-500/30 text-blue-300 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    inactive: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  twitter: {
    active: "bg-sky-500/30 text-sky-300 border-sky-400/50 shadow-[0_0_15px_rgba(14,165,233,0.5)]",
    inactive: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
};

const badgeIcons: Record<string, React.ReactNode> = {
  openai: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
    </svg>
  ),
  instagram: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  linkedin: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  ),
};

const badgeLabels: Record<string, string> = {
  openai: "OpenAI",
  nano: "Nano 🍌",
  veo3: "Veo3 🎬",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  twitter: "Twitter",
};

export function WorkflowBadge({ type, isActive = false }: WorkflowBadgeProps) {
  const styles = badgeStyles[type] || badgeStyles.instagram;
  const className = isActive ? styles.active : styles.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm transition-all duration-300 ${className}`}
      style={isActive ? { animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}
    >
      {badgeIcons[type]}
      {badgeLabels[type]}
    </span>
  );
}
