import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createS3Client, getBucketConfig } from "./aws-config";

// ------------------------------------------------------------
// S3 CLIENT & CONFIG
// ------------------------------------------------------------
const s3Client: S3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

/**
 * Build the final S3 key, with optional prefix (folder)
 */
function buildKey(fileName: string) {
  // si la key inclut déjà le préfixe → ne pas le rajouter
  if (fileName.startsWith(folderPrefix)) {
    return fileName;
  }
  return `${folderPrefix}${fileName}`;
}


// ------------------------------------------------------------
// LOW-LEVEL AWS FUNCTIONS (raw operations)
// ------------------------------------------------------------

/**
 * Upload a file to S3.
 * @param buffer File contents (Buffer)
 * @param fileName Path/name inside the bucket (key)
 * @param contentType MIME type
 * @returns string S3 key
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType?: string
): Promise<string> {
  const key = buildKey(fileName);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
  });

  await s3Client.send(command);

  return key;
}

/**
 * Detect content type from file extension
 */
function getContentTypeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  
  const contentTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text
    'txt': 'text/plain',
    'csv': 'text/csv',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Determine if file should be displayed inline or downloaded
 */
function shouldDisplayInline(contentType: string): boolean {
  const inlineTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
  ];
  
  return inlineTypes.includes(contentType);
}

/**
 * Generate a signed URL to download or view a file.
 */
export async function downloadFile(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const contentType = getContentTypeFromKey(key);
  const inline = shouldDisplayInline(contentType);
  const fileName = key.split('/').pop() || 'download';
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: inline 
      ? "inline" 
      : `attachment; filename="${fileName}"`,
    ResponseContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3.
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * "Rename" a file in S3 (actually copy + delete)
 */
export async function renameFile(
  oldKey: string,
  newKey: string
): Promise<string> {
  const copyCommand = new CopyObjectCommand({
    Bucket: bucketName,
    CopySource: `${bucketName}/${oldKey}`,
    Key: newKey,
  });

  await s3Client.send(copyCommand);

  // Delete the original
  await deleteFile(oldKey);

  return newKey;
}

// ------------------------------------------------------------
// HIGH-LEVEL HELPERS (used by your router)
// ------------------------------------------------------------

/**
 * Used by router.upload (version 1)
 */
export async function uploadFileToS3(
  s3Key: string,
  buffer: Buffer,
  contentType?: string
) {
  return uploadFile(buffer, s3Key, contentType);
}

/**
 * Used by router.delete
 */
export async function deleteFromS3(key: string) {
  return deleteFile(key);
}

/**
 * Used by router.getSignedUrl
 */
export async function getSignedUrlForKey(
  key: string,
  expiresIn = 3600,
  download = false
): Promise<string> {
  const contentType = getContentTypeFromKey(key);
  const inline = shouldDisplayInline(contentType);
  const fileName = key.split('/').pop() || 'download';
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: download
      ? `attachment; filename="${fileName}"`
      : (inline ? "inline" : `attachment; filename="${fileName}"`),
    ResponseContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}


// ------------------------------------------------------------
// OPTIONAL: expose a `ctx.s3` helper for TRPC context
// ------------------------------------------------------------
export const s3Helpers = {
  upload: uploadFileToS3,
  delete: deleteFromS3,
  getSignedUrl: getSignedUrlForKey,
};
