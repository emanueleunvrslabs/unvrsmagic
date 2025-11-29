import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle } from "lucide-react";
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
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
      <CardHeader className="p-4">
        <CardTitle className="line-clamp-1">
          {client.company_name}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
      </CardContent>

      <CardFooter className="flex flex-col items-start border-t p-4 mt-auto gap-2">
        {client.client_contacts && client.client_contacts.length > 0 ? (
          <div className="w-full space-y-2">
            {client.client_contacts.map((contact: any) => (
              <div key={contact.id} className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">
                  {contact.first_name} {contact.last_name}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(`https://wa.me/${contact.whatsapp_number.replace(/\D/g, '')}`, '_blank')}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No contacts available</p>
        )}
      </CardFooter>
    </Card>
  );
}
