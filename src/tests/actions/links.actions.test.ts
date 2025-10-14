// src/tests/actions/links.actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mock handles (safe for use inside vi.mock) ---
const M = vi.hoisted(() => ({
  connectToDB: vi.fn().mockResolvedValue(undefined),

  // Link model methods
  updateMany: vi.fn(),
  create: vi.fn(),
  updateOne: vi.fn(),
  findById: vi.fn(), // will return { select().lean() }
}));

vi.mock("@/lib/mongoose", () => ({
  connectToDB: M.connectToDB,
}));

vi.mock("@/models/Links", () => ({
  default: {
    updateMany: M.updateMany,
    create: M.create,
    updateOne: M.updateOne,
    findById: M.findById,
  },
}));

// Import AFTER mocks
import { createLink, updateLink } from "@/actions/Links";
import type { FormState } from "@/lib/types.util";

// helpers
const prev: FormState = { success: false, message: "", timestamp: 0 };
const okUpdate = { matchedCount: 1, modifiedCount: 1 };
const notFoundUpdate = { matchedCount: 0, modifiedCount: 0 };

// utility to mock findById().select().lean()
function mockFindByIdLeanOnce(value: unknown) {
  const select = vi.fn().mockReturnThis();
  const lean = vi.fn().mockResolvedValue(value);
  M.findById.mockReturnValueOnce({ select, lean });
  return { select, lean };
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* -------------------------- createLink -------------------------- */
describe("createLink", () => {
  it("fails when required fields are missing", async () => {
    const fd = new FormData();
    const res = await createLink(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("title is required");
    expect(M.connectToDB).not.toHaveBeenCalled();
  });

  it("validates type-specific value (email)", async () => {
    const fd = new FormData();
    fd.set("title", "Email");
    fd.set("type", "email");
    fd.set("link", "not-an-email");

    const res = await createLink(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("invalid");
    expect(M.create).not.toHaveBeenCalled();
  });

  it("deselects others when selected=true and creates doc", async () => {
    const fd = new FormData();
    fd.set("title", "LinkedIn");
    fd.set("type", "linkedin");
    fd.set("link", "https://www.linkedin.com/in/handle");
    fd.set("selected", "true");

    const res = await createLink(prev, fd);

    expect(M.connectToDB).toHaveBeenCalledTimes(1);
    expect(M.updateMany).toHaveBeenCalledWith(
      { type: "linkedin", selected: true },
      { $set: { selected: false } }
    );
    expect(M.create).toHaveBeenCalledWith({
      title: "LinkedIn",
      type: "linkedin",
      link: "https://www.linkedin.com/in/handle",
      selected: true,
    });
    expect(res.success).toBe(true);
  });

  it("returns friendly message on duplicate key (11000)", async () => {
    const fd = new FormData();
    fd.set("title", "GitHub");
    fd.set("type", "github");
    fd.set("link", "https://github.com/you");
    fd.set("selected", "true");

    M.create.mockRejectedValueOnce({ code: 11000 });

    const res = await createLink(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("already exists");
  });
});

/* -------------------------- updateLink -------------------------- */
describe("updateLink", () => {
  it("requires id", async () => {
    const fd = new FormData();
    const res = await updateLink(prev, fd);

    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("missing id");
    expect(M.connectToDB).not.toHaveBeenCalled();
  });

  it("no fields to update -> error", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");

    const res = await updateLink(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("no fields to update");
  });

  it("updates title only", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("title", "New Title");

    mockFindByIdLeanOnce({ _id: "abc123", type: "linkedin", link: "https://x" }); // fetched but not strictly needed here
    M.updateOne.mockResolvedValueOnce(okUpdate);

    const res = await updateLink(prev, fd);

    expect(M.connectToDB).toHaveBeenCalledTimes(1);
    expect(M.updateMany).not.toHaveBeenCalled();
    expect(M.updateOne).toHaveBeenCalledWith(
      { _id: "abc123" },
      { $set: { title: "New Title" } },
      { runValidators: true }
    );
    expect(res.success).toBe(true);
  });

  it("validates link against (new) type when either changes", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("type", "email");
    fd.set("link", "not-an-email");

    mockFindByIdLeanOnce({ _id: "abc123", type: "linkedin", link: "https://x" });

    const res = await updateLink(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("invalid for its (new) type");
    expect(M.updateOne).not.toHaveBeenCalled();
  });

  it("selected=true deselects others in effective type (no type change)", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("selected", "true");

    mockFindByIdLeanOnce({ _id: "abc123", type: "github", link: "https://github.com/you" });
    M.updateOne.mockResolvedValueOnce(okUpdate);

    const res = await updateLink(prev, fd);

    expect(M.updateMany).toHaveBeenCalledWith(
      { type: "github", selected: true, _id: { $ne: "abc123" } },
      { $set: { selected: false } }
    );
    expect(M.updateOne).toHaveBeenCalledWith(
      { _id: "abc123" },
      { $set: { selected: true } },
      { runValidators: true }
    );
    expect(res.success).toBe(true);
  });

  it("selected=true + type change deselects others in NEW type", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("type", "linkedin"); // move to linkedin
    fd.set("selected", "true");

    mockFindByIdLeanOnce({ _id: "abc123", type: "github", link: "https://github.com/you" });
    M.updateOne.mockResolvedValueOnce(okUpdate);

    const res = await updateLink(prev, fd);

    expect(M.updateMany).toHaveBeenCalledWith(
      { type: "linkedin", selected: true, _id: { $ne: "abc123" } },
      { $set: { selected: false } }
    );
    expect(M.updateOne).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  it("selected=false does not deselect others", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("selected", "false");

    mockFindByIdLeanOnce({ _id: "abc123", type: "email", link: "you@example.com" });
    M.updateOne.mockResolvedValueOnce(okUpdate);

    const res = await updateLink(prev, fd);

    expect(M.updateMany).not.toHaveBeenCalled();
    expect(M.updateOne).toHaveBeenCalledWith(
      { _id: "abc123" },
      { $set: { selected: false } },
      { runValidators: true }
    );
    expect(res.success).toBe(true);
  });

  it("returns not found when matchedCount is 0", async () => {
    const fd = new FormData();
    fd.set("id", "missing");
    fd.set("title", "X");

    mockFindByIdLeanOnce({ _id: "missing", type: "linkedin", link: "https://x" });
    M.updateOne.mockResolvedValueOnce(notFoundUpdate);

    const res = await updateLink(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("not found");
  });

  it("duplicate key on update returns friendly message", async () => {
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("selected", "true");

    mockFindByIdLeanOnce({ _id: "abc123", type: "github", link: "https://github.com/you" });
    M.updateOne.mockRejectedValueOnce({ code: 11000 });

    const res = await updateLink(prev, fd);
    expect(res.success).toBe(false);
    expect(res.message.toLowerCase()).toContain("already exists");
  });
});