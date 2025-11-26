"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Mic, Sparkles, Settings, Trash2, Play, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface Avatar {
  id: string
  name: string
  description: string | null
  heygen_avatar_id: string
  voice_id: string | null
  personality: string
  thumbnail_url: string | null
  created_at: string
}

interface HeyGenAvatar {
  avatar_id: string
  avatar_name: string
  preview_image_url: string
  gender: string
}

const PERSONALITIES = [
  { value: "friendly", label: "Friendly & Warm" },
  { value: "professional", label: "Professional & Formal" },
  { value: "energetic", label: "Energetic & Enthusiastic" },
  { value: "calm", label: "Calm & Soothing" },
  { value: "humorous", label: "Humorous & Playful" },
]

export default function AvatarStudio() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [heygenAvatars, setHeygenAvatars] = useState<HeyGenAvatar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingHeyGen, setIsLoadingHeyGen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [selectedHeyGenAvatar, setSelectedHeyGenAvatar] = useState<string>("")
  const [avatarName, setAvatarName] = useState("")
  const [avatarDescription, setAvatarDescription] = useState("")
  const [selectedVoice, setSelectedVoice] = useState("")
  const [selectedPersonality, setSelectedPersonality] = useState("friendly")
  const [openingScript, setOpeningScript] = useState("")
  const [closingScript, setClosingScript] = useState("")

  // Load user avatars
  useEffect(() => {
    loadAvatars()
  }, [])

  const loadAvatars = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('ai_avatars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAvatars(data || [])
    } catch (error) {
      console.error("Error loading avatars:", error)
      toast.error("Failed to load avatars")
    } finally {
      setIsLoading(false)
    }
  }

  const loadHeyGenAvatars = async () => {
    setIsLoadingHeyGen(true)
    try {
      const { data, error } = await supabase.functions.invoke('heygen-avatars')
      
      if (error) throw error
      
      if (data?.avatars) {
        setHeygenAvatars(data.avatars)
      }
    } catch (error) {
      console.error("Error loading HeyGen avatars:", error)
      toast.error("Failed to load HeyGen avatars. Make sure HeyGen API key is configured.")
    } finally {
      setIsLoadingHeyGen(false)
    }
  }

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true)
    if (heygenAvatars.length === 0) {
      loadHeyGenAvatars()
    }
  }

  const handleCreateAvatar = async () => {
    if (!selectedHeyGenAvatar || !avatarName) {
      toast.error("Please select an avatar and enter a name")
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const selectedAvatar = heygenAvatars.find(a => a.avatar_id === selectedHeyGenAvatar)

      const { error } = await supabase
        .from('ai_avatars')
        .insert({
          user_id: user.id,
          heygen_avatar_id: selectedHeyGenAvatar,
          name: avatarName,
          description: avatarDescription || null,
          voice_id: selectedVoice || null,
          personality: selectedPersonality,
          thumbnail_url: selectedAvatar?.preview_image_url || null,
          opening_script: openingScript || null,
          closing_script: closingScript || null,
        })

      if (error) throw error

      toast.success("Avatar created successfully!")
      setIsCreateDialogOpen(false)
      resetForm()
      loadAvatars()
    } catch (error) {
      console.error("Error creating avatar:", error)
      toast.error("Failed to create avatar")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAvatar = async (avatarId: string) => {
    try {
      const { error } = await supabase
        .from('ai_avatars')
        .delete()
        .eq('id', avatarId)

      if (error) throw error

      toast.success("Avatar deleted")
      loadAvatars()
    } catch (error) {
      console.error("Error deleting avatar:", error)
      toast.error("Failed to delete avatar")
    }
  }

  const resetForm = () => {
    setSelectedHeyGenAvatar("")
    setAvatarName("")
    setAvatarDescription("")
    setSelectedVoice("")
    setSelectedPersonality("friendly")
    setOpeningScript("")
    setClosingScript("")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Avatar Studio</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your Interactive AI avatars for live streaming
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Avatar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Interactive Avatar</DialogTitle>
                <DialogDescription>
                  Select a HeyGen Interactive Avatar for real-time streaming (only streaming-compatible avatars are shown)
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* HeyGen Avatar Selection */}
                <div className="space-y-3">
                  <Label>Select Avatar</Label>
                  {isLoadingHeyGen ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading avatars...</span>
                    </div>
                  ) : heygenAvatars.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto">
                      {heygenAvatars.map((avatar) => (
                        <div
                          key={avatar.avatar_id}
                          className={`relative cursor-pointer rounded-lg border-2 p-1 transition-all ${
                            selectedHeyGenAvatar === avatar.avatar_id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedHeyGenAvatar(avatar.avatar_id)}
                        >
                          <img
                            src={avatar.preview_image_url}
                            alt={avatar.avatar_name}
                            className="w-full aspect-square object-cover rounded"
                          />
                          <p className="text-xs text-center mt-1 truncate">{avatar.avatar_name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No avatars available</p>
                      <p className="text-sm">Make sure HeyGen API key is configured in Settings</p>
                    </div>
                  )}
                </div>

                {/* Avatar Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Avatar Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter a name for your avatar"
                    value={avatarName}
                    onChange={(e) => setAvatarName(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your avatar's purpose..."
                    value={avatarDescription}
                    onChange={(e) => setAvatarDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Personality */}
                <div className="space-y-2">
                  <Label>Personality</Label>
                  <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select personality" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSONALITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Scripts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="opening">Opening Script (optional)</Label>
                    <Textarea
                      id="opening"
                      placeholder="What the avatar says when starting a live..."
                      value={openingScript}
                      onChange={(e) => setOpeningScript(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closing">Closing Script (optional)</Label>
                    <Textarea
                      id="closing"
                      placeholder="What the avatar says when ending a live..."
                      value={closingScript}
                      onChange={(e) => setClosingScript(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleCreateAvatar}
                  disabled={isSaving || !selectedHeyGenAvatar || !avatarName}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Avatar
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Avatars Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : avatars.length === 0 ? (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No avatars yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first AI avatar to start live streaming
              </p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Avatar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {avatars.map((avatar) => (
              <Card key={avatar.id} className="bg-card/50 overflow-hidden group">
                <div className="relative aspect-square bg-muted">
                  {avatar.thumbnail_url ? (
                    <img
                      src={avatar.thumbnail_url}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary">
                      <Play className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{avatar.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {avatar.description || "No description"}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAvatar(avatar.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary/80 border-primary/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {PERSONALITIES.find(p => p.value === avatar.personality)?.label || avatar.personality}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
