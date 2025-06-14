"use server";

import { FormState } from "@/lib/types.util";
import { cookies } from "next/headers";

export async function validateLogin(prevState: FormState, formData: FormData) {
  const password = formData.get("password") as string;

  if (!password) {
    return { success: false, message: "Password is required to login" };
  }

  const isValid = password === process.env.ADMIN_PASSWORD;

  if (!isValid) {
    return { success: false, message: "Invalid Password" };
  }

  (await cookies()).set("auth", "true", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return {
    success: true,
    message: "Password is correct, you are now logged in",
  };
}
