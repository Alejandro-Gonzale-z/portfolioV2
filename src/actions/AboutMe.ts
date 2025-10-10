// /actions/AboutMe.ts
"use server";

import { connectToDB } from "@/lib/mongoose";
import { AboutMe } from "@/models/AboutMe";
// import { revalidatePath } from "next/cache"; // optional if you want to refresh RSC views

export type AboutMeFormState = {
  success: boolean;
  message: string;
  timestamp: number;
};

function now(): number {
  return Date.now();
}

function toBool(v: FormDataEntryValue | null): boolean | undefined {
  if (v == null) return undefined;
  const s = v.toString().trim().toLowerCase();
  if (["true", "on", "1", "yes"].includes(s)) return true;
  if (["false", "off", "0", "no"].includes(s)) return false;
  return undefined;
}

/** Create a new AboutMe and make it the only selected document */
export async function createAboutMe(
  _prevState: AboutMeFormState,
  formData: FormData
): Promise<AboutMeFormState> {
  const description = (formData.get("description") ?? "").toString().trim();

  if (!description) {
    return {
      success: false,
      message: "About me description is required",
      timestamp: now(),
    };
  }

  await connectToDB();

  // Ensure only one selected document
  await AboutMe.updateMany({ selected: true }, { $set: { selected: false } });
  const aboutMe = await AboutMe.create({ description, selected: true });

  // Optional: revalidate paths/tags if your UI reads this via RSC
  // revalidatePath("/admin");

  console.log("Inserted the following document:", aboutMe);

  return {
    success: true,
    message: "Created successfully!",
    timestamp: now(),
  };
}

/** Update description and/or selected for an existing AboutMe */
export async function updateAboutMe(
  _prev: AboutMeFormState,
  formData: FormData
): Promise<AboutMeFormState> {
  const id = formData.get("id")?.toString().trim() ?? "";

  if (!id) {
    return { success: false, message: "Missing id", timestamp: now() };
  }

  // Build a narrow, typed $set object
  type AboutMeSet = { description?: string; selected?: boolean };
  const set: AboutMeSet = {};

  const descriptionRaw = formData.get("description");
  if (descriptionRaw != null) {
    const desc = descriptionRaw.toString().trim();
    if (!desc) {
      return { success: false, message: "Description cannot be empty", timestamp: now() };
    }
    set.description = desc;
  }

  const selectedParsed = toBool(formData.get("selected"));
  if (selectedParsed !== undefined) {
    set.selected = selectedParsed;
  }

  if (Object.keys(set).length === 0) {
    return { success: false, message: "No fields to update", timestamp: now() };
  }

  try {
    await connectToDB();

    // If selecting this doc, first deselect others
    if (selectedParsed === true) {
      await AboutMe.updateMany(
        { _id: { $ne: id }, selected: true },
        { $set: { selected: false } }
      );
      // ensure the target ends up selected
      set.selected = true;
    }

    const res = await AboutMe.updateOne({ _id: id }, { $set: set });

    if (res.matchedCount === 0) {
      return { success: false, message: "AboutMe not found", timestamp: now() };
    }

    return { success: true, message: "Updated successfully!", timestamp: now() };
  } catch (err) {
    console.error("[updateAboutMe] error:", err);
    return { success: false, message: "Failed to update", timestamp: now() };
  }
}