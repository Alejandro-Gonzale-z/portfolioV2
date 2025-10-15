/* eslint-disable @typescript-eslint/no-explicit-any */
// src/tests/actions/projects.actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------- Polyfill File in node env ----------
const G: any = globalThis as any;
if (typeof G.File === "undefined") {
  class NodeFile extends Blob {
    name: string;
    lastModified: number;
    type: string;
    constructor(parts: any[], name: string, opts?: { type?: string; lastModified?: number }) {
      super(parts, opts);
      this.name = name;
      this.type = opts?.type ?? "";
      this.lastModified = opts?.lastModified ?? Date.now();
    }
  }
  G.File = NodeFile;
}

// ---------- Hoisted mocks ----------
const H = vi.hoisted(() => {
  return {
    connectToDB: vi.fn().mockResolvedValue(undefined),
    projectCreate: vi.fn(),
    // parseMMDDYYYY mock lets us control valid/invalid cases
    parseMMDDYYYY: vi.fn((s: string) => {
      const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
      if (!m) return null;
      // return a stable Date to avoid TZ flakes
      return new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2])));
    }),
    // GridFSBucket constructor & bucket instance
    bucket: {
      openUploadStream: vi.fn(),
    },
    GridFSBucketCtor: vi.fn(), // will return bucket above
    // pipeline mock (resolves by default)
    pipeline: vi.fn().mockResolvedValue(undefined),
  };
});

// ---------- Module mocks ----------
vi.mock("@/lib/mongoose", () => ({
  connectToDB: H.connectToDB,
}));

vi.mock("@/models/Projects", () => ({
  Project: {
    create: H.projectCreate,
  },
}));

vi.mock("@/lib/actionHelpers.util", () => ({
  parseMMDDYYYY: H.parseMMDDYYYY,
}));

// mongoose default import is used for connection.db
vi.mock("mongoose", () => {
  const mock = { connection: { db: {} } };
  return { __esModule: true, default: mock };
});

// mongodb GridFSBucket (returns our mock bucket)
vi.mock("mongodb", () => {
  return {
    GridFSBucket: H.GridFSBucketCtor.mockImplementation(() => H.bucket),
  };
});

// node:stream/promises pipeline
vi.mock("node:stream/promises", () => ({
  pipeline: H.pipeline,
}));

// ---------- Import the action under test (AFTER mocks) ----------
import { createProject } from "@/actions/Projects";
import type { FormState } from "@/lib/types.util";

const prev: FormState = { success: false, message: "", timestamp: 0 };

