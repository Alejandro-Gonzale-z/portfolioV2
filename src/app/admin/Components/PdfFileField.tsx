"use client";
import { useId, useState } from "react";

export function PdfFileField() {
  const id = useId();
  const [fileName, setFileName] = useState("");

  return (
    <div className="space-y-1">
      <input
        id={id}
        name="file"
        type="file"
        accept="application/pdf"
        required
        className="sr-only"
        onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? "")}
      />
      <label
        htmlFor={id}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2
                   bg-blue-600 text-white cursor-pointer hover:bg-blue-700
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Choose PDF
      </label>
      <p className="text-xs text-gray-600 min-h-[1rem]" aria-live="polite">
        {fileName || ""}
      </p>
    </div>
  );
}