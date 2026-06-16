# Atelier Vitrine

Site vitrine statique pour présenter une offre de création de sites internet, avec formulaire de demande de devis gratuit.

## Ouvrir le projet dans Visual Studio Code

1. Ouvre Visual Studio Code.
2. Clique sur `Fichier` > `Ouvrir un dossier`.
3. Sélectionne le dossier :
   `/Users/tim/Documents/Site web`
4. Installe les extensions recommandées quand VS Code te le propose.

## Voir le site dans le navigateur

La méthode la plus simple :

1. Installe l'extension `Live Server`.
2. Ouvre `index.html`.
3. Clique sur `Go Live` en bas à droite de VS Code.

Tu peux aussi utiliser le terminal intégré de VS Code :

```bash
python3 -m http.server 8080
```

Puis ouvre :

```text
http://localhost:8080
```

## Fichiers importants

- `index.html` : contenu de la page, textes, sections, formulaire.
- `exemples.html` : page portfolio avec des exemples de sites vitrines générés.
- `styles.css` : couleurs, mise en page, responsive, design.
- `script.js` : interactions des boutons, sélection des offres, message du formulaire.
- `examples.js` : filtres et effets 3D de la page exemples.
- `three-scene.js` : scène Three.js du haut de page.
- `gsap-animations.js` : animations GSAP et effets au scroll.
- `assets/hero-vitrine.png` : image utilisée dans le haut de page.

## Modifier les textes

Pour changer un texte affiché sur le site, ouvre `index.html`.

Exemples utiles :

- Le titre principal est dans la section `.hero`.
- Les offres sont dans la section `#offres`.
- Le formulaire est dans la section `#devis`.
- Les coordonnées sont dans `.hero-contact` et `.contact-card`.

## Modifier les couleurs

Les couleurs principales sont en haut de `styles.css`, dans `:root`.

Exemples :

```css
--teal: #0e9f8f;
--coral: #ff6b4a;
--ink: #152033;
```

En changeant ces valeurs, tu peux modifier l'identité visuelle du site sans chercher partout dans le fichier.

## Modifier le prix

Le tarif de départ est actuellement indiqué à `500 €`.

Pour le changer, cherche `500` dans `index.html`.

## Email

L'adresse affichée sur le site est :

```text
timayecom@gmail.com
```

Le formulaire affiche encore une confirmation locale. On pourra le connecter à un vrai envoi email avec un service comme Formspree, Netlify Forms, EmailJS ou un backend.

## Extensions VS Code conseillées

- `Live Server` : voir le site avec rechargement automatique.
- `Prettier` : garder le code propre automatiquement.
- `Auto Rename Tag` : renommer automatiquement les balises HTML.
- `HTML CSS Support` : aide à l'écriture du HTML/CSS.
- `Path Intellisense` : aide pour les chemins d'images et de fichiers.

## Routine simple pour travailler

1. Ouvre le dossier dans VS Code.
2. Lance `Go Live`.
3. Modifie `index.html`, `styles.css` ou `script.js`.
4. Regarde le navigateur se mettre à jour.
5. Teste sur mobile avec l'inspecteur du navigateur.

## Prochaines améliorations possibles

- Ajouter ton adresse email.
- Connecter le formulaire pour recevoir les demandes.
- Ajouter des exemples de sites réalisés.
- Ajouter une section avis clients.
- Ajouter une vraie page mentions légales.
- Optimiser le référencement naturel avec titre, description et balises sociales.
