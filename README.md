# Auto Rent
Location de voitures : site web responsive de démonstration

## À propos

Auto Rent est un site web de démonstration pour une agence de location de voitures. On peut y découvrir les catégories, parcourir toute la flotte, préparer une réservation, puis consulter ou imprimer un devis.

Le site fonctionne en local, sans serveur web : il suffit d'ouvrir la page dans un navigateur.

## 🛠️ Technologies utilisées

| Technologie | Rôle |
|---|---|
| **HTML5** | Structure des pages et des formulaires |
| **CSS3** | Styles, thème clair/sombre et règles d'impression |
| **Bootstrap 5.3.8** | Base du design, personnalisée avec le fichier `theme.css` |
| **JavaScript** | Interactions, validation, filtres, réservations de démonstration et génération du devis |
| **CSV** | Données de la flotte (`data/vehicles.csv`), chargées depuis `data/vehicles.js` |
| **LocalStorage / SessionStorage** | Conservation des réservations simulées et transmission des détails du devis dans le navigateur |

## 📚 Bibliothèques intégrées

Les fichiers nécessaires des bibliothèques sont inclus dans le dossier `vendor/`, avec leurs licences. Comme ça, le site fonctionne aussi après publication sur GitHub Pages et hors ligne. Les originaux et les versions de développement sont gérés avec `node_modules`.

| Bibliothèque | Version | Utilisation |
|---|---|---|
| **Bootstrap** | 5.3.8 | Grille responsive, navigation, cartes, formulaires, boutons et carrousel |
| **Bootstrap Icons** | 1.11.3 | Icônes de l'interface |
| **jQuery** | 3.7.1 | Dépendance utilisée par Select2 |
| **Select2** | 4.1.0-rc.0 | Listes déroulantes recherchables avec choix dépendants |
| **DataTables (avec Bootstrap 5)** | 2.3.4 | Recherche, tri et pagination du catalogue |

## 🎨 Personnalisation du design (theme.css)

En plus de Bootstrap, j'ai créé un fichier CSS personnalisé, `theme.css`, pour donner au site l'identité visuelle d'Auto Rent. Il contient :

- 🔴 **Variables Bootstrap redéfinies :** couleur principale rouge (`#dc2626`), police, arrière-plan, bordures et angles arrondis
- 🧭 **Navbar, boutons, cartes et formulaires stylisés :** dégradés sombres, ombres, transitions, états de survol et de focus
- 🪜 **Étapes de réservation (`.booking-steps`) et récapitulatif (`.booking-review`) :** pour le formulaire en trois étapes
- 🌙 **Mode sombre via `[data-bs-theme="dark"]` :** avec les couleurs adaptées aux cartes, formulaires, tableaux, Select2 et DataTables
- 🦶 **Pied de page (`.site-footer`) :** et en-têtes des pages
- ♿ **Accessibilité :** indicateurs de focus clavier bien visibles et respect de `prefers-reduced-motion`
- 📱 **Responsive :** ajustements pour les petits écrans (étapes empilées, marges réduites, images adaptées)

## ✨ Fonctionnalités principales

- 🏠 **Accueil responsive** avec un carrousel Citadine, Berline et Commerciale
- 🗂️ **Cartes de catégories et catalogue** généré à partir des données locales de 50 véhicules
- 🔎 **Recherche, pagination, tri par prix et filtres** par catégorie, marque, tarif et disponibilité
- 📝 **Formulaire de réservation guidé en 3 étapes :** dates et véhicule, coordonnées, puis récapitulatif
- ⚡ **Pré-remplissage automatique de la réservation** quand un véhicule est disponible : il ne reste qu'à compléter son nom et ses coordonnées
- 💰 **Mise à jour du prix** selon le véhicule et la durée de location
- 🚫 **Vérification des conflits de dates** pour un véhicule (les réservations de démonstration sont gardées dans le navigateur)
- 🧾 **Devis séparé** avec référence, détail du prix, dates en français et bouton d'impression
- ✉️ **Formulaire de contact** validé côté navigateur
- 🌗 **Navigation commune**, mode clair/sombre mémorisé et affichage adapté aux petits écrans

## 🤖 Améliorations réalisées avec l'IA (Copilot)

