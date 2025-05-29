"use server";

import { connectToDB } from "@/lib/mongoose";
import { AboutMe } from "@/models/AboutMe";

type FormState = {
  success: boolean;
  message: string;
};

export async function createAboutMe(prevState: FormState, formData: FormData) {
  const description = formData.get("description") as string;

  if (!description) {
    return { success: false, message: "About me description is required" };
  }

  await connectToDB();
  const aboutMe = await AboutMe.create({ description });
  console.log("Inserted the following document:", aboutMe);
  return { success: true, message: "Created successfully!" };
}
