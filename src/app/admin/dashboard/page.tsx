"use client";
import { Text } from "@mantine/core";
import AboutMeForm from "../Components/AboutMeForm";
import AdminNavbar from "../Components/AdminNavbar";
import LinksForm from "../Components/LinksForm";
import { AdminNavLinks } from "@/lib/types.util";
import { useState } from "react";

export default function AdminDashboard() {
  const [currentForm, setCurrentForm] = useState<AdminNavLinks>(
    AdminNavLinks.Null
  );

  return (
    <div className="flex flex-row min-h-screen">
      <AdminNavbar />
      <div className="flex flex-col w-full admin-padding h-[88px] justify-center shadow-[12px_0_24px_-2px_rgba(0,0,0,0.25)]"> 
        <div className="w-full">
          <h1 className="text-2xl sm:text-4xl">Admin Dashboard</h1>
        </div>
        {currentForm === AdminNavLinks.AboutMe && <AboutMeForm />}
        {currentForm === AdminNavLinks.Links && <LinksForm />}
      </div>
    </div>
  );
}
