"use client";

import { useActionState, useEffect } from "react";
import { createResume } from "@/actions/Resume";
import { FormState } from "@/lib/types.util";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { SubmitButton } from "./submitBtn";
import { Switch, Title } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { PdfFileField } from "./PdfFileField";

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
      <div className="pt-6 relative">
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
              <label className="block text-sm font-medium text-gray-700">Resume Title</label>
              <input
                name="title"
                type="text"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Software Engineer Resume"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">PDF File</label>
              <PdfFileField />
            </div>

            <div className="pt-1">
              {/* Mantine Switch renders a checkbox under the hood;
                 setting name makes it submit just like your previous checkbox. */}
              <Switch name="selected" color="blue" label="Mark as selected" />
            </div>

            <div className="flex justify-end">
              <SubmitButton isPending={isPending} label="Save" />
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
