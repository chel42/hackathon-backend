# --- ÉTAPE 1 : BUILD ---
FROM node:20-alpine AS builder
WORKDIR /app

# Installation des dépendances
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Build du projet
COPY . .
RUN npx prisma generate
RUN npm run build

# --- ÉTAPE 2 : RUNTIME ---
FROM node:20-alpine
WORKDIR /app

# Copie uniquement du nécessaire depuis le builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Variable d'environnement par défaut
ENV NODE_ENV=production

# Commande de démarrage (Migration + App)
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]