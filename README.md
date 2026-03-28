# FIJ — Fraternité Internationale de Jésus
### Plateforme de gestion de l'évangélisation

Application web multi-tenant pour gérer les activités d'évangélisation de cellules chrétiennes : suivi des âmes abordées, programmes de sorties, statistiques en temps réel et cartographie des villes touchées.

---

## Vue d'ensemble

FIJ permet à chaque cellule (organisation) de :
- **Enregistrer les rencontres** avec des personnes lors de sorties d'évangélisation
- **Suivre les résultats** : prière du salut, guérison, prière spontanée
- **Gérer les programmes** de sortie terrain (à venir, en cours, terminé)
- **Consulter un tableau de bord** avec KPIs et graphiques en temps réel
- **Visualiser une carte de France** indiquant la ville de la cellule et son activité
- **Gérer les membres** (évangélistes) de la cellule avec invitations par email ou QR code
- **Exporter des rapports** de l'annuaire des âmes filtrés par semaine ou groupe
- **Sessions longue durée** de 30 jours pour une utilisation terrain confortable

Chaque cellule est **totalement isolée** : une organisation ne voit jamais les données d'une autre.

---

## Architecture technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router) |
| Authentification | NextAuth v5 (credentials, JWT) |
| Base de données | PostgreSQL |
| ORM | Prisma v7 |
| UI | Tailwind CSS |
| Cartes | react-simple-maps |
| Graphiques | ApexCharts |
| QR Code | qrcode.react |
| Email | Nodemailer (SMTP Gmail) |
| Runtime | Node.js 22 |
| Conteneur | Docker + docker-compose |

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
│   ├── schema.prisma          # Modèles de données
│   └── migrations/            # Historique des migrations
├── src/
│   ├── app/
│   │   ├── (auth)/            # Pages connexion / inscription
│   │   │   ├── connexion/     # Login
│   │   │   └── inscription/   # Création de compte
│   │   ├── (dashboard)/       # Interface ADMIN
│   │   │   ├── (home)/        # Tableau de bord principal
│   │   │   ├── ames/          # Annuaire des âmes + export PDF
│   │   │   ├── equipe/        # Gestion des évangélistes + invitations QR
│   │   │   ├── programmes/    # Gestion des programmes
│   │   │   └── terrain/       # Enregistrer une rencontre (admin)
│   │   ├── evangeliste/       # Interface EVANGELISTE
│   │   │   ├── (home)/        # Dashboard évangéliste
│   │   │   ├── ames/          # Ses propres rencontres
│   │   │   ├── programmes/    # Programmes de sa cellule
│   │   │   └── terrain/       # Enregistrer une rencontre
│   │   ├── rejoindre/[token]/ # Page publique d'inscription via QR code
│   │   ├── invitation/[token]/ # Page d'activation de compte (email)
│   │   ├── mot-de-passe-oublie/ # Demande de réinitialisation
│   │   ├── reinitialisation/[token]/ # Nouveau mot de passe
│   │   ├── api/               # Routes API Next.js
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   └── notifications/ # Gestion des notifications
│   │   └── accueil/           # Landing page publique
│   ├── components/
│   │   ├── Charts/            # Graphiques ApexCharts
│   │   ├── Layouts/
│   │   │   ├── header/        # Barre de navigation
│   │   │   └── sidebar/       # Menu latéral
│   │   ├── Tables/            # Tableaux de données
│   │   └── AutoRefresh.tsx    # Polling temps réel (5s)
│   ├── lib/
│   │   ├── auth.ts            # Config NextAuth (JWT 30j, trustHost, useSecureCookies)
│   │   └── prisma.ts          # Client Prisma singleton
│   ├── actions/               # Server Actions Next.js
│   │   ├── equipe.actions.ts  # Invitations email, suppression évangéliste
│   │   ├── qr-invite.actions.ts # Génération token QR, inscription via QR
│   │   ├── invitation.actions.ts # Activation de compte
│   │   ├── profile.actions.ts # Mise à jour profil + changement mot de passe
│   │   └── reset-password.actions.ts # Mot de passe oublié
│   ├── services/              # Logique métier (charts, etc.)
│   ├── middleware.ts           # Protection des routes par rôle
│   └── types/                 # Types TypeScript globaux
├── public/
│   └── images/                # Assets statiques
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-entrypoint.sh
└── .env                       # Variables d'environnement (ne pas commiter)
```

---

## Modèle de données (Prisma)

### Entités principales

**Organization** — une cellule d'évangélisation
```
id, nom, ville, latitude, longitude
qrInviteToken (unique), qrInviteExpiry  ← invitation QR tournante
createdAt
```

**User** — membre d'une organisation
```
id, nom, email, password (hashé bcrypt), role, actif
organizationId
invitationToken, invitationExpiry       ← activation de compte par email
resetToken, resetExpiry                 ← réinitialisation mot de passe (1h)
```

**Rencontre** — une âme abordée lors d'une sortie
```
id, personneNom, personneVille, religion
priereSalut, guerison, priereSpontanee, besoinEglise
telephone, reseauxSociaux, notes
evangelisteId, organizationId, programmeId
groupeEquipe[]                          ← préservé si évangéliste supprimé
latitude, longitude, createdAt
```

**Programme** — une sortie terrain organisée
```
id, nom, description, date, statut (a_venir|en_cours|termine)
organizationId
```

**Notification** — alertes temps réel
```
id, type, message, lu, userId, organizationId, rencontreId
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
# Éditer .env avec vos valeurs

