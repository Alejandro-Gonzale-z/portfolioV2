// /actions/Resume.ts
"use server";

import crypto from "node:crypto";
import { connectToDB } from "@/lib/mongoose";
import { Resume } from "@/models/Resume";
import { toBool } from "@/lib/actionHelpers.util";
import { FormState } from "@/lib/types.util";

const MAX_BYTES = 16 * 1024 * 1024; // 16MB MongoDB doc limit
const ALLOWED_MIME = "application/pdf";
const now = () => Date.now();

/** Create a new Resume from an uploaded PDF and (optionally) mark it selected */
export async function createResume(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const titleRaw = formData.get("title");
  const fileField = formData.get("file");
  const selectedParsed = toBool(formData.get("selected"));

  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  if (!title) {
    return { success: false, message: "Title is required", timestamp: now() };
  }

  if (!(fileField instanceof File)) {
    return { success: false, message: "PDF file is required", timestamp: now() };
  }

  const filename = fileField.name?.trim() || "resume.pdf";
  const contentType = fileField.type || ALLOWED_MIME;
  const size = fileField.size;

  if (size === 0) {
    return { success: false, message: "File is empty", timestamp: now() };
  }
  if (size > MAX_BYTES) {
    return { success: false, message: "File exceeds 16MB limit", timestamp: now() };
  }
  if (contentType !== ALLOWED_MIME) {
    return { success: false, message: "Only PDF files are allowed", timestamp: now() };
  }

  const buf = Buffer.from(await fileField.arrayBuffer());

  // Quick PDF magic header check
  if (buf.slice(0, 4).toString() !== "%PDF") {
    return { success: false, message: "Invalid PDF file", timestamp: now() };
  }

  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const selected = selectedParsed === true;

  try {
    await connectToDB();

    // If marking this as selected, proactively unselect others to satisfy the partial unique index
    if (selected) {
      await Resume.updateMany({ selected: true }, { $set: { selected: false } });
    }

    await Resume.create({
      title,
      filename,
      contentType,
      size,
      file: buf,
      sha256,
      selected,
    });

    // Optionally: revalidatePath("/admin"); if your UI reads via RSC
    return { success: true, message: "Uploaded successfully!", timestamp: now() };
  } catch (err) {
    const e = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (e?.code === 11000 && e?.keyPattern?.sha256) {
      return { success: false, message: "This exact PDF already exists", timestamp: now() };
    }
    console.error("[createResume] error:", err);
    return { success: false, message: "Failed to upload", timestamp: now() };
  }
}