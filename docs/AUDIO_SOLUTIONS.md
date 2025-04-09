# Solutions pour les prévisualisations audio

## Problème

Spotify a restreint l'accès aux prévisualisations audio (`preview_url`) pour de nombreuses pistes, rendant difficile l'utilisation de son API pour une expérience audio-visuelle interactive.

## Solutions proposées

### 1. Mode Démo (solution immédiate)

Nous avons implémenté un "Mode Démo" qui utilise des fichiers audio préchargés au lieu de l'API Spotify. Ces fichiers sont libres de droits et permettent aux utilisateurs de tester l'expérience sans dépendre de Spotify.

#### Comment configurer le mode démo:

1. Créer les dossiers nécessaires:

   ```bash
   mkdir -p public/demo-tracks public/demo-covers
   ```

2. Exécuter le script de téléchargement des fichiers de démo:

   ```bash
   node scripts/prepare-demo.js
   ```

3. Le mode démo est automatiquement accessible via un bouton dans l'interface.

### 2. Intégration avec Apple Music (solution à moyen terme)

Si vous disposez d'un compte Apple Music Developer, vous pouvez utiliser l'API Apple Music pour obtenir des prévisualisations. Cette API propose généralement des prévisualisations pour la plupart des morceaux.

#### Comment configurer Apple Music:

1. Créer un compte développeur Apple Music
2. Configurer un Developer Token
3. Utiliser l'API Apple Music pour les recherches et les prévisualisations
4. Adapter notre interface pour afficher et lire les résultats d'Apple Music

### 3. Alternative avec une libraire de morceaux libres de droits

Une solution plus durable pourrait être d'utiliser des API comme:

- Jamendo (musique libre de droits)
- Free Music Archive
- SoundCloud API (pour les morceaux avec licence appropriée)

### 4. Optimisations pour Spotify

Si vous souhaitez continuer avec Spotify:

1. **Élargir les marchés**: Notre code recherche déjà sur plusieurs marchés (US, GB, FR, etc.) pour maximiser les chances de trouver des prévisualisations
2. **Rechercher des artistes populaires**: Les artistes plus connus ont généralement plus de morceaux avec prévisualisations
3. **Filtrer par popularité**: Les morceaux populaires ont plus de chances d'avoir des prévisualisations
4. **Mettre en cache les résultats positifs**: Stocker les ID des morceaux qui ont des prévisualisations

### 5. Solution hybride

L'approche actuelle utilise une méthode hybride:

- Recherche d'abord sur Spotify
- En cas d'échec, propose le mode démo
- Permet aux utilisateurs de choisir entre les deux modes

## Recommandation

Pour une expérience professionnelle et fiable, nous recommandons:

1. Conserver le mode démo comme solution de repli
2. Envisager l'intégration avec Apple Music si vous avez un compte développeur
3. Explorer les APIs de musique libre de droits comme alternative plus durable

## Prochaines étapes

1. Utiliser des statistiques pour voir quel pourcentage de recherches échoue à cause du manque de prévisualisations
2. Évaluer l'expérience utilisateur avec le mode démo
3. Explorer des partenariats directs avec des fournisseurs de contenu audio
