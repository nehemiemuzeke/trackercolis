-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'ADMIN_RDC', 'ADMIN_CHINE');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('COMMANDE_CREEE', 'COMMANDE_VALIDEE_RDC', 'TRANSMISE_CHINE', 'ACCEPTEE_CHINE', 'COLIS_PREPARE', 'EXPEDIE_CHINE', 'EN_TRANSIT', 'ARRIVE_RDC', 'EN_LIVRAISON', 'LIVRE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'PAYE', 'REMBOURSE');

-- CreateEnum
CREATE TYPE "TypeActeur" AS ENUM ('CLIENT', 'ADMIN_RDC', 'ADMIN_CHINE', 'SYSTEME');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('STATUT_CHANGE', 'NOUVELLE_COMMANDE', 'MESSAGE', 'ALERTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT,
    "photo_profil" TEXT,
    "fcm_token" TEXT,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" TEXT NOT NULL,
    "numero_commande" TEXT NOT NULL,
    "numero_tracking" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "description_produit" TEXT NOT NULL,
    "categorie_produit" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "poids_estime_kg" DOUBLE PRECISION NOT NULL,
    "valeur_declaree_usd" DOUBLE PRECISION NOT NULL,
    "adresse_livraison" TEXT NOT NULL,
    "ville_livraison" TEXT NOT NULL,
    "statut_actuel" "StatutCommande" NOT NULL DEFAULT 'COMMANDE_CREEE',
    "etape_actuelle" INTEGER NOT NULL DEFAULT 1,
    "admin_rdc_id" TEXT,
    "admin_chine_id" TEXT,
    "frais_service_usd" DOUBLE PRECISION NOT NULL,
    "frais_livraison_usd" DOUBLE PRECISION NOT NULL,
    "montant_total_usd" DOUBLE PRECISION NOT NULL,
    "statut_paiement" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "date_livraison_estimee" TIMESTAMP(3) NOT NULL,
    "date_livraison_reelle" TIMESTAMP(3),
    "notes_client" TEXT,
    "notes_admin_rdc" TEXT,
    "notes_admin_chine" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suivi_colis" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "numero_etape" INTEGER NOT NULL,
    "statut" "StatutCommande" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lieu" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "declenche_par" TEXT,
    "type_acteur" "TypeActeur" NOT NULL,
    "photo_preuve" TEXT,
    "signature_url" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suivi_colis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "commande_id" TEXT,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "est_lu" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "expediteur_id" TEXT NOT NULL,
    "destinataire_id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "piece_jointe" TEXT,
    "est_lu" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_est_actif_idx" ON "users"("role", "est_actif");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_numero_commande_key" ON "commandes"("numero_commande");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_numero_tracking_key" ON "commandes"("numero_tracking");

-- CreateIndex
CREATE INDEX "commandes_statut_actuel_idx" ON "commandes"("statut_actuel");

-- CreateIndex
CREATE INDEX "commandes_etape_actuelle_idx" ON "commandes"("etape_actuelle");

-- CreateIndex
CREATE INDEX "commandes_client_id_idx" ON "commandes"("client_id");

-- CreateIndex
CREATE INDEX "commandes_admin_rdc_id_idx" ON "commandes"("admin_rdc_id");

-- CreateIndex
CREATE INDEX "commandes_admin_chine_id_idx" ON "commandes"("admin_chine_id");

-- CreateIndex
CREATE INDEX "commandes_cree_le_idx" ON "commandes"("cree_le");

-- CreateIndex
CREATE INDEX "suivi_colis_commande_id_cree_le_idx" ON "suivi_colis"("commande_id", "cree_le");

-- CreateIndex
CREATE INDEX "suivi_colis_statut_idx" ON "suivi_colis"("statut");

-- CreateIndex
CREATE INDEX "notifications_user_id_est_lu_idx" ON "notifications"("user_id", "est_lu");

-- CreateIndex
CREATE INDEX "notifications_user_id_cree_le_idx" ON "notifications"("user_id", "cree_le");

-- CreateIndex
CREATE INDEX "notifications_commande_id_idx" ON "notifications"("commande_id");

-- CreateIndex
CREATE INDEX "messages_commande_id_cree_le_idx" ON "messages"("commande_id", "cree_le");

-- CreateIndex
CREATE INDEX "messages_destinataire_id_est_lu_idx" ON "messages"("destinataire_id", "est_lu");

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_admin_rdc_id_fkey" FOREIGN KEY ("admin_rdc_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_admin_chine_id_fkey" FOREIGN KEY ("admin_chine_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suivi_colis" ADD CONSTRAINT "suivi_colis_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suivi_colis" ADD CONSTRAINT "suivi_colis_declenche_par_fkey" FOREIGN KEY ("declenche_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_expediteur_id_fkey" FOREIGN KEY ("expediteur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_destinataire_id_fkey" FOREIGN KEY ("destinataire_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
