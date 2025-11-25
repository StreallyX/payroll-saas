# Changelog - Séparation Approbation/Signature dans le Workflow de Contrats

## Date: 2024-11-25

## Problème identifié
Les approvers étaient traités comme des signataires, ce qui était conceptuellement incorrect. Un approver vérifie et valide le contrat selon les normes, mais ne fait PAS partie du contrat en tant que signataire.

## Solution implémentée

### 1. Modifications de la base de données
**Fichier**: `prisma/schema.prisma`
- ✅ Ajout du champ `approved` (Boolean, default: false) au modèle `ContractParticipant`
- ✅ Ce champ indique si un approver a validé le contrat

**Migration**: `prisma/migrations/20251125130721_add_approved_to_contract_participant/migration.sql`
- ✅ Migration créée pour ajouter la colonne `approved` à la table `contract_participants`

### 2. Modifications du backend (API)
**Fichier**: `server/api/routers/contract.ts`

#### Validation des participants
- ✅ Ajout d'une validation Zod pour empêcher les approvers d'avoir `requiresSignature: true`
- ✅ Message d'erreur clair si violation de cette règle

#### Création de contrats
- ✅ Lors de la création d'un contrat, les approvers ont automatiquement `requiresSignature: false`
- ✅ Le champ `approved` est initialisé à `false`

#### Ajout de participants
- ✅ Même logique appliquée lors de l'ajout d'un participant à un contrat existant

#### Mutation `approveByApprover`
- ✅ Utilise maintenant le champ `approved: true` au lieu de `signedAt`
- ✅ Vérifie que tous les approvers ont `approved: true` avant de passer à `PENDING_SIGNATURE`

#### Workflow status
- ✅ Ajout des valeurs `pending_approval` et `pending_signature` aux enums de statut
- ✅ Flux complet : DRAFT → PENDING_APPROVAL → PENDING_SIGNATURE → COMPLETED

### 3. Modifications du frontend

#### Page des contrats (`app/(dashboard)/(modules)/contracts/page.tsx`)
- ✅ Affichage séparé des statuts d'approbation et de signature
- ✅ Badge jaune "⏳ Approbation en attente" pour les approvers non-approuvés
- ✅ Badge vert "✓ Approuvé" pour les approvers ayant approuvé
- ✅ Badge orange "⏳ Signature en attente" pour les signataires n'ayant pas signé
- ✅ Badge bleu "✓ Signé" pour les signataires ayant signé
- ✅ Logique de `needsToApprove` utilise maintenant `p.approved` au lieu de `p.signedAt`

#### Modal d'approbation (`components/contracts/ApprovalModal.tsx`)
- ✅ Distinction claire entre approvers et signataires dans l'affichage
- ✅ Badge "Approuvé" pour les approvers (utilise `p.approved`)
- ✅ Badge "Signé" pour les signataires (utilise `p.signedAt`)
- ✅ Texte explicatif adapté pour les approvers

#### Modal de création MSA (`components/contracts/MSACreateModal.tsx`)
- ✅ Les approvers ont maintenant `requiresSignature: false` par défaut
- ✅ Commentaire explicatif dans le code

#### Modal de création SOW (`components/contracts/SOWCreateModal.tsx`)
- ✅ Les approvers ont maintenant `requiresSignature: false` par défaut
- ✅ Commentaire explicatif dans le code

### 4. Nouveau modal de création de contrat normal

**Fichier**: `components/contracts/NormalContractCreateModal.tsx` (NOUVEAU)
- ✅ Modal complet pour créer des contrats normaux (type: "sow")
- ✅ Permet d'ajouter plusieurs participants avec différents rôles
- ✅ Gestion intelligente des approvers :
  - Checkbox "Signature requise" désactivée pour les approvers
  - Message explicatif quand on sélectionne le rôle "approver"
  - Validation empêchant les approvers d'avoir requiresSignature
- ✅ Interface claire distinguant :
  - Approvers avec badge jaune "Approuvera"
  - Signataires avec badge orange "✍️ Signera"
- ✅ Support de tous les rôles : contractor, client, client_admin, approver, agency, payroll_partner

**Fichier**: `components/contracts/ContractCreateModal.tsx` (MODIFIÉ)
- ✅ Réexporte maintenant `NormalContractCreateModal`
- ✅ Plus de placeholder "En construction"

## Workflow complet

```
1. DRAFT
   ↓ (Upload main document)
2. PENDING_APPROVAL
   ↓ (Tous les approvers avec role="approver" ont approved=true)
3. PENDING_SIGNATURE
   ↓ (Tous les participants avec requiresSignature=true ont signedAt != null)
4. COMPLETED
   ↓ (Admin peut activer)
5. ACTIVE
```

## Règles d'or

1. ❌ **Un approver ne peut JAMAIS avoir `requiresSignature: true`**
2. ✅ **Un approver utilise le champ `approved` pour valider**
3. ✅ **Seuls les signataires (requiresSignature: true) utilisent `signedAt`**
4. ✅ **Les approvers ne sont PAS des participants au contrat, ils valident juste les normes**

## Fichiers modifiés

### Base de données
- `prisma/schema.prisma`
- `prisma/migrations/20251125130721_add_approved_to_contract_participant/migration.sql`

### Backend
- `server/api/routers/contract.ts`

### Frontend
- `app/(dashboard)/(modules)/contracts/page.tsx`
- `components/contracts/ApprovalModal.tsx`
- `components/contracts/MSACreateModal.tsx`
- `components/contracts/SOWCreateModal.tsx`
- `components/contracts/NormalContractCreateModal.tsx` (NOUVEAU)
- `components/contracts/ContractCreateModal.tsx`

## Tests recommandés

1. ✅ Créer un MSA avec un approver → Vérifier que requiresSignature=false
2. ✅ Créer un SOW avec un approver → Vérifier que requiresSignature=false
3. ✅ Créer un contrat normal avec des approvers et signataires
4. ✅ Tester le workflow complet : DRAFT → PENDING_APPROVAL → PENDING_SIGNATURE → COMPLETED
5. ✅ Vérifier les badges dans la liste des contrats
6. ✅ Vérifier le modal d'approbation
7. ✅ Essayer d'ajouter un approver avec requiresSignature=true → Doit être rejeté

## Notes importantes

- Les données existantes avec des approvers ayant `signedAt` ne seront pas affectées par la migration
- Il faudra peut-être une migration de données pour nettoyer les anciens approvers qui ont `signedAt` mais pas `approved`
- La logique de workflow est maintenant complètement séparée entre approbation et signature
