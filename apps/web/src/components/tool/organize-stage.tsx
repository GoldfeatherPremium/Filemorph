"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrganizeStageProps {
  onChange: (settings: Record<string, unknown>) => void;
}

export function OrganizeStage({ onChange }: OrganizeStageProps) {
  const [order, setOrder] = useState("");
  const [deletePages, setDeletePages] = useState("");

  function parseList(raw: string): number[] {
    return raw
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 1)
      .slice(0, 500);
  }

  function apply() {
    const orderList = parseList(order);
    const delList = parseList(deletePages);
    if (orderList.length) {
      onChange({ order: orderList });
    } else if (delList.length) {
      onChange({ deletePages: delList });
    } else {
      onChange({});
    }
  }

  return (
    <Tabs defaultValue="reorder" onValueChange={() => setTimeout(apply, 0)} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="reorder" className="flex-1">Reorder</TabsTrigger>
        <TabsTrigger value="delete" className="flex-1">Delete pages</TabsTrigger>
      </TabsList>
      <TabsContent value="reorder" className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="order">New page order</Label>
          <Input id="order" placeholder="e.g. 3, 1, 2, 4" value={order} onChange={(e) => { setOrder(e.target.value); apply(); }} />
        </div>
        <p className="text-xs text-muted-foreground">Pages not listed are removed. Type page numbers in the order you want them to appear.</p>
      </TabsContent>
      <TabsContent value="delete" className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="delete">Pages to delete</Label>
          <Input id="delete" placeholder="e.g. 2, 5" value={deletePages} onChange={(e) => { setDeletePages(e.target.value); apply(); }} />
        </div>
        <p className="text-xs text-muted-foreground">All other pages are kept in their original order. You can’t delete every page.</p>
      </TabsContent>
    </Tabs>
  );
}
