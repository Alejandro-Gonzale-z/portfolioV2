"use client";
import AboutMePanel from "../Components/AboutMePanel";
import LinksForm from "../Components/LinksForm";
import { AdminNavLinks } from "@/lib/types.util";
import ResumeForm from "../Components/ResumeForm";
import React, { useState } from "react";


type TopNavProps = {
  activeTab: AdminNavLinks;
  setActiveTab: React.Dispatch<React.SetStateAction<AdminNavLinks>>;
};

const tabs: AdminNavLinks[] = [AdminNavLinks.AboutMe, AdminNavLinks.Links, AdminNavLinks.Resume];

export function TopNav({ activeTab, setActiveTab }: TopNavProps) {

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-12 py-3 bg-white border-b border-gray-200 mb-12 w-full max-w-sm sm:max-w-none mx-auto">
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
    </div>
  );
}

export default function AdminDashboard() {
  const [currentForm, setCurrentForm] = useState<AdminNavLinks>(AdminNavLinks.AboutMe);

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

      <TopNav activeTab={currentForm} setActiveTab={setCurrentForm} />

      {/* Content */}
      <main className="h-[80%] flex justify-center items-center w-full overflow-y-auto">
        <div className="w-full max-w-4xl px-6 mb-10">
          {currentForm === AdminNavLinks.AboutMe && <AboutMePanel />}
          {currentForm === AdminNavLinks.Links && <LinksForm />}
          {currentForm === AdminNavLinks.Resume && <ResumeForm />}
        </div>
      </main>
    </div>
  );
}
