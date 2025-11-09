
// Storage Adapter Abstraction
// This interface allows for easy switching between storage providers (AWS S3, Google Cloud, etc.)

export interface StorageFile {
  key: string
  url: string
  size: number
  contentType: string
  lastModified: Date
}

export interface StorageAdapter {
  // Upload a file and return the storage key/path
  uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string>

  // Download a file by key
  downloadFile(key: string): Promise<Buffer>

  // Get a signed URL for direct access (useful for downloads/previews)
  getSignedUrl(key: string, expiresIn?: number): Promise<string>

  // Delete a file by key
  deleteFile(key: string): Promise<boolean>

  // List files with optional prefix filter
  listFiles(prefix?: string, limit?: number): Promise<StorageFile[]>

  // Check if file exists
  fileExists(key: string): Promise<boolean>

  // Get file metadata
  getFileMetadata(key: string): Promise<StorageFile | null>
}

// Default implementation placeholder
export class LocalStorageAdapter implements StorageAdapter {
  async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
    // TODO: Implement local storage or return mock
    console.warn("LocalStorageAdapter: uploadFile not implemented")
    return key
  }

  async downloadFile(key: string): Promise<Buffer> {
    // TODO: Implement local storage or return mock
    console.warn("LocalStorageAdapter: downloadFile not implemented")
    return Buffer.from("")
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    // TODO: Return local URL or signed URL
    console.warn("LocalStorageAdapter: getSignedUrl not implemented")
    return `/api/files/${key}`
  }

  async deleteFile(key: string): Promise<boolean> {
    // TODO: Implement file deletion
    console.warn("LocalStorageAdapter: deleteFile not implemented")
    return true
  }

  async listFiles(prefix?: string, limit?: number): Promise<StorageFile[]> {
    // TODO: Implement file listing
    console.warn("LocalStorageAdapter: listFiles not implemented")
    return []
  }

  async fileExists(key: string): Promise<boolean> {
    // TODO: Check if file exists
    console.warn("LocalStorageAdapter: fileExists not implemented")
    return false
  }

  async getFileMetadata(key: string): Promise<StorageFile | null> {
    // TODO: Get file metadata
    console.warn("LocalStorageAdapter: getFileMetadata not implemented")
    return null
  }
}

// Storage instance - can be swapped for different implementations
export const storageAdapter: StorageAdapter = new LocalStorageAdapter()
