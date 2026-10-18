# Pixel & Co — Veille Technologique Automatisée

Outil de veille quotidienne conçu pour **Pixel & Co**, agence web composée d'une équipe de développeurs travaillant sur les technologies WordPress, Next.js et React.

---

## 1. Profil client

| Champ | Valeur |
|---|---|
| **Agence** | Pixel & Co |
| **Activité** | Agence web spécialisée WordPress et Next.js |
| **Stack** | WordPress, Next.js, React, PHP, TypeScript, Tailwind CSS |
| **Priorités** | Sécurité WordPress · Nouvelles versions Next.js/React · Tendances web · Performance web |

Ce profil est injecté dans chaque prompt IA pour contextualiser la notation des articles.

---

## 2. Sources

L'outil surveille **6 sources** réparties en 3 catégories :

| Source | URL | Catégorie |
|---|---|---|
| Hacker News | `https://news.ycombinator.com/rss` | Tendances |
| web.dev | `https://web.dev/feed.xml` | Tendances |
| Wordfence | `https://www.wordfence.com/blog/feed/` | Sécurité |
| CVE Feed | `https://cvefeed.io/rss.xml` | Sécurité |
| Next.js Releases | `https://github.com/vercel/next.js/releases.atom` | Versions |
| React Releases | `https://github.com/facebook/react/releases.atom` | Versions |

- **Tendances** : flux RSS de blogs tech généralistes
- **Sécurité** : alertes vulnérabilités et sécurité WordPress
- **Versions** : flux Atom des releases GitHub des dépendances clés

---

## 3. Choix techniques

Application web full-stack (Next.js + PostgreSQL) avec scoring IA via Groq (`openai/gpt-oss-120b`, gratuit) et fallback Gemini, orchestrée par une tâche planifiée Abacus qui exécute le pipeline chaque matin à 7 h 00.
Cette architecture combine gratuité des APIs IA, robustesse du stockage relationnel et automatisation sans serveur dédié.

---

## 4. Moteur de tri

Chaque article collecté passe par le pipeline suivant :

1. **Collecte** — Les flux RSS/Atom des sources actives sont parsés (`lib/feed-parser.ts`). Les articles déjà présents sont ignorés grâce à une contrainte d'unicité sur l'URL (déduplication).
2. **Scoring IA** — Le titre et la description de chaque article non noté sont envoyés à l'IA avec le profil de l'agence (stack + priorités). L'IA répond **uniquement** en JSON :
   ```json
   { "score": 7, "categorie": "sécurité" }
   ```
   - `score` : nombre entier de **0** (sans intérêt) à **10** (critique).
   - `categorie` : une des 3 valeurs exactes — `tendances`, `sécurité`, `versions`.
   - La réponse est nettoyée (suppression des backticks markdown) puis validée. En cas d'échec (après 1 nouvel essai, puis bascule sur Gemini), **aucune note n'est inventée** : l'article reste « non noté », une erreur est inscrite au Journal, et il sera re-noté au prochain passage.
3. **Digest** — Les articles scorés des dernières 24 h sont groupés par catégorie. Pour chaque catégorie, les **3 meilleurs** (score le plus élevé) sont retenus. Un **article surprise** 🎲 est tiré au hasard parmi les articles restants.

---

## 5. Variables d'environnement

Les clés API ne sont **jamais** écrites en dur dans le code. Elles sont stockées dans un fichier `.env` à la racine du projet (exclu du versionnement par `.gitignore`).

