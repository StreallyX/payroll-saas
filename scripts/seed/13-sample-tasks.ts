// /seed/13-sample-tasks.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSampleTasks(tenantId: string) {
  console.log("👉 Seeding tasks...")

  const admin = await prisma.user.findFirst({
    where: { tenantId, email: "admin@demo.com" },
  })

  const hr = await prisma.user.findFirst({
    where: { tenantId, email: "hr@demo.com" },
  })

  if (!admin || !hr) return console.log("❌ Missing admin or HR")

  const TASKS = [
    {
      title: "Review Contractor Documents",
      description: "Verify all onboarding documents.",
      assignedBy: admin.id,
      assignedTo: hr.id,
      tenantId,
    },
    {
      title: "Approve Payroll Report",
      description: "Review payroll calculations.",
      assignedBy: admin.id,
      assignedTo: admin.id,
      tenantId,
    },
    {
      title: "Follow up with agency",
      description: "Get missing contract signed.",
      assignedBy: admin.id,
      assignedTo: hr.id,
      tenantId,
    },
  ]

  for (const t of TASKS) {
    await prisma.task.create({ data: t })
  }

  console.log("✅ Tasks created.")
}
