"use client";

import { useState } from "react";
import IgnPrompt from "./ign-prompt";

export default function IgnPromptWrapper() {
  const [open, setOpen] = useState(true);
  return <IgnPrompt open={open} onOpenChange={setOpen} />;
}