| Variable | Description | Où l'obtenir |
|---|---|---|
| `GROQ_API_KEY` | Clé API Groq (moteur principal) | [console.groq.com/keys](https://console.groq.com/keys) |
| `GEMINI_API_KEY` | Clé API Google Gemini (fallback) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `DATABASE_URL` | URL de connexion PostgreSQL | Fournie par la plateforme d'hébergement |
| `NEXTAUTH_URL` | URL publique du site | `http://localhost:3000` en local |

Un modèle est fourni : copiez `.env.example` en `.env` puis remplissez-le.

### Installation locale

```bash
git clone https://github.com/ColonelFrere/pixel-co-veille.git
cd pixel-co-veille
cp .env.example .env      # puis remplir les valeurs
npm install               # génère aussi le client Prisma
npm run db:push           # crée les tables
npm run db:seed           # ajoute les 6 sources et le profil
npm run dev               # http://localhost:3000
```

### Mise en ligne (Vercel + Neon)

1. Créez une base PostgreSQL gratuite sur [neon.tech](https://neon.tech) et copiez son URL de connexion.
2. Sur [vercel.com](https://vercel.com), connectez-vous avec GitHub → **Add New → Project** → importez `pixel-co-veille`.
3. Dans **Environment Variables**, ajoutez `DATABASE_URL`, `GROQ_API_KEY`, `GEMINI_API_KEY`.
4. Cliquez **Deploy**. Depuis votre PC, créez les tables sur la base Neon : mettez son URL dans `DATABASE_URL` du `.env`, puis `npm run db:push && npm run db:seed`.

---

## 6. Ajouter une source

1. Ouvrir la page **Sources** (`/sources`) dans l'interface.
2. Cliquer sur le bouton d'ajout.
3. Renseigner :
   - **Nom** de la source (ex. « WordPress Releases »)
   - **URL** du flux RSS ou Atom
   - **Catégorie** : `tendances`, `sécurité` ou `versions`
4. La source est immédiatement active et sera incluse dans le prochain cycle de collecte.

Pour désactiver temporairement une source sans la supprimer, utiliser le toggle sur sa ligne.

---

## 7. Modifier le profil

1. Ouvrir la page **Profil** (`/profil`).
2. Modifier les champs souhaités :
   - **Nom** et **activité** de l'agence
   - **Stack** : liste de technologies (tags)
   - **Priorités** : sujets à privilégier lors du scoring
3. Enregistrer.

**Effet sur le scoring IA** : le profil est injecté dans chaque prompt de notation. Modifier la stack ou les priorités change directement la pertinence calculée des articles. Par exemple, ajouter « Nuxt.js » à la stack augmentera le score des articles liés à Vue/Nuxt.

---

## 8. Relancer la veille manuellement

Deux méthodes :

### Via l'interface
Sur le **Tableau de bord** (`/dashboard`), cliquer sur le bouton **« Lancer la veille »**. Cela exécute le pipeline complet (collecte → scoring → digest) en une seule action. Tous les articles notés, avec leur source, sont consultables sur la page **Articles** (`/articles`).

### Via les endpoints API (dans l'ordre)

```
POST /api/fetch-feeds        ← Collecte les articles des sources actives
POST /api/score-articles     ← Note les articles non encore scorés
POST /api/generate-digest    ← Génère le digest du jour
```

Ou en un seul appel orchestré :

```
POST /api/run-pipeline       ← Exécute les 3 étapes ci-dessus
```

---

## 9. En cas de blocage

### Quota gratuit Groq atteint
L'outil bascule automatiquement sur Gemini (fallback). Si les deux quotas sont atteints, les articles restent « non notés » (aucune fausse note) et seront notés au prochain passage. Attendre la réinitialisation du quota (en général quotidienne) ou passer à un plan payant.

### Réponse IA invalide
Si l'IA renvoie un format non-JSON ou des valeurs hors bornes, le parseur nettoie la réponse (suppression des backticks) et réessaie une fois. En cas d'échec persistant, l'article n'est pas noté et une erreur est journalisée dans le **Journal** (`/logs`).

### Workflow qui plante
Consulter la page **Journal** (`/logs`) et filtrer par type **Erreur** pour identifier la source du problème (source morte, timeout réseau, erreur API). Chaque étape du pipeline journalise ses résultats et ses erreurs.

### Clé API exposée
Si une clé API est accidentellement partagée :
1. **Révoquer** immédiatement la clé sur la console du fournisseur ([console.groq.com](https://console.groq.com) ou [aistudio.google.com](https://aistudio.google.com)).
2. **Régénérer** une nouvelle clé sur la même console.
3. **Mettre à jour** la variable d'environnement correspondante (`GROQ_API_KEY` ou `GEMINI_API_KEY`) dans la configuration de l'application.
4. La clé n'est **jamais** dans le code source — elle est uniquement lue via `process.env`.

---

## 10. Recette / Blind test

Cette procédure permet de vérifier que le scoring IA correspond au jugement humain de l'équipe.

### Procédure

1. Lancer une collecte (`POST /api/fetch-feeds`).
2. **Avant** de lancer le scoring IA, ouvrir la base de données et noter **10 articles** à la main (score 0-10, catégorie) sans regarder les résultats de l'outil.
3. Lancer le scoring IA (`POST /api/score-articles`).
4. Comparer vos notes avec celles de l'IA dans le tableau ci-dessous.
5. Compter les accords (écart ≤ 2 pour le score ET même catégorie = accord).
6. Si le taux d'accord est < 70 %, ajuster le profil (stack / priorités sur `/profil`) ou affiner le prompt dans `lib/scoring.ts`, puis relancer.

### Tour 1

| # | Article | Ma note | Ma catégorie | Note IA | Catégorie IA | Accord ? |
|---|---------|---------|-------------|---------|-------------|----------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

**Taux d'accord Tour 1** : ___ / 10

### Tour 2 (après ajustement du profil)

| # | Article | Ma note | Ma catégorie | Note IA | Catégorie IA | Accord ? |
|---|---------|---------|-------------|---------|-------------|----------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

**Taux d'accord Tour 2** : ___ / 10
