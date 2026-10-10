# Plateforme de Suivi de Colis RDC — Chine

Plateforme logistique complète en 3 applications : API Node.js, client mobile Expo, console d'administration React.

## Structure

```
backend/        API Node.js + Express + TypeScript + Prisma + PostgreSQL + Socket.IO
mobile-client/  Application client React Native + Expo (10 fichiers)
web-admin/      Console d'administration React + Vite (10 fichiers)
```

## Comptes de démonstration (créés par le seed)

| Rôle        | Email                     | Mot de passe   |
| ----------- | ------------------------- | -------------- |
| Admin RDC   | admin.rdc@collisrdc.cd    | AdminRdc!2024  |
| Admin Chine | admin.chine@collisrdc.cd  | AdminChine!2024|
| Client      | client.test@collisrdc.cd  | Client!2024    |

## 1. Backend

Prérequis : Node.js 20+, PostgreSQL 14+.

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

L'API démarre sur `http://localhost:3000`. Health check : `GET /api/health`.

Base de données à créer avant la migration :

```sql
CREATE USER colis WITH PASSWORD 'colis' CREATEDB;
CREATE DATABASE colis_rdc OWNER colis;
```

Vérifications :

```bash
npm run typecheck
npm run test
npm run build && npm start
```

Variables notables du `.env` :

| Variable                  | Rôle                                                      |
| ------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`            | Connexion PostgreSQL                                      |
| `JWT_ACCESS_SECRET`       | Secret JWT accès (32 caractères min), durée `JWT_ACCESS_EXPIRES` (15m) |
| `JWT_REFRESH_SECRET`      | Secret JWT rafraîchissement (7j)                          |
| `BCRYPT_SALT_ROUNDS`      | Coût bcrypt (12 minimum)                                  |
| `CORS_ORIGINS`            | Origines autorisées (web admin, Expo web)                 |
| `SIMULATION_INTERVAL_MS`  | Période d'avancement automatique du vol (étape EN_TRANSIT)|
| `FCM_SERVICE_ACCOUNT_JSON`| JSON du compte de service Firebase (push FCM, vide = désactivé) |
| `SERVICE_FEE_*`, `DELIVERY_FEE_*` | Tarification des frais                            |

## 2. Web Admin

```bash
cd web-admin
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev
```

Console sur `http://localhost:5173`. Connexion avec un compte Admin RDC ou Admin Chine (les comptes CLIENT y sont refusés). `CORS_ORIGINS` du backend doit contenir `http://localhost:5173`.

## 3. Mobile Client

```bash
cd mobile-client
npm install
npx expo start
```

- L'URL de l'API est configurée dans `app.json` → `expo.extra.apiUrl` (`http://localhost:3000` par défaut).
- Émulateur Android : remplacer par `http://10.0.2.2:3000`.
- Appareil physique : utiliser l'adresse LAN de la machine (ex: `http://192.168.1.50:3000`).
- Après modification des versions : `npx expo install --fix`.

## 4. Tester l'application mobile dans un navigateur (web)

Le code mobile reste 100 % natif Expo ; seuls trois modules à API natives sont séparés par plateforme :

| Module | Natif | Web |
|---|---|---|
| `stockageDurable` | `expo-secure-store` | `localStorage` (repli mémoire si accès refusé) |
| `notificationsAppareil` | `expo-notifications` | no-op |
| `CarteColis` | `react-native-maps` | carte SVG stylisée du parcours Guangzhou → Kinshasa |

Démarrage en mode web (l'API doit tourner sur le port 3000) :

```bash
cd mobile-client
npm install
npx expo start --web --port 8082 --host lan
node serveur-preview.js
```

`serveur-preview.js` écoute sur le port 8081 et route `/api` et `/socket.io` vers l'API (port 3000), le reste vers Metro (port 8082) : l'application web appelle ainsi l'API en même origine, sans configuration CORS. En local (`localhost`), `api.js` déduit automatiquement `http://localhost:3000`. Sur mobile natif, l'URL vient de `extra.apiUrl` dans `app.json`.

## Flux métier (10 étapes)


```
1  COMMANDE_CREEE        Client crée            Kinshasa
2  COMMANDE_VALIDEE_RDC  Admin RDC valide       Kinshasa
3  TRANSMISE_CHINE       Admin RDC transmet     Digital
4  ACCEPTEE_CHINE        Admin Chine accepte    Guangzhou
5  COLIS_PREPARE         Admin Chine prépare    Guangzhou
6  EXPEDIE_CHINE         Admin Chine expédie    Aéroport Baiyun
7  EN_TRANSIT            Système (vol simulé)   Vol international
8  ARRIVE_RDC            Admin RDC confirme     Aéroport N'djili
9  EN_LIVRAISON          Admin RDC lance        Kinshasa
10 LIVRE                 Admin RDC confirme     Adresse client
```

À chaque transition : écriture `suivi_colis`, notification en base, émission Socket.IO (`order:updated`, `tracking:updated`, `notification:new`) et push FCM si configuré. Pendant l'étape `EN_TRANSIT`, un service de simulation déplace automatiquement la position du colis le long de la route aérienne (Asie du Sud-Est, Océan Indien, Corne de l'Afrique, Afrique de l'Est, Approche RDC) puis déclenche une alerte d'approche vers le client et les admins RDC.

## API

```
POST   /api/auth/register            POST /api/auth/login
POST   /api/auth/refresh             GET  /api/auth/profile
PUT    /api/auth/fcm-token

POST   /api/commandes                GET  /api/commandes
GET    /api/commandes/:id            PUT  /api/commandes/:id
DELETE /api/commandes/:id            GET  /api/commandes/tracking/:code

GET    /api/suivi/:commandeId        POST /api/suivi/:commandeId/etape

GET    /api/admin-rdc/commandes
PUT    /api/admin-rdc/commandes/:id/{valider|transmettre|arrivee|livraison|livrer}

GET    /api/admin-chine/commandes
PUT    /api/admin-chine/commandes/:id/{accepter|preparer|expedier|transit}

GET    /api/notifications            PUT  /api/notifications/:id/lu
PUT    /api/notifications/lire-tout

GET    /api/messages/:commandeId     POST /api/messages/:commandeId

GET    /api/dashboard/stats          GET  /api/dashboard/commandes/recentes
GET    /api/health
```

Événements Socket.IO : `order:updated`, `tracking:updated`, `notification:new`, `message:new` (serveur) ; `join:order`, `leave:order`, `message:send` (client). Authentification par jeton JWT dans `auth.jeton`.

## Sécurité

JWT accès 15 min + rafraîchissement 7 j, bcrypt coût 12, Helmet, CORS strict, rate limiting par IP (globale + auth) et par utilisateur (écritures), validation Zod sur chaque entrée, requêtes paramétrées via Prisma, guards de rôle sur toutes les routes admin, journal d'audit structuré des actions admin, request-id propagé dans les logs.
