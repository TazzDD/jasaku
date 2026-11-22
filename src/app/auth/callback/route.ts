import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const n = searchParams.get("next") ?? "/dashboard";
  const next = n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
  if (code) { const supabase = await createClient(); await supabase.auth.exchangeCodeForSession(code); }
  return NextResponse.redirect(`${origin}${next}`);
}
