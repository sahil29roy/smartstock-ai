import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth/auth.service";
import { getUserById } from "@/services/auth/auth.repository";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Decode and verify token
    const payload = verifyToken(tokenCookie.value);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the latest user info from the database to check if they are still active
    const user = await getUserById(payload.userId);
    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Me API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
