import { NextRequest, NextResponse } from "next/server";
import { loginUser, UserLogin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body: UserLogin = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { detail: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const result = await loginUser(body);

    return NextResponse.json({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      token_type: result.token_type,
      expires_in: result.expires_in,
      user: result.user,
    });
  } catch (error: any) {
    console.error("Login error:", error);

    if (error.message === "Invalid credentials") {
      return NextResponse.json(
        { detail: "Invalid email or password" },
        { status: 401 }
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
