# 🚛 RouteHaul

GPS adapté au gabarit pour van à chevaux, fourgons et camions.
Calcule des itinéraires qui évitent ponts bas, routes interdites et restrictions de tonnage.

**Stack :** Next.js 15 · React 19 · TypeScript · Tailwind · MapLibre GL · OpenRouteService

---

## 🚀 Déploiement Vercel (5 min)

### 1. Récupérer une clé OpenRouteService (gratuite)

1. Va sur **https://openrouteservice.org/dev/#/signup**
2. Inscris-toi (email + mot de passe)
3. Dashboard → **Request a token** → choisis "Standard" (2 000 requêtes/jour gratuites)
4. Copie la clé qui commence par `eyJ...`

### 2. Pousser le projet sur GitHub

```bash
cd routehaul
git init
git add .
git commit -m "Initial commit"
gh repo create routehaul --public --source=. --push
```

(ou crée le repo manuellement sur github.com et `git push`)

### 3. Déployer sur Vercel

1. Va sur **https://vercel.com/new**
2. Importe ton repo `routehaul`
3. Dans **Environment Variables**, ajoute :
   - **Name :** `ORS_API_KEY`
   - **Value :** ta clé ORS
4. Clique **Deploy**

⏱️ ~2 minutes plus tard, tu reçois une URL `https://routehaul-xxx.vercel.app`.

### 4. Installer sur iPhone

1. Ouvre l'URL dans Safari
2. Bouton Partager → **Sur l'écran d'accueil**
3. Tu as une icône RouteHaul comme une vraie app 🎉

---

## 💻 Développement local

```bash
npm install
cp .env.example .env.local
# Édite .env.local et colle ta clé ORS_API_KEY
npm run dev
```

Ouvre http://localhost:3000

---

## 🗂️ Structure

```
src/
├── app/
│   ├── api/
│   │   ├── geocode/route.ts    # Proxy Nominatim (recherche d'adresses)
│   │   └── route/route.ts      # Proxy OpenRouteService (calcul d'itinéraire)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Page principale
├── components/
│   ├── AddressInput.tsx        # Champ avec autocomplétion
│   ├── MapView.tsx             # Carte MapLibre
│   ├── RouteSummary.tsx        # Panneau résultat
│   ├── VehicleCustomizer.tsx   # Modale dimensions
│   └── VehicleSelector.tsx     # Dropdown profils
├── lib/
│   ├── format.ts               # Formatage km / durée
│   ├── profiles.ts             # Profils véhicules pré-configurés
│   └── useLocalStorage.ts      # Hook persistence
└── types/
    └── index.ts
```

---

## ✅ Ce qui marche

- ✅ Profils véhicules pré-configurés + édition libre
- ✅ Recherche d'adresses (FR, BE, CH, LU, DE, ES, IT)
- ✅ Calcul d'itinéraire **avec contraintes de gabarit** (hauteur, largeur, longueur, poids)
- ✅ Géolocalisation "Ma position" en un clic
- ✅ Détail des étapes en français
- ✅ Avertissements de restrictions sur le trajet
- ✅ Sauvegarde du profil véhicule (localStorage)
- ✅ Installable comme PWA (iPhone/Android)
- ✅ Clé API **côté serveur** (jamais exposée au navigateur)

## 🔮 Roadmap

- [ ] Trajets favoris
- [ ] Mode hors-ligne (cache des cartes)
- [ ] Navigation turn-by-turn vocale
- [ ] Alertes ZFE explicites
- [ ] Partage de trajet par lien
- [ ] Export GPX

---

## ⚖️ Crédits & licences

- Cartes : © OpenStreetMap contributors · © CARTO (tuiles dark)
- Routage : OpenRouteService (HeiGIT, université de Heidelberg)
- Géocodage : Nominatim (OpenStreetMap Foundation)

Usage personnel. Respecte les limites d'usage des APIs gratuites.
