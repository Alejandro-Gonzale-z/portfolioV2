// app/(admin)/components/AboutMeViewUpdate.tsx
"use client";

import * as React from "react";
import { Button, Textarea, Title } from "@mantine/core";
import { updateAboutMe } from "@/actions/AboutMe";
import type { FormState } from "@/lib/types.util";

type AboutMeItem = { _id: string; description: string; updatedAt?: string };

const initialState: FormState = { success: false, message: "", timestamp: 0 };

function formatWhen(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();

  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12; // convert 0 -> 12
  const hh = String(h).padStart(2, "0");

  const min = String(d.getMinutes()).padStart(2, "0");

  return `${mm}/${dd}/${yyyy} ${hh}:${min} ${ampm}`;
}

function Bubble({ item, onSaved }: { item: AboutMeItem; onSaved: () => void }) {
  const [editing, setEditing] = React.useState(false);
  const [state, formAction, isPending] = React.useActionState(
    updateAboutMe,
    initialState
  );

  React.useEffect(() => {
    if (!state.timestamp) return;
    if (state.success) {
      setEditing(false);
      onSaved(); // re-fetch list
    }
  }, [state, onSaved]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
      {!editing ? (
        <>
          <Title order={4}>Last updated: {formatWhen(item.updatedAt)}</Title>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {item.description}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <Button
              size="xs"
              variant="outline"
              color="blue"
              onClick={() => setEditing(true)}
              className="ml-auto"
            >
              Update
            </Button>
          </div>
        </>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={item._id} />
          <Textarea
            name="description"
            defaultValue={item.description}
            autosize
            minRows={4}
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="xs"
              variant="subtle"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="xs" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
          {!state.success && state.message ? (
            <p className="text-xs text-red-600">{state.message}</p>
          ) : null}
        </form>
      )}
    </div>
  );
}

export default function AboutMeViewUpdate() {
  const [items, setItems] = React.useState<AboutMeItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/aboutme", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AboutMeItem[];
      setItems(data);
    } catch {
      setItems([]);
      setError("Failed to load records");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {items === null && !error && (
        <p className="text-sm text-gray-500">Loading…</p>
      )}
      {items && items.length === 0 && !error && (
        <p className="text-sm text-gray-500">No records yet.</p>
      )}

      {items && items.length > 0 && (
        <div className="max-h-[65vh] md:max-h-[70vh] overflow-y-auto pr-1 min-h-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pb-2">
            {items.map((it) => (
              <Bubble key={it._id} item={it} onSaved={load} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
