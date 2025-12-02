import "../labs/SocialMediaCard.css";
import { FileText, Calendar, Download, ExternalLink, Zap, Flame, Droplets, Trash2, Thermometer, Building } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface DeliberaFile {
  name: string;
  url: string;
  originalUrl?: string;
}

interface DeliberaCardProps {
  delibera: {
    id: string;
    delibera_code: string;
    publication_date: string | null;
    title: string;
    description: string | null;
    summary: string | null;
    detail_url: string | null;
    files: DeliberaFile[];
    status: string;
    category?: string;
  };
}

const getCategoryConfig = (category: string | undefined) => {
  switch (category) {
    case 'elettricita':
      return { label: 'Elettricità', icon: Zap, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'gas':
      return { label: 'Gas', icon: Flame, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'acqua':
      return { label: 'Acqua', icon: Droplets, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    case 'rifiuti':
      return { label: 'Rifiuti', icon: Trash2, color: 'bg-green-500/10 text-green-400 border-green-500/20' };
    case 'teleriscaldamento':
      return { label: 'Teleriscaldamento', icon: Thermometer, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    case 'generale':
    default:
      return { label: 'Generale', icon: Building, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  }
};

export function DeliberaCard({ delibera }: DeliberaCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-green-500/10 text-green-400 border-green-500/20">
            ✓ Completed
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse">
            ⏳ Processing
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-red-500/10 text-red-400 border-red-500/20">
            ✗ Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-gray-500/10 text-gray-400 border-gray-500/20">
            Pending
          </span>
        );
    }
  };

  return (
    <div 
      className="social-media-card" 
      style={{ 
        width: '100%', 
        height: 'auto', 
        minHeight: 'auto',
        flexDirection: 'column',
        cursor: 'default'
      }}
    >
      {/* Badges Row */}
      <div className="flex items-center justify-between w-full px-5 pt-5 pb-3 z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-primary/10 text-primary border-primary/20 font-semibold">
            {delibera.delibera_code}
          </span>
          {(() => {
            const categoryConfig = getCategoryConfig(delibera.category);
            const CategoryIcon = categoryConfig.icon;
            return (
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm ${categoryConfig.color}`}>
                <CategoryIcon className="h-3 w-3" />
                {categoryConfig.label}
              </span>
            );
          })()}
          {getStatusBadge(delibera.status)}
          {delibera.publication_date && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-blue-500/10 text-blue-400 border-blue-500/20">
              <Calendar className="h-3 w-3" />
              {format(new Date(delibera.publication_date), "d MMM yyyy", { locale: it })}
            </span>
          )}
          {delibera.files && delibera.files.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Download className="h-3 w-3" />
              {delibera.files.length} files
            </span>
          )}
        </div>
        {delibera.detail_url && (
          <a
            href={delibera.detail_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-blue-400 text-xs font-semibold hover:bg-white/10 transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
            ARERA
          </a>
        )}
      </div>

      {/* Title */}
      <div className="px-5 pb-3">
        <h3 className="text-sm font-semibold text-white">{delibera.title}</h3>
      </div>
      
      {/* Summary */}
      {delibera.summary && (
        <div className="mx-5 mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">AI Summary</p>
          <p className="text-xs text-white/80 whitespace-pre-line">{delibera.summary}</p>
        </div>
      )}
      
      {/* Files */}
      {delibera.files && delibera.files.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-400 mb-2">Attached Files</p>
          <div className="flex flex-wrap gap-2">
            {delibera.files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <FileText className="h-3 w-3" />
                {file.name.length > 30 ? `${file.name.slice(0, 30)}...` : file.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
