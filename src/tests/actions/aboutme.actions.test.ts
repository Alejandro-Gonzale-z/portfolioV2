// src/tests/actions/aboutme.actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mock handles (safe for use inside vi.mock) ---
const M = vi.hoisted(() => ({
  connectToDB: vi.fn().mockResolvedValue(undefined),
  updateMany: vi.fn(),
  create: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock("@/lib/mongoose", () => ({
  connectToDB: M.connectToDB,
}));

vi.mock("@/models/AboutMe", () => ({
  AboutMe: {
    updateMany: M.updateMany,
    create: M.create,
    updateOne: M.updateOne,
  },
}));

// Import the module under test AFTER mocks
import {
  createAboutMe,
  updateAboutMe,
  type AboutMeFormState,
} from "@/actions/AboutMe";

const prev: AboutMeFormState = { success: false, message: "", timestamp: 0 };

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Tests for createAboutMe ----
describe("createAboutMe", () => {
  it("returns error when description is missing", async () => {
    const fd = new FormData();
    const res = await createAboutMe(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("description is required");

    expect(M.connectToDB).not.toHaveBeenCalled();
    expect(M.updateMany).not.toHaveBeenCalled();
    expect(M.create).not.toHaveBeenCalled();
  });

  it("deselects others and creates a selected document", async () => {
    const fd = new FormData();
    fd.set("description", "Hello world");

    M.create.mockResolvedValueOnce({
      _id: "doc1",
      description: "Hello world",
      selected: true,
    });

    const res = await createAboutMe(prev, fd);

    expect(M.connectToDB).toHaveBeenCalledTimes(1);
    expect(M.updateMany).toHaveBeenCalledWith(
      { selected: true },
      { $set: { selected: false } }
    );
    expect(M.create).toHaveBeenCalledWith({
      description: "Hello world",
      selected: true,
    });

    expect(res.success).toBe(true);
    expect(res.message.toLowerCase()).toContain("created successfully");
    expect(typeof res.timestamp).toBe("number");
  });
});

// ---- Tests for updateAboutMe ----
describe("updateAboutMe", () => {
  it("requires id", async () => {
    const fd = new FormData();
    fd.set("description", "X");

    const res = await updateAboutMe(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("missing id");

    expect(M.connectToDB).not.toHaveBeenCalled();
    expect(M.updateOne).not.toHaveBeenCalled();
  });

  it("errors when description is provided but empty after trim", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("description", "   "); // becomes empty string

    const res = await updateAboutMe(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("cannot be empty");
    expect(M.updateOne).not.toHaveBeenCalled();
  });

  it("errors when no fields to update", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    // no description / selected

    const res = await updateAboutMe(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("no fields to update");
    expect(M.updateOne).not.toHaveBeenCalled();
  });

  it("updates description only", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("description", "New desc");

    M.updateOne.mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 });

    const res = await updateAboutMe(prev, fd);

    expect(M.connectToDB).toHaveBeenCalledTimes(1);
    expect(M.updateMany).not.toHaveBeenCalled(); // not switching selection
    expect(M.updateOne).toHaveBeenCalledWith(
      { _id: "abc123" },
      { $set: { description: "New desc" } }
    );

    expect(res.success).toBe(true);
    expect(res.message.toLowerCase()).toContain("updated successfully");
  });

  it("sets selected=true, deselects others, then selects target", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("selected", "true");

    M.updateOne.mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 });

    const res = await updateAboutMe(prev, fd);

    expect(M.connectToDB).toHaveBeenCalledTimes(1);
    expect(M.updateMany).toHaveBeenCalledWith(
      { _id: { $ne: "abc123" }, selected: true },
      { $set: { selected: false } }
    );
    expect(M.updateOne).toHaveBeenCalledWith(
      { _id: "abc123" },
      { $set: { selected: true } }
    );

    expect(res.success).toBe(true);
  });

  it("sets selected=false without deselecting others", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("selected", "false");

    M.updateOne.mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 });

    const res = await updateAboutMe(prev, fd);

    expect(M.updateMany).not.toHaveBeenCalled();
    expect(M.updateOne).toHaveBeenCalledWith(
      { _id: "abc123" },
      { $set: { selected: false } }
    );
    expect(res.success).toBe(true);
  });

  it("returns not found when matchedCount is 0", async () => {
    const fd = new FormData();
    fd.set("id", "missing");
    fd.set("description", "X");

    M.updateOne.mockResolvedValueOnce({ matchedCount: 0, modifiedCount: 0 });

    const res = await updateAboutMe(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("not found");
  });
});