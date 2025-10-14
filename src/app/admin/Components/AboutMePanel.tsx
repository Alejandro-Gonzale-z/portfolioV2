"use client";

import * as React from "react";
import { Title, Switch } from "@mantine/core";
import AboutMeCreateForm from "./AboutMeCreateForm";
import AboutMeViewUpdate from "./AboutMeViewUpdate";
import { AnimatePresence, motion } from "framer-motion";

export default function AboutMePanel() {
  const [mode, setMode] = React.useState<"create" | "update">("create");
  const isUpdate = mode === "update";

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <Title order={2} style={{ color: isUpdate ? "red" : "blue" }}>
          About Me
        </Title>
        <Switch
          checked={isUpdate}
          onChange={(e) =>
            setMode(e.currentTarget.checked ? "update" : "create")
          }
          color={isUpdate ? "red" : "blue"}
          label={isUpdate ? "Update" : "Create"}
          size="md"
        />
      </div>

      {/* Animated content area */}
      <div className="pt-6 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {isUpdate ? <AboutMeViewUpdate /> : <AboutMeCreateForm />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
