# 🔧 Corrections - Timesheet Expenses & Invoice Link

## 📋 Problèmes Corrigés

### 1. ✅ Expenses non enregistrées
**Problème** : Les expenses ajoutées dans le formulaire timesheet n'étaient pas sauvegardées dans la base de données.

**Solution** :
- Ajout du champ `expenses` dans l'input du mutation `createRange` (timesheet.ts)
- Création automatique des `TimesheetDocument` pour chaque expense
- Calcul et stockage du `totalExpenses` dans le timesheet
- Mise à jour du frontend pour envoyer les expenses au backend

**Fichiers modifiés** :
- `server/api/routers/timesheet.ts` : Ajout du traitement des expenses (lignes 141-146, 286-310)
- `components/timesheets/TimesheetSubmissionForm.tsx` : Envoi des expenses au backend (ligne 219)

### 2. ✅ Total amount mal calculé dans invoice
**Problème** : Le total amount de l'invoice n'incluait pas les expenses, seulement les heures travaillées.

**Solution** :
- Correction du calcul dans `sendToAgency` pour inclure `totalExpenses`
- Formule corrigée : `totalAmount = (hours × rate) + totalExpenses + margin`
- Ajout de line items pour chaque expense document dans l'invoice

**Fichiers modifiés** :
- `server/api/routers/timesheet.ts` : Correction du calcul dans `sendToAgency` (lignes 565-642)

### 3. ✅ Upload de fichiers non fonctionnel
**Problème** : Les fichiers uploadés pour les expenses n'utilisaient pas le modèle `TimesheetDocument`.

**Solution** :
- Utilisation du modèle `TimesheetDocument` pour stocker les receipts d'expenses
- Création automatique des documents lors de la soumission du timesheet
- Les documents sont liés au timesheet via `timesheetId`

**Fichiers modifiés** :
- `server/api/routers/timesheet.ts` : Création des TimesheetDocument (lignes 290-303)

### 4. ✅ Manque de lien timesheet-invoice
**Problème** : Pas de champ `timesheetId` dans la table Invoice pour récupérer les informations du timesheet.

**Solution** :
- Ajout du champ `timesheetId` dans le modèle `Invoice`
- Création d'une relation bidirectionnelle entre Invoice et Timesheet
- Migration Prisma pour ajouter la colonne et l'index
- Mise à jour de la création d'invoice pour inclure `timesheetId`

**Fichiers modifiés** :
- `prisma/schema.prisma` : Ajout du champ `timesheetId` et relations (lignes 624, 682, 832)
- `prisma/migrations/20251209_add_timesheet_id_to_invoice/migration.sql` : Migration SQL
- `server/api/routers/timesheet.ts` : Utilisation de `timesheetId` lors de la création d'invoice (ligne 648)

## 🗂️ Modifications de la Base de Données

### Nouveau champ dans Invoice
```prisma
model Invoice {
  // ...
  timesheetId   String?  // 🔥 NEW - Link to source timesheet for traceability
  // ...
  
  // Relations
  timesheet    Timesheet?  @relation("InvoiceTimesheet", fields: [timesheetId], references: [id])
  // ...
  
  @@index([timesheetId])
}
```

### Relations mises à jour dans Timesheet
```prisma
model Timesheet {
  // ...
  invoiceLink  Invoice?  @relation("InvoiceTimesheet") // 🔥 NEW: Proper link from Invoice side
  documents    TimesheetDocument[] // Multiple expense documents
  // ...
}
```

## 🚀 Migration

Pour appliquer les changements en base de données :

```bash
npx prisma migrate dev --name add_timesheet_id_to_invoice
npx prisma generate
```

## 🧪 Tests à Effectuer

1. **Création de timesheet avec expenses** :
   - Créer un timesheet
   - Ajouter plusieurs expenses avec montants et receipts
   - Vérifier que les expenses sont sauvegardées dans `TimesheetDocument`
   - Vérifier que `totalExpenses` est calculé correctement

2. **Calcul du total** :
   - Soumettre et approuver le timesheet
   - Cliquer sur "Send to Agency"
   - Vérifier que l'invoice créée inclut :
     - Base amount (heures × taux)
     - Total expenses
     - Margin
     - Total amount = base + expenses + margin

3. **Lien timesheet-invoice** :
   - Vérifier que l'invoice créée a un `timesheetId`
   - Vérifier qu'on peut récupérer les documents du timesheet via l'invoice
   - Vérifier que les expense documents s'affichent dans l'invoice

4. **Affichage des expenses** :
   - Ouvrir un timesheet avec expenses
   - Vérifier que les expenses s'affichent dans l'onglet Files
   - Vérifier que les montants sont corrects

## 📊 Exemple de Calcul

### Avant (❌ Incorrect)
```
Hours: 40h × $50/h = $2,000
Margin (10%): $200
Total: $2,200
❌ Expenses ignorées !
```

### Après (✅ Correct)
```
Hours: 40h × $50/h = $2,000
Expenses: $300 (3 documents)
Subtotal: $2,300
Margin (10%): $230
Total: $2,530
✅ Expenses incluses !
```

## 🔗 Traçabilité Invoice → Timesheet

Maintenant, depuis une invoice, on peut :
- Récupérer le timesheet source via `invoice.timesheet`
- Accéder aux documents d'expenses via `invoice.timesheet.documents`
- Voir les détails des heures travaillées via `invoice.timesheet.entries`
- Afficher les informations complètes du contractor

## 📝 Notes Importantes

1. **Backward Compatibility** : Les anciennes invoices sans `timesheetId` continuent de fonctionner (champ nullable)

2. **Expense Documents** : Les receipts sont stockés comme `TimesheetDocument` avec `category: "expense"`

3. **Calcul Automatique** : Le `totalExpenses` est calculé automatiquement lors de la création du timesheet

4. **Validation** : Les expenses sont validées côté backend (montants positifs, catégories valides)

## 🎯 Prochaines Étapes (Optionnel)

- [ ] Ajouter la possibilité de modifier les expenses après création
- [ ] Implémenter l'upload réel de fichiers (actuellement fake URL)
- [ ] Ajouter des validations supplémentaires (limites de montants, etc.)
- [ ] Créer une page dédiée pour visualiser les expenses d'une invoice
- [ ] Ajouter des filtres par catégorie d'expense

---

**Date de correction** : 9 décembre 2025  
**Branche** : `fix/timesheet-expenses-and-invoice-link`  
**PR** : À créer après validation
