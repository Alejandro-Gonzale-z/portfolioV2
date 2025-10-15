"use client";
import AboutMePanel from "../Components/AboutMePanel";
import LinksForm from "../Components/LinksForm";
import { AdminNavLinks } from "@/lib/types.util";
import ResumeForm from "../Components/ResumeForm";
import React, { useState } from "react";
import ProjectCreateForm from "../Components/ProjectsForm";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react";

type TopNavProps = {
  activeTab: AdminNavLinks;
  setActiveTab: React.Dispatch<React.SetStateAction<AdminNavLinks>>;
  onCollapse?: () => void;
};

const tabs: AdminNavLinks[] = [
  AdminNavLinks.AboutMe,
  AdminNavLinks.Links,
  AdminNavLinks.Resume,
  AdminNavLinks.Projects,
];

export function TopNav({ activeTab, setActiveTab, onCollapse }: TopNavProps) {
  return (
    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-12 py-3 bg-white border-b border-gray-200 mb-12 w-full max-w-sm sm:max-w-none mx-auto">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActiveTab(t)}
          className={[
            "w-full sm:w-auto rounded-xl px-4 py-2 text-sm sm:text-md font-medium transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
            activeTab === t
              ? "bg-blue-50 text-gray-900"
              : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          ].join(" ")}
        >
          {t}
        </button>
      ))}
      {/* collapse control (top-right) */}
      <button
        type="button"
        onClick={onCollapse}
        className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border bg-white shadow-sm hover:bg-gray-50"
        aria-label="Hide navigation"
      >
        Hide <IconChevronUp size={16} />
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const [currentForm, setCurrentForm] = useState<AdminNavLinks>(
    AdminNavLinks.AboutMe
  );
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="h-[10%] flex items-center justify-center bg-white z-10
                         shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]"
      >
        <h1
          className="text-4xl sm:text-4xl text-center font-bold py-3
                       drop-shadow-sm"
        >
          Admin Dashboard
        </h1>
      </header>

      {/* Collapsible top nav  content share a layout context */}
      <LayoutGroup>
        <motion.div
          key="admin-topnav"
          layout
          initial={false}
          animate={{
            height: navOpen ? "auto" : 0,
            opacity: navOpen ? 1 : 0,
            marginBottom: navOpen ? 48 : 8, // animate spacing too
          }}
          transition={{
            height: { duration: 0.5, ease: "easeInOut" }, // slower collapse/expand
            opacity: { duration: 0.2 },
            layout: { duration: 0.5, ease: "easeInOut" },
          }}
          style={{ overflow: "hidden" }}
        >
          <TopNav
            activeTab={currentForm}
            setActiveTab={setCurrentForm}
            onCollapse={() => setNavOpen(false)}
          />
        </motion.div>

        {!navOpen && (
          <div className="flex justify-center mb-2 mt-2">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border bg-white shadow-sm hover:bg-gray-50"
            >
              Show tabs <IconChevronDown size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <motion.main
          layout
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="h-[80%] flex justify-center items-center w-full overflow-y-auto"
        >
          <motion.div layout className="w-full max-w-4xl px-6 mb-10">
            {/* Fade/slide between tabs */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentForm}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {currentForm === AdminNavLinks.AboutMe && <AboutMePanel />}
                {currentForm === AdminNavLinks.Links && <LinksForm />}
                {currentForm === AdminNavLinks.Resume && <ResumeForm />}
                {currentForm === AdminNavLinks.Projects && (
                  <ProjectCreateForm />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.main>
      </LayoutGroup>
    </div>
  );
}
