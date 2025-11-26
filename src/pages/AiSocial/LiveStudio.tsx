"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Play, 
  Square, 
  User, 
  MessageSquare, 
  Users, 
  Clock, 
  Loader2,
  Radio,
  ShoppingBag,
  Settings,
  Mic,
  MicOff
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface Avatar {
  id: string
  name: string
  thumbnail_url: string | null
  personality: string
}

interface LiveSession {
  id: string
  status: string
  started_at: string | null
  viewer_count: number
  total_comments: number
  platforms: string[]
}

interface Comment {
  id: string
  commenter_name: string
  comment_text: string
  platform: string
  response_text: string | null
  created_at: string
}

const PLATFORMS = [
  { id: "tiktok", label: "TikTok Live", color: "bg-pink-500" },
  { id: "instagram", label: "Instagram Live", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { id: "youtube", label: "YouTube Live", color: "bg-red-500" },
]

export default function LiveStudio() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<string>("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Load avatars
  useEffect(() => {
    loadAvatars()
  }, [])

  // Timer for live session
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLive && currentSession?.started_at) {
      interval = setInterval(() => {
        const start = new Date(currentSession.started_at!).getTime()
        const now = Date.now()
        setElapsedTime(Math.floor((now - start) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLive, currentSession?.started_at])

  const loadAvatars = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('ai_avatars')
        .select('id, name, thumbnail_url, personality')
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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const handleStartLive = async () => {
    if (!selectedAvatar) {
      toast.error("Please select an avatar")
      return
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    setIsStarting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create live session
      const { data: session, error } = await supabase
        .from('ai_live_sessions')
        .insert({
          user_id: user.id,
          avatar_id: selectedAvatar,
          platforms: selectedPlatforms,
          status: 'live',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Start HeyGen streaming session
      const { data: streamData, error: streamError } = await supabase.functions.invoke('heygen-session', {
        body: {
          action: 'start',
          avatarId: selectedAvatar,
          sessionId: session.id,
        }
      })

      if (streamError) {
        // Rollback session creation
        await supabase.from('ai_live_sessions').delete().eq('id', session.id)
        throw streamError
      }

      setCurrentSession(session)
      setIsLive(true)
      setElapsedTime(0)
      toast.success("Live stream started!")
    } catch (error) {
      console.error("Error starting live:", error)
      toast.error("Failed to start live stream. Make sure HeyGen API is configured.")
    } finally {
      setIsStarting(false)
    }
  }

  const handleStopLive = async () => {
    if (!currentSession) return

    try {
      // Stop HeyGen session
      await supabase.functions.invoke('heygen-session', {
        body: {
          action: 'stop',
          sessionId: currentSession.id,
        }
      })

      // Update session status
      await supabase
        .from('ai_live_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentSession.id)

      setIsLive(false)
      setCurrentSession(null)
      setComments([])
      toast.success("Live stream ended")
    } catch (error) {
      console.error("Error stopping live:", error)
      toast.error("Failed to stop live stream")
    }
  }

  const selectedAvatarData = avatars.find(a => a.id === selectedAvatar)

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col p-6 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Studio</h1>
            <p className="text-muted-foreground mt-1">
              Go live with your AI avatar
            </p>
          </div>
          {isLive && (
            <div className="flex items-center gap-4">
              <Badge variant="destructive" className="animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Video Preview Area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className="flex-1 bg-card/50 overflow-hidden">
              <div className="relative w-full h-full min-h-[400px] bg-black flex items-center justify-center">
                {isLive ? (
                  <>
                    {/* Live video would be rendered here via LiveKit/WebRTC */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {selectedAvatarData?.thumbnail_url ? (
                        <img 
                          src={selectedAvatarData.thumbnail_url} 
                          alt="Avatar"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <User className="h-32 w-32 text-muted-foreground/30" />
                      )}
                    </div>
                    {/* Live overlay */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <Badge variant="destructive">
                        <Radio className="h-3 w-3 mr-1 animate-pulse" />
                        LIVE
                      </Badge>
                      <Badge variant="secondary" className="bg-black/50">
                        <Users className="h-3 w-3 mr-1" />
                        {currentSession?.viewer_count || 0}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <User className="h-24 w-24 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Select an avatar and go live</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Controls */}
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {!isLive ? (
                      <>
                        <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Avatar" />
                          </SelectTrigger>
                          <SelectContent>
                            {avatars.map((avatar) => (
                              <SelectItem key={avatar.id} value={avatar.id}>
                                <div className="flex items-center gap-2">
                                  {avatar.thumbnail_url ? (
                                    <img src={avatar.thumbnail_url} className="h-6 w-6 rounded-full object-cover" />
                                  ) : (
                                    <User className="h-6 w-6" />
                                  )}
                                  {avatar.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          {PLATFORMS.map((platform) => (
                            <Button
                              key={platform.id}
                              variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => togglePlatform(platform.id)}
                            >
                              {platform.label}
                            </Button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon">
                          <ShoppingBag className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isLive ? (
                      <Button 
                        onClick={handleStartLive}
                        disabled={isStarting || !selectedAvatar || selectedPlatforms.length === 0}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isStarting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Go Live
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStopLive}
                        variant="destructive"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        End Live
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Panel */}
          <Card className="bg-card/50 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Comments
                </CardTitle>
                {currentSession && (
                  <Badge variant="secondary">
                    {currentSession.total_comments} total
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <ScrollArea className="h-full px-4 pb-4">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center">
                      {isLive ? "Waiting for comments..." : "Comments will appear here when live"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {comment.platform}
                          </Badge>
                          <div>
                            <span className="font-medium text-sm">{comment.commenter_name}</span>
                            <p className="text-sm text-muted-foreground">{comment.comment_text}</p>
                          </div>
                        </div>
                        {comment.response_text && (
                          <div className="ml-6 p-2 bg-primary/10 rounded-lg">
                            <p className="text-sm text-primary">{comment.response_text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
