/**
 * Helpers for checking permissions and contract access
 * 
 * These helpers verify if a user has the necessary rights to
 * perform actions on a contract (read, modify, upload documents).
 */

import { PrismaClient } from "@prisma/client";

/**
 * Checks if a user is a participant of a contract
 * 
 * A user is considered a participant if:
 * - They appear directly in ContractParticipant (via userId)
 * - They are a member of a company that is a participant (via companyId)
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param userId - User ID
 * @returns true if user is participant, false otherwise
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
    // Check if user is directly a participant
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

    // Check if user is a member of a participating company
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
 * Checks if a user can modify a contract
 * 
 * A user can modify a contract if:
 * - They have contract.update.global permission OR
 * - They have contract.update.own permission AND are a participant of the contract OR
 * - They are the contract creator (createdBy) AND have contract.update.own
 * 
 * Additionally, certain contract statuses prevent any modification:
 * - "active" and "completed" contracts can no longer be modified
 *   (except for certain specific actions)
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param userId - User ID
 * @param userPermissions - User permissions (permission keys)
 * @returns true if user can modify, false otherwise
 * 
 * @example
 * const canModify = await canModifyContract(
 *   prisma,
 *   "clxxx123",
 *   "clusr456",
 *   ["contract.update.own", "contract.read.global"]
 * );
 */
export async function canModifyContract(
  prisma: PrismaClient,
  contractId: string,
  userId: string,
  userPermissions: string[]
): Promise<boolean> {
  try {
    // Permission globale permet tout
    if (userPermissions.includes("contract.update.global")) {
      return true;
    }

    // Retrieve contract to check status and creator
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

    // "completed" and "active" contracts can no longer be modified
    // (except for uploading signed documents, but that's handled elsewhere)
    if (contract.workflowStatus === "completed" || contract.workflowStatus === "active") {
      // Only contract.update.global can modify these contracts
      return userPermissions.includes("contract.update.global");
    }

    // "own" permission requires being a participant or creator
    if (userPermissions.includes("contract.update.own")) {
      // Check if user is the creator
      if (contract.createdBy === userId) {
        return true;
      }

      // Check if user is a participant
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
 * Checks if a user can upload documents for a contract
 * 
 * A user can upload documents if:
 * - They are a participant of the contract (directly or via company) AND
 * - Contract is not in "completed" or "active" status
 * 
 * Exception: Users with contract.update.global can always upload
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param userId - User ID
 * @param userPermissions - User permissions (permission keys)
 * @returns true if user can upload, false otherwise
 * 
 * @example
 * const canUpload = await canUploadDocument(
 *   prisma,
 *   "clxxx123",
 *   "clusr456",
 *   ["contract.read.own"]
 * );
 */
export async function canUploadDocument(
  prisma: PrismaClient,
  contractId: string,
  userId: string,
  userPermissions: string[]
): Promise<boolean> {
  try {
    // Permission globale permet tout
    if (userPermissions.includes("contract.update.global")) {
      return true;
    }

    // Retrieve contract to check status
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        workflowStatus: true,
      },
    });

    if (!contract) {
      return false;
    }

    // "completed" and "active" contracts no longer allow upload
    // (except for contract.update.global, already checked above)
    if (contract.workflowStatus === "completed" || contract.workflowStatus === "active") {
      return false;
    }

    // Check if user is a participant
    const isParticipant = await isContractParticipant(prisma, contractId, userId);
    return isParticipant;
  } catch (error) {
    console.error("[canUploadDocument] Error:", error);
    return false;
  }
}

/**
 * Checks if a user can delete a document
 * 
 * A user can delete a document if:
 * - They are the document uploader OR
 * - They have contract.update.global permission
 * 
 * Additionally, contract must not be "completed" or "active"
 * (except for contract.update.global)
 * 
 * @param prisma - Instance Prisma Client
 * @param contractDocumentId - ID du ContractDocument
 * @param userId - User ID
 * @param userPermissions - User permissions (permission keys)
 * @returns true if user can delete, false otherwise
 * 
 * @example
 * const canDelete = await canDeleteDocument(
 *   prisma,
 *   "cldoc123",
 *   "clusr456",
 *   ["contract.read.own"]
 * );
 */
export async function canDeleteDocument(
  prisma: PrismaClient,
  contractDocumentId: string,
  userId: string,
  userPermissions: string[]
): Promise<boolean> {
  try {
    // Permission globale permet tout
    if (userPermissions.includes("contract.update.global")) {
      return true;
    }

    // Retrieve document with associated contract
    const contractDocument = await prisma.contractDocument.findUnique({
      where: { id: contractDocumentId },
      include: {
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

    // "completed" and "active" contracts no longer allow deletion
    const contract = contractDocument.contract;
    if (contract.workflowStatus === "completed" || contract.workflowStatus === "active") {
      return false;
    }

    // Check if user is the uploader
    if (contractDocument.uploadedByUserId === userId) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("[canDeleteDocument] Error:", error);
    return false;
  }
}

/**
 * Checks if a user can view a contract
 * 
 * A user can view a contract if:
 * - They have contract.read.global permission OR
 * - They have contract.read.own permission AND are a participant of the contract OR
 * - They are the contract creator (createdBy)
 * 
 * @param prisma - Instance Prisma Client
 * @param contractId - Contract ID
 * @param userId - User ID
 * @param userPermissions - User permissions (permission keys)
 * @returns true if user can view, false otherwise
 * 
 * @example
 * const canView = await canViewContract(
 *   prisma,
 *   "clxxx123",
 *   "clusr456",
 *   ["contract.read.own"]
 * );
 */
export async function canViewContract(
  prisma: PrismaClient,
  contractId: string,
  userId: string,
  userPermissions: string[]
): Promise<boolean> {
  try {
    // Permission globale permet tout
    if (userPermissions.includes("contract.read.global")) {
      return true;
    }

    // Retrieve contract to check creator
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        createdBy: true,
      },
    });

    if (!contract) {
      return false;
    }

    // "own" permission requires being a participant or creator
    if (userPermissions.includes("contract.read.own")) {
      // Check if user is the creator
      if (contract.createdBy === userId) {
        return true;
      }

      // Check if user is a participant
      const isParticipant = await isContractParticipant(prisma, contractId, userId);
      return isParticipant;
    }

    return false;
  } catch (error) {
    console.error("[canViewContract] Error:", error);
    return false;
  }
}
