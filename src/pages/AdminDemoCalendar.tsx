import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import { Plus, Video, Clock, User, Mail, Phone, ChevronLeft, ChevronRight, Trash2, Edit2, ExternalLink, Check, X } from "lucide-react";

interface DemoBooking {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  project_type: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdminDemoCalendar() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<DemoBooking | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    project_type: "energizzo",
    scheduled_time: "10:00",
    duration_minutes: 30,
    meeting_link: "",
    notes: "",
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["demo-bookings", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from("demo_bookings")
        .select("*")
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .order("scheduled_at", { ascending: true });
      
      if (error) throw error;
      return data as DemoBooking[];
    },
  });

  const createBooking = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = data.scheduled_time.split(":");
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase.from("demo_bookings").insert({
        user_id: userData.user.id,
        title: data.title,
        description: data.description || null,
        client_name: data.client_name || null,
        client_email: data.client_email || null,
        client_phone: data.client_phone || null,
        project_type: data.project_type,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: data.duration_minutes,
        meeting_link: data.meeting_link || null,
        notes: data.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-bookings"] });
      toast.success("Demo scheduled successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Error creating demo");
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = data.scheduled_time.split(":");
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase
        .from("demo_bookings")
        .update({
          title: data.title,
          description: data.description || null,
          client_name: data.client_name || null,
          client_email: data.client_email || null,
          client_phone: data.client_phone || null,
          project_type: data.project_type,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: data.duration_minutes,
          meeting_link: data.meeting_link || null,
          notes: data.notes || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-bookings"] });
      toast.success("Demo updated successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Error updating demo");
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("demo_bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-bookings"] });
      toast.success("Demo deleted");
    },
    onError: () => {
      toast.error("Error deleting demo");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("demo_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-bookings"] });
      toast.success("Status updated");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      client_name: "",
      client_email: "",
      client_phone: "",
      project_type: "energizzo",
      scheduled_time: "10:00",
      duration_minutes: 30,
      meeting_link: "",
      notes: "",
    });
    setEditingBooking(null);
  };

  const handleEdit = (booking: DemoBooking) => {
    const date = new Date(booking.scheduled_at);
    setSelectedDate(date);
    setFormData({
      title: booking.title,
      description: booking.description || "",
      client_name: booking.client_name || "",
      client_email: booking.client_email || "",
      client_phone: booking.client_phone || "",
      project_type: booking.project_type || "energizzo",
      scheduled_time: format(date, "HH:mm"),
      duration_minutes: booking.duration_minutes,
      meeting_link: booking.meeting_link || "",
      notes: booking.notes || "",
    });
    setEditingBooking(booking);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBooking) {
      updateBooking.mutate({ id: editingBooking.id, data: formData });
    } else {
      createBooking.mutate(formData);
    }
  };

  const selectedDayBookings = bookings.filter((b) =>
    isSameDay(new Date(b.scheduled_at), selectedDate)
  );

  const getDaysWithBookings = () => {
    return bookings.map((b) => new Date(b.scheduled_at));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "rescheduled":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "pending_approval":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "rescheduled":
        return "Rescheduled";
      case "pending_approval":
        return "Pending";
      default:
        return status;
    }
  };

  const approveBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("demo_bookings").update({ status: "scheduled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-bookings"] });
      toast.success("Demo approved!");
    },
    onError: () => {
      toast.error("Error approving demo");
    },
  });

  const rejectBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("demo_bookings").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-bookings"] });
      toast.success("Demo rejected");
    },
    onError: () => {
      toast.error("Error rejecting demo");
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Demo Calendar
            </h1>
            <p className="text-white/60 mt-1">
              Manage software demo video calls
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white">
                <Plus size={18} />
                New Demo
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="max-w-[380px] p-0 overflow-hidden border-0 bg-transparent shadow-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.08) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.2), inset 0 -1px 0 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Header */}
              <div 
                className="px-5 pt-5 pb-4"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                }}
              >
                <DialogHeader>
                  <DialogTitle 
                    className="text-white/95 text-lg font-semibold tracking-tight"
                    style={{ fontFamily: "SF Pro Display, -apple-system, sans-serif" }}
                  >
                    {editingBooking ? "Edit Demo" : "Schedule Demo"}
                  </DialogTitle>
                  <p className="text-white/50 text-xs mt-1">
                    {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: enUS })}
                  </p>
                </DialogHeader>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="max-h-[55vh]">
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                  
                  {/* Title Section */}
                  <div 
                    className="rounded-2xl p-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <label className="text-[11px] uppercase tracking-wider text-white/40 font-medium mb-2 block">
                      Demo Title
                    </label>
                    <Input
                      placeholder="Enter demo title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-9 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/30 transition-colors"
                    />
                  </div>

                  {/* Client Section */}
                  <div 
                    className="rounded-2xl p-4 space-y-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <label className="text-[11px] uppercase tracking-wider text-white/40 font-medium block">
                      Client Information
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                          placeholder="Name"
                          value={formData.client_name}
                          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          className="bg-transparent border-0 border-b border-white/10 rounded-none pl-5 pr-0 h-8 text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/30"
                        />
                      </div>
                      <div className="relative">
                        <Mail size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={formData.client_email}
                          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                          className="bg-transparent border-0 border-b border-white/10 rounded-none pl-5 pr-0 h-8 text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/30"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Phone size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                          placeholder="Phone"
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                          className="bg-transparent border-0 border-b border-white/10 rounded-none pl-5 pr-0 h-8 text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/30"
                        />
                      </div>
                      <Select
                        value={formData.project_type}
                        onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                      >
                        <SelectTrigger className="bg-transparent border-0 border-b border-white/10 rounded-none h-8 text-sm text-white focus:ring-0 [&>span]:text-white/70">
                          <SelectValue placeholder="Project" />
                        </SelectTrigger>
                        <SelectContent 
                          className="border-white/10 rounded-xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.98) 100%)',
                            backdropFilter: 'blur(20px)',
                          }}
                        >
                          <SelectItem value="energizzo">Energizzo</SelectItem>
                          <SelectItem value="ai-social">AI Social</SelectItem>
                          <SelectItem value="nkmt">NKMT</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div 
                    className="rounded-2xl p-4 space-y-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <label className="text-[11px] uppercase tracking-wider text-white/40 font-medium block">
                      Schedule
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Clock size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                          type="time"
                          value={formData.scheduled_time}
                          onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                          className="bg-transparent border-0 border-b border-white/10 rounded-none pl-5 pr-0 h-8 text-sm text-white focus-visible:ring-0 focus-visible:border-white/30 [&::-webkit-calendar-picker-indicator]:invert"
                        />
                      </div>
                      <Select
                        value={formData.duration_minutes.toString()}
                        onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
                      >
                        <SelectTrigger className="bg-transparent border-0 border-b border-white/10 rounded-none h-8 text-sm text-white focus:ring-0 [&>span]:text-white/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent 
                          className="border-white/10 rounded-xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.98) 100%)',
                            backdropFilter: 'blur(20px)',
                          }}
                        >
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                          <SelectItem value="90">90 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Video size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30" />
                      <Input
                        placeholder="Meeting link (Zoom, Meet...)"
                        value={formData.meeting_link}
                        onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                        className="bg-transparent border-0 border-b border-white/10 rounded-none pl-5 pr-0 h-8 text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/30"
                      />
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div 
                    className="rounded-2xl p-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <label className="text-[11px] uppercase tracking-wider text-white/40 font-medium mb-2 block">
                      Notes
                    </label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-transparent border-0 rounded-lg px-0 min-h-[70px] text-sm text-white placeholder:text-white/30 focus-visible:ring-0 resize-none"
                    />
                  </div>
                </form>
              </ScrollArea>

              {/* Footer */}
              <div 
                className="px-5 py-4 flex justify-end gap-3"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  background: 'linear-gradient(0deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
                }}
              >
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)} 
                  className="text-white/50 hover:text-white hover:bg-white/5 h-9 px-4 rounded-xl text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createBooking.isPending || updateBooking.isPending}
                  className="h-9 px-5 rounded-xl text-sm font-medium text-white border-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                    boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {createBooking.isPending || updateBooking.isPending ? "Saving..." : editingBooking ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar + Selected Day Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="bg-white/5 border-white/10 lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {format(currentMonth, "MMMM yyyy", { locale: enUS })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="text-white/60 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="text-white/60 hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={enUS}
                modifiers={{
                  booked: getDaysWithBookings(),
                }}
                modifiersStyles={{
                  booked: {
                    fontWeight: "bold",
                    backgroundColor: "rgba(132, 204, 22, 0.2)",
                    borderRadius: "50%",
                  },
                }}
                className="w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  caption: "hidden",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-white/50 rounded-md flex-1 font-normal text-sm",
                  row: "flex w-full mt-2",
                  cell: "flex-1 text-center text-sm p-0 relative",
                  day: "h-10 w-10 p-0 font-normal mx-auto rounded-full hover:bg-white/10 transition-colors flex items-center justify-center",
                  day_selected: "bg-lime-500/30 text-lime-400 hover:bg-lime-500/40",
                  day_today: "border border-white/30",
                  day_outside: "text-white/20",
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Day Sidebar */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {format(selectedDate, "dd MMMM yyyy", { locale: enUS })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-2">
                {(() => {
                  const dayBookings = bookings.filter(b => 
                    isSameDay(new Date(b.scheduled_at), selectedDate)
                  );
                  
                  if (isLoading) {
                    return <div className="text-white/50 text-center py-8">Loading...</div>;
                  }
                  
                  if (dayBookings.length === 0) {
                    return (
                    <div className="text-white/50 text-center py-8">
                        No calls for this date
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {dayBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium text-sm">
                              {format(new Date(booking.scheduled_at), "HH:mm")}
                            </span>
                            <Badge 
                              className={
                                booking.status === "pending_approval" 
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs"
                                  : booking.status === "scheduled"
                                  ? "bg-lime-500/20 text-lime-400 border-lime-500/30 text-xs"
                                  : "bg-white/10 text-white/70 border-white/20 text-xs"
                              }
                            >
                              {booking.status === "pending_approval" ? "Pending" : booking.status}
                            </Badge>
                          </div>
                          <h4 className="text-white/90 text-sm">
                            {booking.project_type 
                              ? `Demo ${booking.project_type.charAt(0).toUpperCase() + booking.project_type.slice(1)}`
                              : booking.title
                            }
                          </h4>
                          {booking.client_name && (
                            <div className="flex items-center gap-2 text-white/60 text-xs">
                              <User size={12} />
                              <span>{booking.client_name}</span>
                            </div>
                          )}
                          <div className="flex gap-1 pt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-white/60 hover:text-white"
                              onClick={() => handleEdit(booking)}
                            >
                              <Edit2 size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                              onClick={() => deleteBooking.mutate(booking.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Pending Videocalls Section */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
              <Video className="text-white/70" size={20} />
              Pending Videocalls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const pendingBookings = bookings.filter(b => b.status === "pending_approval");
              
              if (isLoading) {
                return <div className="text-white/50 text-center py-8">Loading...</div>;
              }
              
              if (pendingBookings.length === 0) {
                return (
                  <div className="text-white/50 text-center py-8">
                    No pending videocalls
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-medium">
                            Demo {booking.project_type ? booking.project_type.charAt(0).toUpperCase() + booking.project_type.slice(1) : 'Demo'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={14} className="text-white/50" />
                            <span className="text-white/60 text-sm">
                              {format(new Date(booking.scheduled_at), "dd/MM/yyyy")} alle {format(new Date(booking.scheduled_at), "HH:mm")}
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-white/10 text-white/70 border-white/20">
                          Pending
                        </Badge>
                      </div>

                      {booking.client_name && (
                        <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                          <User size={14} className="text-white/50" />
                          <span>{booking.client_name}</span>
                        </div>
                      )}
                      {booking.client_phone && (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Phone size={14} />
                          <span>{booking.client_phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Button
                          size="sm"
                          className="gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                          onClick={() => approveBooking.mutate(booking.id)}
                          disabled={approveBooking.isPending}
                        >
                          <Check size={14} />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={() => rejectBooking.mutate(booking.id)}
                          disabled={rejectBooking.isPending}
                        >
                          <X size={14} />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs ml-auto"
                          onClick={() => handleEdit(booking)}
                        >
                          <Edit2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}