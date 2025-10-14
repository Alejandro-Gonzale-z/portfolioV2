"use client";
import { useActionState, useEffect } from "react";
import { FormState } from "@/lib/types.util";
import { LinkType } from "@/lib/types.util";
import { Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { createLink } from "@/actions/Links";
import { SubmitButton } from "./submitBtn";

const TYPES: LinkType[] = ["linkedin", "github", "email", "phone"];

const PRETTY_LABEL: Record<LinkType, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  email: "Email",
  phone: "Phone",
};

const PLACEHOLDER: Record<LinkType, string> = {
  linkedin: "https://www.linkedin.com/in/your-handle",
  github: "https://github.com/your-handle",
  email: "you@example.com",
  phone: "+1 555 123 4567",
};

const FIELD_LABEL: Record<LinkType, string> = {
  linkedin: "Profile URL",
  github: "Profile URL",
  email: "Email address",
  phone: "Phone number",
};

const initialState: FormState = {
  success: false,
  message: "",
  timestamp: 0,
};

function MiniLinkForm({ type }: { type: LinkType }) {
  const [state, formAction, isPending] = useActionState(createLink, initialState);

  const pretty = PRETTY_LABEL[type];
  const fieldLabel = FIELD_LABEL[type];
  const placeholder = PLACEHOLDER[type];

  useEffect(() => {
    if (state.message) {
      notifications.show({
        position: "top-center",
        withCloseButton: true,
        autoClose: 3500,
        title: state.success ? "Success" : "Error",
        message: state.message,
        color: state.success ? "green" : "red",
        icon: state.success ? <IconCheck stroke={2} /> : <IconX stroke={2} />,
      });
    }
  }, [state.message, state.success, state.timestamp]);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-gray-200 p-4 shadow-xl space-y-4 bg-white"
    >
      <input type="hidden" name="type" value={type} />

      <div className="space-y-2">
        <Title order={3} style={{ color: "blue", textAlign: "center" }}>
          {pretty} Form
        </Title>
        <label className="block text-sm font-medium text-gray-700">
          {pretty} Title
        </label>
        <input
          name="title"
          defaultValue={pretty}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {fieldLabel}
        </label>
        <input
          name="link"
          placeholder={placeholder}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id={`selected-${type}`}
          name="selected"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor={`selected-${type}`} className="text-sm text-gray-700">
          Mark this as the selected {pretty}
        </label>
      </div>

      <div className="flex justify-end align-right pt-1">
        <SubmitButton isPending={isPending}label="Save" />
      </div>
    </form>
  );
}

export default function LinksForm() {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xl p-6 md:p-8">
      <Title order={2} style={{ color: "blue" }}>
        Links
      </Title>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 mt-4">
        {TYPES.map((t) => (
          <MiniLinkForm key={t} type={t} />
        ))}
      </div>
    </div>
  );
}
