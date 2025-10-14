import { Schema, model, models } from "mongoose";

const ProjectImageRef = new Schema(
  {
    fileID: { type: Schema.Types.ObjectId, required: true },
    alt: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  {
    _id: false,
  }
);

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, default: "" },
    images: { type: [ProjectImageRef], default: [] },
    techStack: { type: [String], default: [] },
    gitHubLink: { type: String },
    productionLink: { type: String },
    creationDate: { type: Date },
    visible: { type: Boolean, required: true },
  },
  {
    collection: "Projects",
    timestamps: true,
  }
);

export const Project = models.Project || model("Project", ProjectSchema);