# 4. Initialiser la base de données
npx prisma db push
npx prisma generate

# 5. Lancer en développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

### Avec Docker

```bash
# Démarrer tous les services (app + PostgreSQL)
docker-compose up -d

# Voir les logs
docker-compose logs -f app

# Arrêter
docker-compose down
```

---

## Variables d'environnement

Créer un fichier `.env` à la racine (ne **jamais** le commiter) :

```env
# Base de données
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/evangile?schema=public"

# NextAuth
AUTH_SECRET="une-chaine-aleatoire-longue-et-secrete"
NEXTAUTH_URL="https://votre-domaine.com"   # ou tunnel Cloudflare en dev

# Email (Gmail SMTP recommandé)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-application
MAIL_FROM_ADDRESS=votre@gmail.com
MAIL_FROM_NAME="FIJ EVANGILE"
```

> **Note PostgreSQL** : si le mot de passe contient des caractères spéciaux (ex: `&`), les encoder en URL : `&` → `%26`

> **Note Gmail** : utiliser un "mot de passe d'application" Gmail (pas le mot de passe du compte). Activer la validation en 2 étapes puis générer le mot de passe dans les paramètres de sécurité Google.

> **Note Cloudflare** : en développement avec un tunnel Cloudflare (`cloudflared tunnel`), mettre l'URL du tunnel dans `NEXTAUTH_URL`. En production, mettre le vrai domaine.

---

## Fonctionnalités détaillées

### Tableau de bord (Admin)

- **KPI Cards** : total âmes, saluts, prières, guérisons pour la cellule
- **Graphique d'activité** : évolution semaine par semaine
- **Dernières rencontres** : tableau responsive (mobile/desktop)
- **Carte de France** : point sur la ville de la cellule, taille proportionnelle à l'activité
- **Répartition par religion** : graphique donut avec pourcentages au format `XX.X%`
- **Mise à jour temps réel** : `AutoRefresh` rafraîchit toutes les 5 secondes

### Annuaire des âmes + Reporting

- Liste paginée de toutes les rencontres avec filtres multiples :
  - Nom, ville, religion, statut (salut, guérison, prière), groupe, semaine
