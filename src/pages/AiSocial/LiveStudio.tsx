"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
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
  AlertCircle,
  ChevronDown
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

interface YouTubeBroadcast {
  broadcastId: string
  streamId: string
  rtmpUrl: string
  streamKey: string
  watchUrl: string
  liveChatId?: string
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
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
  const [youtubeBroadcast, setYoutubeBroadcast] = useState<YouTubeBroadcast | null>(null)
  const [youtubeChatPolling, setYoutubeChatPolling] = useState<NodeJS.Timeout | null>(null)
  const [restreamInfo, setRestreamInfo] = useState<{ whipUrl: string; streamKey: string } | null>(null)
  const [whipPeerConnection, setWhipPeerConnection] = useState<RTCPeerConnection | null>(null)

  // LiveKit refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const roomRef = useRef<Room | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Load avatars
  useEffect(() => {
    loadAvatars()
    return () => {
      // Cleanup on unmount
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.remove()
      }
      // Cleanup WHIP connection
      if (whipPeerConnection) {
        whipPeerConnection.close()
      }
    }
  }, [])

  // Cleanup YouTube chat polling on unmount
  useEffect(() => {
    return () => {
      if (youtubeChatPolling) {
        clearTimeout(youtubeChatPolling)
      }
    }
  }, [youtubeChatPolling])

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

  // Handle mute state changes for audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
      audioRef.current.volume = isMuted ? 0 : 1
    }
  }, [isMuted])

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

  // WHIP streaming to Restream
  const startWhipStream = async (mediaStream: MediaStream, whipUrl: string): Promise<RTCPeerConnection | null> => {
    console.log("Starting WHIP stream to Restream...", whipUrl)
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      // Add tracks from the media stream
      mediaStream.getTracks().forEach(track => {
        console.log("Adding track to WHIP:", track.kind)
        pc.addTrack(track, mediaStream)
      })

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve()
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              resolve()
            }
          }
          // Timeout after 5 seconds
          setTimeout(resolve, 5000)
        }
      })

      // Send offer to WHIP endpoint
      const response = await fetch(whipUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: pc.localDescription?.sdp,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("WHIP endpoint error:", response.status, errorText)
        pc.close()
        return null
      }

      // Set remote description from WHIP response
      const answerSdp = await response.text()
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      }))

      console.log("WHIP stream connected successfully")
      return pc
    } catch (error) {
      console.error("WHIP stream error:", error)
      return null
    }
  }

  // Capture MediaStream from video element for WHIP
  const captureMediaStream = (): MediaStream | null => {
    if (!videoRef.current) return null

    try {
      // Capture video from the video element
      const canvas = document.createElement('canvas')
      const video = videoRef.current
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Create a stream from canvas
      const canvasStream = canvas.captureStream(30) // 30 fps

      // Draw video frames to canvas
      const drawFrame = () => {
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
        if (videoRef.current && !videoRef.current.paused) {
          requestAnimationFrame(drawFrame)
        }
      }
      drawFrame()

      // Add audio track if available
      if (audioRef.current && audioRef.current.srcObject) {
        const audioStream = audioRef.current.srcObject as MediaStream
        audioStream.getAudioTracks().forEach(track => {
          canvasStream.addTrack(track.clone())
        })
      }

      return canvasStream
    } catch (error) {
      console.error("Error capturing media stream:", error)
      return null
    }
  }

  const connectToLiveKit = async (livekitUrl: string, accessToken: string): Promise<boolean> => {
    console.log("Connecting to LiveKit...", livekitUrl)
    setConnectionStatus("connecting")

    return new Promise((resolve) => {
      try {
        const room = new Room()
        roomRef.current = room
        
        let videoReady = false
        let audioReady = false
        let resolved = false

        const checkReady = () => {
          if (videoReady && audioReady && !resolved) {
            resolved = true
            console.log("LiveKit fully ready - video and audio tracks subscribed")
            setConnectionStatus("connected")
            resolve(true)
          }
        }

        // Handle track subscriptions
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          console.log("Track subscribed:", track.kind, participant.identity)
          
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current)
            videoReady = true
            checkReady()
          } else if (track.kind === Track.Kind.Audio) {
            // Create audio element with proper autoplay settings
            const audioElement = track.attach() as HTMLAudioElement
            audioElement.autoplay = true
            audioElement.muted = false
            audioElement.volume = 1
            
            // Store reference for later control
            audioRef.current = audioElement
            
            // Append to body and try to play
            document.body.appendChild(audioElement)
            
            // Force play to handle autoplay restrictions
            audioElement.play().then(() => {
              console.log("Audio playback started successfully")
            }).catch((err) => {
              console.error("Audio autoplay failed:", err)
              // Show toast to user to click to enable audio
              toast.info("Click anywhere to enable audio", { duration: 5000 })
            })
            
            audioReady = true
            checkReady()
          }
        })

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          console.log("Track unsubscribed:", track.kind)
          track.detach()
        })

        room.on(RoomEvent.Connected, () => {
          console.log("LiveKit room connected, waiting for tracks...")
        })

        room.on(RoomEvent.Disconnected, () => {
          console.log("LiveKit disconnected")
          setConnectionStatus("disconnected")
          if (!resolved) {
            resolved = true
            resolve(false)
          }
        })

        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          console.log("Connection state:", state)
        })

        // Connect to the room
        room.connect(livekitUrl, accessToken)
          .then(() => {
            console.log("LiveKit room connected, waiting for video/audio tracks...")
            // Set a timeout in case tracks don't arrive
            setTimeout(() => {
              if (!resolved) {
                console.log("Timeout waiting for tracks, proceeding anyway")
                resolved = true
                setConnectionStatus("connected")
                resolve(true)
              }
            }, 10000) // 10 second timeout
          })
          .catch((error) => {
            console.error("LiveKit connection error:", error)
            setConnectionStatus("error")
            if (!resolved) {
              resolved = true
              resolve(false)
            }
          })
      } catch (error) {
        console.error("LiveKit setup error:", error)
        setConnectionStatus("error")
        resolve(false)
      }
    })
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

      // If YouTube is selected, create broadcast first
      let ytBroadcast: YouTubeBroadcast | null = null
      if (selectedPlatforms.includes('youtube')) {
        toast.info("Creating YouTube Live broadcast...")
        const avatar = avatars.find(a => a.id === selectedAvatar)
        
        const { data: broadcastData, error: broadcastError } = await supabase.functions.invoke('youtube-broadcast', {
          body: {
            action: 'create',
            title: `Live with ${avatar?.name || 'AI Avatar'}`,
            description: `AI Avatar live stream powered by HeyGen`,
            sessionId: session.id,
          }
        })

        if (broadcastError) {
          console.error("YouTube broadcast error:", broadcastError)
          toast.error("Failed to create YouTube broadcast. Check your YouTube connection.")
          // Continue without YouTube - don't fail the entire stream
        } else if (broadcastData?.success) {
          ytBroadcast = {
            broadcastId: broadcastData.broadcastId,
            streamId: broadcastData.streamId,
            rtmpUrl: broadcastData.rtmpUrl,
            streamKey: broadcastData.streamKey,
            watchUrl: broadcastData.watchUrl,
          }
          setYoutubeBroadcast(ytBroadcast)
          console.log("YouTube broadcast created:", ytBroadcast)
          toast.success("YouTube Live created!", {
            description: `Watch at: ${ytBroadcast.watchUrl}`,
            action: {
              label: "Open",
              onClick: () => window.open(ytBroadcast!.watchUrl, '_blank')
            },
            duration: 10000,
          })
        }
      }

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

      // In LiveKit V2 mode, must call streaming.start BEFORE connecting to LiveKit
      toast.info("Activating streaming session...")
      const { error: startError } = await supabase.functions.invoke('heygen-session', {
        body: {
          action: 'start-session',
          sessionId: session.id,
        }
      })

      if (startError) {
        console.error("Failed to start session:", startError)
        throw new Error("Failed to activate streaming session")
      }

      // Now connect via LiveKit
      toast.info("Connecting to video stream...")
      const connected = await connectToLiveKit(streamData.livekitUrl, streamData.accessToken)

      if (!connected) {
        throw new Error("Failed to connect to LiveKit")
      }

      // Get Restream WHIP URL and start streaming to platforms
      toast.info("Connecting to Restream for multi-platform streaming...")
      try {
        const { data: restreamData, error: restreamError } = await supabase.functions.invoke('restream-stream', {
          body: {
            action: 'get-whip-url',
            sessionId: session.id,
            platforms: selectedPlatforms,
          }
        })

        if (restreamError) {
          console.error("Restream error:", restreamError)
          toast.error("Restream not configured. Stream will only show locally.")
        } else if (restreamData?.whipUrl) {
          setRestreamInfo({ whipUrl: restreamData.whipUrl, streamKey: restreamData.streamKey })
          console.log("Restream WHIP URL:", restreamData.whipUrl)
          
          // Wait a moment for video to be ready, then start WHIP stream
          setTimeout(async () => {
            const mediaStream = captureMediaStream()
            if (mediaStream) {
              mediaStreamRef.current = mediaStream
              const pc = await startWhipStream(mediaStream, restreamData.whipUrl)
              if (pc) {
                setWhipPeerConnection(pc)
                toast.success("Streaming to Restream!", {
                  description: "Your stream is now live on all connected platforms",
                  duration: 5000,
                })
              } else {
                toast.error("Failed to connect to Restream WHIP")
              }
            } else {
              toast.error("Failed to capture video stream for Restream")
            }
          }, 3000) // Wait for video to stabilize
        }
      } catch (restreamErr) {
        console.error("Restream setup error:", restreamErr)
        toast.error("Failed to setup Restream. Stream will only show locally.")
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

      // Start YouTube chat polling if broadcast exists
      if (ytBroadcast) {
        startYoutubeChatPolling(ytBroadcast.broadcastId, session.id)
      }

      // Play opening script if available - tracks are now subscribed, add small delay for HeyGen
      const avatar = avatars.find(a => a.id === selectedAvatar)
      if (avatar?.opening_script && streamData.sessionId) {
        setTimeout(async () => {
          console.log("Sending speak command with opening script...")
          const { data, error: speakError } = await supabase.functions.invoke('heygen-session', {
            body: {
              action: 'speak',
              sessionId: session.id,
              text: avatar.opening_script,
            }
          })
          if (speakError) {
            console.error("Speak error:", speakError)
            toast.error("Failed to make avatar speak")
          } else {
            console.log("Speak command sent successfully:", data)
          }
        }, 3000) // Small delay after tracks are ready
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
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.remove()
        audioRef.current = null
      }
    } finally {
      setIsStarting(false)
    }
  }

  const startYoutubeChatPolling = async (broadcastId: string, sessionId: string) => {
    // First get the liveChatId
    const { data: detailsData } = await supabase.functions.invoke('youtube-broadcast', {
      body: {
        action: 'get-broadcast-details',
        broadcastId,
      }
    })

    if (!detailsData?.liveChatId) {
      console.log("No liveChatId available yet, will retry...")
      // Retry after 10 seconds
      setTimeout(() => startYoutubeChatPolling(broadcastId, sessionId), 10000)
      return
    }

    const liveChatId = detailsData.liveChatId
    console.log("Starting YouTube chat polling with liveChatId:", liveChatId)

    let nextPageToken: string | undefined

    const pollChat = async () => {
      try {
        const { data: chatData } = await supabase.functions.invoke('youtube-broadcast', {
          body: {
            action: 'get-chat',
            liveChatId,
            pageToken: nextPageToken,
          }
        })

        if (chatData?.items && chatData.items.length > 0) {
          nextPageToken = chatData.nextPageToken

          // Process new comments
          for (const item of chatData.items) {
            const commentText = item.snippet?.displayMessage
            const authorName = item.authorDetails?.displayName

            if (commentText && authorName) {
              // Add to local comments state
              const newComment: Comment = {
                id: item.id,
                commenter_name: authorName,
                comment_text: commentText,
                platform: 'youtube',
                response_text: null,
                created_at: item.snippet?.publishedAt || new Date().toISOString(),
              }

              setComments(prev => {
                // Avoid duplicates
                if (prev.some(c => c.id === newComment.id)) return prev
                return [...prev, newComment]
              })

              // TODO: Send comment to AI for response and make avatar speak
              console.log("New YouTube comment:", authorName, "-", commentText)
            }
          }
        }

        // Poll interval from API response or default to 5 seconds
        const pollingInterval = chatData?.pollingIntervalMillis || 5000
        const timeoutId = setTimeout(pollChat, pollingInterval)
        setYoutubeChatPolling(timeoutId)
      } catch (error) {
        console.error("YouTube chat polling error:", error)
        // Retry after 10 seconds on error
        const timeoutId = setTimeout(pollChat, 10000)
        setYoutubeChatPolling(timeoutId)
      }
    }

    pollChat()
  }

  const handleStopLive = async () => {
    if (!currentSession) return

    try {
      // Stop YouTube chat polling
      if (youtubeChatPolling) {
        clearTimeout(youtubeChatPolling)
        setYoutubeChatPolling(null)
      }

      // End YouTube broadcast if exists
      if (youtubeBroadcast) {
        try {
          await supabase.functions.invoke('youtube-broadcast', {
            body: {
              action: 'transition',
              broadcastId: youtubeBroadcast.broadcastId,
              status: 'complete',
            }
          })
          console.log("YouTube broadcast ended")
        } catch (ytError) {
          console.error("Failed to end YouTube broadcast:", ytError)
        }
        setYoutubeBroadcast(null)
      }

      // Close WHIP connection
      if (whipPeerConnection) {
        whipPeerConnection.close()
        setWhipPeerConnection(null)
        console.log("WHIP connection closed")
      }

      // Stop captured media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }

      // Clear Restream info
      setRestreamInfo(null)

      // Disconnect LiveKit
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }

      // Clear video
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      // Clean up audio element
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.remove()
        audioRef.current = null
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
              {youtubeBroadcast && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  onClick={() => window.open(youtubeBroadcast.watchUrl, '_blank')}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Watch on YouTube
                </Button>
              )}
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
                        {restreamInfo && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                            Restream
                          </Badge>
                        )}
                        {selectedPlatforms.map(p => (
                          <Badge key={p} variant="outline" className="bg-black/50 text-xs">
                            {PLATFORMS.find(pl => pl.id === p)?.label}
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
                <div className="flex items-center justify-between gap-4">
                  {!isLive ? (
                    <>
                      <div className="flex items-center gap-4 flex-wrap flex-1">
                        <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
                          <SelectTrigger className="w-[200px] bg-background">
                            <SelectValue placeholder="Select Avatar" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border z-50">
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

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-between bg-background">
                              {selectedPlatforms.length === 0 ? (
                                <span className="text-muted-foreground">Select Platforms</span>
                              ) : (
                                <span>
                                  {selectedPlatforms.map(p => PLATFORMS.find(pl => pl.id === p)?.label).join(', ')}
                                </span>
                              )}
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-2 bg-background border border-border z-50">
                            <div className="space-y-2">
                              {PLATFORMS.map((platform) => (
                                <div
                                  key={platform.id}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                  onClick={() => togglePlatform(platform.id)}
                                >
                                  <Checkbox 
                                    checked={selectedPlatforms.includes(platform.id)}
                                    onCheckedChange={() => togglePlatform(platform.id)}
                                  />
                                  <span className="text-sm">{platform.label}</span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Button 
                        onClick={handleStartLive}
                        disabled={isStarting || !selectedAvatar || selectedPlatforms.length === 0}
                        className="bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30 hover:text-red-400"
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
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
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
                      <Button 
                        onClick={handleStopLive}
                        variant="destructive"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        End Live
                      </Button>
                    </div>
                  )}
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
