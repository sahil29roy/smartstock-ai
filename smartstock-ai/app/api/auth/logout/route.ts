import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleRouteError } from "@/lib/errors";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the JWT token cookie
    cookieStore.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0), // Expire immediately
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/logout");
  }
}
