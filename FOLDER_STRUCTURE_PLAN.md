# 📁 Plan de la Nouvelle Structure de Dossiers

**Date:** 17 Novembre 2025  
**Version:** 2.0  
**Objectif:** Structure fonctionnelle remplaçant la structure basée sur les rôles

---

## 🎯 Principes de la Nouvelle Architecture

### 1. **Structure Fonctionnelle**
- Organisation par **fonctionnalités** plutôt que par **rôles**
- Chaque module est accessible par plusieurs rôles avec différentes permissions
- Réutilisabilité maximale des composants

### 2. **Permissions Granulaires**
- Chaque page vérifie des permissions spécifiques
- Séparation claire entre permissions "own" (personnelles) et "manage" (admin)
- Une seule page peut servir différents rôles avec des vues différentes

### 3. **Dynamic Routing**
- Les routes s'adaptent automatiquement aux permissions de l'utilisateur
- Pas de redirection manuelle basée sur les rôles
- Le contenu de la page change selon les permissions

---

## 📂 Nouvelle Structure Complète

```
app/(dashboard)/(modules)/
│
├── 🏠 dashboard/                              [Tous les rôles]
│   └── page.tsx                               [dashboard.view]
│       ↳ Affichage adaptatif selon le rôle
│
├── 👤 profile/                                [Tous les utilisateurs]
│   ├── page.tsx                               [profile.view]
│   ├── edit/                                  
│   │   └── page.tsx                           [profile.update]
│   └── documents/
│       ├── page.tsx                           [profile.documents.view]
│       └── upload/page.tsx                    [profile.documents.upload]
│
├── 📄 contracts/                              [Multi-role]
│   ├── page.tsx                               [contracts.view_own OR contracts.manage.view_all]
│   │   ↳ Si contracts.view_own → affiche seulement les contrats de l'utilisateur
│   │   ↳ Si contracts.manage.view_all → affiche tous les contrats avec actions admin
│   ├── [id]/
│   │   ├── page.tsx                           [contracts.view_own OR contracts.manage.view_all]
│   │   └── edit/page.tsx                      [contracts.manage.update]
│   └── new/
│       └── page.tsx                           [contracts.manage.create]
│
├── 🧾 invoices/                               [Multi-role]
│   ├── page.tsx                               [invoices.view_own OR invoices.manage.view_all]
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/page.tsx                      [invoices.manage.update]
│   └── new/
│       └── page.tsx                           [invoices.create_own OR invoices.manage.create]
│
├── ⏰ timesheets/                             [Multi-role]
│   ├── page.tsx                               [timesheets.view_own OR timesheets.manage.view_all]
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/page.tsx                      [timesheets.update_own OR timesheets.manage.update]
│   └── new/
│       └── page.tsx                           [timesheets.create]
│
├── 💸 expenses/                               [Multi-role]
│   ├── page.tsx                               [expenses.view_own OR expenses.manage.view_all]
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/page.tsx                      [expenses.update_own OR expenses.manage.update]
│   └── new/
│       └── page.tsx                           [expenses.create]
│
├── 💰 payments/                               [Multi-role]
│   ├── payslips/
│   │   ├── page.tsx                           [payments.payslips.view_own OR view_all]
│   │   └── [id]/page.tsx
│   ├── remits/
│   │   ├── page.tsx                           [payments.remits.view_own OR view_all]
│   │   └── [id]/page.tsx
│   └── payroll/
│       ├── page.tsx                           [payments.payroll.view_own OR view_all]
│       ├── [id]/page.tsx
│       ├── generate/page.tsx                  [payments.payroll.generate]
│       └── new/page.tsx                       [payments.payroll.generate]
│
├── 👥 team/                                   [Admin & Agency Owner]
│   ├── contractors/
│   │   ├── page.tsx                           [contractors.manage.view_all]
│   │   ├── [id]/
│   │   │   ├── page.tsx                       [contractors.manage.view_all]
│   │   │   └── edit/page.tsx                  [contractors.manage.update]
│   │   └── new/
│   │       └── page.tsx                       [contractors.manage.create]
│   │
│   ├── agencies/
│   │   ├── page.tsx                           [agencies.manage.view_all]
│   │   ├── [id]/
│   │   │   ├── page.tsx                       [agencies.manage.view_all]
│   │   │   └── edit/page.tsx                  [agencies.manage.update]
│   │   └── new/
│   │       └── page.tsx                       [agencies.manage.create]
│   │
│   └── members/
│       ├── page.tsx                           [team.view]
│       ├── invite/page.tsx                    [team.invite]
│       └── [id]/page.tsx
│
├── 📋 onboarding/                             [Multi-role]
│   ├── page.tsx                               [onboarding.responses.view_own OR view_all]
│   ├── my-onboarding/
│   │   └── page.tsx                           [onboarding.responses.view_own]
│   ├── review/
│   │   ├── page.tsx                           [onboarding.responses.view_all]
│   │   └── [id]/page.tsx                      [onboarding.responses.review]
│   └── templates/
│       ├── page.tsx                           [onboarding.templates.view]
│       ├── [id]/page.tsx
│       └── new/page.tsx                       [onboarding.templates.create]
│
├── 🤝 referrals/                              [Contractors & Admin]
│   ├── page.tsx                               [referrals.view OR referrals.manage.view_all]
│   ├── my-referrals/
│   │   └── page.tsx                           [referrals.view]
│   └── manage/
│       ├── page.tsx                           [referrals.manage.view_all]
│       └── [id]/page.tsx                      [referrals.manage.update]
│
├── ✅ tasks/                                  [Tous]
│   ├── page.tsx                               [tasks.view_own OR tasks.view_all]
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/page.tsx                      [tasks.update_own OR tasks.delete]
│   └── new/
│       └── page.tsx                           [tasks.create]
│
├── 🎯 leads/                                  [Recruiter & Admin]
│   ├── page.tsx                               [leads.view]
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/page.tsx                      [leads.update]
│   └── new/
│       └── page.tsx                           [leads.create]
│
├── 📊 reports/                                [Admin & Managers]
│   ├── page.tsx                               [reports.view]
│   ├── analytics/
│   │   └── page.tsx                           [reports.analytics]
│   ├── activity-logs/
│   │   └── page.tsx                           [reports.activity_logs]
│   ├── user-activity/
│   │   └── page.tsx                           [reports.activity_logs]
│   ├── email-logs/
│   │   └── page.tsx                           [reports.activity_logs]
│   └── sms-logs/
│       └── page.tsx                           [reports.activity_logs]
│
└── ⚙️ settings/                               [Admin]
    ├── page.tsx                               [settings.view]
    ├── roles/
    │   ├── page.tsx                           [tenant.roles.view]
    │   ├── [id]/page.tsx
    │   └── new/page.tsx                       [tenant.roles.create]
    ├── users/
    │   ├── page.tsx                           [tenant.users.view]
    │   ├── [id]/page.tsx
    │   ├── invite/page.tsx                    [tenant.users.invite]
    │   └── new/page.tsx                       [tenant.users.create]
    ├── permissions/
    │   └── page.tsx                           [tenant.roles.view]
    ├── banks/
    │   ├── page.tsx                           [banks.view]
    │   └── new/page.tsx                       [banks.create]
    ├── companies/
    │   ├── page.tsx                           [companies.view]
    │   └── new/page.tsx                       [companies.create]
    ├── document-types/
    │   ├── page.tsx                           [document_types.view]
    │   └── new/page.tsx                       [document_types.create]
    ├── onboarding-templates/
    │   └── page.tsx                           [onboarding.templates.view]
    ├── master-onboarding/
    │   └── page.tsx                           [tenant.onboarding.view]
    ├── templates/
    │   ├── email/
    │   │   ├── page.tsx                       [tenant.templates.email.view]
    │   │   └── new/page.tsx                   [tenant.templates.email.create]
    │   └── pdf/
    │       ├── page.tsx                       [tenant.templates.pdf.view]
    │       └── new/page.tsx                   [tenant.templates.pdf.create]
    ├── webhooks/
    │   ├── page.tsx                           [webhooks.view]
    │   └── new/page.tsx                       [webhooks.create]
    ├── branding/
    │   ├── page.tsx                           [tenant.branding.view]
    │   └── login/page.tsx                     [tenant.branding.update]
    ├── tenant/
    │   └── page.tsx                           [tenant.view]
    ├── subscription/
    │   └── page.tsx                           [tenant.subscription.view]
    ├── countries/
    │   └── page.tsx                           [settings.view]
    ├── currencies/
    │   └── page.tsx                           [settings.view]
    └── legal/
        └── page.tsx                           [settings.view]
```

