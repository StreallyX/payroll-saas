
// =============================================================
// SEED: TASKS
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTasks(tenantId: string) {
  console.log("✅ Seeding tasks...");

  const hrManager = await prisma.user.findFirst({
    where: {
      tenantId,
      userRoles: {
        some: {
          role: {
            name: "hr_manager",
          },
        },
      },
    },
  });

  const contractors = await prisma.user.findMany({
    where: {
      tenantId,
      userRoles: {
        some: {
          role: {
            name: "contractor",
          },
        },
      },
    },
    take: 3,
  });

  if (!hrManager || contractors.length === 0) {
    console.log("   ⚠️  Missing required data, skipping tasks");
    return [];
  }

  const TASK_TEMPLATES = [
    {
      title: "Complete onboarding documentation",
      description: "Please complete all required onboarding forms and upload necessary documents.",
      priority: "high",
      status: "in_progress",
    },
    {
      title: "Submit timesheet for last week",
      description: "Please submit your timesheet for the week of [date].",
      priority: "medium",
      status: "pending",
    },
    {
      title: "Review and sign contract",
      description: "Please review your contract and sign if you agree with the terms.",
      priority: "high",
      status: "completed",
    },
    {
      title: "Update banking information",
      description: "Please update your banking information for payment processing.",
      priority: "low",
      status: "pending",
    },
  ];

  const tasks = [];

  for (let i = 0; i < TASK_TEMPLATES.length; i++) {
    const template = TASK_TEMPLATES[i];
    const assignee = contractors[i % contractors.length];

    const task = await prisma.task.create({
      data: {
        tenantId,
        title: template.title,
        description: template.description,
        assignedTo: assignee.id,
        createdBy: hrManager.id,
        priority: template.priority,
        status: template.status,
        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        completedAt: template.status === "completed" ? new Date() : null,
      },
    });

    tasks.push(task);
    console.log(`   ✓ ${task.title} - assigned to ${assignee.name}`);
  }

  console.log(`✅ Tasks seeded: ${tasks.length}`);
  return tasks;
}

// Run if executed directly
if (require.main === module) {
  seedTasks(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding tasks:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
