import mongoose, { Schema } from "mongoose";

const AboutMeSchema = new Schema(
  {
    description: { type: String, required: true },
  },
  {
    collection: "AboutMe",
    timestamps: true,
  }
);

export const AboutMe =
  mongoose.models.AboutMe || mongoose.model("AboutMe", AboutMeSchema);