- **Statistiques dynamiques** : les KPIs de l'annuaire se mettent à jour en fonction des filtres actifs (stats filtrées, pas globales)
- **Export PDF** : bouton "Exporter" génère un rapport HTML mis en page, ouvrable dans le navigateur et imprimable/sauvegardable en PDF
  - Le rapport inclut les stats filtrées + la liste complète des âmes correspondantes
  - Fonctionne avec ou sans filtre actif

### Gestion de l'équipe

- Liste des évangélistes avec statistiques (âmes, saluts, dernière activité)
- **Badges de statut** :
  - `Actif` (vert) — compte activé
  - `Invitation en cours` (orange) — invitation envoyée, pas encore activée
  - `Suspendu` (rouge) — compte désactivé sans invitation en attente
- **Suppression sécurisée** : les rencontres de l'évangéliste supprimé sont réassignées à l'admin, son nom est conservé dans le champ `groupeEquipe` pour traçabilité
- **Invitation par email** : envoi d'un lien d'activation unique valable 48h
- **Invitation par QR code** : QR dynamique qui tourne automatiquement toutes les 30 secondes
  - Barre de progression avec décompte visuel
  - Rouge quand il reste ≤ 5 secondes
  - La personne scanne → formulaire simple (nom + email) → reçoit un email d'activation

### Invitation via QR code

1. L'admin ouvre la modal "Inviter" → onglet "QR Code"
2. Un QR est généré avec un token valable 35 secondes
3. Nouveau token automatiquement toutes les 30 secondes
4. La personne scanne avec son téléphone → page `/rejoindre/[token]`
5. Elle saisit son nom et email → compte créé (inactif) → email d'activation envoyé
6. Elle clique le lien dans l'email → choisit son mot de passe → compte activé

### Formulaire Terrain

- Recherche de ville avec autocomplétion (API geo.api.gouv.fr)
- Géolocalisation automatique de la ville sélectionnée
- Champs toujours visibles : Besoin d'église, Téléphone, Réseaux sociaux
- Bannière "Nouvelle âme sauvée — Gloire à Dieu!" si prière du salut acceptée

### Programmes

- Création de sorties terrain avec date et description
- Statuts : À venir → En cours → Terminé
- Ordre d'affichage : En cours d'abord, puis À venir, puis Terminé
- Association de rencontres à un programme

### Notifications

- Notification en temps réel quand une prière du salut est enregistrée
- Cloche dans la barre de navigation avec badge rouge
- Marquage comme lu au clic

### Profil utilisateur

- Accessible depuis le menu avatar (admin → `/profile`, évangéliste → `/evangeliste/profil`)
- Modification du nom d'affichage
- Changement de mot de passe avec indicateur de force
- Stats personnelles : âmes rencontrées, saluts, guérisons

### Mot de passe oublié

Flow complet accessible depuis la page de connexion :
1. L'utilisateur clique "Mot de passe oublié ?" → saisit son email
2. Il reçoit un lien par email valable **1 heure**
3. Il clique le lien → page identique à l'activation de compte → choisit un nouveau mot de passe
4. Redirigé automatiquement vers la connexion

Fonctionne pour admins et évangélistes. Pour sécurité, le message de confirmation ne révèle pas si l'email existe en base.

### Sessions longue durée + renouvellement automatique

- JWT valable **30 jours** — l'utilisateur reste connecté même s'il ferme le navigateur ou redémarre son téléphone
- **Renouvellement silencieux** : si l'utilisateur est actif depuis plus de 15 jours, le token est automatiquement prolongé de 30 jours supplémentaires → session quasi-permanente pour un usage régulier
- Compatible tous navigateurs, tous onglets

### PWA — Installation sur l'écran d'accueil

L'application est une Progressive Web App installable sur mobile :

**Installation automatique (Android/Chrome)** :
- Une bannière discrète apparaît en bas d'écran quand Chrome détecte un usage régulier
- Bouton "Installer" → l'icône FIJ Save Souls apparaît sur l'écran d'accueil
- Bouton "Plus tard" → la bannière ne réapparaît pas avant 7 jours

