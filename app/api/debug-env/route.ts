import { NextResponse } from "next/server";

export async function GET() {
  // This should only be used in development!
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  return NextResponse.json({
    TOGETHER_API_KEY: process.env.TOGETHER_API_KEY ? "✅ Set" : "❌ Not set",
    HELICONE_API_KEY: process.env.HELICONE_API_KEY ? "✅ Set" : "❌ Not set",
    SERPER_API_KEY: process.env.SERPER_API_KEY ? "✅ Set" : "❌ Not set",
    NODE_ENV: process.env.NODE_ENV,
    // Show first few characters for verification (don't show full key!)
    TOGETHER_API_KEY_PREFIX: process.env.TOGETHER_API_KEY ? 
      `${process.env.TOGETHER_API_KEY.substring(0, 8)}...` : "Not set",
  });
}
