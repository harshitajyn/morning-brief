import { NextResponse } from "next/server";
import { fetchAllData } from "@/app/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await fetchAllData();
  return NextResponse.json(data, { status: data.live === false && (data as any).error ? 500 : 200 });
}
