"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EdaLinkButton() {
  return (
    <Link href="/eda">
      <Button variant="secondary">Open EDA</Button>
    </Link>
  );
}


