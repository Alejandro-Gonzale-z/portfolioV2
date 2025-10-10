"use client";
import AboutMeForm from "../Components/AboutMeForm";
import LinksForm from "../Components/LinksForm";
import { AdminNavLinks } from "@/lib/types.util";
import React, { useState } from "react";

export default function AdminDashboard() {
  const [currentForm] = useState<AdminNavLinks>(
    AdminNavLinks.AboutMe
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section (10%) */}
      <header className="h-[10%] flex items-center justify-center shadow-[12px_0_24px_-2px_rgba(0,0,0,0.25)] bg-white mb-10">
        <h1 className="text-2xl sm:text-4xl text-center font-bold py-3">Admin Dashboard</h1>
      </header>

      {/* Content Section (90%) */}
      <main className="h-[90%] flex justify-center items-center w-full overflow-auto">
        <div className="w-full max-w-4xl px-6">
          {currentForm === AdminNavLinks.AboutMe && <AboutMeForm />}
          {currentForm === AdminNavLinks.Links && <LinksForm />}
        </div>
      </main>
    </div>
  );
}
