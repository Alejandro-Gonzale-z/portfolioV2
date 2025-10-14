import { Schema, model, models } from "mongoose";
import crypto from "node:crypto";

const MAX_BYTES = 16 * 1024 * 1024;
const ALLOWED_MIMES = ["application/pdf"];

const ResumeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },          
    filename: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      required: true,
      enum: ALLOWED_MIMES,                                        
    },
    size: {
      type: Number,
      required: true,
      max: MAX_BYTES,
    },
    file: {
      type: Buffer,
      required: true,
      validate: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator(v: any) {
          return v && v.length <= MAX_BYTES;
        },
        message: "File exceeds 16MB document limit.",
      },
    },
    sha256: {
      type: String,
      required: true,
      unique: true,                                               
      index: true,
    },
    selected: {
      type: Boolean,
      default: false,                                             
    },
  },
  {
    collection: "Resumes",
    timestamps: true,
  }
);

// Ensure at most one selected resume
ResumeSchema.index(
  { selected: 1 },
  { unique: true, partialFilterExpression: { selected: true } }
);

// Auto-populate size and sha256 whenever the file changes
ResumeSchema.pre("validate", function (next) {
  if (this.file) {
    this.size = this.file.length;
    if (this.isModified("file") || !this.sha256) {
      this.sha256 = crypto.createHash("sha256").update(this.file).digest("hex");
    }
  }
  next();
});

export const Resume = models.Resume || model("Resume", ResumeSchema);