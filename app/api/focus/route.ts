import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const FILE = join(process.cwd(), "data", "focus.json");

function load() {
  try {
    return JSON.parse(readFileSync(FILE, "utf-8"));
  } catch {
    return { tasks: [] };
  }
}

export async function GET() {
  return NextResponse.json(load());
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = load();

  if (body.action === "add" && body.text) {
    data.tasks.push({ id: `ft-${Date.now()}`, text: body.text });
  } else if (body.action === "delete" && body.id) {
    data.tasks = data.tasks.filter((t: any) => t.id !== body.id);
  } else if (body.action === "edit" && body.id && body.text) {
    const task = data.tasks.find((t: any) => t.id === body.id);
    if (task) task.text = body.text;
  }

  writeFileSync(FILE, JSON.stringify(data, null, 2));
  return NextResponse.json(data);
}
