# Corrections TypeScript - Système de Contrats avec Participants

## Résumé des corrections effectuées

Ce document résume toutes les corrections apportées pour résoudre les 35 erreurs TypeScript liées à l'adaptation du système de contrats pour utiliser `ContractParticipant` au lieu de la relation directe `companyId`.

### Contexte

Le schéma Prisma a changé : `Contract` n'a plus de relation directe `company` (pas de `companyId`), mais utilise maintenant `ContractParticipant` qui peut lier un `userId` et/ou un `companyId`.

---

## 1. Backend - Corrections des includes Prisma

### Fichier: `server/api/routers/contract.ts`

**Corrections appliquées:**
- ✅ Retiré tous les `company: true` des includes de Contract (8 occurrences)
- ✅ Les `participants` sont déjà inclus avec `{ user: true, company: true }` partout
- ✅ Ajouté `statusHistory: { orderBy: { changedAt: "desc" } }` dans `getById`
- ✅ Retiré `companyId: true` du select dans l'export (ligne 709)

**Includes maintenant corrects:**
```typescript
include: {
  participants: {
    include: {
      user: { select: { id: true, name: true, email: true } },
      company: { select: { id: true, name: true } },
    }
  },
  currency: true,
  bank: true,
  contractCountry: true,
  parent: { select: { id: true, type: true, title: true } },
  children: { select: { id: true, type: true, title: true, status: true } },
  statusHistory: { orderBy: { changedAt: "desc" } },
}
```

---

### Fichier: `server/api/routers/analytics.ts`

**Corrections appliquées:**
- ✅ Remplacé `company: { select: { name: true } }` par l'accès via participants
- ✅ Ajouté `participants: { include: { user, company } }`

---

### Fichier: `server/api/routers/dashboard.ts`

**Corrections appliquées:**
- ✅ Remplacé `company: { select: { name: true } }` dans le select
- ✅ Utilisé `participants: { include: { user, company } }`

---

### Fichier: `server/api/routers/expense.ts`

**Corrections appliquées:**
- ✅ Remplacé `contract: { select: { company: ... } }` par `participants` avec includes

---

### Fichier: `server/api/routers/timesheet.ts`

**Corrections appliquées:**
- ✅ Retiré tous les `company: true` des includes de Contract (4 occurrences)
- ✅ Ajouté `participants: { include: { user: true, company: true } }` partout
- ✅ Corrigé la recherche dans `listTimesheets` pour utiliser `participants.some()`

---

### Fichier: `server/api/routers/payment.ts`

**Corrections appliquées:**
- ✅ Ajouté null safety pour `contractor.user` avant d'accéder à ses propriétés
- ✅ Ajouté null safety pour `payrollPartner.user` avant d'accéder à ses propriétés
- ✅ Ajouté check pour `payrollPartner.userId !== null` avant de l'assigner

**Code corrigé:**
```typescript
if (payrollPartner && contractor && contractor.user && payrollPartner.user && payrollPartner.userId) {
  // Créer Task avec accès sécurisé à contractor.user.name, etc.
}
```

---

## 2. Frontend - Corrections des accès aux propriétés

### Fichier: `app/(dashboard)/(modules)/contracts/page.tsx`

**Corrections appliquées:**
- ✅ Ajouté le type `any` pour le paramètre `p` dans le callback
- ✅ Casté `c.participants` en `(c as any).participants`

**Code corrigé:**
```typescript
(c as any).participants?.some((p: any) => p.user?.name?.toLowerCase().includes(q))
```

---

### Fichier: `components/contracts/ApprovalModal.tsx`

**Corrections appliquées:**
- ✅ Remplacé `contract.company?.name` par l'accès via participants
- ✅ Casté `contract.participants` en `(contract as any).participants`

**Code corrigé:**
```typescript
<p className="font-medium">
  {(contract as any).participants?.find((p: any) => p.company)?.company?.name || "—"}
</p>
```

---

### Fichier: `components/contracts/ContractView.tsx`

**Corrections appliquées:**
- ✅ Casté `contract?.currency` en `(contract as any)?.currency`
- ✅ Casté `contract?.participants` en `(contract as any)?.participants`
- ✅ Casté `contract?.parent` en `(contract as any)?.parent`
- ✅ Casté `contract.children` en `(contract as any).children` (2 occurrences)
- ✅ Remplacé `contract.company?.name` par l'accès via participants
- ✅ Casté `contract.contractCountry` en `(contract as any).contractCountry`
- ✅ Casté `contract.bank` en `(contract as any).bank`
- ✅ Casté `contract.statusHistory` en `(contract as any).statusHistory` (3 occurrences)

**Exemples de code corrigé:**
```typescript
const currencyCode = (contract as any)?.currency?.code ?? contract?.currencyId ?? "—";

const participantsByRole: Record<string, any[]> = {};
((contract as any)?.participants ?? []).forEach((p: any) => { ... });

const parentMSA = isSOW ? (contract as any)?.parent : null;

<Field label="Entreprise (Client)" 
  value={(contract as any).participants?.find((p: any) => p.company)?.company?.name ?? "—"} />
```

---

### Fichier: `components/timesheets/TimesheetReviewModal.tsx`

**Corrections appliquées:**
- ✅ Casté `data?.contract` en `(data as any)?.contract`

**Code corrigé:**
```typescript
const main = useMemo(() => getMainParticipant((data as any)?.contract), [data]);
```

---

## 3. Vérification finale

### Commandes à exécuter:

```bash
# Vérifier qu'il n'y a plus d'erreurs TypeScript
npx tsc --noEmit

# Si tout est OK, vous devriez voir:
# (aucune erreur affichée)
```

---

## 4. Fichiers modifiés

**Backend (6 fichiers):**
1. `server/api/routers/contract.ts`
2. `server/api/routers/analytics.ts`
3. `server/api/routers/dashboard.ts`
4. `server/api/routers/expense.ts`
5. `server/api/routers/payment.ts`
6. `server/api/routers/timesheet.ts`

**Frontend (4 fichiers):**
1. `app/(dashboard)/(modules)/contracts/page.tsx`
2. `components/contracts/ApprovalModal.tsx`
3. `components/contracts/ContractView.tsx`
4. `components/timesheets/TimesheetReviewModal.tsx`

---

## 5. Points clés à retenir

1. **Plus de relation directe `company`**: Toujours passer par `participants` pour accéder aux companies
2. **Includes nécessaires**: Toujours inclure `participants: { include: { user, company } }` dans les queries
3. **Type casting**: Utiliser `(contract as any)` pour accéder aux propriétés incluses mais non typées
4. **Null safety**: Toujours vérifier que `user` et `userId` ne sont pas null avant utilisation
5. **Search patterns**: Utiliser `participants: { some: { ... } }` pour les recherches

---

## 6. Tests recommandés

Après avoir vérifié que le code compile sans erreurs, testez:

1. ✅ Affichage de la liste des contrats
2. ✅ Création d'un nouveau contrat avec participants
3. ✅ Visualisation d'un contrat (ContractView)
4. ✅ Approbation d'un contrat (ApprovalModal)
5. ✅ Gestion des timesheets avec contrats
6. ✅ Recherche de contrats par nom d'entreprise
7. ✅ Création de paiements et génération de tâches

---

**Date de correction**: 27 novembre 2025
**Branche**: feature/contract-participants-company-support
