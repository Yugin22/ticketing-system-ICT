import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard"); // already logged in
  } else {
    redirect("/login"); // not logged in
  }
}