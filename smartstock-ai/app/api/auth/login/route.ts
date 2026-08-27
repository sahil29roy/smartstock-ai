import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { login } from "@/services/auth/auth.service";
import { loginSchema } from "@/validators/auth/auth.validator";
import { handleRouteError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    
    // Perform authentication
    const authSession = await login(email, password);
    if (!authSession) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Set HTTP-only secure cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: authSession.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({
      success: true,
      user: authSession.user,
    });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/login");
  }
}
