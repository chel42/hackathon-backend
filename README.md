# 🚀 Hackathon Backend API

Backend NestJS pour la gestion d'un système de hackathons avec authentification, inscriptions, gestion d'annonces, analyse IA et monitoring administrateur.

## 📚 Documentation Complète

Voir le fichier **[GUIDE_PROJET.md](./GUIDE_PROJET.md)** pour la documentation complète du projet.

## 🚀 Démarrage Rapide

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Générer le client Prisma
npx prisma generate

# Lancer les migrations
npx prisma migrate dev

# Démarrer le serveur
npm run start:dev
```

Le serveur sera accessible sur : `http://localhost:3000`
Documentation Swagger : `http://localhost:3000/api`

## 📋 Fonctionnalités

- ✅ Authentification JWT (register/login)
- ✅ Gestion des hackathons
- ✅ Système d'inscriptions
- ✅ Annonces (publiques/pour inscrits)
- ✅ Dashboard administrateur
- ✅ Monitoring et métriques
- ✅ Analyse IA des inscriptions
- ✅ WebSockets pour événements temps réel
- ✅ Envoi d'emails via SMTP

## 🗄️ Base de Données

Le schéma Prisma est conforme au document PDF fourni avec tous les modèles, enums et relations nécessaires.

## 📮 Collection Postman

Une collection Postman est disponible : `Hackathon_API.postman_collection.json`

Importez-la dans Postman pour tester toutes les routes API.

## 📖 Pour plus d'informations

Consultez **[GUIDE_PROJET.md](./GUIDE_PROJET.md)** pour :
- Architecture détaillée
- Guide d'utilisation
- Dépannage
- Commandes utiles

