import "../labs/SocialMediaCard.css";
import { FileText, Calendar, Download, ExternalLink } from "lucide-react";
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
  };
}

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
    <div className="social-media-card expanded-lateral" style={{ height: 'auto', minHeight: '12em', maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <div className="flex items-start justify-between w-full px-6 pt-6 pb-4 absolute top-0 left-0 right-0 z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border backdrop-blur-sm bg-primary/10 text-primary border-primary/20 font-semibold">
              {delibera.delibera_code}
            </span>
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
          <h2 className="text-sm font-bold text-white line-clamp-2">{delibera.title}</h2>
        </div>
        {delibera.detail_url && (
          <a
            href={delibera.detail_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-blue-400 text-xs font-semibold hover:bg-white/10 transition-all flex items-center gap-1.5 flex-shrink-0 ml-4"
          >
            <ExternalLink className="h-3 w-3" />
            ARERA
          </a>
        )}
      </div>
      
      {/* Main Content */}
      <div className="card-main-content" style={{ width: '8em', paddingTop: '5em' }}>
        <FileText className="w-12 h-12 text-primary/60" />
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col justify-start p-6 pt-16 pb-6 h-full w-full flex-1 overflow-hidden">
        {/* Summary */}
        {delibera.summary && (
          <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">AI Summary</p>
            <p className="text-xs text-white/80 whitespace-pre-line line-clamp-4">{delibera.summary}</p>
          </div>
        )}
        
        {/* Files */}
        {delibera.files && delibera.files.length > 0 && (
          <div>
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
                  {file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
