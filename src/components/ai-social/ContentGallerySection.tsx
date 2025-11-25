import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Trash2, Maximize2, Play, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  media_url: string | null;
  thumbnail_url: string | null;
  prompt: string;
  created_at: string;
  metadata: Record<string, any> | null;
  workflow?: {
    id: string;
    platforms: string[];
  } | null;
}

export function ContentGallerySection() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    loadContent();

    const channel = supabase
      .channel("content-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_social_content",
        },
        () => {
          loadContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterContent();
  }, [content, searchQuery, typeFilter, statusFilter]);

  const loadContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get content with workflow_id from metadata
      const { data: contentData, error } = await supabase
        .from("ai_social_content")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each content, fetch the workflow if it has one
      const contentWithWorkflows = await Promise.all(
        (contentData || []).map(async (item) => {
          const metadata = item.metadata as Record<string, any> | null;
          const workflowId = metadata?.workflow_id;
          if (workflowId) {
            const { data: workflow } = await supabase
              .from("ai_social_workflows")
              .select("id, platforms")
              .eq("id", workflowId)
              .single();
            
            return { ...item, workflow };
          }
          return { ...item, workflow: null };
        })
      );

      setContent(contentWithWorkflows as ContentItem[]);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load content");
    } finally {
      setIsLoading(false);
    }
  };

  const filterContent = () => {
    let filtered = content;

    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredContent(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ai_social_content")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Content deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  };

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading content:", error);
      toast.error("Failed to download content");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "generating":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredContent.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No content found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredContent.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                  {item.status === "completed" && (item.media_url || item.thumbnail_url) ? (
                    <>
                      {item.type === "image" ? (
                        <img
                          src={item.media_url || ""}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <video
                            src={`${item.media_url}#t=0.1`}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                          />
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs font-medium text-white">
                            {item.metadata?.duration || "0:00"}
                          </div>
                        </>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item);
                            setPreviewDialogOpen(true);
                          }}
                        >
                          {item.type === "image" ? <Maximize2 className="h-4 w-4" /> : <Play className="h-5 w-5" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(item.media_url!, item.title)}
                        >
                          <Download className="h-5 w-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </>
                  ) : item.status === "generating" ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Generating...</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                    <Badge className={getStatusColor(item.status)} variant="outline">
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {/* Model badge */}
                    {item.type === "image" ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border backdrop-blur-sm bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                        Nano 🍌
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border backdrop-blur-sm bg-purple-500/10 text-purple-400 border-purple-500/20">
                        Veo3 🎬
                      </span>
                    )}
                    
                    {/* Execution type badge */}
                    {item.workflow ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border backdrop-blur-sm bg-blue-500/10 text-blue-400 border-blue-500/20">
                        ⏰ Schedule
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border backdrop-blur-sm bg-green-500/10 text-green-400 border-green-500/20">
                        ▶️ Run Now
                      </span>
                    )}
                    
                    {/* Social platforms badges */}
                    {item.workflow?.platforms?.map((platform: string) => (
                      <span key={platform} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border backdrop-blur-sm capitalize bg-pink-500/10 text-pink-400 border-pink-500/20">
                        {platform === "instagram" && "📷 "}
                        {platform === "facebook" && "👍 "}
                        {platform === "twitter" && "🐦 "}
                        {platform === "linkedin" && "💼 "}
                        {platform}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedItem && handleDelete(selectedItem.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem?.type === "image" ? (
              <img
                src={selectedItem?.media_url || ""}
                alt={selectedItem?.title}
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <video
                src={selectedItem?.media_url || ""}
                controls
                className="w-full h-auto rounded-lg"
              />
            )}
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Prompt:</p>
                <p className="text-sm text-muted-foreground">{selectedItem?.prompt}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedItem && format(new Date(selectedItem.created_at), "PPpp")}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
