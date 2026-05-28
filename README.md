# 📣 Session Tifo — Appli téléphone (PWA, 100 % gratuite)

Ton appli existante a été transformée en **vraie application installable** sur iPhone et Android,
en gardant **ton Google Sheets** comme base de données. Tout reste gratuit.

> Principe : Google Apps Script affiche les pages dans une *iframe* qui empêche une vraie
> installation. On contourne ça en hébergeant le « front » sur un hébergeur gratuit, et en
> transformant ton script en **API JSON**. Un petit fichier (`gas-shim.js`) traduit
> automatiquement tous tes appels `google.script.run` en appels réseau → **ton code HTML
> fonctionne quasiment sans modification.**

---

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | App participant (ex-CheckIn) — page d'accueil |
| `admin.html` | Console admin (ex-Admin) |
| `config.js` | **Le seul fichier à éditer** : l'URL de ton API |
| `gas-shim.js` | Traduit `google.script.run` → `fetch` (ne pas toucher) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation + hors-ligne |
| `apps_script/Api.gs` | À coller dans ton projet Apps Script |

---

## Étape A — Activer l'API dans Apps Script (5 min)

1. Ouvre ton projet Apps Script (celui qui contient `Code.gs`).
2. **Fichier ▸ +** ▸ **Script** ▸ nomme-le `Api` ▸ colle tout le contenu de
   `apps_script/Api.gs` ▸ Enregistre.
   *(Ne supprime rien dans `Code.gs`. On ajoute seulement un `doPost`.)*
3. Clique **Déployer ▸ Nouveau déploiement**.
4. Type : **Application Web**.
   - *Exécuter en tant que* : **Moi**
   - *Qui a accès* : **Tout le monde** ← indispensable pour que l'appli puisse appeler l'API.
5. **Déployer**, autorise si demandé, puis **copie l'URL** qui se termine par `/exec`.

---

## Étape B — Coller l'URL

Ouvre `config.js` et remplace la ligne par ton URL :

```js
window.TIFO_API_URL = "https://script.google.com/macros/s/AKfycb..../exec";
```

---

## Étape C — Héberger gratuitement (GitHub Pages)

1. Crée un compte sur https://github.com (gratuit).
2. **New repository** ▸ nom `session-tifo` ▸ **Public** ▸ Create.
3. **Add file ▸ Upload files** ▸ glisse **tout le contenu** de ce dossier
   (les fichiers ET le dossier `icons/`) ▸ **Commit**.
   *(N'envoie pas le dossier `apps_script/`, il sert seulement côté Google.)*
4. **Settings ▸ Pages** ▸ *Branch* = `main` / `/root` ▸ **Save**.
5. Au bout d'1-2 min, ton appli est en ligne :
   `https://TON-PSEUDO.github.io/session-tifo/`

> Alternatives tout aussi gratuites : **Netlify Drop** (glisser-déposer le dossier),
> **Cloudflare Pages**. N'importe quel hébergeur statique HTTPS convient.

---

## Étape D — Installer sur le téléphone

**iPhone (Safari obligatoire)** : ouvre l'URL ▸ bouton **Partager** ▸
**Sur l'écran d'accueil** ▸ Ajouter. L'icône mégaphone apparaît, l'app s'ouvre en plein écran.

**Android (Chrome)** : ouvre l'URL ▸ menu **⋮** ▸ **Installer l'application**
(ou la bannière « Ajouter à l'écran d'accueil »).

Pour l'admin : depuis l'app, le bouton admin ouvre `admin.html` (même appli).
Tu peux aussi installer `…/session-tifo/admin.html` séparément.

---

## Mettre à jour l'appli plus tard

Réuploade les fichiers modifiés sur GitHub, **et** incrémente la version du cache dans
`sw.js` (`const CACHE = "tifo-v2";`) pour forcer le rafraîchissement sur les téléphones.

---

## Bon à savoir / limites

- **Connexion** : la session dure 24 h (côté serveur, comme avant) ; il faudra se
  reconnecter ensuite. *(On pourra ajouter le « rester connecté » plus tard si tu veux.)*
- **Sécurité** : l'API n'expose que les fonctions de la liste blanche dans `Api.gs`.
  C'est le même niveau d'accès qu'aujourd'hui. Si tu veux verrouiller davantage
  (ex. clé secrète, ou exiger un token admin sur `getParticipants`/`updateParticipant`),
  c'est une amélioration simple à faire ensuite.
- **Hors-ligne** : l'app s'ouvre sans réseau (coquille en cache), mais les données
  (sessions, présences…) nécessitent évidemment une connexion.
- **iOS** : l'installation passe forcément par **Safari** (limitation Apple), pas Chrome iOS.

---

### Pourquoi pas une app « native » sur les stores ?
Publier en natif coûte **99 €/an** (Apple) et **25 €** (Google) — incompatible avec
« gratuit ». La PWA donne la même expérience (icône, plein écran, hors-ligne) sans aucun
coût ni validation de store. Si un jour tu veux la version native, ce même front pourra
être réutilisé presque tel quel (ex. via Capacitor).
