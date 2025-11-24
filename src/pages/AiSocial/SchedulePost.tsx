import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function SchedulePost() {
  const [caption, setCaption] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);

  const handleSchedule = () => {
    toast.success("Post scheduled successfully!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Schedule Post</h1>
          <p className="text-muted-foreground mt-2">
            Schedule content for social media publishing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>Configure your scheduled post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Content</Label>
              <Input placeholder="Search your generated content..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Write your post caption..."
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Schedule Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Instagram</Button>
                <Button variant="outline" size="sm">Facebook</Button>
                <Button variant="outline" size="sm">Twitter</Button>
                <Button variant="outline" size="sm">LinkedIn</Button>
              </div>
            </div>

            <Button onClick={handleSchedule} className="w-full">
              Schedule Post
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
