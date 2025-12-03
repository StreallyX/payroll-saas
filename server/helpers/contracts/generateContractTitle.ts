/**
 * Helper pour générer automatiquement un titre de contrat
 * à partir d'un nom de fichier PDF
 * 
 * Utilisé par le système simplifié de contrats MSA/SOW pour créer
 * automatiquement des titres lisibles sans intervention de l'utilisateur.
 */

/**
 * Génère un titre de contrat à partir d'un nom de fichier PDF
 * 
 * Règles de transformation :
 * - Enlever l'extension (.pdf, .PDF)
 * - Remplacer underscores et tirets par des espaces
 * - Capitaliser la première lettre de chaque mot
 * - Limiter à 100 caractères
 * - Retourner "Untitled Contract" si le résultat est vide
 * 
 * @param fileName - Nom du fichier (ex: "msa_client_abc.pdf")
 * @returns Titre formaté (ex: "Msa Client Abc")
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

  // 2. Remplacer underscores, tirets, et caractères spéciaux par des espaces
  const cleaned = nameWithoutExt.replace(/[_\-]+/g, " ");

  // 3. Capitaliser première lettre de chaque mot
  const capitalized = cleaned
    .split(/\s+/)
    .filter(word => word.length > 0) // Enlever les espaces multiples
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();

  // 4. Limiter à 100 caractères
  const truncated = capitalized.length > 100
    ? capitalized.substring(0, 97) + "..."
    : capitalized;

  // 5. Retourner un titre par défaut si vide
  return truncated || "Untitled Contract";
}

/**
 * Génère un titre avec préfixe selon le type de contrat
 * 
 * @param fileName - Nom du fichier
 * @param type - Type de contrat ("msa" ou "sow")
 * @returns Titre avec préfixe (ex: "[MSA] Client Abc")
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

  // Limiter à 100 caractères en incluant le préfixe
  return titleWithPrefix.length > 100
    ? titleWithPrefix.substring(0, 97) + "..."
    : titleWithPrefix;
}

/**
 * Génère un titre avec horodatage
 * 
 * @param fileName - Nom du fichier
 * @param addTimestamp - Ajouter un timestamp au titre
 * @returns Titre avec timestamp (ex: "Client Abc - 2024-01-15")
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

  // Limiter à 100 caractères
  return titleWithTimestamp.length > 100
    ? titleWithTimestamp.substring(0, 97) + "..."
    : titleWithTimestamp;
}
