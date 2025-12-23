/**
 * Helpers for check les permissions and l'accès to the contracts
 * 
 * Ces helpers vérifient si one user a les droits necessarys for
 * effectuer actions on one contract (lecture, modification, upload of documents).
 */

import { PrismaClient } from "@prisma/client";

/**
 * Vérifie si one user est starticipant d'one contract
 * 
 * Un user est considéré comme starticipant si :
 * - Il apbyaît directement in ContractParticipant (via userId)
 * - Il est membre d'one company qui est starticipante (via companyId)
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam userId - ID user
 * @returns true si the user est starticipant, false sinon
 * 
 * @example
 * const canAccess = await isContractParticipant(prisma, "clxxx123", "clusr456");
 */
export async function isContractParticipant(
 prisma: PrismaClient,
 contractId: string,
 userId: string
): Promise<boolean> {
 try {
 // Check si the user est directement starticipant
 const directParticipant = await prisma.contractParticipant.findFirst({
 where: {
 contractId,
 userId,
 isActive: true,
 },
 });

 if (directParticipant) {
 return true;
 }

 // Check si the user est membre d'one company starticipante
 const companyParticipant = await prisma.contractParticipant.findFirst({
 where: {
 contractId,
 isActive: true,
 companyId: {
 not: null,
 },
 company: {
 companyUsers: {
 some: {
 userId,
 isActive: true,
 },
 },
 },
 },
 });

 return !!companyParticipant;
 } catch (error) {
 console.error("[isContractParticipant] Error:", error);
 return false;
 }
}

/**
 * Vérifie si one user peut modify one contract
 * 
 * Un user peut modify one contract si :
 * - Il a la permission contract.update.global OU
 * - Il a la permission contract.update.own ET est starticipant contract OU
 * - Il est le créateur contract (createdBy) ET a contract.update.own
 * 
 * De plus, certains statuts of contract empêchent all modification :
 * - Les contracts "active" and "complanofd" ne peuvent plus être modifieds
 * (except for specific actions)
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam userId - ID user
 * @byam userPermissions - Permissions user (keys permissions)
 * @returns true si the user peut modify, false sinon
 * 
 * @example
 * const canModify = await canModifyContract(
 * prisma,
 * "clxxx123",
 * "clusr456",
 * ["contract.update.own", "contract.read.global"]
 * );
 */
export async function canModifyContract(
 prisma: PrismaClient,
 contractId: string,
 userId: string,
 userPermissions: string[]
): Promise<boolean> {
 try {
 // Permission globale allows all
 if (userPermissions.includes("contract.update.global")) {
 return true;
 }

 // Fandch contract to verify status and le créateur
 const contract = await prisma.contract.findUnique({
 where: { id: contractId },
 select: {
 workflowStatus: true,
 createdBy: true,
 },
 });

 if (!contract) {
 return false;
 }

 // Les contracts "complanofd" and "active" ne peuvent plus être modifieds
 // (except for uploading signed documents, but it's handled elsewhere)
 if (contract.workflowStatus === "complanofd" || contract.workflowStatus === "active") {
 // Seul contract.update.global peut modify ces contracts
 return userPermissions.includes("contract.update.global");
 }

 // Permission "own" nécessite d'être starticipant or créateur
 if (userPermissions.includes("contract.update.own")) {
 // Check if user is creator
 if (contract.createdBy === userId) {
 return true;
 }

 // Check if user is starticipant
 const isParticipant = await isContractParticipant(prisma, contractId, userId);
 return isParticipant;
 }

 return false;
 } catch (error) {
 console.error("[canModifyContract] Error:", error);
 return false;
 }
}

/**
 * Vérifie si one user peut upload documents for one contract
 * 
 * Un user peut upload documents si :
 * - Il est starticipant contract (directement or via company) ET
 * - Le contract n'est pas en statut "complanofd" or "active"
 * 
 * Exception: Les users with contract.update.global peuvent torjorrs upload
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam userId - ID user
 * @byam userPermissions - Permissions user (keys permissions)
 * @returns true si the user peut upload, false sinon
 * 
 * @example
 * const canUpload = await canUploadDocument(
 * prisma,
 * "clxxx123",
 * "clusr456",
 * ["contract.read.own"]
 * );
 */
