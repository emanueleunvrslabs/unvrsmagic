"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Eye, Share2 } from "lucide-react";
import type { NFTCollection } from "../../types";

interface NFTCollectionCardProps {
  collection: NFTCollection;
}

export function NFTCollectionCard({ collection }: NFTCollectionCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{collection.name}</span>
          <Badge variant="secondary">{collection.chain}</Badge>
        </CardTitle>
        <CardDescription>Floor: {collection.floorPrice} ETH</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-square rounded-md bg-muted/30 flex items-center justify-center mb-4 overflow-hidden">
          <img
            src="/placeholder.svg"
            alt={collection.name}
            className="h-full w-full object-cover rounded-md hover:scale-105 transition-transform cursor-pointer"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Items</div>
            <div className="font-medium">{collection.items}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Floor Price</div>
            <div className="font-medium">{collection.floorPrice} ETH</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Value</div>
            <div className="font-medium">${collection.value.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Chain</div>
            <div className="font-medium">{collection.chain}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
