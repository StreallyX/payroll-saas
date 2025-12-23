// server/api/routers/email.ts
import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";
import { emailService } from "@/lib/email/emailService";

const PERMS = {
  SEND_EMAIL: "email.send.global",
  LIST_EMAILS: "email.list.global",
} as const;

export const emailRouter = createTRPCRouter({
  // ---------------------------------------------------------
  // SEND EMAIL
  // ---------------------------------------------------------
  send: tenantProcedure
    .use(hasPermission(PERMS.SEND_EMAIL))
    .input(
      z.object({
        to: z.string().email().or(z.array(z.string().email())),
        subject: z.string().min(1),
        body: z.string().min(1),
        isHtml: z.boolean().default(true),
        templateName: z.string().optional(),
        templateData: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Prepare template data with default values
        const templateData = input.templateData || {};
        
        // Add company name if available
        const tenant = await ctx.prisma.tenant.findUnique({
          where: { id: ctx.tenantId! },
          select: { name: true },
        });
        
        if (tenant && !templateData.companyName) {
          templateData.companyName = tenant.name;
        }

        let emailResult;

        // Use template if specified
        if (input.templateName) {
          emailResult = await emailService.sendWithTemplate(
            input.templateName,
            templateData,
            {
              to: input.to,
              subject: input.subject,
            },
            'normal'
          );
        } else {
          // Send direct email
          emailResult = await emailService.send(
            {
              to: input.to,
              subject: input.subject,
              html: input.isHtml ? input.body : undefined,
              text: !input.isHtml ? input.body : undefined,
            },
            'normal'
          );
        }

        // Log email
        const toEmails = Array.isArray(input.to) ? input.to : [input.to];
        await Promise.all(
          toEmails.map((email) =>
            ctx.prisma.emailLog.create({
              data: {
                tenantId: ctx.tenantId,
                to: email,
                from: process.env.EMAIL_FROM || 'noreply@payroll-saas.com',
                subject: input.subject,
                template: input.templateName || null,
                status: 'SENT',
                sentAt: new Date(),
              },
            })
          )
        );

        await ctx.prisma.auditLog.create({
          data: {
            tenantId: ctx.tenantId!,
            userId: ctx.session.user.id,
            userName: ctx.session.user.name ?? "Unknown",
            userRole: ctx.session.user.roleName,
            action: "EMAIL_SENT",
            entityType: "email",
            description: `Sent email: ${input.subject}`,
            metadata: {
              to: input.to,
              template: input.templateName,
            },
          },
        });

        return { success: true, message: "Email sent successfully" };
      } catch (error) {
        // Log failed email
        const toEmails = Array.isArray(input.to) ? input.to : [input.to];
        await Promise.all(
          toEmails.map((email) =>
            ctx.prisma.emailLog.create({
              data: {
                tenantId: ctx.tenantId,
                to: email,
                from: process.env.EMAIL_FROM || 'noreply@payroll-saas.com',
                subject: input.subject,
                template: input.templateName || null,
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            })
          )
        );

        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // ---------------------------------------------------------
  // GET EMAIL TEMPLATES
  // ---------------------------------------------------------
  getTemplates: tenantProcedure
    .use(hasPermission(PERMS.SEND_EMAIL))
    .query(async () => {
      return [
        { 
          name: 'welcome', 
          displayName: 'Welcome Email',
          description: 'Welcome new users',
          variables: ['userName', 'companyName', 'loginUrl']
        },
        { 
          name: 'password-reset', 
          displayName: 'Password Reset',
          description: 'Send password reset link',
          variables: ['userName', 'resetUrl', 'expiryHours']
        },
        { 
          name: 'account-created', 
          displayName: 'Account Created',
          description: 'New account notification with credentials',
          variables: ['userName', 'userEmail', 'password', 'companyName', 'loginUrl']
        },
        { 
          name: 'invoice-notification', 
          displayName: 'Invoice Notification',
          description: 'Notify about new invoice',
          variables: ['clientName', 'invoiceNumber', 'amount', 'dueDate', 'invoiceUrl']
        },
        { 
          name: 'payslip-notification', 
          displayName: 'Payslip Notification',
          description: 'Send payslip to employee',
          variables: ['employeeName', 'period', 'netPay', 'payslipUrl']
        },
      ];
    }),
});
