// src/app/admin/Components/ProjectCreateForm.tsx
"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Title, Button as MantineButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { createProject } from "@/actions/Projects";
import type { FormState } from "@/lib/types.util";
import { SubmitButton } from "./submitBtn";

const initialState: FormState = { success: false, message: "", timestamp: 0 };

// Common techs; each renders a checkbox named "techStack"
const COMMON_TECHS = [
  "Next.js",
  "TypeScript",
  "Python",
  "React",
  "Node.js",
  "Mongoose",
  "MongoDB",
  "GridFS",
  "Tailwind",
];

type Batch = {
  id: string;
  files: string[];
};

export default function ProjectCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createProject,
    initialState
  );
  const [batches, setBatches] = useState<Batch[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const uid = useId(); // used to generate unique ids per batch

  useEffect(() => {
    if (!state.message) return;
    notifications.show({
      position: "top-center",
      withCloseButton: true,
      autoClose: 3500,
      title: state.success ? "Success" : "Error",
      message: state.message,
      color: state.success ? "green" : "red",
      icon: state.success ? <IconCheck stroke={2} /> : <IconX stroke={2} />,
    });
  }, [state]);

  function addBatchAndPick() {
    const id = `${uid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setBatches((prev) => [...prev, { id, files: [] }]);
    // click after DOM paints so the ref is set
    requestAnimationFrame(() => {
      inputRefs.current[id]?.click();
    });
  }

  function onBatchChange(id: string, el: HTMLInputElement | null) {
    if (!el) return;
    const names = Array.from(el.files ?? []).map((f) => f.name);
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, files: names } : b))
    );
  }

  function removeBatch(id: string) {
    // Clear the input and remove the ref, then drop the batch from state
    const el = inputRefs.current[id];
    if (el) {
      try {
        {
          el.value = "";
        }
      } catch {}
    }
    delete inputRefs.current[id];
    setBatches((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <Title order={2} style={{ color: "blue" }}>
          Project
        </Title>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            name="title"
            required
            placeholder="Awesome Scheduler"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="Short summary of the project..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              GitHub Link
            </label>
            <input
              name="gitHubLink"
              placeholder="https://github.com/your/repo"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Production Link
            </label>
            <input
              name="productionLink"
              placeholder="https://yourapp.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Creation date & Visible */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Creation Date (MM/DD/YYYY)
            </label>
            <input
              name="creationDate"
              placeholder="10/14/2025"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="visible"
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Visible</span>
          </label>
        </div>

        {/* Tech stack: checkboxes + CSV fallback */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tech Stack
          </label>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
            {COMMON_TECHS.map((t) => (
              <label key={t} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="techStack"
                  value={t}
                  className="h-4 w-4"
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-500">
              Or paste a CSV list (used if no checkboxes are selected)
            </label>
            <input
              name="techStackCsv"
              placeholder="Next.js, Mongoose, GridFS"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Images */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Images
            </label>
            <MantineButton
              variant="outline"
              color="blue"
              leftSection={<IconPlus size={16} />}
              onClick={(e) => {
                e.preventDefault();
                addBatchAndPick();
              }}
            >
              Add images
            </MantineButton>
          </div>

          {/* Hidden inputs + previews per batch */}
          <div className="space-y-2">
            {batches.map((b) => (
              <div key={b.id} className="rounded-lg border border-gray-200 p-3">
                {/* Hidden input that actually carries the files */}
                <input
                  ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[b.id] = el;
                  }}
                  type="file"
                  name="images"
                  multiple
                  className="sr-only"
                  onChange={(e) => onBatchChange(b.id, e.currentTarget)}
                />

                <div className="flex items-start gap-3">
                  {/* Left side: filenames (or empty placeholder) */}
                  <div className="flex-1">
                    {!!b.files.length ? (
                      <ul className="text-sm">
                        {b.files.map((n, i) => (
                          <li key={i} className="truncate">
                            {n}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="min-h-[1.25rem]" />
                    )}
                  </div>
                  {/* Right side: buttons (always pinned right) */}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                      onClick={() => inputRefs.current[b.id]?.click()}
                    >
                      Choose files
                    </button>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                      onClick={() => removeBatch(b.id)}
                    >
                      <IconTrash size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <SubmitButton isPending={isPending} label="Save" />
        </div>
      </form>
    </div>
  );
}
