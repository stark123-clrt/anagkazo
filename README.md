# Anagkazo — Plateforme de gestion de l'évangélisation

Application web multi-tenant pour gérer les activités d'évangélisation de cellules chrétiennes : suivi des âmes abordées, programmes de sorties, statistiques en temps réel, notifications push et cartographie des villes touchées.

---

## Vue d'ensemble

Anagkazo permet à chaque cellule (organisation) de :
- **Enregistrer les rencontres** avec des personnes lors de sorties d'évangélisation
- **Suivre les résultats** : prière du salut, guérison, prière spontanée
- **Gérer les programmes** de sortie terrain (à venir, en cours, terminé)
- **Consulter un tableau de bord** avec KPIs et graphiques en temps réel
- **Visualiser une carte de France** indiquant la ville de la cellule et son activité
- **Gérer les membres** (évangélistes) de la cellule avec invitations par email ou QR code
- **Recevoir des notifications push** même quand l'app est fermée
- **Sessions longue durée** de 30 jours pour une utilisation terrain confortable

Chaque cellule est **totalement isolée** : une organisation ne voit jamais les données d'une autre.

---

## Architecture technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router) |
| Authentification | NextAuth v5 (credentials, JWT) |
| Base de données | PostgreSQL |
| ORM | Prisma v7 (avec adapteur PrismaPg) |
| UI | Tailwind CSS |
| Cartes | react-simple-maps |
| Graphiques | ApexCharts |
| QR Code | qrcode.react |
| Email | Nodemailer (SMTP) |
| Notifications Push | web-push + Web Push API + Service Worker |
| Runtime | Node.js 22 |
| Conteneur | Docker + docker compose (v2) |

> **Important Docker** : utiliser `docker compose` (v2, sans tiret) et non `docker-compose` (v1). La v1 a un bug `ContainerConfig` connu.

### Structure des rôles

```
SUPER_ADMIN   → accès global, gestion de toutes les organisations
ADMIN         → gestionnaire d'une cellule (tableau de bord complet)
EVANGELISTE   → membre d'une cellule (interface simplifiée)
```

---

## Structure du projet

```
nextjs-admin-dashboard/
├── prisma/
│   └── schema.prisma              # Modèles de données
├── public/
│   └── sw.js                      # Service Worker (notifications push)
├── scripts/
│   ├── create-super-admin.mjs     # Créer le premier SUPER_ADMIN
│   └── reset-db.mjs               # Réinitialiser la base de données
├── src/
│   ├── app/
│   │   ├── (auth)/                # Pages publiques
│   │   │   ├── accueil/           # Landing page
│   │   │   ├── connexion/         # Login
│   │   │   ├── inscription/       # Création de compte admin (code d'invitation)
│   │   │   ├── verifier-email/[token]/  # Confirmation email admin
│   │   │   ├── invitation/[token]/      # Activation compte évangéliste
│   │   │   ├── rejoindre/[token]/       # Inscription via QR code
│   │   │   ├── mot-de-passe-oublie/     # Demande réinitialisation
│   │   │   └── reinitialisation/[token]/ # Nouveau mot de passe
│   │   ├── (dashboard)/           # Interface ADMIN
│   │   │   ├── (home)/            # Tableau de bord principal
│   │   │   ├── ames/              # Annuaire des âmes + filtres + export PDF
│   │   │   ├── equipe/            # Gestion des évangélistes + invitations
│   │   │   ├── programmes/        # Gestion des programmes
│   │   │   ├── parametres/        # Notifications, profil
│   │   │   └── terrain/           # Enregistrer une rencontre (admin)
│   │   ├── evangeliste/           # Interface EVANGELISTE
│   │   │   ├── page.tsx           # Dashboard évangéliste (stats + graphique)
│   │   │   ├── ames/              # Ses propres rencontres
│   │   │   ├── programmes/        # Programmes de sa cellule
│   │   │   └── terrain/           # Enregistrer une rencontre
│   │   └── super-admin/           # Interface SUPER_ADMIN
│   ├── actions/                   # Server Actions Next.js
│   │   ├── auth.actions.ts        # Inscription admin + vérification email
│   │   ├── push.actions.ts        # Abonnement + envoi notifications push
│   │   ├── invitation-admin.actions.ts  # Codes d'invitation SUPER_ADMIN
│   │   ├── equipe.actions.ts      # Invitations évangélistes
│   │   ├── qr-invite.actions.ts   # Génération QR + inscription
│   │   ├── rencontre.actions.ts   # Enregistrement rencontres
│   │   ├── programme.actions.ts   # Gestion programmes + sync statuts
│   │   └── reset-password.actions.ts   # Mot de passe oublié
│   ├── components/
│   │   ├── PushNotifications.tsx  # Composant demande permission push
│   │   ├── InstallPWA.tsx         # Bannière installation PWA
│   │   └── AutoRefresh.tsx        # Polling temps réel (5s)
│   ├── lib/
│   │   ├── auth.ts                # Config NextAuth (JWT 30j)
│   │   ├── prisma.ts              # Client Prisma singleton (PrismaPg adapter)
│   │   └── webpush.ts             # Config web-push VAPID
│   └── middleware.ts              # Protection des routes par rôle
└── .env                           # Variables d'environnement (ne pas commiter)
```

