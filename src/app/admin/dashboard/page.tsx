"use client";
import { Title } from "@mantine/core";
import AboutMeForm from "../Components/AboutMeForm";
import AdminNavbar from "../Components/AdminNavbar";

export default function AdminDashboard() {
  return (
    <div className="flex flex-row min-h-screen">
      <AdminNavbar />
      <div className="flex flex-col w-full">
        <div className="admin-padding bg-orange-700 w-full">
          <Title order={1}>Admin Dashboard</Title>
        </div>
        <AboutMeForm />
      </div>
    </div>
  );
}
