import { Schema, model, models } from "mongoose";

const AboutMeSchema = new Schema(
  {
    description: { type: String, required: true },
    selected: { type: Boolean, required: true },
  },
  {
    collection: "AboutMe",
    timestamps: true,
  }
);

export const AboutMe = models.AboutMe || model("AboutMe", AboutMeSchema);
