# API JURUTCOM
Collecte TCOM pour Judilibre

## Caractéristiques

- **Architecture Modulaire** : Basée sur NestJS, permettant une scalabilité et une maintenance facilitées.
- **Gestion des Environnements** : Supporte plusieurs environnements (local, développement, production).
- **Tests Automatisés** : Tests unitaires et d'intégration avec Jest pour assurer la qualité du code.
- **Linting et Formatage** : Utilisation d'ESLint et Prettier pour maintenir un code propre et cohérent.

## Technologies

- **NestJS** : Framework pour construire des applications Node.js performantes.
- **TypeScript** : Langage de programmation pour un typage statique.
- **AWS SDK** : Pour interagir avec le service stockage S3.
- **Jest** : Framework de tests pour JavaScript.
- **Prettier** : Outil de formatage de code.
- **ESLint** : Outil de linting pour identifier et reporter les motifs dans le code JavaScript.

## Dépendances
### Le projet JURITCOM utilise les dépendances suivantes :
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/config`
- `@nestjs/swagger`
- `@aws-sdk/client-s3`
- `axios`
- `class-transformer`
- `class-validator`
- `joi`
- `rimraf`
- `rxjs`
- `uuid`
- 
### Pré-requis

- Installer [nvm](https://github.com/nvm-sh/nvm) afin d'avoir la version utilisée pour cette application et lancer la commande :

```bash
nvm install
```

### Installation

Pour installer les packages nécessaires au bon fonctionnement de l'application, ouvrir un terminal et executer la commande suivante :

```bash
npm install
```
## Configuration
### Configurer les variables d'environnement:

    Dupliquer le fichier `docker.env.example` et le rennomer `docker.env` ou `.env` selon le besoin, adapter les variables d'environnement si besoin


## Scripts
-   Voici une liste des scripts disponibles dans `package.json` :

| Commande           | Description                                                                                   |
|--------------------|-----------------------------------------------------------------------------------------------|
| `prebuild`         | Supprime le dossier `dist` avant la construction.                                              |
| `build`            | Compile l'application NestJS.                                                                  |
| `format`           | Vérifie le formatage du code avec Prettier.                                                    |
| `start`            | Démarre l'application en mode local.                                                           |
| `start:dev`        | Démarre l'application en mode développement avec rechargement à chaud.                         |
| `start:debug`      | Démarre l'application en mode debug avec rechargement à chaud.                                 |
| `start:prod`       | Démarre l'application en mode production.                                                      |
| `docker:build`     | Construit l'image Docker avec `docker-compose.local.yml`.                                       |
| `docker:start`     | Démarre les conteneurs Docker en arrière-plan avec `docker-compose.local.yml`.                  |
| `docker:stop`      | Arrête les conteneurs Docker.                                                                  |
| `docker:kill`      | Supprime les conteneurs Docker, les orphelins, les volumes et les images.                      |
| `batch:start`      | Exécute un script de normalisation batch en utilisant `ts-node`.                                |
| `batch:start:prod` | Exécute le script batch de normalisation en production.                                         |
| `docker:start:s3`  | Démarre le conteneur S3 et crée des buckets via Docker.                                         |
| `docker:stop:s3`   | Arrête le conteneur S3.                                                                        |
| `lint`             | Vérifie le code TypeScript avec ESLint.                                                        |
| `test`             | Exécute les tests unitaires et d'intégration.                                                  |
| `test:batch`       | Exécute uniquement les tests pour le batch.                                                    |
| `test:api`         | Exécute uniquement les tests pour l'API et lance les tests d'intégration.                      |
| `test:watch`       | Exécute les tests en mode interactif avec surveillance des changements.                        |
| `test:cov`         | Exécute les tests avec génération de rapports de couverture.                                   |
| `test:debug`       | Démarre les tests en mode debug avec Jest.                                                     |
| `test:integration` | Exécute les tests d'intégration avec la configuration `jest-integration.json`.                  |
| `fix`              | Corrige les erreurs de formatage avec ESLint et Prettier.                                      |


### Démarrer l'application dans un environnement local

Démarrer l'application nécessite au préalable d'initaliser les fichiers de variables d'environnement.

- Pour lancer l'ensemble de JuriTCOM avec Docker :

  ```bash
  npm run docker:build
  npm run docker:start
  ```

- Pour lancer l'API en phase de développement et afin de disposer d'une mise à jour à chaud du serveur à chaque changement:

  ```bash
  npm run docker:build
  npm run docker:start:s3
  npm run start:dev
  ```

- Autres commandes utiles :
    - Stopper tous les container :
      ```bash
      npm run docker:stop
      ```
    - Stopper le container du S3 :
      ```bash
      npm run docker:stop:s3
      ```
    - Arrêter et nettoyer l'environnement docker de l'application :
      ```bash
      npm run docker:kill
      ```
    - Lancer le lint et le formatage du code :
      ```bash
      npm run fix

## Tests
- Pour exécuter les tests, utilisez la commande suivante :

```bash
npm run test
```

- Pour exécuter les tests en mode interactif :

```bash
 npm run test:watch 
 ```

- Pour exécuter les tests avec un rapport de couverture :

```bash
 npm run test:cov 
 ```

### Postman

### Configuration de Postman

Pour effectuer des tests Postman sur l'environnement de développement :

- Récupérer le certificat client, la clé privée client et le certificat d'autorité de certification auto-signé
- [Insérer la clé privée client et certificats](https://learning.postman.com/docs/sending-requests/certificates/) sur Postman
- Récupérer les collections Postman dans le [dossier de documentation](documentation/postman/README.md)
- Les importer dans Postman

### Swagger

Un Swagger est disponible à l'url `/doc` ou via `/doc-json`

Il vous suffit d'utiliser les variables DOC_LOGIN et DOC_PASSWORD à votre disposition pour vous authentifier.