J'ai utilisé l'IA pour proposer et accélérer les améliorations ci-dessous. Le code a ensuite été vérifié et intégré au projet.

### 1. Catalogue local illustré
- **Prompt utilisé :** « Génère un catalogue local de véhicules à partir d'un fichier CSV d'au moins 50 entrées, utilisable sans serveur ni connexion Internet. »
- **Proposition :** charger le CSV et afficher les véhicules dans un tableau.
- **Version intégrée :** données CSV accompagnées d'un fichier JavaScript local, illustrations SVG générées dans le navigateur, puis affichage avec DataTables.
- **Fonctionnement :** JavaScript lit les données locales et crée les lignes du catalogue ainsi que leurs illustrations.

### 2. Parcours de réservation et disponibilité
- **Prompt utilisé :** « Améliore le formulaire de réservation avec des étapes, une vérification des dates et un récapitulatif avant confirmation. »
- **Proposition :** guider l'utilisateur et l'empêcher de choisir un véhicule déjà réservé sur les mêmes dates.
- **Version intégrée :** formulaire en trois étapes, validation progressive et contrôle des chevauchements à partir des réservations stockées localement.
- **Fonctionnement :** les choix de dates et de véhicule sont vérifiés avant confirmation, et les réservations simulées sont enregistrées dans localStorage.

### 3. Devis imprimable
- **Prompt utilisé :** « Crée un devis imprimable distinct de la page de réservation avec un récapitulatif clair et un montant total. »
- **Proposition :** ouvrir une page de devis après validation et proposer son impression.
- **Version intégrée :** `devis.html` présente une référence, les coordonnées, le véhicule, les dates et le détail du tarif. Les styles d'impression masquent la navigation et les boutons.
- **Fonctionnement :** les données validées sont transmises via sessionStorage, puis imprimées avec `window.print()`.

### 4. Navigation et accessibilité
- **Prompt utilisé :** « Harmonise la navigation et le pied de page et améliore l'utilisation sur mobile et au clavier. »
- **Proposition :** partager les mêmes éléments de navigation, ajouter des retours de validation visibles et éviter les débordements sur mobile.
- **Version intégrée :** navbar et footer harmonisés, indicateurs de focus clavier, messages accessibles et mises en page adaptées aux petits écrans.
- **Fonctionnement :** les styles et composants communs sont réutilisés sur toutes les pages du site.

### 5. Vérification de la disponibilité et pré-remplissage de la réservation
- **Prompt utilisé :** « Propose plusieurs moyens de vérifier la disponibilité d'un véhicule et de pré-remplir le formulaire de réservation quand un véhicule est disponible. »
- **Proposition :** proposer plusieurs moyens de vérifier la réservation d'un véhicule, puis pré-remplir le formulaire quand le véhicule est disponible.
- **Version intégrée :** 3 méthodes de vérification de la réservation d'un véhicule :
  1. **Depuis le catalogue (Bouton « Réserver » & URL) :** Clic sur un véhicule disponible dans le catalogue pour transmettre automatiquement la catégorie et l'identifiant via l'URL (`?categorie=...&voiture=...`), pré-sélectionnant directement le véhicule dans le formulaire.
  2. **Filtrage dynamique selon les dates :** Mise à jour instantanée du menu déroulant des véhicules lors de la saisie des dates pour masquer les véhicules en conflit dans `localStorage`.
  3. **Contrôle et validation aux étapes :** Vérification stricte au passage de l'étape 1 à 2 et lors de la confirmation finale avec affichage d'un message d'erreur si le véhicule n'est plus disponible.
- **Fonctionnement :** quand un véhicule est disponible, le formulaire de réservation se remplit automatiquement avec le véhicule et les dates choisis. L'utilisateur complète ensuite à la main son nom et ses autres coordonnées avant de confirmer.

## 🚀 Utilisation

- Ouvrir `index.html` ou `index2.html` dans un navigateur.
- `index.html` redirige vers la version principale `index2.html`, pour que la racine de GitHub Pages affiche la bonne page.
- Le dossier `vendor/` contient toutes les ressources nécessaires au site publié et à l'utilisation hors ligne. Aucun serveur web n'est nécessaire.