# Système Simplifié de Contrats MSA/SOW

**Date**: 28 novembre 2024  
**Version**: 1.0  
**Statut**: ✅ Prêt pour utilisation

---

## 📋 Vue d'Ensemble

Ce système permet la création et gestion simplifiée de contrats MSA (Master Service Agreement) et SOW (Statement of Work) avec un workflow optimisé en 4 étapes :

```
draft → pending_admin_review → completed → active
```

### Avantages

- ✅ **Création rapide** : Upload PDF + titre auto-généré
- ✅ **Workflow simplifié** : 4 étapes au lieu de 5+
- ✅ **Participants auto-créés** : Gestion minimale
- ✅ **Coexistence** : Fonctionne en parallèle du système legacy
- ✅ **Audit complet** : Logs automatiques de toutes les actions
- ✅ **Type-safe** : Validation Zod complète

---

## 📁 Architecture

### Backend (tRPC)

```
server/
├── api/
│   ├── routers/
│   │   └── simpleContract.ts       # 10 endpoints (créer, approuver, etc.)
│   ├── root.ts                     # Intégration du router
│   └── trpc.ts                     # Middlewares (hasPermission, hasAnyPermission)
│
├── validators/
│   └── simpleContract.ts           # Schémas Zod pour tous les inputs
│
└── helpers/
    └── contracts/
        ├── generateContractTitle.ts         # Génération automatique de titre
        ├── createMinimalParticipant.ts      # Création de participants
        ├── validateParentMSA.ts             # Validation MSA parent
        └── simpleWorkflowTransitions.ts     # Gestion du workflow
```

---

## 🔌 Endpoints tRPC

### 1. **createSimpleMSA**

Crée un MSA avec upload PDF en une seule étape.

```typescript
const result = api.simpleContract.createSimpleMSA.useMutation({
  pdfBuffer: "base64_encoded_pdf",
  fileName: "MSA-ClientABC.pdf",
  mimeType: "application/pdf",
  fileSize: 1024000,
  companyId: "clxxx123", // optionnel
});
```

**Workflow**:
- Upload PDF → S3
- Génère titre automatiquement
- Crée contrat avec statut `draft`
- Crée document lié
- Crée participant company (optionnel)

---

### 2. **createSimpleSOW**

Crée un SOW lié à un MSA parent.

```typescript
const result = api.simpleContract.createSimpleSOW.useMutation({
  parentMSAId: "clyyy456",
  pdfBuffer: "base64_encoded_pdf",
  fileName: "SOW-ProjectXYZ.pdf",
  mimeType: "application/pdf",
  fileSize: 1024000,
  companyId: "clxxx123", // optionnel
});
```

**Workflow**:
- Valide le MSA parent
- Upload PDF → S3
- Hérite des champs du MSA (currency, country, etc.)
- Crée contrat SOW avec statut `draft`

---

### 3. **submitForReview**

Soumet un contrat draft pour validation admin.

```typescript
const result = api.simpleContract.submitForReview.useMutation({
  contractId: "clzzz789",
  notes: "Prêt pour validation", // optionnel
});
```

**Transition**: `draft` → `pending_admin_review`

**Validations**:
- Contrat doit être en draft
- Un document principal doit exister

---

### 4. **adminApprove**

Approuve un contrat en attente de review.

```typescript
const result = api.simpleContract.adminApprove.useMutation({
  contractId: "clzzz789",
  notes: "Contrat validé", // optionnel
});
```

**Transition**: `pending_admin_review` → `completed`

**Permissions**: `contracts.approve`

---

### 5. **adminReject**

Rejette un contrat et le remet en draft.

```typescript
const result = api.simpleContract.adminReject.useMutation({
  contractId: "clzzz789",
  reason: "Montant incorrect, merci de corriger", // requis
});
```

**Transition**: `pending_admin_review` → `draft`

---

### 6. **uploadSignedVersion**

Upload une version signée du contrat.

```typescript
const result = api.simpleContract.uploadSignedVersion.useMutation({
  contractId: "clzzz789",
  pdfBuffer: "base64_encoded_signed_pdf",
  fileName: "MSA-ClientABC-signed.pdf",
  mimeType: "application/pdf",
  fileSize: 1024000,
});
```

**Statuts autorisés**: `completed`, `active`

**Workflow**:
- Crée une nouvelle version du document
- Marque l'ancienne version comme non-latest
- Flag `isSigned: true`

---

### 7. **activateContract**

Active un contrat completed.

```typescript
const result = api.simpleContract.activateContract.useMutation({
  contractId: "clzzz789",
  notes: "Contrat activé", // optionnel
});
```

**Transition**: `completed` → `active`

**Permissions**: `contracts.approve`

---

### 8. **listSimpleContracts**

Liste les contrats avec filtres et pagination.