---

## 🔄 Migration : Avant → Après

### Pages Contractor

| Ancien Chemin | Nouveau Chemin | Permission |
|---------------|----------------|------------|
| `/contractor` | `/dashboard` | `dashboard.view` |
| `/contractor/information` | `/profile` | `profile.view` |
| `/contractor/onboarding` | `/onboarding/my-onboarding` | `onboarding.responses.view_own` |
| `/contractor/time-expenses` | `/timesheets` + `/expenses` | `timesheets.view_own`, `expenses.view_own` |
| `/contractor/invoices` | `/invoices` | `invoices.view_own` |
| `/contractor/remits` | `/payments/remits` | `payments.remits.view_own` |
| `/contractor/payslips` | `/payments/payslips` | `payments.payslips.view_own` |
| `/contractor/refer` | `/referrals/my-referrals` | `referrals.view` |

### Pages Agency

| Ancien Chemin | Nouveau Chemin | Permission |
|---------------|----------------|------------|
| `/agency` | `/dashboard` | `dashboard.view` |
| `/agency/information` | `/profile` | `profile.view` |
| `/agency/contracts` | `/contracts` | `contracts.manage.view_all` |
| `/agency/invoices` | `/invoices` | `invoices.manage.view_all` |
| `/agency/users` | `/team/members` | `team.view` |
| `/agency/roles` | `/settings/roles` | `tenant.roles.view` |
| `/agency/settings` | `/settings` | `settings.view` |

