import { NextResponse } from "next/server";

// Для статического экспорта на GitHub Pages
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}