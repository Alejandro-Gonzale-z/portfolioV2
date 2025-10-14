/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import { connectToDB } from "@/lib/mongoose";
import { Project } from "@/models/Projects";
import type { FormState } from "@/lib/types.util";
import { parseMMDDYYYY } from "@/lib/actionHelpers.util";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const now = () => Date.now();

export async function createProject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await connectToDB();

    const title = (formData.get("title") ?? "").toString().trim();
    if (!title) {
      return { success: false, message: "Title is required", timestamp: now() };
    }

    const description =
      (formData.get("description") ?? "").toString().trim() || "";

    const gitHubLink =
      (formData.get("gitHubLink") ?? "").toString().trim() || undefined;
    const productionLink =
      (formData.get("productionLink") ?? "").toString().trim() || undefined;

    const creationDateStr = (formData.get("creationDate") ?? "")
      .toString()
      .trim();
    const creationDate = creationDateStr
      ? parseMMDDYYYY(creationDateStr) ?? undefined
      : undefined;
    if (creationDateStr && !creationDate) {
      return {
        success: false,
        message: "creationDate must be in MM/DD/YYYY format",
        timestamp: now(),
      };
    }

    const visible = formData.get("visible") === "on";

    // techStack can be multiple selects OR a CSV string; we support both
    let techStack: string[] = [];
    const tsAll = formData.getAll("techStack");
    if (tsAll.length > 0) {
      techStack = tsAll
        .map((v) => v?.toString().trim())
        .filter(Boolean) as string[];
    } else {
      const csv = (formData.get("techStackCsv") ?? "").toString();
      techStack = csv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // ---- Upload images to GridFS ----
    const db = mongoose.connection.db!;
    const bucket = new GridFSBucket(db, { bucketName: "projectImages" });

    const files = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File);

    const images: { fileId: any; alt: string; order: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f || f.size === 0) continue;

      const buf = Buffer.from(await f.arrayBuffer());
      const uploadStream = bucket.openUploadStream(f.name, {
        contentType: f.type || "application/octet-stream",
      });

      await pipeline(Readable.from(buf), uploadStream);

      images.push({ fileId: uploadStream.id, alt: "", order: i });
    }

    await Project.create({
      title,
      description,
      images,
      gitHubLink,
      productionLink,
      creationDate,
      visible,
      techStack,
    });

    return {
      success: true,
      message: `Project created${
        images.length ? ` with ${images.length} image(s)` : ""
      }.`,
      timestamp: now(),
    };
  } catch (err) {
    console.error("[createProject] error:", err);
    return {
      success: false,
      message: "Failed to create project",
      timestamp: now(),
    };
  }
}