// ---------- Helpers ----------
function makeImg(name = "img.png", type = "image/png", content = "PNGDATA") {
  return new File([new TextEncoder().encode(content)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  // reset bucket openUploadStream behavior each test
  let counter = 0;
  H.bucket.openUploadStream.mockImplementation(() => {
    counter += 1;
    return { id: `gfs-${counter}` }; // minimal shape used by action
  });
});

describe("createProject", () => {
  it("returns error when title is missing (but connectToDB is still called)", async () => {
    const fd = new FormData();
    const res = await createProject(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("title is required");

    expect(H.connectToDB).toHaveBeenCalledTimes(1);
    expect(H.projectCreate).not.toHaveBeenCalled();
    expect(H.GridFSBucketCtor).not.toHaveBeenCalled();
  });

  it("errors on bad creationDate format", async () => {
    const fd = new FormData();
    fd.set("title", "P1");
    fd.set("creationDate", "2025-10-14"); // not MM/DD/YYYY -> parseMMDDYYYY returns null

    const res = await createProject(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("must be in mm/dd/yyyy");
    // connectToDB is called at the top of action
    expect(H.connectToDB).toHaveBeenCalledTimes(1);
    expect(H.projectCreate).not.toHaveBeenCalled();
  });

  it("creates with minimal fields (defaults): no desc/links/date/tech/images/visible=false", async () => {
    const fd = new FormData();
    fd.set("title", "Minimal");

    H.projectCreate.mockResolvedValueOnce({ _id: "p-min" });

    const res = await createProject(prev, fd);

    expect(H.connectToDB).toHaveBeenCalledTimes(1);
    expect(H.GridFSBucketCtor).toHaveBeenCalledTimes(1);

    const payload = H.projectCreate.mock.calls[0][0];
    expect(payload.title).toBe("Minimal");
    expect(payload.description).toBe(""); // action defaults ""
    expect(payload.gitHubLink).toBeUndefined();
    expect(payload.productionLink).toBeUndefined();
    expect(payload.creationDate).toBeUndefined();
    expect(payload.visible).toBe(false);
    expect(payload.techStack).toEqual([]);
    expect(payload.images).toEqual([]);

    expect(res.success).toBe(true);
    expect(res.message).toMatch(/project created/i);
  });

  it("creates without images, techStack via checkboxes, visible on", async () => {
    const fd = new FormData();
    fd.set("title", "My Project");
    fd.set("description", "Desc");
    fd.set("gitHubLink", "https://github.com/you/repo");
    fd.set("productionLink", "https://app.example.com");
    fd.set("creationDate", "10/14/2025");
    fd.append("techStack", "Next.js");
    fd.append("techStack", "MongoDB");
    fd.set("visible", "on"); // checkbox-like

    H.projectCreate.mockResolvedValueOnce({ _id: "p1" });

    const res = await createProject(prev, fd);

    expect(H.connectToDB).toHaveBeenCalledTimes(1);
    expect(H.GridFSBucketCtor).toHaveBeenCalledTimes(1);
    expect(H.bucket.openUploadStream).not.toHaveBeenCalled();

    // Validate Project.create payload
    expect(H.projectCreate).toHaveBeenCalledTimes(1);
    const payload = H.projectCreate.mock.calls[0][0];

    expect(payload.title).toBe("My Project");
    expect(payload.description).toBe("Desc");
    expect(payload.gitHubLink).toBe("https://github.com/you/repo");
    expect(payload.productionLink).toBe("https://app.example.com");
    expect(payload.visible).toBe(true);
    expect(payload.techStack).toEqual(["Next.js", "MongoDB"]);
    expect(Array.isArray(payload.images)).toBe(true);
    expect(payload.images.length).toBe(0);

    // creationDate normalized by parseMMDDYYYY mock
    expect(payload.creationDate).toEqual(new Date(Date.UTC(2025, 9, 14)));

    expect(res.success).toBe(true);
    expect(res.message).toMatch(/project created/i);
  });

  it("trims blank links to undefined, trims CSV techs and drops empties", async () => {
    const fd = new FormData();
    fd.set("title", "Trims");
    fd.set("gitHubLink", "   ");
    fd.set("productionLink", "");
    fd.set("techStackCsv", " React , , Tailwind ,  GridFS ");

    H.projectCreate.mockResolvedValueOnce({ _id: "p-trim" });

    const res = await createProject(prev, fd);

    const payload = H.projectCreate.mock.calls[0][0];
    expect(payload.gitHubLink).toBeUndefined();
    expect(payload.productionLink).toBeUndefined();
    expect(payload.techStack).toEqual(["React", "Tailwind", "GridFS"]);
    expect(res.success).toBe(true);
  });

  it("uploads multiple images to GridFS and stores ids + order", async () => {
    const fd = new FormData();
    fd.set("title", "With Images");
    const img1 = makeImg("a.png", "image/png", "AAA");
    const img2 = makeImg("b.png", "image/png", "BBB");
    fd.append("images", img1);
    fd.append("images", img2);

    H.projectCreate.mockResolvedValueOnce({ _id: "p3" });

    const res = await createProject(prev, fd);

    expect(H.GridFSBucketCtor).toHaveBeenCalledTimes(1);
    // one upload stream per file
    expect(H.bucket.openUploadStream).toHaveBeenCalledTimes(2);
    // pipeline called twice
    expect(H.pipeline).toHaveBeenCalledTimes(2);

    // Verify the driver is called with correct filename + contentType
    const c0 = H.bucket.openUploadStream.mock.calls[0];
    expect(c0[0]).toBe("a.png");
    expect(c0[1]?.contentType).toBe("image/png");
    const c1 = H.bucket.openUploadStream.mock.calls[1];
    expect(c1[0]).toBe("b.png");
    expect(c1[1]?.contentType).toBe("image/png");

    const payload = H.projectCreate.mock.calls[0][0];
    expect(payload.images).toEqual([
      { fileID: "gfs-1", alt: "", order: 0 },
      { fileID: "gfs-2", alt: "", order: 1 },
    ]);

    expect(res.success).toBe(true);
    expect(res.message).toMatch(/2 image\(s\)/i);
  });

  it("skips empty image files (keeps original index as order)", async () => {
    const fd = new FormData();
    fd.set("title", "Skip Empty");
    const empty = new File([], "empty.png", { type: "image/png" });
    const ok = makeImg("ok.png", "image/png", "OK");
    fd.append("images", empty); // index 0 -> skipped
    fd.append("images", ok);    // index 1 -> uploaded

    H.projectCreate.mockResolvedValueOnce({ _id: "p4" });

    const res = await createProject(prev, fd);

    // openUploadStream should be called only for the non-empty file
    expect(H.bucket.openUploadStream).toHaveBeenCalledTimes(1);
    const payload = H.projectCreate.mock.calls[0][0];
    expect(payload.images.length).toBe(1);
    // IMPORTANT: order is original index (1), matching current action
    expect(payload.images[0]).toMatchObject({ fileID: "gfs-1", order: 1 });

    expect(res.success).toBe(true);
  });

  it("returns failure when pipeline throws", async () => {
    const fd = new FormData();
    fd.set("title", "Pipeline Fail");
    fd.append("images", makeImg("x.png"));

    H.pipeline.mockRejectedValueOnce(new Error("stream boom"));

    const res = await createProject(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("failed to create project");
  });

  it("propagates success message with count 0 when no images", async () => {
    const fd = new FormData();
    fd.set("title", "No Images");
    H.projectCreate.mockResolvedValueOnce({ _id: "p5" });

    const res = await createProject(prev, fd);
    expect(res.success).toBe(true);
    expect(res.message.toLowerCase()).toMatch(/project created/);
    expect(res.message).not.toMatch(/\d+\simage\(s\)/); // no count appended
  });
});