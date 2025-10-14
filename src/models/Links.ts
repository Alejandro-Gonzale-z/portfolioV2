/* eslint-disable @typescript-eslint/no-explicit-any */
// /models/Link.ts
import { Schema, model, models, InferSchemaType } from "mongoose";

export const LINK_TYPES = ["linkedin", "github", "phone", "email"] as const;

const LinkSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    link: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(this: any, v: string) {
          const t = (this.type as string)?.toLowerCase();
          if (t === "email") {
            // Email Validation
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          }
          if (t === "phone") {
            // Phone Validation
            return /^\+?[0-9()\s.-]{7,}$/.test(v);
          }
          // Actual Link Validation
          return /^https?:\/\/.+/i.test(v);
        },
        message: (props: any) => `Invalid ${props.path} for the given type`,
      },
    },
    type: {
      type: String,
      required: true,
      enum: LINK_TYPES,
      trim: true,
      lowercase: true,
    },
    selected: { type: Boolean, default: false },
  },
  {
    collection: "Links",
    timestamps: true,
  }
);

// Ensure only one selected per type (DB-level)
// This says: among docs with selected:true, the (type) must be unique.
LinkSchema.index(
  { type: 1 },
  { unique: true, partialFilterExpression: { selected: true } }
);

export type LinkDoc = InferSchemaType<typeof LinkSchema>;
export default models.Link || model("Link", LinkSchema);
