# Déploiement — Fly.io + Supabase

Ce guide décrit les étapes pour déployer l'application sur Fly.io et utiliser Supabase comme base de données gérée.

## Pré-requis
- Un compte GitHub (repo avec CI activé)
- Fly CLI (`flyctl`) installé localement ou via CI
- Supabase CLI (optionnel si vous préférez l'UI)
- Secrets GitHub configurés (voir ci-dessous)

## Secrets GitHub nécessaires
- `FLY_API_TOKEN` — token Fly (permissions : deploy)
- `FLY_APP_NAME` — nom de l'application Fly (ex: `hackathon-backend-prod`)
- `DATABASE_URL` — fournie par Supabase (ex: `postgresql://...`)
- `SUPABASE_URL` — base url du projet Supabase (ex: `https://<project_ref>.supabase.co`)
- `SUPABASE_ANON_KEY` — clé anon (client)
- `SUPABASE_SERVICE_ROLE` — clé service role (si vous souhaitez administrer depuis CI)
- `SUPABASE_ACCESS_TOKEN` (optionnel) — pour créer ou gérer projet Supabase via API

> Note: `DATABASE_URL` est utilisé par la job `migrate` pour exécuter `npx prisma migrate deploy`. Si vous voulez que CI fasse des opérations admin sur Supabase, fournissez `SUPABASE_SERVICE_ROLE`.

## Étapes (résumé)
1. Créer un projet Supabase et récupérer `DATABASE_URL` (ou automatiser via token)
2. Ajouter les secrets GitHub au repo (voir instructions ci‑dessous)
3. Vérifier la job `smoke-test` dans `.github/workflows/ci-cd.yml` (déjà présente)
4. Merger la PR sur `main` → CI buildera l'image et la poussera vers GHCR
5. Fly déploie l'image (job `deploy` dans workflow)

### Comment ajouter les secrets (UI)
1. Sur GitHub → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`
2. Ajouter : `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` (optionnel), `FLY_API_TOKEN`, `FLY_APP_NAME`

### Comment ajouter les secrets (CLI)
- Avec `gh` (exécuté localement depuis votre compte) :
  - gh secret set DATABASE_URL --body '<votre DATABASE_URL>' --repo CG242/hackathon-backend
  - gh secret set SUPABASE_URL --body 'https://<project_ref>.supabase.co' --repo CG242/hackathon-backend
  - gh secret set SUPABASE_ANON_KEY --body '<votre anon key>' --repo CG242/hackathon-backend
  - gh secret set SUPABASE_SERVICE_ROLE --body '<votre service key>' --repo CG242/hackathon-backend
  - gh secret set FLY_API_TOKEN --body '<votre fly token>' --repo CG242/hackathon-backend
  - gh secret set FLY_APP_NAME --body 'chel42Project_Hackathon' --repo CG242/hackathon-backend

> Important: exécutez ces commandes depuis votre machine (compte GitHub a les droits sur le repo).

## Commandes utiles
- Créer app Fly localement:
  - flyctl apps create $FLY_APP_NAME --image ghcr.io/CG242/hackathon-backend:${GITHUB_SHA}
  - flyctl deploy --image ghcr.io/CG242/hackathon-backend:${GITHUB_SHA}

- Créer projet Supabase via CLI (optionnel):
  - supabase projects create --name "hackathon-db" --org-id <ORG>
  - supabase projects connection-string <PROJECT_REF>

## Nettoyage automatique
Si vous voulez que l’environnement soit supprimé automatiquement après 60 jours, nous pouvons ajouter:
- Un workflow GitHub Actions planifié qui utilise `flyctl` et `supabase` CLI pour supprimer les ressources.

---
Si vous voulez, j’implémente maintenant :
- la PR contenant `fly.toml` + `DEPLOYMENT.md` + adaptation du workflow CI pour utiliser `FLY_APP_NAME`.
- ou j’attends que vous configuriez les secrets et je déclenche tout (création Supabase + déploiement Fly).
