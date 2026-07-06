# JURITCOM

API de collecte des décisions des tribunaux de commerce en vu de leur publication sur judilibre.

# Utilisation

1. Initialiser les variables d'environnement : dupliquer le fichier `.env.example` et le renommer `.env`
2. Dépendances : l'application utilise une base de donnée et un S3 pour stocker les décisions reçues. Vous pouvez les lancer grace a [juridependencies](https://github.com/Cour-de-cassation/juridependencies).
3. Installer les dépendances requises avec `npm install`. L'application peut-être lancée via docker avec la `docker compose up` ou sans via la commande `npm run start:watch`
