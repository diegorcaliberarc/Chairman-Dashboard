"use client";

import React from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { PodContainer } from "@/components/chairman/pods/PodContainer";

export default function SharedPodsPage() {
  return (
    <ExecutiveModuleShell
      moduleId="PODS"
      eyebrow="Section 13 • Zero-Trust Collective Sync"
      title='"His & Hers" Shared Pod Engine'
      subtitle="Multi-Tiered Collective Access (Couple 1:1 • Rodriguez Family • Pristine Tech Team) with Live Field-Level Consent Redaction"
      accentColor="#ec4899"
    >
      <PodContainer />
    </ExecutiveModuleShell>
  );
}
