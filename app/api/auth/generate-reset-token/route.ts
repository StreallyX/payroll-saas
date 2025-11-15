// src/app/api/utils/generate-reset-token/route.ts

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Generate token
    const token = crypto.randomUUID();

    // Save it
    await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // 🔥 REDIRECT DIRECTLY TO SET-PASSWORD PAGE
    const redirectUrl = `/auth/set-password?token=${token}`;

    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
