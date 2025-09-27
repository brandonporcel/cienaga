import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";

const BulkUsersSchema = z.object({
  userIds: z.array(z.uuid()).min(1).max(100),
});

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();

  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validar request body
    const body = await request.json();
    const validationResult = BulkUsersSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error,
        },
        { status: 400 },
      );
    }

    const { userIds } = validationResult.data;

    // Obtener usuarios
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .in("id", userIds);

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        {
          error: "Database error",
        },
        { status: 500 },
      );
    }

    // Log para debugging
    console.log(
      `Bulk users request: ${userIds.length} requested, ${users?.length || 0} found`,
    );

    return NextResponse.json(users || []);
  } catch (error) {
    console.error("Fatal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
