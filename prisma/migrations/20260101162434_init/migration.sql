-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "HackathonStatus" AS ENUM ('UPCOMING', 'ONGOING', 'PAST');

-- CreateEnum
CREATE TYPE "AnnonceCible" AS ENUM ('PUBLIC', 'INSCRITS');

-- CreateEnum
CREATE TYPE "TypeEvenementSurveillance" AS ENUM ('INSCRIPTION', 'CONNEXION', 'ACTION_ADMIN', 'ERREUR', 'PERFORMANCE');

-- CreateEnum
CREATE TYPE "NiveauEvenementSurveillance" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Promo" AS ENUM ('L1', 'L2');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('VALIDE', 'EN_ATTENTE', 'REFUSE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('EMAIL', 'SITE');

-- CreateEnum
CREATE TYPE "TypeIALog" AS ENUM ('ANALYSE', 'SURVEILLANCE', 'SUGGESTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hackathon" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "themes" JSONB,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "dateLimiteInscription" TIMESTAMP(3) NOT NULL,
    "status" "HackathonStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "promo" "Promo",
    "technologies" JSONB,
    "statut" "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annonce" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "cible" "AnnonceCible" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "hackathonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IALog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "TypeIALog" NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "score" DOUBLE PRECISION,
    "suggestions" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IALog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementSurveillance" (
    "id" TEXT NOT NULL,
    "type" "TypeEvenementSurveillance" NOT NULL,
    "valeur" DOUBLE PRECISION,
    "seuil" DOUBLE PRECISION,
    "niveau" "NiveauEvenementSurveillance" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "details" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvenementSurveillance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "annonceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyseIA" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "scoreMatching" DOUBLE PRECISION,
    "scoreSpam" DOUBLE PRECISION,
    "suggestionsEquipes" JSONB,
    "autoTags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyseIA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Hackathon_status_dateDebut_idx" ON "Hackathon"("status", "dateDebut");

-- CreateIndex
CREATE INDEX "Hackathon_dateLimiteInscription_idx" ON "Hackathon"("dateLimiteInscription");

-- CreateIndex
CREATE INDEX "Hackathon_status_idx" ON "Hackathon"("status");

-- CreateIndex
CREATE INDEX "Inscription_hackathonId_idx" ON "Inscription"("hackathonId");

-- CreateIndex
CREATE INDEX "Inscription_userId_idx" ON "Inscription"("userId");

-- CreateIndex
CREATE INDEX "Inscription_createdAt_idx" ON "Inscription"("createdAt");

-- CreateIndex
CREATE INDEX "Inscription_statut_idx" ON "Inscription"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_userId_hackathonId_key" ON "Inscription"("userId", "hackathonId");

-- CreateIndex
CREATE INDEX "Annonce_hackathonId_idx" ON "Annonce"("hackathonId");

-- CreateIndex
CREATE INDEX "Annonce_createdAt_idx" ON "Annonce"("createdAt");

-- CreateIndex
CREATE INDEX "Annonce_cible_createdAt_idx" ON "Annonce"("cible", "createdAt");

-- CreateIndex
CREATE INDEX "Annonce_sentAt_idx" ON "Annonce"("sentAt");

-- CreateIndex
CREATE INDEX "IALog_userId_idx" ON "IALog"("userId");

-- CreateIndex
CREATE INDEX "IALog_createdAt_idx" ON "IALog"("createdAt");

-- CreateIndex
CREATE INDEX "IALog_type_idx" ON "IALog"("type");

-- CreateIndex
CREATE INDEX "IALog_type_createdAt_idx" ON "IALog"("type", "createdAt");

-- CreateIndex
CREATE INDEX "EvenementSurveillance_type_idx" ON "EvenementSurveillance"("type");

-- CreateIndex
CREATE INDEX "EvenementSurveillance_niveau_idx" ON "EvenementSurveillance"("niveau");

-- CreateIndex
CREATE INDEX "EvenementSurveillance_createdAt_idx" ON "EvenementSurveillance"("createdAt");

-- CreateIndex
CREATE INDEX "EvenementSurveillance_type_niveau_createdAt_idx" ON "EvenementSurveillance"("type", "niveau", "createdAt");

-- CreateIndex
CREATE INDEX "EvenementSurveillance_userId_idx" ON "EvenementSurveillance"("userId");

-- CreateIndex
CREATE INDEX "EvenementSurveillance_valeur_seuil_idx" ON "EvenementSurveillance"("valeur", "seuil");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_annonceId_idx" ON "Notification"("annonceId");

-- CreateIndex
CREATE INDEX "Notification_scheduledAt_idx" ON "Notification"("scheduledAt");

-- CreateIndex
CREATE INDEX "Notification_sent_idx" ON "Notification"("sent");

-- CreateIndex
CREATE INDEX "Notification_type_sent_idx" ON "Notification"("type", "sent");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyseIA_inscriptionId_key" ON "AnalyseIA"("inscriptionId");

-- CreateIndex
CREATE INDEX "AnalyseIA_inscriptionId_idx" ON "AnalyseIA"("inscriptionId");

-- CreateIndex
CREATE INDEX "AnalyseIA_scoreMatching_idx" ON "AnalyseIA"("scoreMatching");

-- CreateIndex
CREATE INDEX "AnalyseIA_scoreSpam_idx" ON "AnalyseIA"("scoreSpam");

-- CreateIndex
CREATE INDEX "AnalyseIA_createdAt_idx" ON "AnalyseIA"("createdAt");

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annonce" ADD CONSTRAINT "Annonce_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IALog" ADD CONSTRAINT "IALog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementSurveillance" ADD CONSTRAINT "EvenementSurveillance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "Annonce"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyseIA" ADD CONSTRAINT "AnalyseIA_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
