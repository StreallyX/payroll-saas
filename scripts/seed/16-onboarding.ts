
/**
 * Seed Onboarding
 * Creates onboarding templates and responses
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedOnboarding(tenantId: string, users: any[]) {
  console.log("👉 Seeding onboarding...");

  // Create Onboarding Template
  const template = await prisma.onboardingTemplate.create({
    data: {
      tenantId,
      name: "Contractor Onboarding",
      description: "Standard onboarding process for new contractors",
      isActive: true,
    },
  });

  // Create Questions
  const questions = [
    {
      questionText: "Please provide your emergency contact information",
      questionType: "textarea",
      isRequired: true,
      order: 1,
    },
    {
      questionText: "Upload a copy of your government-issued ID",
      questionType: "file",
      isRequired: true,
      order: 2,
    },
    {
      questionText: "Do you have any relevant certifications?",
      questionType: "select",
      options: { choices: ["Yes", "No"] },
      isRequired: true,
      order: 3,
    },
    {
      questionText: "Please upload your resume/CV",
      questionType: "file",
      isRequired: true,
      order: 4,
    },
    {
      questionText: "Describe your previous work experience (2-3 paragraphs)",
      questionType: "textarea",
      isRequired: true,
      order: 5,
    },
  ];

  for (const questionData of questions) {
    await prisma.onboardingQuestion.create({
      data: {
        onboardingTemplateId: template.id,
        ...questionData,
      },
    });
  }

  console.log(`   ✓ Created template with ${questions.length} questions`);

  // Create some responses
  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contractor2 = users.find((u) => u.email === "contractor2@demo.com");
  const hrUser = users.find((u) => u.email === "hr@demo.com");

  const allQuestions = await prisma.onboardingQuestion.findMany({
    where: { onboardingTemplateId: template.id },
  });

  // Contractor 1 - Complete responses (approved)
  if (contractor1) {
    for (const question of allQuestions) {
      let responseText = null;
      let responseFilePath = null;

      switch (question.order) {
        case 1:
          responseText = "Emergency Contact: Jane Doe, Relationship: Spouse, Phone: +1-555-9999";
          break;
        case 2:
          responseFilePath = "/uploads/docs/contractor1-id.pdf";
          break;
        case 3:
          responseText = "Yes";
          break;
        case 4:
          responseFilePath = "/uploads/docs/contractor1-resume.pdf";
          break;
        case 5:
          responseText =
            "I have 8 years of experience in full-stack web development, specializing in React, Node.js, and cloud infrastructure. In my previous role at TechStartup Inc., I led the development of their core platform serving 100,000+ users.\n\nI'm passionate about clean code, test-driven development, and continuous learning. I've contributed to several open-source projects and regularly speak at local tech meetups.";
          break;
      }

      await prisma.onboardingResponse.create({
        data: {
          userId: contractor1.id,
          questionId: question.id,
          responseText,
          responseFilePath,
          status: "approved",
          submittedAt: new Date("2024-01-12"),
          reviewedAt: new Date("2024-01-13"),
          reviewedBy: hrUser?.id,
          adminNotes: "All documents verified and approved",
        },
      });
    }
    console.log(`   ✓ Created responses for ${contractor1.email} (approved)`);
  }

  // Contractor 2 - Partial responses (pending)
  if (contractor2) {
    const firstThree = allQuestions.slice(0, 3);
    for (const question of firstThree) {
      let responseText = null;
      let responseFilePath = null;

      switch (question.order) {
        case 1:
          responseText = "Emergency Contact: Mike Smith, Relationship: Brother, Phone: +44-7911-123456";
          break;
        case 2:
          responseFilePath = "/uploads/docs/contractor2-passport.pdf";
          break;
        case 3:
          responseText = "Yes";
          break;
      }

      await prisma.onboardingResponse.create({
        data: {
          userId: contractor2.id,
          questionId: question.id,
          responseText,
          responseFilePath,
          status: "pending",
          submittedAt: new Date("2024-01-28"),
        },
      });
    }
    console.log(`   ✓ Created partial responses for ${contractor2.email} (pending)`);
  }

  console.log("✅ Onboarding data seeded");
}
