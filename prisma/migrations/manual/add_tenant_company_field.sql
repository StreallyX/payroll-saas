-- Migration pour ajouter le champ tenantCompany au modèle Company
-- À exécuter manuellement sur la base de données

ALTER TABLE "companies" 
ADD COLUMN "tenantCompany" BOOLEAN NOT NULL DEFAULT false;

-- Index optionnel pour améliorer les performances des requêtes sur tenantCompany
CREATE INDEX "companies_tenantCompany_idx" ON "companies"("tenantCompany");

-- Commentaire sur la colonne
COMMENT ON COLUMN "companies"."tenantCompany" IS 'Indique si cette company appartient au tenant/plateforme (true) ou est une company cliente (false)';
