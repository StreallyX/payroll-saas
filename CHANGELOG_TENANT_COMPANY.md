# Changelog - Implémentation Tenant Company

## Version 1.0.0 - 2025-11-26

### ✨ Nouvelles fonctionnalités

#### 1. Système de Tenant Companies
- Ajout du champ `tenantCompany` (Boolean) au modèle Company dans Prisma
- Interface de gestion avec toggle dans le modal Company
- Affichage visuel distinctif dans la liste des companies (badge, gradient, icône)

#### 2. Workflow de création de contrats simplifié
- **MSA** : Suppression de la sélection obligatoire des admin/approver lors de la création
- **SOW** : Suppression de la validation des admin/approver du MSA parent
- Ajout de messages informatifs expliquant l'envoi au tenant
- Création avec uniquement le participant "client" (utilisateur actuel)

#### 3. Composant d'assignation
- Nouveau composant `ContractAssignmentModal.tsx`
- Permet aux admins d'assigner :
  - Une Tenant Company au contrat
  - Un Admin principal (avec signature)
  - Un Approver (sans signature, utilise `approved`)
- Affichage des assignations existantes avec avertissement

#### 4. Permissions
- `CONTRACTS_ASSIGN` : Permet d'assigner admin/approver aux contrats
- `COMPANIES_MANAGE_TENANT` : Permet de gérer les tenant companies

### 📝 Fichiers modifiés

#### Schema & Database
- `prisma/schema.prisma` : Ajout du champ `tenantCompany` au modèle Company
- `prisma/migrations/manual/add_tenant_company_field.sql` : Migration SQL manuelle

#### Composants React
- `components/contracts/MSACreateModal.tsx` : Workflow simplifié
- `components/contracts/SOWCreateModal.tsx` : Workflow simplifié
- `components/modals/company-modal.tsx` : Toggle tenant company
- `app/(dashboard)/(modules)/settings/companies/page.tsx` : Affichage visuel

#### Nouveau composant
- `components/contracts/ContractAssignmentModal.tsx` : Modal d'assignation

#### Configuration
- `lib/permissions.ts` : Nouvelles permissions

#### Documentation
- `TENANT_COMPANY_IMPLEMENTATION.md` : Documentation complète
- `CHANGELOG_TENANT_COMPANY.md` : Ce fichier

### 🔧 Actions requises

#### Base de données
```sql
-- À exécuter manuellement sur la base de données
ALTER TABLE "companies" 
ADD COLUMN "tenantCompany" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "companies_tenantCompany_idx" ON "companies"("tenantCompany");
```

#### Permissions
Créer les permissions suivantes dans la base de données :
- `contracts.assign` (resource: "contract", action: "assign", scope: "global")
- `companies.manage_tenant` (resource: "companies", action: "manage_tenant", scope: "global")

Attribuer ces permissions aux rôles : ADMIN, SUPER_ADMIN

### 🎯 Prochaines étapes

1. **Intégration UI** : Ajouter le bouton "Assigner Admin & Approver" dans la vue détail des contrats
2. **Tests** : Tester le workflow complet de création et assignation
3. **Documentation utilisateur** : Créer des guides pour les utilisateurs finaux

### ⚠️ Breaking Changes

Aucun breaking change. Les contrats existants continuent de fonctionner normalement.
Les nouvelles fonctionnalités sont additives.

### 🐛 Bugs connus

Aucun bug connu pour l'instant.

---

**Contributeur** : DeepAgent (Abacus.AI)  
**Date** : 2025-11-26  
**Branche** : `feature/tenant-company-implementation`
