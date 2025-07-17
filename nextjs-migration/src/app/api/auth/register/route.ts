import { NextRequest, NextResponse } from "next/server";
import { registerUser, UserCreate } from "@/lib/auth";

export async function POST(request: NextRequest) {
  console.log("🔍 Registration endpoint called");
  try {
    const body: UserCreate = await request.json();
    console.log("📝 Request body:", body);

    // Validate required fields
    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { detail: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { detail: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json(
        { detail: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Register user
    console.log("🚀 Calling registerUser...");
    const result = await registerUser(body);
    console.log("✅ Registration successful:", result);

    return NextResponse.json({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      token_type: result.token_type,
      expires_in: result.expires_in,
      user: result.user,
    });
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.message === "User with this email already exists") {
      return NextResponse.json(
        { detail: "User with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
