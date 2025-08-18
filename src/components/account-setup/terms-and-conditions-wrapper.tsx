"use client";

import { useState } from "react";
import TermsAndConditions from "./terms-and-conditions";

export default function TermsAndConditionsWrapper() {
  const [open, setOpen] = useState(true);
  return <TermsAndConditions open={open} onOpenChange={setOpen} />;
}