```typescript
const { data } = api.simpleContract.listSimpleContracts.useQuery({
  type: "all", // "all" | "msa" | "sow"
  status: "active", // "all" | "draft" | "pending_admin_review" | "completed" | "active"
  search: "ClientABC", // optionnel
  parentMSAId: "clyyy456", // optionnel (filtrer SOWs d'un MSA)
  page: 1,
  pageSize: 20,
});
```

**Retourne**:
- Liste des contrats avec participants, documents, parent, children
- Pagination (total, totalPages, hasMore)

---

### 9. **getSimpleContractById**

Récupère un contrat par son ID.

```typescript
const { data } = api.simpleContract.getSimpleContractById.useQuery({
  id: "clzzz789",
});
```

**Inclut**:
- Parent MSA (si SOW)
- Children SOWs (si MSA)
- Participants avec users/companies
- Documents (toutes versions)
- Historique des statuts

---

### 10. **deleteDraftContract**

Supprime un contrat en draft uniquement.

```typescript
const result = api.simpleContract.deleteDraftContract.useMutation({
  id: "clzzz789",
});
```

**Sécurités**:
- Seuls les contrats `draft` peuvent être supprimés
- Les MSA avec SOWs liés ne peuvent pas être supprimés
- Les documents S3 sont supprimés en cascade

---

## 🔐 Permissions

Le système utilise les permissions existantes :

| Permission | Description |
|------------|-------------|
| `contracts.create` | Créer des contrats MSA/SOW |
| `contracts.update` | Modifier et soumettre pour review |
| `contracts.approve` | Approuver, rejeter, activer |
| `contracts.view` | Voir les contrats |
| `contracts.delete` | Supprimer les drafts |

---

## 🧩 Helpers Disponibles

### generateContractTitle()

Génère automatiquement un titre depuis un nom de fichier.

```typescript
import { generateContractTitle } from "@/server/helpers/contracts/generateContractTitle";

const title = generateContractTitle("MSA-ClientABC-2024.pdf");
// Résultat: "Msa Clientabc 2024"
```

**Règles**:
- Enlève l'extension `.pdf`
- Remplace `_` et `-` par des espaces
- Capitalise chaque mot
- Limite à 100 caractères

---

### createMinimalParticipant()

Crée un participant minimal pour un contrat.

```typescript
import { createMinimalParticipant } from "@/server/helpers/contracts/createMinimalParticipant";

await createMinimalParticipant(prisma, {
  contractId: "clzzz789",
  companyId: "clxxx123",
  role: "client",
  isPrimary: true,
});
```

**Validations**:
- Soit `userId` soit `companyId` requis
- Les `approvers` ne peuvent JAMAIS avoir `requiresSignature: true`

---

### validateParentMSA()

Valide qu'un contrat parent est bien un MSA valide.

```typescript
import { validateParentMSA } from "@/server/helpers/contracts/validateParentMSA";

const parentMSA = await validateParentMSA(prisma, parentId, tenantId);
// Lève TRPCError si invalide
```

**Validations**:
- Le parent doit exister
- Le parent doit être de type `msa`
- Le parent doit être dans un statut valide (pas `cancelled`)

---

### simpleWorkflowTransitions

Fonctions pour gérer les transitions de workflow.

```typescript
import {
  isTransitionAllowed,
  getAvailableTransitions,
  isDraft,
  canDelete,
  getStatusLabel,
  getStatusBadgeColor,
} from "@/server/helpers/contracts/simpleWorkflowTransitions";

// Vérifier une transition
if (isTransitionAllowed("draft", "pending_admin_review", "submit_for_review")) {
  // OK
}

// Récupérer les transitions possibles
const transitions = getAvailableTransitions("draft");
// [{ from: "draft", to: "pending_admin_review", action: "submit_for_review", ... }]

// Helpers de statut
isDraft(contract); // boolean
canDelete(contract); // boolean

// Helpers UI
getStatusLabel("pending_admin_review"); // "En attente de validation"
getStatusBadgeColor("active"); // "green"
```

---

## ✅ Workflow Complet

### Exemple : Création et activation d'un MSA

```typescript
// 1. Créer le MSA
const { contract } = await createSimpleMSA({
  pdfBuffer: pdfBase64,
  fileName: "MSA-ClientABC.pdf",
  mimeType: "application/pdf",
  fileSize: 1024000,
  companyId: "clxxx123",
});
// Statut: draft

// 2. Soumettre pour review
await submitForReview({
  contractId: contract.id,
  notes: "Prêt pour validation",
});
// Statut: pending_admin_review

// 3. Admin approuve
await adminApprove({
  contractId: contract.id,
  notes: "Validé",
});
// Statut: completed

// 4. Upload version signée (optionnel)
await uploadSignedVersion({
  contractId: contract.id,
  pdfBuffer: signedPdfBase64,
  fileName: "MSA-ClientABC-signed.pdf",
  mimeType: "application/pdf",
  fileSize: 1024000,
});

// 5. Activer
await activateContract({
  contractId: contract.id,
  notes: "Contrat activé",
});
// Statut: active ✅
```

