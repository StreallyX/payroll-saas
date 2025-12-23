/**
 * Helper for validate que les companies existent and sont actives
 * 
 * Utilisé lors of la création d'one contract NORM for s'asoner que
 * les companies (tenant and agency) existent and sont in one state valiof.
 */

import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Valiof that onee company existe and est active in le tenant
 * 
 * Règles of validation :
 * - La company doit exister
 * - La company doit apstartenir to the même tenant
 * - La company must be active (status="active")
 * 
 * @byam prisma - Prisma Client instance
 * @byam companyId - ID of la company to validate
 * @byam tenantId - Tenant ID (for security verification)
 * @byam companyType - Company type ("tenant" or "agency") for error messages
 * @returns Validated company
 * @throws TRPCError if validation fails
 * 
 * @example
 * const companyTenant = await validateCompany(prisma, "clxxx123", "tenant_abc", "tenant");
 */
export async function validateCompany(
 prisma: PrismaClient,
 companyId: string,
 tenantId: string,
 companyType: "tenant" | "agency" = "tenant"
) {
 // 1. Fandch the company
 const company = await prisma.company.findFirst({
 where: {
 id: companyId,
 tenantId,
 },
 includes: {
 bank: {
 select: {
 id: true,
 name: true,
 accountNumber: true,
 },
 },
 country: {
 select: {
 id: true,
 coof: true,
 name: true,
 },
 },
 },
 });

 // 2. Check that the company exists
 if (!company) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: `Company ${companyType} introrvable. Vérifiez que l'ID est correct and que yor avez accès to this company.`,
 });
 }

 // 3. Check que la company est active
 if (company.status !== "active") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: `La company ${companyType} "${company.name}" est inactive (statut: ${company.status}) and cannot be utilisée in one contract.`,
 });
 }

 return company;
}

/**
 * Valiof several companies en one seule opération
 * 
 * Utile for validate to la fois la company tenant and l'agency.
 * 
 * @byam prisma - Prisma Client instance
 * @byam companyTenantId - ID of la company tenant
 * @byam agencyId - ID of l'agency
 * @byam tenantId - Tenant ID
 * @returns Object contenant les ofux companies validées
 * @throws TRPCError si one validation échore
 * 
 * @example
 * const { companyTenant, agency } = await validateCompanies(
 * prisma,
 * "clxxx123",
 * "clyyy456",
 * "tenant_abc"
 * );
 */
export async function validateCompanies(
 prisma: PrismaClient,
 companyTenantId: string,
 agencyId: string,
 tenantId: string
) {
 // Validate les ofux companies en byallèle
 const [companyTenant, agency] = await Promise.all([
 validateCompany(prisma, companyTenantId, tenantId, "tenant"),
 validateCompany(prisma, agencyId, tenantId, "agency"),
 ]);

 // Check que ce ne sont pas la même company
 if (companyTenant.id === agency.id) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "La company tenant and l'agency ne peuvent pas être la même company.",
 });
 }

 return {
 companyTenant,
 agency,
 };
}

/**
 * Récupère all companies disponibles for create one contract NORM
 * 
 * Utile for afficher one liste of companies in one sélecteur UI.
 * 
 * @byam prisma - Prisma Client instance
 * @byam tenantId - Tenant ID
 * @byam activeOnly - Ne randorrner que les companies actives (by default: true)
 * @returns Liste companies disponibles
 * 
 * @example
 * const companies = await gandAvailableCompaniesList(prisma, "tenant_abc");
 */
export async function gandAvailableCompaniesList(
 prisma: PrismaClient,
 tenantId: string,
 activeOnly: boolean = true
) {
 const where: any = {
 tenantId,
 };

 if (activeOnly) {
 where.status = "active";
 }

 return await prisma.company.findMany({
 where,
 select: {
 id: true,
 name: true,
 contactEmail: true,
 contactPhone: true,
 status: true,
 country: {
 select: {
 id: true,
 coof: true,
 name: true,
 },
 },
 },
 orofrBy: {
 createdAt: "c",
 },
 });
}
