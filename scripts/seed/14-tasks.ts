
/**
 * Seed Tasks
 * Creates sample tasks
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedTasks(tenantId: string, users: any[]) {
  console.log("👉 Seeding tasks...");

  const adminUser = users.find((u) => u.email === "admin@demo.com");
  const hrUser = users.find((u) => u.email === "hr@demo.com");
  const financeUser = users.find((u) => u.email === "finance@demo.com");
  const teamLead = users.find((u) => u.email === "teamlead@demo.com");
  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contractor2 = users.find((u) => u.email === "contractor2@demo.com");

  const TASKS = [
    {
      title: "Review timesheet submissions",
      description: "Review and approve pending timesheet submissions from contractors",
      assignedTo: teamLead?.id,
      createdBy: adminUser?.id,
      priority: "high",
      status: "in_progress",
      dueDate: new Date("2024-11-20"),
    },
    {
      title: "Complete onboarding documents",
      description: "Submit all required onboarding documents and personal information",
      assignedTo: contractor1?.id,
      createdBy: hrUser?.id,
      priority: "urgent",
      status: "pending",
      dueDate: new Date("2024-11-18"),
    },
    {
      title: "Generate monthly financial report",
      description: "Create comprehensive financial report for October 2024",
      assignedTo: financeUser?.id,
      createdBy: adminUser?.id,
      priority: "high",
      status: "completed",
      dueDate: new Date("2024-11-05"),
      completedAt: new Date("2024-11-04"),
    },
    {
      title: "Update design system documentation",
      description: "Document all new components and design patterns",
      assignedTo: contractor2?.id,
      createdBy: teamLead?.id,
      priority: "medium",
      status: "in_progress",
      dueDate: new Date("2024-11-25"),
    },
    {
      title: "Approve pending invoices",
      description: "Review and approve invoices awaiting approval",
      assignedTo: financeUser?.id,
      createdBy: adminUser?.id,
      priority: "high",
      status: "pending",
      dueDate: new Date("2024-11-19"),
    },
    {
      title: "Conduct quarterly performance reviews",
      description: "Complete performance reviews for all team members",
      assignedTo: hrUser?.id,
      createdBy: adminUser?.id,
      priority: "medium",
      status: "pending",
      dueDate: new Date("2024-12-01"),
    },
  ];

  for (const taskData of TASKS) {
    if (!taskData.assignedTo || !taskData.createdBy) continue;

    await prisma.task.create({
      data: {
        tenantId,
        ...taskData,
      },
    });
  }

  console.log(`✅ ${TASKS.length} tasks created`);
}
