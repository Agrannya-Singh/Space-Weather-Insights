"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EdaLinkButton() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/eda">
        <Button variant="secondary">Open EDA</Button>
      </Link>
      <Link href="/explanation">
        <Button variant="ghost">Explanation</Button>
      </Link>
    </div>
  );
}


