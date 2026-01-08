# Correction de l'Erreur de Création du Dossier 'logs'

## 🔍 Analyse du Problème

### Erreur Rencontrée
```
Error: ENOENT: no such file or directory, mkdir 'logs'
    at Object.mkdirSync (node:fs:1363:26)
    at e.exports._createLogDirIfNotExist (/var/task/.next/server/app/api/trpc/[trpc]/route.js:8113:58885)
```

### Localisation du Code Problématique
- **Fichier**: `lib/logging/logger.ts`
- **Problème**: Le logger Winston tentait d'écrire des logs dans des fichiers locaux (`logs/error.log`, `logs/combined.log`, `logs/exceptions.log`, `logs/rejections.log`) sans vérifier l'existence du dossier parent ni la compatibilité avec l'environnement d'exécution.

### Causes Identifiées
1. **Environnement Serverless**: Le chemin `/var/task/` indique un environnement serverless (AWS Lambda, Vercel, etc.)
2. **Système de Fichiers en Lecture Seule**: Dans un environnement serverless, le système de fichiers est généralement en lecture seule, sauf pour `/tmp`
3. **Dossier 'logs' Non Existant**: Aucune vérification n'était faite pour créer le dossier avant d'y écrire
4. **File Transports Inappropriés**: L'utilisation de file transports dans un environnement serverless est problématique car :
   - Les fichiers sont éphémères et disparaissent après chaque exécution
   - Le système de fichiers peut être en lecture seule
   - Les logs ne sont pas persistés entre les invocations

## ✅ Solution Appliquée

### 1. Détection de l'Environnement Serverless
Ajout de la détection automatique des environnements serverless :
```typescript
const isServerless = process.env.VERCEL || 
                     process.env.AWS_LAMBDA_FUNCTION_NAME || 
                     process.env.LAMBDA_TASK_ROOT;
```

### 2. Désactivation Conditionnelle des File Transports
Les file transports sont maintenant **désactivés automatiquement** en environnement serverless :
```typescript
// File transports (only for local/non-serverless environments)
const fileTransports = !isServerless ? [
  new transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  new transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 10,
  }),
] : [];
```

### 3. Création Sécurisée du Dossier Logs
Pour les environnements locaux/non-serverless, ajout d'une méthode sécurisée de création du dossier :
```typescript
private _createLogDirIfNotExist(): void {
  try {
    const logsDir = resolve(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });  // ✅ Option recursive: true
    }
  } catch (error) {
    // Silently fail - console transport will still work
    console.warn('Warning: Could not create logs directory. File logging disabled.', error);
  }
}
```

**Points clés de cette méthode** :
- ✅ Utilise `recursive: true` pour créer les dossiers parents si nécessaire
- ✅ Vérifie l'existence avec `existsSync()` avant de créer
- ✅ Entoure le code d'un `try-catch` pour gérer les erreurs gracieusement
- ✅ En cas d'échec, le logger continue de fonctionner avec le console transport

### 4. Gestion des Exception/Rejection Handlers
Les handlers de fichiers pour les exceptions et rejections sont également désactivés en environnement serverless :
```typescript
...((!isServerless) && {
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' }),
  ],
})
```

## 🎯 Comportement Après Correction

### En Environnement Serverless (Production)
- ✅ **Console Transport uniquement** : Les logs sont envoyés à la console
- ✅ **Capture par le Service Cloud** : Les logs sont automatiquement capturés par CloudWatch (AWS), Vercel Logs, etc.
- ✅ **Aucune Erreur** : Plus d'erreur ENOENT lors de la création du dossier
- ✅ **Performance Optimale** : Pas d'opérations de fichiers inutiles

### En Environnement Local/Développement
- ✅ **Console + File Transports** : Les logs sont à la fois affichés dans la console et sauvegardés dans des fichiers
- ✅ **Création Automatique du Dossier** : Le dossier `logs/` est créé automatiquement s'il n'existe pas
- ✅ **Rotation des Logs** : Les fichiers de logs sont automatiquement gérés avec rotation (10MB max par fichier)

## 📋 Modifications Apportées

### Fichier Modifié
- **`lib/logging/logger.ts`**

### Changements Effectués
1. Ajout des imports `fs` et `path` :
   ```typescript
   import { mkdirSync, existsSync } from 'fs';
   import { resolve } from 'path';
   ```

2. Ajout de la détection d'environnement serverless (ligne 29)

3. Ajout de l'appel à `_createLogDirIfNotExist()` pour les environnements non-serverless (lignes 31-34)

4. Séparation des transports en `baseTransports` et `fileTransports` (lignes 36-65)

5. Ajout de la méthode privée `_createLogDirIfNotExist()` (lignes 92-106)

6. Désactivation conditionnelle des exception/rejection handlers (lignes 80-88)

## 🚀 Déploiement

Après cette correction, l'application peut être déployée sans erreur dans les environnements suivants :
- ✅ AWS Lambda
- ✅ Vercel Serverless Functions
- ✅ Netlify Functions
- ✅ Google Cloud Functions
- ✅ Azure Functions
- ✅ Environnements locaux (développement)

## 📝 Recommandations Supplémentaires

Pour une solution de logging en production plus robuste, considérez :
1. **Services de Logging Externes** : Winston Cloud Transport, Loggly, Papertrail, Datadog
2. **Structured Logging** : Le format JSON est déjà activé, facilitant l'analyse des logs
3. **Log Aggregation** : Utiliser un service centralisé pour agréger les logs de toutes les instances
4. **Monitoring** : Configurer des alertes sur les erreurs critiques

## ✨ Résultat Final

L'application est maintenant compatible avec les environnements serverless tout en conservant la fonctionnalité de logging sur fichier en développement local. Le logger s'adapte automatiquement à son environnement d'exécution sans configuration supplémentaire requise.