### Pages Payroll Partner

| Ancien Chemin | Nouveau Chemin | Permission |
|---------------|----------------|------------|
| `/payroll-partner` | `/dashboard` | `dashboard.view` |
| `/payroll-partner/information` | `/profile` | `profile.view` |
| `/payroll-partner/contracts` | `/contracts` | `contracts.manage.view_all` |
| `/payroll-partner/invoices` | `/invoices` | `invoices.manage.view_all` |
| `/payroll-partner/payslips` | `/payments/payslips` | `payments.payslips.view_all` |
| `/payroll-partner/remits` | `/payments/remits` | `payments.remits.view_all` |

### Pages Admin (Inchangées mais Renommées)

| Ancien Chemin | Nouveau Chemin | Permission |
|---------------|----------------|------------|
| `/contractors` | `/team/contractors` | `contractors.manage.view_all` |
| `/agencies` | `/team/agencies` | `agencies.manage.view_all` |
| `/payroll-partners` | `/team/payroll-partners` | ⚠️ Nouvelle permission nécessaire |

---

## 🎨 Composants Réutilisables

### PageContainer.tsx
```tsx
// Composant wrapper qui vérifie les permissions et adapte l'affichage
<PageContainer 
  ownPermission="contracts.view_own"
  managePermission="contracts.manage.view_all"
>
  {/* Contenu adaptatif */}
</PageContainer>
```

### PermissionGuard.tsx
```tsx
// Affiche le contenu uniquement si l'utilisateur a la permission
<PermissionGuard permission="invoices.create_own">
  <Button>Créer une facture</Button>
</PermissionGuard>
```

### AdaptiveTable.tsx
```tsx
// Table qui adapte les colonnes et actions selon les permissions
<AdaptiveTable
  data={data}
  ownMode={hasPermission("invoices.view_own")}
  manageMode={hasPermission("invoices.manage.view_all")}
  actions={{
    edit: "invoices.manage.update",
    delete: "invoices.manage.delete",
    markPaid: "invoices.manage.mark_paid"
  }}
/>
```