---

## Modèle de données (Prisma)

### Entités principales

**Organization** — une cellule d'évangélisation
```
id, nom, ville, latitude, longitude
qrInviteToken, qrInviteExpiry     ← invitation QR tournante
createdAt
```

**User** — membre d'une organisation
```
id, nom, email, password (hashé bcrypt), role, actif
organizationId
invitationToken, invitationExpiry       ← activation compte évangéliste (48h)
resetToken, resetExpiry                 ← réinitialisation mot de passe (1h)
emailVerifToken, emailVerifExpiry       ← vérification email admin (24h)
emailVerified                           ← email confirmé ou non
notifVuAt                               ← dernière lecture des notifications
```

**Rencontre** — une âme abordée lors d'une sortie
```
id, personneNom, personneVille, religion
priereSalut, guerison, priereSpontanee, besoinEglise
contact, suivi, notes
evangelisteId, organizationId, programmeId
groupeEquipe, createdAt
```

**Programme** — une sortie terrain organisée
```
id, titre, description, date, statut (a_venir|en_cours|termine)
repartitionGroupes (JSON)         ← [{groupe: 1, membres: [userId, ...]}]
organizationId
```

**PushSubscription** — abonnements notifications push
```
id, endpoint, p256dh, auth
userId, createdAt
```

**InvitationAdmin** — codes d'invitation générés par le SUPER_ADMIN
```
id, code, expiresAt, usedAt
createdAt
```

---

## Démarrage rapide

### Prérequis

- Node.js 22+
- PostgreSQL (local ou via Docker)
- Git

### Installation locale

```bash
# 1. Cloner le dépôt
git clone <repo-url>
cd nextjs-admin-dashboard

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs (voir section Variables d'environnement)

# 4. Appliquer le schéma Prisma
npx prisma db push
npx prisma generate

# 5. Créer le premier SUPER_ADMIN
node scripts/create-super-admin.mjs

# 6. Lancer en développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

### Avec Docker (production VPS)

```bash
# Démarrer tous les services (app + PostgreSQL)
docker compose up -d --build

# Voir les logs
docker compose logs -f app

# Arrêter
docker compose down
```

> Le `docker-entrypoint.sh` exécute automatiquement `prisma db push` + `prisma generate` au démarrage.

---

## Variables d'environnement

Créer un fichier `.env` à la racine (ne **jamais** le commiter) :

```env
# ─── Base de données ───────────────────────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/evangile?schema=public"

# Si le mot de passe contient & → encoder en %26
# Exemple local : postgresql://postgres:Meli123christ%26@localhost:5433/evangile?schema=public
# Exemple Docker VPS : postgresql://postgres:PASSWORD@db:5432/evangile?schema=public

# ─── NextAuth ──────────────────────────────────────────────────────────────────
AUTH_SECRET="une-chaine-aleatoire-longue-et-secrete"
NEXTAUTH_URL="https://votre-domaine.com"
# En développement avec tunnel Cloudflare : NEXTAUTH_URL="https://xxx.trycloudflare.com"

