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
import { it } from "date-fns/locale";
import { Plus, Video, Clock, User, Mail, Phone, ChevronLeft, ChevronRight, Trash2, Edit2, ExternalLink } from "lucide-react";

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
      if (!userData.user) throw new Error("Non autenticato");

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
      toast.success("Demo programmata con successo");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Errore nella creazione della demo");
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
      toast.success("Demo aggiornata con successo");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Errore nell'aggiornamento della demo");
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("demo_bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-bookings"] });
      toast.success("Demo eliminata");
    },
    onError: () => {
      toast.error("Errore nell'eliminazione");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("demo_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-bookings"] });
      toast.success("Stato aggiornato");
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
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Programmata";
      case "completed":
        return "Completata";
      case "cancelled":
        return "Annullata";
      case "rescheduled":
        return "Riprogrammata";
      default:
        return status;
    }
  };

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
              Gestisci le video call di presentazione dei software
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:bg-lime-500/30">
                <Plus size={18} />
                Nuova Demo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-black/95 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {editingBooking ? "Modifica Demo" : "Programma Nuova Demo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Input
                    placeholder="Titolo demo *"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Nome cliente"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email cliente"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Telefono"
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Select
                      value={formData.project_type}
                      onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Progetto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="energizzo">Energizzo</SelectItem>
                        <SelectItem value="ai-social">AI Social</SelectItem>
                        <SelectItem value="nkmt">NKMT</SelectItem>
                        <SelectItem value="altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Orario</label>
                    <Input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Durata (minuti)</label>
                    <Select
                      value={formData.duration_minutes.toString()}
                      onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Input
                    placeholder="Link meeting (Zoom, Meet, etc.)"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Note aggiuntive"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-white/5 border-white/10 min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBooking.isPending || updateBooking.isPending}
                    className="bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:bg-lime-500/30"
                  >
                    {editingBooking ? "Aggiorna" : "Crea Demo"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="col-span-1 lg:col-span-2 bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  {format(currentMonth, "MMMM yyyy", { locale: it })}
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
                locale={it}
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

          {/* Selected Day Bookings */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {format(selectedDate, "d MMMM yyyy", { locale: it })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {isLoading ? (
                  <div className="text-white/50 text-center py-8">Caricamento...</div>
                ) : selectedDayBookings.length === 0 ? (
                  <div className="text-white/50 text-center py-8">
                    Nessuna demo programmata per questo giorno
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{booking.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock size={14} className="text-white/50" />
                              <span className="text-white/60 text-sm">
                                {format(new Date(booking.scheduled_at), "HH:mm")} - {booking.duration_minutes} min
                              </span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </div>

                        {booking.client_name && (
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <User size={14} />
                            <span>{booking.client_name}</span>
                          </div>
                        )}
                        {booking.client_email && (
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Mail size={14} />
                            <span>{booking.client_email}</span>
                          </div>
                        )}
                        {booking.client_phone && (
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Phone size={14} />
                            <span>{booking.client_phone}</span>
                          </div>
                        )}

                        {booking.project_type && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {booking.project_type}
                          </Badge>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          {booking.meeting_link && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-xs"
                              onClick={() => window.open(booking.meeting_link!, "_blank")}
                            >
                              <Video size={14} />
                              Join
                              <ExternalLink size={12} />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs"
                            onClick={() => handleEdit(booking)}
                          >
                            <Edit2 size={14} />
                            Modifica
                          </Button>
                          <Select
                            value={booking.status}
                            onValueChange={(status) => updateStatus.mutate({ id: booking.id, status })}
                          >
                            <SelectTrigger className="h-8 text-xs w-auto bg-transparent border-0 p-0 pl-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Programmata</SelectItem>
                              <SelectItem value="completed">Completata</SelectItem>
                              <SelectItem value="cancelled">Annullata</SelectItem>
                              <SelectItem value="rescheduled">Riprogrammata</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs text-red-400 hover:text-red-300 ml-auto"
                            onClick={() => deleteBooking.mutate(booking.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
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
  );
}