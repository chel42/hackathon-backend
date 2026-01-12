# 🚀 CONFIGURATION LOCALE - À MODIFIER !

## ⚠️ IMPORTANT : Configure tes vraies valeurs

Le fichier `.env` a été remis avec des valeurs d'exemple. Tu dois les remplacer par tes vraies configurations.

### 1. **Ouvre le fichier `.env`** dans ton éditeur

### 2. **Remplace les valeurs** par tes vraies informations :

```env
# Base de données PostgreSQL locale
DATABASE_URL="postgresql://TON_USERNAME:TON_PASSWORD@localhost:5432/hackathon"

# JWT Secret (change-le pour la sécurité)
JWT_SECRET="ton-secret-jwt-personnel"

# Configuration SMTP pour les emails
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="ton-email@gmail.com"
EMAIL_PASS="ton-mot-de-passe-application-gmail"

# Port du serveur
PORT=3000
```

### 3. **Pour Gmail SMTP** :
- Va sur https://myaccount.google.com/apppasswords
- Génère un mot de passe d'application
- Mets ce mot de passe dans `EMAIL_PASS`

### 4. **Pour PostgreSQL** :
- Assure-toi que PostgreSQL est installé et démarré
- Crée une base de données appelée `hackathon`
- Mets ton username et password dans `DATABASE_URL`

### 5. **Teste le démarrage** :
```bash
npm run start:dev
```

Si tu as des erreurs, vérifie tes configurations dans `.env`.

---
**🎯 Une fois configuré, tes applications backend + frontend tourneront parfaitement en local !**
