"use client";

import { useActionState, useEffect } from "react";
import { createResume } from "@/actions/Resume";
import { FormState } from "@/lib/types.util";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { SubmitButton } from "./submitBtn";
import { Switch, Title } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";

const initialState: FormState = {
  success: false,
  message: "",
  timestamp: 0,
};

export default function ResumeForm() {
  const [state, formAction, isPending] = useActionState(
    createResume,
    initialState
  );

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
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <Title order={2} style={{ color: "blue" }}>
          Resume
        </Title>
        {/* Add controls here later if you want a Create/Update toggle like About Me */}
      </div>

      {/* Animated content area */}
      <div className="pt-6 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.form
            key="resume-create"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            action={formAction}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium">Resume Title</label>
              <input
                name="title"
                type="text"
                required
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Software Engineer Resume"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">PDF File</label>
              <input
                name="file"
                type="file"
                accept="application/pdf"
                required
                className="
    block w-full text-sm text-gray-900
    file:mr-3 file:py-2 file:px-4
    file:rounded-lg file:border-0
    file:font-medium
    file:bg-blue-50 file:text-blue-700
    hover:file:bg-blue-100
    file:cursor-pointer
  "
              />
              <p className="text-xs text-gray-500">
                PDF only • up to 16&nbsp;MB
              </p>
            </div>

            <div className="pt-1">
              {/* Mantine Switch renders a checkbox under the hood;
                 setting name makes it submit just like your previous checkbox. */}
              <Switch name="selected" color="blue" label="Mark as selected" />
            </div>

            <div>
              <SubmitButton isPending={isPending} label="Save" />
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