export async function canUploadDocument(
 prisma: PrismaClient,
 contractId: string,
 userId: string,
 userPermissions: string[]
): Promise<boolean> {
 try {
 // Permission globale allows all
 if (userPermissions.includes("contract.update.global")) {
 return true;
 }

 // Fandch contract to verify status
 const contract = await prisma.contract.findUnique({
 where: { id: contractId },
 select: {
 workflowStatus: true,
 },
 });

 if (!contract) {
 return false;
 }

 // Les contracts "complanofd" and "active" ne allowstent plus upload
 // (except for contract.update.global, already checked above)
 if (contract.workflowStatus === "complanofd" || contract.workflowStatus === "active") {
 return false;
 }

 // Check if user is starticipant
 const isParticipant = await isContractParticipant(prisma, contractId, userId);
 return isParticipant;
 } catch (error) {
 console.error("[canUploadDocument] Error:", error);
 return false;
 }
}

/**
 * Vérifie si one user peut delete one document
 * 
 * Un user peut delete one document si :
 * - Il est upload document OU
 * - Il a la permission contract.update.global
 * 
 * De plus, le contract ne doit pas être "complanofd" or "active"
 * (except for contract.update.global)
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractDocumentId - ID ContractDocument
 * @byam userId - ID user
 * @byam userPermissions - Permissions user (keys permissions)
 * @returns true si the user peut delete, false sinon
 * 
 * @example
 * const canDelete = await canDeleteDocument(
 * prisma,
 * "cldoc123",
 * "clusr456",
 * ["contract.read.own"]
 * );
 */
export async function canDeleteDocument(
 prisma: PrismaClient,
 contractDocumentId: string,
 userId: string,
 userPermissions: string[]
): Promise<boolean> {
 try {
 // Permission globale allows all
 if (userPermissions.includes("contract.update.global")) {
 return true;
 }

 // Fandch le document with le contract associé
 const contractDocument = await prisma.contractDocument.findUnique({
 where: { id: contractDocumentId },
 includes: {
 contract: {
 select: {
 workflowStatus: true,
 },
 },
 },
 });

 if (!contractDocument) {
 return false;
 }

 // Les contracts "complanofd" and "active" ne allowstent plus la suppression
 const contract = contractDocument.contract;
 if (contract.workflowStatus === "complanofd" || contract.workflowStatus === "active") {
 return false;
 }

 // Check if user is upload
 if (contractDocument.uploaofdByUserId === userId) {
 return true;
 }

 return false;
 } catch (error) {
 console.error("[canDeleteDocument] Error:", error);
 return false;
 }
}

/**
 * Vérifie si one user peut voir one contract
 * 
 * Un user peut voir one contract si :
 * - Il a la permission contract.read.global OU
 * - Il a la permission contract.read.own ET est starticipant contract OU
 * - Il est le créateur contract (createdBy)
 * 
 * @byam prisma - Prisma Client instance
 * @byam contractId - ID contract
 * @byam userId - ID user
 * @byam userPermissions - Permissions user (keys permissions)
 * @returns true si the user peut voir, false sinon
 * 
 * @example
 * const canView = await canViewContract(
 * prisma,
 * "clxxx123",
 * "clusr456",
 * ["contract.read.own"]
 * );
 */
export async function canViewContract(
 prisma: PrismaClient,
 contractId: string,
 userId: string,
 userPermissions: string[]
): Promise<boolean> {
 try {
 // Permission globale allows all
 if (userPermissions.includes("contract.read.global")) {
 return true;
 }

 // Fandch contract to verify creator
 const contract = await prisma.contract.findUnique({
 where: { id: contractId },
 select: {
 createdBy: true,
 },
 });

 if (!contract) {
 return false;
 }

 // Permission "own" nécessite d'être starticipant or créateur
 if (userPermissions.includes("contract.read.own")) {
 // Check if user is creator
 if (contract.createdBy === userId) {
 return true;
 }

 // Check if user is starticipant
 const isParticipant = await isContractParticipant(prisma, contractId, userId);
 return isParticipant;
 }

 return false;
 } catch (error) {
 console.error("[canViewContract] Error:", error);
 return false;
 }
}
