// /actions/Links.ts
"use server";
import { connectToDB } from "@/lib/mongoose";
import Link from "@/models/Links";
import { Types } from "mongoose";
import { toBool } from "@/lib/actionHelpers.util"
import { FormState } from "@/lib/types.util";
import { LinkType } from "@/lib/types.util";

const now = () => Date.now();

const isHttpUrl = (u: string) => /^https?:\/\/.+/i.test(u);
const isEmail = (u: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u);
const isPhone = (u: string) => /^\+?[0-9()\s.-]{7,}$/.test(u);

function isValidForType(value: string, type: string): boolean {
  const t = type.toLowerCase();
  if (t === "email") return isEmail(value);
  if (t === "phone") return isPhone(value);
  return isHttpUrl(value);
}

/** Create a new Link document. Fields: title, link, type, selected */
export async function createLink(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const title = (formData.get("title") ?? "").toString().trim();
  const link = (formData.get("link") ?? "").toString().trim();
  const type = (formData.get("type") ?? "").toString().trim().toLowerCase() as LinkType | "";
  const selected = toBool(formData.get("selected")) ?? false;

  if (!title) return { success: false, message: "Title is required", timestamp: now() };
  if (!link) return { success: false, message: "Link is required", timestamp: now() };
  if (!type) return { success: false, message: "Type is required", timestamp: now() };
  if (!isValidForType(link, type))
    return { success: false, message: "Link is invalid for its type", timestamp: now() };

  try {
    await connectToDB();

    // Enforce one selected per type (app-level, avoids duplicate key from partial unique index)
    if (selected) {
      await Link.updateMany({ type, selected: true }, { $set: { selected: false } });
    }

    await Link.create({ title, link, type, selected });

    return { success: true, message: "Link created", timestamp: now() };
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return {
        success: false,
        message: "A selected link for this type already exists. Deselect it first or try again.",
        timestamp: now(),
      };
    }
    console.error("[createLink] error:", err);
    return { success: false, message: "Failed to create link", timestamp: now() };
  }
}

/** Update an existing Link. Accepts any subset of: title, link, type, selected (+ id) */
export async function updateLink(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = (formData.get("id") ?? "").toString().trim();
  if (!id) return { success: false, message: "Missing id", timestamp: now() };

  type LinkSet = { title?: string; link?: string; type?: LinkType | string; selected?: boolean };
  const set: LinkSet = {};

  const titleRaw = formData.get("title");
  if (titleRaw != null) {
    const v = titleRaw.toString().trim();
    if (!v) return { success: false, message: "Title cannot be empty", timestamp: now() };
    set.title = v;
  }

  const linkRaw = formData.get("link");
  if (linkRaw != null) {
    const v = linkRaw.toString().trim();
    if (!v) return { success: false, message: "Link cannot be empty", timestamp: now() };
    set.link = v;
  }

  const typeRaw = formData.get("type");
  if (typeRaw != null) {
    const v = typeRaw.toString().trim().toLowerCase();
    if (!v) return { success: false, message: "Type cannot be empty", timestamp: now() };
    set.type = v as LinkType;
  }

  const selectedParsed = toBool(formData.get("selected"));
  if (selectedParsed !== undefined) set.selected = selectedParsed;

  if (Object.keys(set).length === 0) {
    return { success: false, message: "No fields to update", timestamp: now() };
  }

  try {
    await connectToDB();

    // Fetch current minimal fields for validation and selection logic
    type LeanLinkMinimal = { _id: Types.ObjectId; type: string; link: string };
    const current = await Link.findById(id).select("type link").lean<LeanLinkMinimal | null>();
    if (!current) {
      return { success: false, message: "Link not found", timestamp: now() };
    }

    // Validate link against the effective type (if either changed)
    if (set.link !== undefined || set.type !== undefined) {
      const effectiveType = (set.type ?? current.type) as string;
      const effectiveLink = (set.link ?? current.link) as string;
      if (!isValidForType(effectiveLink, effectiveType)) {
        return {
          success: false,
          message: "Link is invalid for its (new) type",
          timestamp: now(),
        };
      }
    }

    // If marking this link as selected, ensure it's the only one for its (possibly new) type
    if (selectedParsed === true) {
      const effectiveType = (set.type ?? current.type) as string;
      await Link.updateMany(
        { type: effectiveType, selected: true, _id: { $ne: id } },
        { $set: { selected: false } }
      );
      set.selected = true;
    }

    const res = await Link.updateOne({ _id: id }, { $set: set }, { runValidators: true });
    if (res.matchedCount === 0) {
      return { success: false, message: "Link not found", timestamp: now() };
    }

    return { success: true, message: "Updated successfully", timestamp: now() };
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return {
        success: false,
        message: "A selected link for this type already exists.",
        timestamp: now(),
      };
    }
    console.error("[updateLink] error:", err);
    return { success: false, message: "Failed to update", timestamp: now() };
  }
}