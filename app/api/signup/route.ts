
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists (across all tenants for now)
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10)

    // For demo purposes, get the first tenant and contractor role
    const tenant = await prisma.tenant.findFirst()
    const contractorRole = await prisma.role.findFirst({
      where: { name: "contractor" },
    })

    if (!tenant || !contractorRole) {
      return NextResponse.json(
        { error: "System not properly initialized" },
        { status: 500 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        tenantId: tenant.id,
        roleId: contractorRole.id,
      },
      include: {
        tenant: true,
        role: true,
      },
    })

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user

    return NextResponse.json({
      message: "User created successfully",
      user: userResponse,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
