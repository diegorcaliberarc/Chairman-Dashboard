"use client";

import { useState, useEffect } from "react";
import { NovaPanel } from "./NovaPanel";

export function NovaCoreWrapper() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setOpen(p => !p);
    window.addEventListener("toggleNovaCore", handleToggle);
    return () => window.removeEventListener("toggleNovaCore", handleToggle);
  }, []);

  return <NovaPanel open={open} onClose={() => setOpen(false)} />;
}
