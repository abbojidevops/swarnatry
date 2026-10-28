import { NextResponse } from "next/server";
import manifest from "@/app/manifest";

export async function GET() {
  return NextResponse.json(manifest());
}
