# Auto Rent — Location de voitures

Auto Rent est un site web responsive de démonstration pour une agence de location de voitures. Il permet de découvrir les catégories, parcourir une flotte de véhicules, préparer une réservation et consulter ou imprimer un devis. Le site fonctionne localement, sans serveur web.

## Technologies utilisées

- **HTML5** pour la structure des pages et des formulaires
- **CSS3** pour les styles, le thème clair/sombre et les règles d’impression
- **JavaScript** pour les interactions, la validation, les filtres, les réservations de démonstration et la génération du devis
- **CSV** pour les données de la flotte, fournies dans `data/vehicles.csv` et chargées depuis `data/vehicles.js`
- **LocalStorage et SessionStorage** pour conserver les réservations simulées et transmettre les détails du devis dans le navigateur

## Bibliothèques intégrées

Les bibliothèques sont chargées depuis `node_modules` afin de pouvoir utiliser le projet hors ligne.

- **Bootstrap 5.3.8** : grille responsive, navigation, cartes, formulaires, boutons et carrousel
- **Bootstrap Icons 1.11.3** : icônes de l’interface
- **jQuery 3.7.1** : dépendance utilisée par Select2
- **Select2 4.1.0-rc.0** : listes déroulantes recherchables avec choix dépendants
- **DataTables 2.3.4** avec Bootstrap 5 : recherche, tri et pagination du catalogue

## Fonctionnalités principales

- Accueil responsive avec un carrousel Citadine, Berline et Commerciale
- Cartes de catégories et catalogue généré à partir des données locales de 50 véhicules
- Recherche, pagination, tri par prix et filtres par catégorie, marque, tarif et disponibilité
- Formulaire de réservation guidé en trois étapes : dates et véhicule, coordonnées, puis récapitulatif
- Mise à jour du prix selon le véhicule et la durée de location
- Vérification des conflits de dates pour un véhicule ; les réservations de démonstration sont conservées dans le navigateur
- Devis séparé avec référence, détail du prix, dates en français et bouton d’impression
- Formulaire de contact validé côté navigateur
- Navigation commune, mode clair/sombre mémorisé et affichage adapté aux petits écrans

## Améliorations réalisées avec l’IA (Capilot)

L’IA a servi à proposer et accélérer les améliorations ci-dessous. Le code a ensuite été vérifié et intégré au projet.

1. **Catalogue local illustré**
   - **Prompt utilisé :** « Génère un catalogue local de véhicules à partir d’un fichier CSV d’au moins 50 entrées, utilisable sans serveur ni connexion Internet. »
   - **Proposition :** charger le CSV et afficher les véhicules dans un tableau.
   - **Version intégrée :** données CSV accompagnées d’un fichier JavaScript local, illustrations SVG générées dans le navigateur, puis affichage DataTables.
   - **Fonctionnement :** JavaScript lit les données locales et crée les lignes du catalogue ainsi que leurs illustrations.

2. **Parcours de réservation et disponibilité**
   - **Prompt utilisé :** « Améliore le formulaire de réservation avec des étapes, une vérification des dates et un récapitulatif avant confirmation. »
   - **Proposition :** guider l’utilisateur et empêcher de choisir un véhicule déjà réservé sur les mêmes dates.
   - **Version intégrée :** formulaire en trois étapes, validation progressive et contrôle des chevauchements à partir des réservations stockées localement.
   - **Fonctionnement :** les choix de dates et de véhicule sont vérifiés avant confirmation ; les réservations simulées sont enregistrées dans `localStorage`.

3. **Devis imprimable**
   - **Prompt utilisé :** « Crée un devis imprimable distinct de la page de réservation avec un récapitulatif clair et un montant total. »
   - **Proposition :** ouvrir une page de devis après validation et proposer son impression.
   - **Version intégrée :** `devis.html` présente une référence, les coordonnées, le véhicule, les dates et le détail du tarif ; les styles d’impression masquent la navigation et les boutons.
   - **Fonctionnement :** les données validées sont transmises via `sessionStorage`, puis imprimées avec `window.print()`.

4. **Navigation et accessibilité**
   - **Prompt utilisé :** « Harmonise la navigation et le pied de page et améliore l’utilisation sur mobile et au clavier. »
   - **Proposition :** partager les mêmes éléments de navigation, ajouter des retours de validation visibles et éviter les débordements mobiles.
   - **Version intégrée :** navbar et footer harmonisés, indicateurs de focus clavier, messages accessibles et mises en page adaptées aux petits écrans.
   - **Fonctionnement :** les styles et composants communs sont réutilisés sur les pages du site.

## Utilisation

Conserver `node_modules` avec le projet et ouvrir `index.html` ou `index2.html` dans un navigateur. `index.html` redirige vers la version principale `index2.html`, notamment pour que la racine de GitHub Pages affiche la bonne page. Aucune installation de dépendances ni aucun serveur web n’est nécessaire si les fichiers du projet sont présents.

Les réservations ne sont qu’une simulation locale : elles ne sont pas partagées entre appareils et ne constituent pas une confirmation réelle de location. Le formulaire de contact valide les champs, mais n’envoie pas d’email.
