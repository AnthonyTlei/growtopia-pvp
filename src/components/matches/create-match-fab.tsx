"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import CreateMatchDialog from "./create-match-dialog";

export default function CreateMatchFAB() {
  const [showCreateMatchDialog, setShowCreateMatchDialog] = useState(false);
  return (
    <div className="bg-primary absolute right-4 bottom-4 aspect-square rounded-full p-2 shadow-2xl hover:cursor-pointer text-secondary">
      <Plus className="size-8" onClick={() => setShowCreateMatchDialog(true)} />
      <CreateMatchDialog
        open={showCreateMatchDialog}
        onClose={() => {
          setShowCreateMatchDialog(false);
        }}
      />
    </div>
  );
}
