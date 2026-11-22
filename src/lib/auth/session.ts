import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
export async function requireRole(role: "provider" | "admin") {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", role).maybeSingle();
  if (!data) redirect("/dashboard");
  return { supabase, user };
}
