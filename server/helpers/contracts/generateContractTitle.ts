/**
 * Helper for automatically generating a contract title
 * from a PDF filename
 * 
 * Used by the simplified MSA/SOW contract system to create
 * automatically readable titles without user intervention.
 */

/**
 * Generates a contract title from a PDF filename
 * 
 * Transformation rules:
 * - Enlever l'extension (.pdf, .PDF)
 * - Replace underscores and hyphens with spaces
 * - Capitalize first letter of each word
 * - Limit to 100 characters
 * - Return "Untitled Contract" if result is empty
 * 
 * @param fileName - Filename (e.g., "msa_client_abc.pdf")
 * @returns Formatted title (e.g., "Msa Client Abc")
 * 
 * @example
 * generateContractTitle("msa_client_abc.pdf") // "Msa Client Abc"
 * generateContractTitle("SOW-Project-XYZ.pdf") // "Sow Project Xyz"
 * generateContractTitle("MSA_TechCorp_2024-Q1.pdf") // "Msa Techcorp 2024 Q1"
 */
export function generateContractTitle(fileName: string): string {
  if (!fileName || typeof fileName !== "string") {
    return "Untitled Contract";
  }

  // 1. Enlever l'extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

  // 2. Replace underscores, hyphens, and special characters with spaces
  const cleaned = nameWithoutExt.replace(/[_\-]+/g, " ");

  // 3. Capitalize first letter of each word
  const capitalized = cleaned
    .split(/\s+/)
    .filter(word => word.length > 0) // Remove multiple spaces
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();

  // 4. Limit to 100 characters
  const truncated = capitalized.length > 100
    ? capitalized.substring(0, 97) + "..."
    : capitalized;

  // 5. Return default title if empty
  return truncated || "Untitled Contract";
}

/**
 * Generates a title with prefix based on contract type
 * 
 * @param fileName - Filename
 * @param type - Contract type ("msa" or "sow")
 * @returns Title with prefix (e.g., "[MSA] Client Abc")
 * 
 * @example
 * generateContractTitleWithPrefix("client_abc.pdf", "msa") // "[MSA] Client Abc"
 * generateContractTitleWithPrefix("project_xyz.pdf", "sow") // "[SOW] Project Xyz"
 */
export function generateContractTitleWithPrefix(
  fileName: string,
  type: "msa" | "sow"
): string {
  const baseTitle = generateContractTitle(fileName);
  const prefix = type === "msa" ? "[MSA]" : "[SOW]";

  const titleWithPrefix = `${prefix} ${baseTitle}`;

  // Limit to 100 characters including prefix
  return titleWithPrefix.length > 100
    ? titleWithPrefix.substring(0, 97) + "..."
    : titleWithPrefix;
}

/**
 * Generates a title with timestamp
 * 
 * @param fileName - Filename
 * @param addTimestamp - Add timestamp to title
 * @returns Title with timestamp (e.g., "Client Abc - 2024-01-15")
 * 
 * @example
 * generateContractTitleWithTimestamp("client_abc.pdf") // "Client Abc - 2024-01-15"
 */
export function generateContractTitleWithTimestamp(
  fileName: string,
  addTimestamp: boolean = true
): string {
  const baseTitle = generateContractTitle(fileName);

  if (!addTimestamp) {
    return baseTitle;
  }

  const now = new Date();
  const timestamp = now.toISOString().split("T")[0]; // Format: YYYY-MM-DD

  const titleWithTimestamp = `${baseTitle} - ${timestamp}`;

  // Limit to 100 characters
  return titleWithTimestamp.length > 100
    ? titleWithTimestamp.substring(0, 97) + "..."
    : titleWithTimestamp;
}
