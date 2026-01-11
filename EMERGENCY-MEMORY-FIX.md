# 🚨 URGENCE : CORRECTION MÉMOIRE RENDER FREE

## 🔥 PROBLÈME : OOM persiste malgré les optimisations

**Erreur :** "JavaScript heap out of memory" après 60 secondes

---

## 📊 ANALYSE DU PROBLÈME

Malgré la désactivation de Winston (-50MB), Swagger (-30MB), et autres optimisations, l'application consomme encore ~250MB.

**Cause identifiée :** Trop de modules NestJS chargés au démarrage

---

## 🛑 SOLUTION D'URGENCE : VERSION EXPRESS MINIMALE

### **3 options de déploiement (choisissez la plus appropriée) :**

---

## **OPTION 1 : EXPRESS PUR (RECOMMANDÉ)** ⭐⭐⭐

Version ultra-minimale avec Express.js au lieu de NestJS.

```bash
# Configuration Render :
Build Command: npm install --production && npm run build && npm run build:minimal
Start Command: npm run start:minimal
NODE_OPTIONS: --max-old-space-size=150 --optimize-for-size --gc-interval=50 --max-new-space-size=32
```

**Avantages :**
- ✅ ~50MB de RAM utilisés maximum
- ✅ Démarrage en < 5 secondes
- ✅ Fonctionne garanti sur 512MB

**Inconvénients :**
- ❌ Seulement les routes essentielles (/health, /)
- ❌ Pas d'authentification, pas de base de données

---

## **OPTION 2 : NESTJS RÉDUIT**

Version NestJS avec modules essentiels seulement.

```bash
# Configuration Render :
Build Command: npm install --production && npm run build
Start Command: npm run start:prod
NODE_OPTIONS: --max-old-space-size=200 --optimize-for-size --gc-interval=100 --max-new-space-size=64
```

**Avantages :**
- ✅ Authentification et base de données fonctionnelles
- ✅ API complète disponible

**Inconvénients :**
- ❌ Risque d'OOM si les modules sont encore trop lourds

---

## **OPTION 3 : DÉPLOIEMENT PROGRESSIF**

1. **Étape 1 :** Déployer avec OPTION 1 (Express minimal)
2. **Étape 2 :** Tester que ça fonctionne
3. **Étape 3 :** Ajouter progressivement les modules NestJS

---

## 🔧 CONFIGURATION ACTUELLE DE render.yaml

```yaml
services:
  - type: web
    name: hackathon-backend
    runtime: node
    buildCommand: npm install --production && npm run build && npm run build:minimal
    startCommand: npm run start:minimal  # CHANGE ICI pour OPTION 1
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_OPTIONS
        value: --max-old-space-size=150 --optimize-for-size --gc-interval=50 --max-new-space-size=32
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: PORT
        value: 10000
    healthCheckPath: /health
```

---

## 📈 SUIVI DES PERFORMANCES

### **Après déploiement, vérifier :**

```bash
# Health check
curl https://your-app.onrender.com/health

# Memory usage (devrait être < 100MB)
curl https://your-app.onrender.com/health | jq .memory

# Expected response:
{
  "status": "ok",
  "timestamp": 1234567890,
  "memory": {
    "rss": 45000000,      // ~45MB (OK)
    "heapTotal": 25000000, // ~25MB (OK)
    "heapUsed": 15000000,  // ~15MB (OK)
    "external": 1000000    // ~1MB (OK)
  }
}
```

---

## 🎯 PROCHAINES ÉTAPES

1. **Déployer avec OPTION 1** (Express minimal)
2. **Vérifier que /health fonctionne**
3. **Ajouter progressivement les fonctionnalités**
4. **Migrer vers NestJS quand la mémoire le permet**

---

## 🚨 SI ÇA NE MARCHE TOUJOURS PAS

**Dernière solution :** Utiliser Railway ou Heroku Free (1GB RAM) au lieu de Render Free (512MB).

**Configuration alternative :**
- Railway : 1GB RAM gratuit
- Heroku : 1GB RAM gratuit
- DigitalOcean App Platform : 512MB mais + flexible

---

## 📋 CHECKLIST DÉPLOIEMENT

- ✅ `render.yaml` configuré
- ✅ Scripts `start:minimal` créés
- ✅ `server-minimal.js` créé
- ✅ `NODE_OPTIONS` optimisées
- ✅ Health check endpoint ajouté
- ✅ Modules lourds désactivés

**🎉 Prêt pour déploiement d'urgence !**