# ─── Email SMTP ────────────────────────────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-application-gmail
MAIL_FROM_ADDRESS=votre@gmail.com
MAIL_FROM_NAME="Anagkazo"

# ─── Notifications Push PWA (VAPID) ───────────────────────────────────────────
VAPID_PUBLIC_KEY=votre-cle-publique-vapid
VAPID_PRIVATE_KEY=votre-cle-privee-vapid
VAPID_SUBJECT=mailto:votre@email.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=votre-cle-publique-vapid
# Note : VAPID_PUBLIC_KEY et NEXT_PUBLIC_VAPID_PUBLIC_KEY ont la même valeur

# ─── Production uniquement ─────────────────────────────────────────────────────
NODE_ENV="production"
```

### Générer les clés VAPID (une seule fois)

```bash
npx web-push generate-vapid-keys
```

Copier les deux clés générées dans `.env` :
- `BH2uZ...` → `VAPID_PUBLIC_KEY` ET `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `A3zOB...` → `VAPID_PRIVATE_KEY`

> **Les clés VAPID ne changent jamais** une fois générées. Si vous les changez, tous les abonnements push existants en base seront invalides.

### Notes importantes

> **Gmail** : ne pas utiliser le mot de passe du compte Gmail. Aller dans Paramètres Google → Sécurité → Validation en 2 étapes (activer) → Mots de passe d'application → créer un mot de passe pour "Mail". C'est ce mot de passe à mettre dans `MAIL_PASSWORD`.

> **Caractères spéciaux dans le mot de passe PostgreSQL** : le `&` doit être encodé `%26` dans l'URL. Exemple : `Mon&Pass` → `Mon%26Pass`.

> **Docker VPS** : dans `docker-compose.yml`, le service app accède à PostgreSQL via le hostname `db` (pas `localhost`). En local, utiliser `localhost:5433` (port mappé).

> **NEXTAUTH_URL** : cette variable est utilisée par NextAuth pour les cookies/redirections, par Nodemailer pour les liens dans les emails (invitation, vérification, réinitialisation), et par le système QR code. Il suffit de la changer pour passer du dev au prod.

---

## Fonctionnalités détaillées

### Inscription admin et vérification email

Flux complet pour créer un espace cellule :

1. L'admin se rend sur `/inscription`
2. Il saisit son nom, sa ville (autocomplétion API geo.gouv.fr), le nom du groupe
3. Il saisit son email, son mot de passe et le **code d'invitation** fourni par le SUPER_ADMIN
4. Le compte est créé avec `actif: false`
5. **Un email de confirmation est envoyé automatiquement** avec un lien valable 24h
6. L'admin clique le lien → page `/verifier-email/[token]` → compte activé (`actif: true`)
7. Il peut maintenant se connecter

> **Pourquoi la vérification email ?** Sans elle, un admin pourrait s'inscrire avec une fausse adresse email et perdre l'accès à la récupération de mot de passe.

### Tableau de bord Admin

- **KPI Cards** : total âmes, saluts, prières, guérisons pour la cellule
- **Graphique d'activité** : évolution semaine par semaine
- **Dernières rencontres** : tableau responsive (mobile/desktop)
- **Carte de France** : point sur la ville de la cellule, taille proportionnelle à l'activité
- **Répartition par religion** : graphique donut
- **Mise à jour temps réel** : `AutoRefresh` rafraîchit toutes les 5 secondes

### Tableau de bord Évangéliste

- **4 KPI cards** avec couleurs distinctes :
  - Bleu (`#5750F1`) → Âmes abordées
  - Vert → Prières du Salut
  - Violet (`#8155FF`) → Prières spontanées
  - Orange (`#FF9C55`) → Guérisons
- **Badge "ce mois"** sur chaque stat : `+X en avril` (mois en cours)
- **Graphique d'activité 30 jours** : une barre par jour, hauteur proportionnelle au nombre de rencontres de l'organisation ce jour-là. Compteur total + combien par lui-même.
- **Dernières 5 rencontres** avec badges colorés selon le type
- **CTA "Nouvelle rencontre"** bien visible

### Annuaire des âmes (Admin)

