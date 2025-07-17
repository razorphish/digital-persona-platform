import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database-memory";

export async function GET(request: NextRequest) {
  try {
    // Get all users (without passwords for security)
    const result = await query(
      "SELECT id, username, email, full_name, is_active, created_at, updated_at FROM users"
    );

    return NextResponse.json({
      total_users: result.rowCount,
      users: result.rows,
    });
  } catch (error: any) {
    console.error("Debug endpoint error:", error);

    return NextResponse.json(
      { detail: "Debug endpoint error", error: error.message },
      { status: 500 }
    );
  }
}
