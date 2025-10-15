/* eslint-disable @typescript-eslint/no-explicit-any */
// src/tests/actions/resume.actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Polyfill File if running in a pure node env (no jsdom) ---
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

// --- Hoisted mock handles (safe for use inside vi.mock) ---
const M = vi.hoisted(() => ({
  connectToDB: vi.fn().mockResolvedValue(undefined),
  updateMany: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/mongoose", () => ({
  connectToDB: M.connectToDB,
}));

vi.mock("@/models/Resume", () => ({
  Resume: {
    updateMany: M.updateMany,
    create: M.create,
  },
}));

// Import module under test AFTER mocks
import { createResume } from "@/actions/Resume";
import type { FormState } from "@/lib/types.util";
import crypto from "node:crypto";

const prev: FormState = { success: false, message: "", timestamp: 0 };

// Helpers
function makePdfFile(name = "resume.pdf", type = "application/pdf") {
  // Minimal PDF header so your magic check passes
  const bytes = new TextEncoder().encode("%PDF-1.4\n% test\n");
  return new File([bytes], name, { type });
}
function sha256OfFile(file: File) {
  // Used to assert what we expect the action to compute
  // (the action hashes the full buffer contents)
  return file.arrayBuffer().then((ab) =>
    crypto.createHash("sha256").update(Buffer.from(ab)).digest("hex")
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createResume action", () => {
  it("errors when title is missing", async () => {
    const fd = new FormData();
    fd.set("file", makePdfFile());
    const res = await createResume(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("title is required");
    expect(M.connectToDB).not.toHaveBeenCalled();
    expect(M.create).not.toHaveBeenCalled();
  });

  it("errors when file is missing", async () => {
    const fd = new FormData();
    fd.set("title", "My Resume");
    const res = await createResume(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("pdf file is required");
    expect(M.connectToDB).not.toHaveBeenCalled();
  });

  it("errors when file is empty", async () => {
    const empty = new File([], "resume.pdf", { type: "application/pdf" });
    const fd = new FormData();
    fd.set("title", "My Resume");
    fd.set("file", empty);

    const res = await createResume(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("file is empty");
    expect(M.connectToDB).not.toHaveBeenCalled();
  });

  it("errors when MIME is not application/pdf (guard triggers before header check)", async () => {
    const notPdf = makePdfFile("resume.bin", "application/octet-stream");
    const fd = new FormData();
    fd.set("title", "My Resume");
    fd.set("file", notPdf);

    const res = await createResume(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("only pdf files are allowed");
    expect(M.connectToDB).not.toHaveBeenCalled();
  });

  it("errors when magic header is not %PDF", async () => {
    const bad = new File([new TextEncoder().encode("HELLO")], "resume.pdf", {
      type: "application/pdf",
    });
    const fd = new FormData();
    fd.set("title", "My Resume");
    fd.set("file", bad);

    const res = await createResume(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("invalid pdf file");
    expect(M.connectToDB).not.toHaveBeenCalled();
  });

  it("creates resume and deselects others when selected", async () => {
    const pdf = makePdfFile();
    const expectedSha = await sha256OfFile(pdf);

    M.create.mockResolvedValueOnce({ _id: "r1" });

    const fd = new FormData();
    fd.set("title", "My Resume");
    fd.set("file", pdf);
    fd.set("selected", "on"); // checkbox style

    const res = await createResume(prev, fd);

    expect(M.connectToDB).toHaveBeenCalledTimes(1);
    expect(M.updateMany).toHaveBeenCalledWith(
      { selected: true },
      { $set: { selected: false } }
    );
    expect(M.create).toHaveBeenCalledTimes(1);

    // Check shape of payload sent to create()
    const arg = M.create.mock.calls[0][0];
    expect(arg.title).toBe("My Resume");
    expect(arg.filename).toBe("resume.pdf");
    expect(arg.contentType).toBe("application/pdf");
    expect(typeof arg.size).toBe("number");
    expect(Buffer.isBuffer(arg.file)).toBe(true);
    expect(arg.sha256).toBe(expectedSha);
    expect(arg.selected).toBe(true);

    expect(res.success).toBe(true);
    expect(res.message.toLowerCase()).toContain("uploaded successfully");
  });

  it("creates resume without deselecting when not selected", async () => {
    const pdf = makePdfFile();
    M.create.mockResolvedValueOnce({ _id: "r2" });

    const fd = new FormData();
    fd.set("title", "Not Selected");
    fd.set("file", pdf);

    const res = await createResume(prev, fd);

    expect(M.connectToDB).toHaveBeenCalledTimes(1);
    expect(M.updateMany).not.toHaveBeenCalled(); // not selected => no deselect
    expect(M.create).toHaveBeenCalledTimes(1);
    expect(res.success).toBe(true);
  });

  it("returns duplicate message when sha256 unique index is hit", async () => {
    const pdf = makePdfFile();
    M.create.mockRejectedValueOnce({ code: 11000, keyPattern: { sha256: 1 } });

    const fd = new FormData();
    fd.set("title", "Dup");
    fd.set("file", pdf);

    const res = await createResume(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("already exists");
  });

  it("returns generic failure on unexpected error", async () => {
    const pdf = makePdfFile();
    M.create.mockRejectedValueOnce(new Error("boom"));

    const fd = new FormData();
    fd.set("title", "X");
    fd.set("file", pdf);

    const res = await createResume(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("failed to upload");
  });
});