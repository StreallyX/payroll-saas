# 🚀 Commandes Rapides - Correction Seeders RBAC

## ⚡ TL;DR - Commandes Essentielles

```bash
# 1. Aller dans le projet
cd /home/ubuntu/github_repos/payroll-saas

# 2. Vérifier la branche (doit être refactor/rbac-phase2-migration)
git status

# 3. Mettre à jour si nécessaire
git pull origin refactor/rbac-phase2-migration

# 4. RÉINITIALISER LA BASE DE DONNÉES (⚠️ SUPPRIME TOUTES LES DONNÉES)
npx prisma migrate reset

# 5. Démarrer l'application
npm run dev
```

---

## ✅ Ce Qui a Été Corrigé

- ✅ Le fichier `scripts/seed.ts` utilise maintenant les seeders **v2**
- ✅ Toutes les permissions v2 sont incluses (150+ permissions granulaires)
- ✅ Les permissions `payroll_partners` manquantes ont été ajoutées
- ✅ Admin et superadmin ont maintenant accès à **toutes les pages**
- ✅ Le commit a été fait : `cf5d2c1`
- ✅ Le push a été effectué sur `refactor/rbac-phase2-migration`

---

## 🎯 Résultat Attendu

Après `npx prisma migrate reset`, vous devriez voir :
- 150+ permissions v2 créées
- 10 rôles créés avec les bonnes permissions
- Message final : "🎉 SEED COMPLETE! Everything is ready to use."
- Admin peut maintenant accéder à **TOUTES** les pages (plus d'erreur 403)

---

## 📖 Documentation Complète

Pour plus de détails, consultez : **`SEEDER_FIX_INSTRUCTIONS.md`**

---

## 🆘 En Cas de Problème

```bash
# Reset complet forcé
npx prisma migrate reset --force

# Régénérer le client Prisma
npx prisma generate

# Vérifier les permissions dans la base de données
npx prisma studio
```

---

**Status:** ✅ **PRÊT À TESTER**  
**Branche:** `refactor/rbac-phase2-migration`  
**Commit:** `cf5d2c1`