---

## 🚀 Intégration avec le Frontend

### Installation

Le router est déjà intégré dans `server/api/root.ts` :

```typescript
export const appRouter = createTRPCRouter({
  // ... autres routers
  simpleContract: simpleContractRouter,
});
```

### Utilisation dans les composants

```typescript
// Dans un composant React
import { api } from "@/lib/trpc";

function MyComponent() {
  // Query (lecture)
  const { data: contracts } = api.simpleContract.listSimpleContracts.useQuery({
    type: "all",
    status: "all",
    page: 1,
    pageSize: 20,
  });

  // Mutation (écriture)
  const createMutation = api.simpleContract.createSimpleMSA.useMutation({
    onSuccess: (data) => {
      console.log("MSA créé:", data.contract);
    },
    onError: (error) => {
      console.error("Erreur:", error.message);
    },
  });

  const handleCreate = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    createMutation.mutate({
      pdfBuffer: base64,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });
  };

  return (
    <div>
      {/* Votre UI */}
    </div>
  );
}
```

---

## 🔍 Audit Logs

Toutes les actions importantes génèrent automatiquement des audit logs :

```typescript
{
  userId: "cluser123",
  userName: "John Doe",
  userRole: "ADMIN",
  action: "CREATE", // CREATE, UPDATE, APPROVE, REJECT, ACTIVATE, DELETE
  entityType: "CONTRACT",
  entityId: "clcontract456",
  entityName: "Msa Client Abc",
  tenantId: "cltenant789",
  metadata: {
    type: "msa",
    fileName: "MSA-ClientABC.pdf",
    system: "simple",
    documentId: "cldoc123"
  }
}
```

---

## 📊 Schéma de Base de Données

Le système utilise les modèles Prisma existants (aucune modification du schéma) :

- **Contract** : Contrat principal (tous champs optionnels)
- **ContractParticipant** : Participants (users ou companies)
- **Document** : Documents S3 avec versioning
- **ContractStatusHistory** : Historique des changements de statut
- **ContractNotification** : Notifications pour les utilisateurs

---

## 🐛 Gestion d'Erreurs

Toutes les erreurs sont typées avec `TRPCError` :

```typescript
try {
  await createSimpleMSA(...);
} catch (error) {
  if (error instanceof TRPCError) {
    switch (error.code) {
      case "NOT_FOUND":
        console.error("Ressource introuvable");
        break;
      case "BAD_REQUEST":
        console.error("Données invalides:", error.message);
        break;
      case "FORBIDDEN":
        console.error("Permission manquante:", error.message);
        break;
      case "INTERNAL_SERVER_ERROR":
        console.error("Erreur serveur:", error.message);
        break;
    }
  }
}
```

---

## ✨ Tests

### Tester la création d'un MSA

```bash
# Via l'interface (recommandé)
# Ou via un client REST avec le endpoint tRPC

# Exemple avec curl (après conversion en REST endpoint)
curl -X POST http://localhost:3000/api/trpc/simpleContract.createSimpleMSA \
  -H "Content-Type: application/json" \
  -d '{
    "pdfBuffer": "base64_pdf_here",
    "fileName": "MSA-Test.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1024000
  }'
```

---

## 📚 Références

- **Architecture détaillée** : `/home/ubuntu/simplified_contracts_architecture.md`
- **Analyse du système** : `/home/ubuntu/contract_analysis.md`
- **Code source** :
  - Router : `server/api/routers/simpleContract.ts`
  - Validators : `server/validators/simpleContract.ts`
  - Helpers : `server/helpers/contracts/`

---

## 🎯 Prochaines Étapes

### Frontend (non inclus dans cette implémentation)

1. Créer les composants React :
   - `CreateMSAModal.tsx`
   - `CreateSOWModal.tsx`
   - `AdminReviewModal.tsx`
   - `SimplifiedContractsList.tsx`

2. Créer les pages :
   - `/contracts/simple` (liste)
   - `/contracts/simple/[id]` (détails)

3. Créer les hooks :
   - `useSimpleContractCreation.ts`
   - `useContractWorkflow.ts`

---

## 🙏 Support

Pour toute question ou problème, consultez :

1. La documentation du code (commentaires JSDoc complets)
2. Les tests de validation (`/tmp/check_syntax.sh`)
3. Les logs du serveur (console.error pour debugging)

---

**✅ Backend complet et fonctionnel, prêt pour l'intégration frontend !**
