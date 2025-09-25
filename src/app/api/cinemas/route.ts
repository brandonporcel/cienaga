import { NextRequest, NextResponse } from "next/server";

import { createClientForServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClientForServer();
  const { searchParams } = new URL(request.url);
  const enabledOnly = searchParams.get("enabled");

  let query = supabase.from("cinemas").select("*");

  if (enabledOnly) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query.order("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
