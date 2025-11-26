# 🚀 Quick Start - Tenant Company Implementation

## 📍 Statut actuel
✅ Toutes les modifications ont été implémentées et commitées sur la branche `feature/tenant-company-implementation`

---

## 🔄 Push des modifications vers GitHub

### Option 1 : Push vers votre repository
```bash
cd /home/ubuntu/github_repos/payroll-saas

# Pousser la branche vers GitHub
git push -u origin feature/tenant-company-implementation
```

### Option 2 : Créer une Pull Request
1. Pusher la branche (commande ci-dessus)
2. Aller sur GitHub : https://github.com/StreallyX/payroll-saas
3. Cliquer sur "Compare & pull request"
4. Réviser les changements
5. Créer la PR vers la branche `actual2`

---

## ⚙️ Configuration requise avant déploiement

### 1. Base de données (OBLIGATOIRE)
Exécuter cette migration SQL sur votre base de données :
```sql
ALTER TABLE "companies" 
ADD COLUMN "tenantCompany" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "companies_tenantCompany_idx" ON "companies"("tenantCompany");
```

**Fichier disponible** : `prisma/migrations/manual/add_tenant_company_field.sql`

### 2. Permissions (OBLIGATOIRE)
Créer les nouvelles permissions dans votre base de données :

**Permission 1** : Assigner admin/approver
```sql
INSERT INTO "permissions" (id, resource, action, key, displayName, description, scope, isActive, isSystem)
VALUES (
  'perm_contract_assign',
  'contract',
  'assign',
  'contract.assign',
  'Assigner Admin/Approver aux contrats',
  'Permet d\'assigner des utilisateurs aux rôles admin et approver pour les contrats',
  'global',
  true,
  false
);
```

**Permission 2** : Gérer les tenant companies
```sql
INSERT INTO "permissions" (id, resource, action, key, displayName, description, scope, isActive, isSystem)
VALUES (
  'perm_company_manage_tenant',
  'companies',
  'manage_tenant',
  'companies.manage_tenant',
  'Gérer les Tenant Companies',
  'Permet de marquer des companies comme appartenant au tenant',
  'global',
  true,
  false
);
```

### 3. Attribuer les permissions aux rôles
Attribuer ces permissions aux rôles ADMIN et SUPER_ADMIN :
```sql
-- Pour le rôle ADMIN
INSERT INTO "role_permissions" (roleId, permissionId)
SELECT r.id, 'perm_contract_assign'
FROM "roles" r
WHERE r.name = 'ADMIN';

INSERT INTO "role_permissions" (roleId, permissionId)
SELECT r.id, 'perm_company_manage_tenant'
FROM "roles" r
WHERE r.name = 'ADMIN';

-- Répéter pour SUPER_ADMIN si nécessaire
```

---

## 🎨 Intégration dans votre interface

### Ajouter le bouton d'assignation dans la vue détail du contrat

**Emplacement recommandé** : `app/(dashboard)/(modules)/contracts/[id]/page.tsx` (ou équivalent)

**Code à ajouter** :
```tsx
import { ContractAssignmentModal } from "@/components/contracts/ContractAssignmentModal";
import { UserCheck } from "lucide-react";
import { useState } from "react";

// Dans votre composant
const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

// Vérifier si admin/approver sont déjà assignés
const hasAdmin = contract.participants?.some(p => p.role === "client_admin");
const hasApprover = contract.participants?.some(p => p.role === "approver");
const needsAssignment = !hasAdmin || !hasApprover;

// Dans le JSX, ajouter le bouton (visible uniquement pour les admins)
{needsAssignment && canAssign && (
  <Button 
    onClick={() => setIsAssignmentModalOpen(true)}
    className="flex items-center gap-2"
  >
    <UserCheck className="h-4 w-4" />
    Assigner Admin & Approver
  </Button>
)}

{/* Modal */}
<ContractAssignmentModal
  open={isAssignmentModalOpen}
  onOpenChange={setIsAssignmentModalOpen}
  contract={contract}
  onSuccess={() => {
    // Rafraîchir les données du contrat
    refetch();
  }}
/>
```

---

## 📋 Test du workflow complet

### Étape 1 : Créer une Tenant Company
1. Connexion avec un compte ADMIN/SUPER_ADMIN
2. Aller à **Settings → Companies**
3. Cliquer sur **"Add Company"**
4. Remplir : Nom = "Aspirock Suisse"
5. **Activer le toggle "Tenant Company"**
6. Sauvegarder
7. ✅ Vérifier que le badge "🏢 Tenant Company" apparaît

### Étape 2 : Créer un MSA
1. Aller à **Contracts**
2. Cliquer sur **"Nouveau MSA"**
3. Remplir les informations :
   - Titre : "MSA Test 2025"
   - Company (client) : Sélectionner une company cliente
   - Pays : France
   - Devise : EUR
   - Paramètres financiers au choix
4. ✅ Vérifier le message : "Contrat envoyé à la plateforme"
5. ✅ Vérifier qu'il n'y a PAS de sélection admin/approver
6. Créer le MSA

### Étape 3 : Assigner Admin & Approver
1. Ouvrir le MSA créé
2. Cliquer sur **"Assigner Admin & Approver"**
3. Dans le modal :
   - Tenant Company : Sélectionner "Aspirock Suisse"
   - Admin principal : Sélectionner un utilisateur
   - Approver : Sélectionner un utilisateur (peut être le même ou différent)
4. Cliquer sur **"Assigner"**
5. ✅ Vérifier que les participants sont ajoutés au contrat

### Étape 4 : Créer un SOW
1. Aller à **Contracts**
2. Cliquer sur **"Nouveau SOW"**
3. Sélectionner le MSA parent créé précédemment
4. Sélectionner un Worker (contractor)
5. Remplir les détails du SOW
6. ✅ Vérifier le message informatif
7. Créer le SOW
8. (Optionnel) Assigner admin/approver si différents du MSA

---

## 📚 Documentation détaillée

Pour plus d'informations, consulter :
- **TENANT_COMPANY_IMPLEMENTATION.md** : Documentation complète (architecture, code, workflow)
- **CHANGELOG_TENANT_COMPANY.md** : Liste détaillée des changements

---

## ❓ FAQ

### Q: Dois-je modifier les contrats existants ?
**R:** Non, les contrats existants continuent de fonctionner normalement. Les nouvelles fonctionnalités s'appliquent uniquement aux nouveaux contrats.

### Q: Puis-je avoir plusieurs Tenant Companies ?
**R:** Oui ! C'est justement le but. Vous pouvez créer "Aspirock Suisse", "Aspirock France", etc.

### Q: Les approvers doivent-ils signer ?
**R:** Non, les approvers utilisent le champ `approved` (boolean). Seuls les admin principaux et contractors signent.

### Q: Comment savoir si un contrat a besoin d'assignation ?
**R:** Vérifiez si les participants avec `role = "client_admin"` ou `role = "approver"` existent.

---

## 🆘 Support

En cas de problème :
1. Vérifier que la migration SQL a été exécutée
2. Vérifier que les permissions sont créées et attribuées
3. Consulter la documentation complète
4. Vérifier les logs de l'application pour les erreurs tRPC

---

**Bon déploiement ! 🚀**
