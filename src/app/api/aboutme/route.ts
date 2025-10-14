/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { AboutMe } from "@/models/AboutMe";

export async function GET() {
  await connectToDB();
  const docs = await AboutMe.find({}).sort({ updatedAt: -1 }).lean();

  const items = docs.map((d: any) => ({
    _id: d._id.toString(),
    description: d.description as string,
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
  }));

  return NextResponse.json(items);
}