- Liste de toutes les rencontres de la cellule avec filtres multiples :
  - Nom/ville (recherche texte)
  - Religion
  - Statut (salut, guérison, prière spontanée)
  - Évangéliste
  - Groupe de programme
  - **Programme** (filtre par programme — affiche uniquement ceux ayant au moins une âme)
- **Statistiques dynamiques** : les KPIs se mettent à jour selon les filtres actifs
- **Export PDF** : rapport HTML imprimable avec stats + liste filtrée

### Annuaire des âmes (Évangéliste)

- Affiche uniquement **ses propres rencontres** (`evangelisteId` filtré)
- Mêmes filtres que la version admin (sans filtre évangéliste)

### Gestion de l'équipe

- Liste des évangélistes avec statistiques et badges de statut
- **Invitation par email** : lien d'activation unique valable 48h
- **Invitation par QR code** : QR dynamique qui tourne toutes les 30 secondes
  - La personne scanne → formulaire nom + email → email d'activation envoyé
- **Suppression sécurisée** : rencontres réassignées à l'admin, nom conservé dans `groupeEquipe`

### Programmes

- Création avec date, description, répartition en groupes avec membres
- Statuts : À venir → En cours → Terminé
- Statistiques par programme : nombre de rencontres, âmes par groupe
- **Sync automatique des statuts** : un cron ou appel vérifie les dates et met à jour les statuts

### Notifications in-app (cloche)

- Badge rouge dans la barre de navigation
- Notifications pour : salut, guérison, rencontre enregistrée
- Marquage comme lu au clic

### Notifications Push PWA (hors app)

Système de notifications push basé sur **Web Push API** + **Service Worker** — les notifications arrivent même quand l'app est fermée.

**Technologies :**
- `web-push` (npm) pour l'envoi serveur avec authentification VAPID
- Service Worker (`public/sw.js`) pour la réception en arrière-plan
- Table `PushSubscription` en DB pour stocker les abonnements par utilisateur
- Composant `PushNotifications.tsx` inclus dans les layouts admin ET évangéliste

**Événements déclencheurs :**

| Événement | Destinataires | Message |
|-----------|--------------|---------|
| Prière du salut enregistrée | Admins de l'org | "🙏 Prière du salut !" |
| Guérison enregistrée | Admins de l'org | "✨ Guérison enregistrée !" |
| Rencontre enregistrée (contact) | Admins de l'org | "📋 Nouvelle rencontre enregistrée" |
| Évangéliste rejoint via QR | Admins de l'org | "👤 Nouvel évangéliste via QR !" |
| Évangéliste active son compte | Admins de l'org | "👤 Nouvel évangéliste actif !" |
| Ajouté à un programme | Évangéliste concerné | "📅 Nouvelle sortie programmée !" |
| Programme passe En cours | Membres du programme | "🚀 La sortie terrain commence !" |
| Programme passe Terminé | Tous les évangélistes de l'org | "✅ Sortie terminée — merci !" |

**Compatibilité :**
- ✅ Android Chrome — fonctionne sans installation
- ✅ PC Chrome / Edge — fonctionne sans installation
- ⚠️ iPhone Safari — nécessite l'app installée sur l'écran d'accueil (iOS 16.4+)

**Variables d'environnement requises :**
```env
VAPID_PUBLIC_KEY=BH2uZDpgQX4wr8...       # clé publique
VAPID_PRIVATE_KEY=A3zOB7jxgJe0...        # clé privée
VAPID_SUBJECT=mailto:votre@email.com      # email de contact
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BH2uZDpgQX4wr8...  # même valeur que VAPID_PUBLIC_KEY
```

**Générer les clés (une seule fois pour le projet) :**
```bash
npx web-push generate-vapid-keys
```

### Mot de passe oublié

1. Clic "Mot de passe oublié ?" → saisit son email
2. Lien envoyé par email valable **1 heure**
3. Clic lien → choisit un nouveau mot de passe
4. Redirigé vers la connexion

Pour sécurité, le message ne révèle pas si l'email existe en base.

### PWA — Installation sur l'écran d'accueil

**Android / Chrome** : bannière automatique ou 3 points → "Ajouter à l'écran d'accueil"

