import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Share2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  company_name: string;
  vat_number: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  client_contacts: any[];
}

interface ClientCardProps {
  client: Client;
  onViewDetails: (client: Client) => void;
}

export function ClientCard({ client, onViewDetails }: ClientCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
      <CardHeader className="p-4">
        <CardTitle className="line-clamp-1">
          {client.company_name}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-4 mt-auto gap-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        <Button className="gap-1" onClick={() => onViewDetails(client)}>
          <span>Details</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
