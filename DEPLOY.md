Déploiement rapide (Supabase + Fly.io)

1) Créer un projet Supabase (free tier)
   - Récupérer la connection string Postgres (DATABASE_URL)
   - Créer un bucket `uploads` si vous utilisez des fichiers
   - Récupérer `SUPABASE_URL` et `SERVICE_ROLE_KEY` si nécessaire

2) Créer une app sur Fly.io
   - Installer flyctl: https://fly.io/docs/hands-on/install-flyctl/
   - flyctl launch --name your-app-name --region ams
   - Note: configurez l'app sans déployer automatiquement si vous préférez

3) Configurer GitHub Secrets (repo Settings → Secrets)
   - DATABASE_URL : la valeur fournie par Supabase
   - FLY_API_TOKEN : token Fly (flyctl auth token)
   - JWT_SECRET : clé secrète JWT
   - SMTP_* : si envoi d'e-mails
   - (optionnel) S3 / SUPABASE credentials

4) Lancer le pipeline
   - Poussez sur `main` → GitHub Actions s'exécute:
     - build, tests, prisma:generate, docker image -> push to GHCR
     - prisma migrate deploy (utilise DATABASE_URL)
     - flyctl deploy (déploy l'image sur Fly)

5) Vérification
   - Vérifiez l'URL Fly (ex: https://your-app.fly.dev)
   - Endpoint de santé: GET /health
   - UI: configurez `NEXT_PUBLIC_API_URL` dans votre frontend sur Vercel/Netlify pour pointer vers l'API

6) Local (dev)
   - cp .env.example .env && ajuster
   - docker compose up --build
   - Aller sur http://localhost:3000 (server minimal) ou exécuter en dev: npm run start:dev

Notes:
- Assurez-vous d'avoir les secrets GitHub configurés avant le premier push sur main
- Si votre application réalise des traitements lourds (PDF), envisagez de découper en workers ou d'utiliser une instance avec plus de mémoire