**iPhone / Safari** : icône Partager → "Sur l'écran d'accueil" (iOS 16.4+ pour les push)

**Desktop Chrome** : icône d'installation dans la barre d'adresse

Une fois installée : plein écran, session préservée, push notifications actives.

---

## Scripts utilitaires

### Créer le SUPER_ADMIN

```bash
node scripts/create-super-admin.mjs
```

Ce script :
- Crée l'organisation (si elle n'existe pas)
- Crée l'utilisateur SUPER_ADMIN avec `actif: true` et `emailVerified: true`
- Utilise `upsert` (pas d'erreur si relancé)

Modifier les valeurs dans le script avant de lancer si besoin.

### Réinitialiser la base de données

```bash
node scripts/reset-db.mjs
```

> **Attention** : supprime toutes les données dans l'ordre (rencontres → programmes → invitations → users → organizations). Irréversible.

---

## Isolation multi-tenant

Chaque requête Prisma filtre **obligatoirement** par `organizationId` récupéré depuis la session :

```typescript
const session = await auth();
const orgId = session?.user?.organizationId;

const rencontres = await prisma.rencontre.findMany({
  where: { organizationId: orgId }, // isolation garantie
});
```

---

## Index PostgreSQL

Définis dans `schema.prisma` pour les performances :
- `User` : `organizationId`, `email`
- `Rencontre` : `organizationId`, `evangelisteId`, `(organizationId, createdAt)`, `programmeId`
- `Programme` : `organizationId`, `statut`
- `PushSubscription` : `userId`

---

## Déploiement VPS avec Docker

### 1. Préparer le `.env` sur le serveur

```env
DATABASE_URL="postgresql://postgres:VOTRE_PASSWORD@db:5432/evangile?schema=public"
AUTH_SECRET="secret-tres-long-et-aleatoire"
NEXTAUTH_URL="https://votre-domaine.com"

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre@gmail.com
MAIL_PASSWORD=mot-de-passe-application-gmail
MAIL_FROM_ADDRESS=votre@gmail.com
MAIL_FROM_NAME="Anagkazo"

VAPID_PUBLIC_KEY=votre-cle-publique
VAPID_PRIVATE_KEY=votre-cle-privee
VAPID_SUBJECT=mailto:votre@email.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=votre-cle-publique

NODE_ENV=production
```

### 2. Lancer

```bash
docker compose up -d --build
docker compose logs -f app
```

### 3. Créer le SUPER_ADMIN (première fois)

```bash
docker compose exec app node scripts/create-super-admin.mjs
```

Ou depuis le host si Node est installé (avec la bonne `DATABASE_URL` pointant vers `localhost:PORT_MAPPE`).

---

## Commandes utiles

```bash
# Développement local
npm run dev                        # Lancer (port 3000)
npm run build                      # Build production
npm run lint                       # Vérifier le code

# Base de données
npx prisma db push                 # Appliquer le schéma
npx prisma generate                # Regénérer le client Prisma
npx prisma studio                  # Interface graphique

# Docker (utiliser docker compose sans tiret — v2)
docker compose up -d --build       # Démarrer + rebuild
docker compose logs -f app         # Logs en temps réel
docker compose down                # Arrêter
docker compose exec app sh         # Shell dans le conteneur
docker system prune -a             # Nettoyer images/volumes

# Générer clés VAPID (une seule fois)
npx web-push generate-vapid-keys
```

---

## Sécurité

- Mots de passe hashés avec bcrypt (coût 10)
- Sessions JWT signées (NextAuth v5), durée 30 jours avec renouvellement automatique
- `useSecureCookies: true` en HTTPS
- `trustHost: true` pour compatibilité proxy/Cloudflare
- Isolation stricte par `organizationId` sur toutes les requêtes
- Middleware de protection des routes par rôle
- **Vérification email obligatoire** pour les admins (lien 24h)
- Tokens d'invitation évangéliste à usage unique (48h)
- Tokens QR rotatifs (35 secondes)
- Tokens reset mot de passe à usage unique (1h)
- Clés VAPID pour authentifier les push notifications
- Variables sensibles uniquement dans `.env` (jamais commitées)