**Installation manuelle (tous navigateurs)** :
- Chrome Android : 3 points en haut à droite → "Ajouter à l'écran d'accueil"
- Safari iOS : icône Partager → "Sur l'écran d'accueil"
- Chrome Desktop : icône d'installation dans la barre d'adresse

**Une fois installée** :
- S'ouvre en plein écran sans barre de navigateur (comme une vraie app)
- Session des 30 jours préservée
- Couleurs FIJ (`#5750F1`) dans la barre de statut iOS/Android

---

## Isolation multi-tenant

Chaque requête Prisma filtre **obligatoirement** par `organizationId` récupéré depuis la session NextAuth :

```typescript
const session = await auth();
const orgId = session?.user?.organizationId;

const rencontres = await prisma.rencontre.findMany({
  where: { organizationId: orgId }, // isolation garantie
});
```

La vérification se fait aussi côté middleware (`src/middleware.ts`) pour protéger les routes.

---

## Performance

### Index PostgreSQL

Tous les index critiques sont définis dans `schema.prisma` :
- `User`: `organizationId`, `email`
- `Rencontre`: `organizationId`, `evangelisteId`, `(organizationId, createdAt DESC)`, `programmeId`
- `Programme`: `organizationId`, `statut`

### Mise en cache Next.js

Les pages de données utilisent `export const dynamic = "force-dynamic"` pour désactiver le cache statique et garantir des données fraîches à chaque requête.

---

## Déploiement en production

### Variables supplémentaires

```env
NODE_ENV="production"
NEXTAUTH_URL="https://votre-domaine.com"
AUTH_SECRET="secret-production-long-et-aleatoire"
```

> La valeur de `NEXTAUTH_URL` est utilisée automatiquement par :
> - NextAuth pour les cookies et redirections
> - Nodemailer pour les liens dans les emails d'invitation
> - Le système QR code pour les liens de scan
>
> Il suffit de changer cette variable pour passer de dev (Cloudflare tunnel) à production (vrai domaine).

### Docker production

```bash
docker-compose up -d --build
```

Le `docker-entrypoint.sh` exécute automatiquement `prisma db push` au démarrage pour appliquer les migrations.

---

## Commandes utiles

```bash
# Développement
npm run dev                    # Lancer en dev (port 3000)
npm run build                  # Build de production
npm run lint                   # Vérifier le code

# Base de données
npx prisma studio              # Interface graphique Prisma Studio
npx prisma db push             # Appliquer le schéma sans migration
npx prisma generate            # Regénérer le client Prisma

# Docker
docker-compose up -d           # Démarrer les services
docker-compose logs -f app     # Logs de l'app
docker-compose down            # Arrêter les services
docker system prune -a         # Nettoyer les images/volumes inutilisés

# Prisma Studio sur la DB Docker
# PowerShell:
$env:DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/evangile?schema=public"; npx prisma studio
```

---

## Contribuer

1. Créer une branche : `git checkout -b feature/nom-feature`
2. Commiter les changements : `git commit -m "feat: description"`
3. Pousser : `git push origin feature/nom-feature`
4. Ouvrir une Pull Request

### Conventions de commits

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `refactor:` refactorisation sans changement fonctionnel
- `docs:` documentation
- `chore:` maintenance (deps, config)

---

## Sécurité

- Mots de passe hashés avec bcrypt (coût 10)
- Sessions JWT signées (NextAuth v5), durée 30 jours
- `useSecureCookies: true` en HTTPS (Cloudflare, production)
- `trustHost: true` pour compatibilité proxy/tunnel
- Isolation stricte par `organizationId` sur toutes les requêtes
- Middleware de protection des routes par rôle
- Tokens d'invitation à usage unique avec expiration (48h)
- Tokens QR rotatifs avec expiration courte (35 secondes)
- Variables sensibles en `.env` (jamais commitées)

---

## Support

Pour toute question ou problème, ouvrir une issue sur le dépôt Git du projet.
