/**
 * API Route: /api/files/view
 * 
 * Purpose: Server-side file viewing with proper authentication and authorization.
 * This route handles generating signed S3 URLs for file viewing while enforcing
 * security through session validation and permission checks.
 * 
 * Security Features:
 * - Requires user authentication
 * - Validates file access permissions
 * - Supports user-owned files and admin access
 * - Prevents unauthorized file access
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSignedUrlForKey } from "@/lib/s3";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // 2. EXTRACT FILE PATH FROM QUERY STRING
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("filePath");
    const download = searchParams.get("download") === "true";

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing filePath parameter" },
        { status: 400 }
      );
    }

    // 3. PERMISSION VALIDATION
    const userId = session.user.id;
    const isAdmin = await checkAdminPermissions(userId);

    // Check if this is a feature request attachment
    if (filePath.includes("feature-requests")) {
      // For feature requests, check if user owns the request or is admin
      const canAccess = isAdmin || await canAccessFeatureRequestFile(userId, filePath);
      
      if (!canAccess) {
        return NextResponse.json(
          { error: "Forbidden - You don't have permission to access this file" },
          { status: 403 }
        );
      }
    } else {
      // Extract the file owner from the path (e.g., uploads/onboarding/{userId}/...)
      const pathParts = filePath.split("/");
      const fileOwnerId = extractUserIdFromPath(filePath);

      // Check if user can access this file
      const canAccess = isAdmin || fileOwnerId === userId;

      if (!canAccess) {
        return NextResponse.json(
          { error: "Forbidden - You don't have permission to access this file" },
          { status: 403 }
        );
      }
    }

    // 4. GENERATE SIGNED URL
    try {
      // Generate a signed URL valid for 1 hour
      // Pass download parameter to control Content-Disposition header
      const signedUrl = await getSignedUrlForKey(filePath, 3600, download);

      return NextResponse.json({
        success: true,
        url: signedUrl,
      });
    } catch (s3Error: any) {
      console.error("S3 Error:", s3Error);
      
      // Check if it's a file not found error
      if (s3Error.name === "NoSuchKey" || s3Error.Code === "NoSuchKey") {
        return NextResponse.json(
          { error: "File not found in storage" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to generate file URL" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("File view error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check if user has admin permissions
 * Admin users can view all files across the tenant
 */
async function checkAdminPermissions(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) return false;

    // Check for admin-level permissions
    const permissions = user.role?.rolePermissions?.map((rp) => rp.permission.key) || [];
    
    // Admin permissions that allow viewing all files
    const adminPermissions = [
      "onboarding.read",
      "onboarding.write",
      "onboarding_response.list.global", // Admin permission to view all onboarding responses
      "users.read",
      "users.write",
      "global.admin",
      "feature_request.list.global", // Admin permission to view all feature requests
      "feature_request.update.global", // Admin permission to update feature requests
      "platform.update.global", // Platform admin permission
    ];

    return permissions.some((p) => adminPermissions.includes(p));
  } catch (error) {
    console.error("Error checking admin permissions:", error);
    return false;
  }
}

/**
 * Extract user ID from file path
 * Supports various path structures:
 * - uploads/onboarding/{userId}/...
 * - uploads/contracts/{userId}/...
 * - etc.
 */
function extractUserIdFromPath(filePath: string): string | null {
  try {
    const parts = filePath.split("/");
    
    // For onboarding files: uploads/onboarding/{userId}/{questionId}/...
    if (parts.includes("onboarding") && parts.length >= 3) {
      const onboardingIndex = parts.indexOf("onboarding");
      return parts[onboardingIndex + 1] || null;
    }

    // For other modules with similar structure
    if (parts.includes("uploads") && parts.length >= 3) {
      return parts[2] || null; // Third segment is typically userId
    }

    return null;
  } catch (error) {
    console.error("Error extracting user ID from path:", error);
    return null;
  }
}

/**
 * Check if user can access a feature request file
 * Returns true if the user created the feature request that owns this attachment
 */
async function canAccessFeatureRequestFile(userId: string, filePath: string): Promise<boolean> {
  try {
    // Find the attachment record with this file path
    const attachment = await prisma.featureRequestAttachment.findFirst({
      where: {
        fileUrl: filePath,
      },
      include: {
        featureRequest: true,
      },
    });

    if (!attachment) {
      // If attachment not found, deny access
      return false;
    }

    // Check if the user created this feature request
    return attachment.featureRequest.userId === userId;
  } catch (error) {
    console.error("Error checking feature request file access:", error);
    return false;
  }
}
