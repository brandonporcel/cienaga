// app/api/notifications/log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClientForServer } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const LogNotificationSchema = z.object({
  userId: z.uuid(),
  screeningIds: z.array(z.uuid()).min(1).max(50), // Max 50 screenings por notificación
  emailSubject: z.string().min(1).max(200),
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
    const validationResult = LogNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error,
        },
        { status: 400 },
      );
    }

    const { userId, screeningIds, emailSubject } = validationResult.data;

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 },
      );
    }

    // Verificar que al menos algunos screenings existen
    const { data: existingScreenings, error: screeningsError } = await supabase
      .from("screenings")
      .select("id")
      .in("id", screeningIds);

    if (screeningsError) {
      console.error("Error checking screenings:", screeningsError);
      return NextResponse.json(
        {
          error: "Database error checking screenings",
        },
        { status: 500 },
      );
    }

    const validScreeningIds = existingScreenings?.map((s) => s.id) || [];

    if (validScreeningIds.length === 0) {
      return NextResponse.json(
        {
          error: "No valid screenings found",
        },
        { status: 400 },
      );
    }

    // Log notification
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        screening_ids: validScreeningIds,
        email_subject: emailSubject,
      })
      .select("id, sent_at")
      .single();

    if (insertError) {
      console.error("Error logging notification:", insertError);
      return NextResponse.json(
        {
          error: "Failed to log notification",
        },
        { status: 500 },
      );
    }

    console.log(
      `Notification logged: ${notification.id} for user ${userId} with ${validScreeningIds.length} screenings`,
    );

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      sentAt: notification.sent_at,
      validScreenings: validScreeningIds.length,
      totalRequested: screeningIds.length,
    });
  } catch (error) {
    console.error("Fatal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET endpoint para obtener historial de notificaciones de un usuario
export async function GET(request: NextRequest) {
  const supabase = await createClientForServer();

  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId) {
      return NextResponse.json(
        {
          error: "userId parameter is required",
        },
        { status: 400 },
      );
    }

    // Obtener historial de notificaciones
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, email_subject, sent_at, screening_ids")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(Math.min(limit, 100)); // Max 100 registros

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        {
          error: "Database error",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: notifications?.length || 0,
    });
  } catch (error) {
    console.error("Fatal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
