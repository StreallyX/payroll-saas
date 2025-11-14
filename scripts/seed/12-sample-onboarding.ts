// /seed/12-sample-onboarding.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSampleOnboarding(tenantId: string) {
  console.log("👉 Seeding onboarding templates...")

  const template = await prisma.onboardingTemplate.create({
    data: {
      tenantId,
      name: "Standard Onboarding",
      description: "Basic employee information",
      questions: {
        create: [
          { questionText: "Upload your ID", questionType: "file", order: 1 },
          { questionText: "Address", questionType: "text", order: 2 },
          { questionText: "Upload CV", questionType: "file", order: 3 },
        ],
      },
    },
  })

  console.log("✅ Onboarding template created.")
  return template
}