---

## 📝 Fichiers à Créer/Modifier

### Nouveaux Fichiers à Créer

1. **Composants Guards:**
   - `components/guards/PermissionGuard.tsx`
   - `components/guards/RouteGuard.tsx`
   - `components/guards/PageContainer.tsx`

2. **Composants Adaptatifs:**
   - `components/shared/AdaptiveTable.tsx`
   - `components/shared/AdaptiveHeader.tsx`
   - `components/shared/AdaptiveActions.tsx`

3. **Utilitaires:**
   - `lib/utils/permission-helpers.ts`
   - `lib/utils/route-helpers.ts`

4. **Hooks:**
   - `hooks/use-adaptive-permissions.ts` (nouveau)
   - Améliorer `hooks/use-permissions.ts`

### Fichiers à Modifier

1. **Navigation:**
   - `lib/dynamicMenuConfig.ts` → Nouvelle structure de menu
   - `middleware.ts` → Routing dynamique amélioré
   - `lib/routing/dynamic-router.ts` → Nouvelle logique

2. **Permissions:**
   - Remplacer `server/rbac/permissions.ts` par `permissions-v2.ts`
   - Remplacer `scripts/seed/00-permissions.ts` par `00-permissions-v2.ts`
   - Remplacer `scripts/seed/01-roles.ts` par `01-roles-v2.ts`

3. **Pages à Déplacer:** (62 pages)
   - Voir tableau de migration ci-dessus

---

## 🚀 Plan de Migration Progressive

### Phase 1: Setup (Préparation)
✅ Créer nouvelle structure de permissions  
✅ Créer nouveaux fichiers de seed  
🔄 Créer composants guards  
⏳ Créer composants adaptatifs

### Phase 2: Backend (Permissions)
⏳ Migrer vers permissions-v2.ts  
⏳ Seed les nouvelles permissions  
⏳ Mettre à jour les rôles  
⏳ Tester les permissions

### Phase 3: Routing (Navigation)
⏳ Mettre à jour dynamicMenuConfig  
⏳ Améliorer middleware  
⏳ Créer redirections temporaires  
⏳ Tester la navigation

### Phase 4: Pages (Déplacement)
⏳ Créer nouvelle structure de dossiers  
⏳ Déplacer les pages progressivement  
⏳ Mettre à jour tous les imports  
⏳ Adapter le contenu des pages

### Phase 5: Testing & Documentation
⏳ Tester avec tous les rôles  
⏳ Créer documentation complète  
⏳ Créer guide de migration  
⏳ Créer PR

---

## ⚠️ Points d'Attention

### 1. **Redirections**
Créer des redirections temporaires pour ne pas casser les bookmarks :
```typescript
// middleware.ts
const REDIRECTS = {
  "/contractor/information": "/profile",
  "/contractor/invoices": "/invoices",
  // ... etc
}
```

### 2. **Backward Compatibility**
Garder les anciens chemins accessibles pendant 1-2 mois avec warnings :
```typescript
if (pathname.startsWith("/contractor/")) {
  console.warn("⚠️ Old route detected. Please update your bookmarks.");
  // Redirect to new path
}
```

### 3. **Session Migration**
Mettre à jour les permissions dans les sessions existantes :
```typescript
// Vérifier si l'utilisateur a les anciennes permissions
// Les remapper vers les nouvelles
```

---

## 📊 Métriques de Réussite

- ✅ **0 routes basées sur les rôles** (objectif : structure 100% fonctionnelle)
- ✅ **100% des pages avec permissions granulaires**
- ✅ **Réutilisation maximale des composants** (< 5% de duplication)
- ✅ **Performance maintenue ou améliorée**
- ✅ **Zéro breaking changes** pour les utilisateurs

---

**Statut:** Plan Validé  
**Prêt pour:** Phase d'Implémentation  
**Prochaine Étape:** Création des composants guards

