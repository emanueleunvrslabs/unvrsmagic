"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Play, 
  Square, 
  User, 
  MessageSquare, 
  Users, 
  Loader2,
  Radio,
  ShoppingBag,
  Settings,
  Mic,
  MicOff,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { Room, RoomEvent, Track, RemoteParticipant, RemoteTrackPublication, RemoteTrack } from "livekit-client"

interface Avatar {
  id: string
  name: string
  thumbnail_url: string | null
  personality: string
  opening_script: string | null
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
  { id: "instagram", label: "Instagram Live", icon: "📸" },
  { id: "tiktok", label: "TikTok Live", icon: "🎵" },
  { id: "youtube", label: "YouTube Live", icon: "▶️" },
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
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")

  // LiveKit refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const roomRef = useRef<Room | null>(null)

  // Load avatars
  useEffect(() => {
    loadAvatars()
    return () => {
      // Cleanup on unmount
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
    }
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
        .select('id, name, thumbnail_url, personality, opening_script')
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

  const connectToLiveKit = async (livekitUrl: string, accessToken: string) => {
    console.log("Connecting to LiveKit...", livekitUrl)
    setConnectionStatus("connecting")

    try {
      const room = new Room()
      roomRef.current = room

      // Handle track subscriptions
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log("Track subscribed:", track.kind, participant.identity)
        
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current)
        } else if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach()
          audioElement.volume = isMuted ? 0 : 1
          document.body.appendChild(audioElement)
        }
      })

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        console.log("Track unsubscribed:", track.kind)
        track.detach()
      })

      room.on(RoomEvent.Connected, () => {
        console.log("LiveKit connected")
        setConnectionStatus("connected")
      })

      room.on(RoomEvent.Disconnected, () => {
        console.log("LiveKit disconnected")
        setConnectionStatus("disconnected")
      })

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log("Connection state:", state)
      })

      // Connect to the room
      await room.connect(livekitUrl, accessToken)
      console.log("LiveKit room connected successfully")
      
      return true
    } catch (error) {
      console.error("LiveKit connection error:", error)
      setConnectionStatus("error")
      return false
    }
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
    setConnectionStatus("initializing")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create live session in database
      const { data: session, error } = await supabase
        .from('ai_live_sessions')
        .insert({
          user_id: user.id,
          avatar_id: selectedAvatar,
          platforms: selectedPlatforms,
          status: 'starting',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      setCurrentSession(session)

      // Start HeyGen streaming session
      toast.info("Initializing HeyGen avatar...")
      const { data: streamData, error: streamError } = await supabase.functions.invoke('heygen-session', {
        body: {
          action: 'start',
          avatarId: selectedAvatar,
          sessionId: session.id,
        }
      })

      if (streamError) {
        console.error("HeyGen error:", streamError)
        await supabase.from('ai_live_sessions').delete().eq('id', session.id)
        throw new Error(streamError.message || "Failed to start HeyGen session")
      }

      if (!streamData?.accessToken || !streamData?.livekitUrl) {
        console.error("Invalid HeyGen response:", streamData)
        await supabase.from('ai_live_sessions').delete().eq('id', session.id)
        throw new Error("Invalid response from HeyGen - missing LiveKit credentials")
      }

      console.log("HeyGen session created:", streamData.sessionId)

      // Connect via LiveKit
      toast.info("Connecting to video stream...")
      const connected = await connectToLiveKit(streamData.livekitUrl, streamData.accessToken)

      if (!connected) {
        throw new Error("Failed to connect to LiveKit")
      }

      // Update session status
      await supabase
        .from('ai_live_sessions')
        .update({ status: 'live' })
        .eq('id', session.id)

      setCurrentSession({ ...session, status: 'live' })
      setIsLive(true)
      setElapsedTime(0)
      toast.success("Live stream started!")

      // Play opening script if available
      const avatar = avatars.find(a => a.id === selectedAvatar)
      if (avatar?.opening_script && streamData.sessionId) {
        setTimeout(async () => {
          await supabase.functions.invoke('heygen-session', {
            body: {
              action: 'speak',
              sessionId: session.id,
              text: avatar.opening_script,
            }
          })
        }, 3000) // Wait longer for connection to stabilize
      }

    } catch (error) {
      console.error("Error starting live:", error)
      toast.error(error instanceof Error ? error.message : "Failed to start live stream")
      setConnectionStatus("disconnected")
      
      // Cleanup on error
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
    } finally {
      setIsStarting(false)
    }
  }

  const handleStopLive = async () => {
    if (!currentSession) return

    try {
      // Disconnect LiveKit
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }

      // Clear video
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

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
      setConnectionStatus("disconnected")
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
                {isLive || isStarting ? (
                  <>
                    {/* LiveKit Video */}
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      autoPlay
                      playsInline
                      muted={isMuted}
                    />
                    
                    {/* Fallback while connecting */}
                    {connectionStatus !== "connected" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        {selectedAvatarData?.thumbnail_url && (
                          <img 
                            src={selectedAvatarData.thumbnail_url} 
                            alt="Avatar"
                            className="absolute inset-0 w-full h-full object-contain opacity-30"
                          />
                        )}
                        <div className="relative z-10 text-center">
                          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                          <p className="text-muted-foreground capitalize">{connectionStatus}...</p>
                        </div>
                      </div>
                    )}

                    {/* Live overlay */}
                    {isLive && (
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Badge variant="destructive">
                          <Radio className="h-3 w-3 mr-1 animate-pulse" />
                          LIVE
                        </Badge>
                        <Badge variant="secondary" className="bg-black/50">
                          <Users className="h-3 w-3 mr-1" />
                          {currentSession?.viewer_count || 0}
                        </Badge>
                        {selectedPlatforms.map(p => (
                          <Badge key={p} variant="outline" className="bg-black/50 text-xs">
                            {PLATFORMS.find(pl => pl.id === p)?.icon} {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    {selectedAvatarData ? (
                      <>
                        {selectedAvatarData.thumbnail_url ? (
                          <img 
                            src={selectedAvatarData.thumbnail_url} 
                            alt={selectedAvatarData.name}
                            className="h-64 mx-auto rounded-lg mb-4 opacity-70"
                          />
                        ) : (
                          <User className="h-24 w-24 mx-auto text-muted-foreground/30 mb-4" />
                        )}
                        <p className="text-muted-foreground">
                          Ready to go live with <span className="text-foreground font-medium">{selectedAvatarData.name}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <User className="h-24 w-24 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Select an avatar to go live</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Controls */}
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {!isLive ? (
                      <>
                        <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Avatar" />
                          </SelectTrigger>
                          <SelectContent>
                            {avatars.length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No avatars found</p>
                                <p className="text-xs">Create one in Avatar Studio</p>
                              </div>
                            ) : (
                              avatars.map((avatar) => (
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
                              ))
                            )}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          {PLATFORMS.map((platform) => (
                            <Button
                              key={platform.id}
                              variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => togglePlatform(platform.id)}
                              className="gap-1"
                            >
                              <span>{platform.icon}</span>
                              <span className="hidden sm:inline">{platform.label}</span>
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
                    <p className="text-center text-sm">
                      {isLive ? "Waiting for comments..." : "Comments will appear here when live"}
                    </p>
                    {!isLive && selectedPlatforms.includes('instagram') && (
                      <p className="text-center text-xs mt-2 text-muted-foreground/70">
                        Instagram comments require app connection
                      </p>
                    )}
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
