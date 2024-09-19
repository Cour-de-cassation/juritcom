# JuriTCOM

Collecte TCOM pour Judilibre

### Pré-requis

- Installer [nvm](https://github.com/nvm-sh/nvm) afin d'avoir la version utilisée pour cette application et lancer la commande :

```bash
nvm install
```

### Installation

Pour installer les packages nécessaires au bon fonctionnement de l'application, ouvrir un terminal et entrer la commande suivante :

```bash
npm install
```

### Démarrer l'application

Pour démarrer l'application:

1. Compiler l'image docker:

```bash
npm run docker:build
```

2. Configurer les variables d'environnement:

    - Dupliquer le fichier `docker.env.example` et le rennomer `docker.env`, adapter les variables d'environnement si besoin
    - Dupliquer le fichier `.env.example` et le rennomer `.env`, adapter les variables d'environnement si besoin

4. Lancer l'API:
    - Pour lancer l'API en local :
          ```bash
          npm run start:dev
          ```
    - Pour lancer l'API avec docker :
      ```bash
      npm run docker:start
      ```
    - Pour lancer le bucket S3 en phase de développement:
      ```bash
      npm run docker:start:s3
      ```    

### Tests

Pour lancer les tests, écrire dans un terminal :

```bash
npm run test
```

### Postman

Le dossier `/documentation` contient :

- Les requêtes Postman et comment les installer [lien](documentation/postman/README.md)

### Swagger

Un Swagger est disponible à l'url `/doc` ou via `/doc-json`
il vous suffit d'entrer les variables que vous avez en `DOC_LOGIN` et `DOC_PASSWORD`
