# Workflow général du processus de collecte et de publication des décisions des TCOM

## Envoi (côté TCOM/Infogreffe)

1. Pour chaque décision à publier dans Judilibre (nouvelle ou mise à jour), la juridiction émettrice effectue une requête HTTPS `PUT /decision` sur l'API de collecte du SDER, suivant les spécifications du [Swagger](./swagger_tcom_collecte.json) (texte brut, fichier PDF et métadonnées) ;
2. La juridiction émettrice attend la réponse de l'API et agit suivant le code HTTP associée à celle-ci :
   - `201` : la décision a bien été prise en compte ;
   - `400` : la requête d'envoi est incorrecte (la réponse contient les erreurs constatées côté SDER) - la juridiction émettrice doit reprendre l'envoi dès que possible, avec une décision et des données corrigées ;
   - `401` : la requête d'envoi n'est pas autorisée (le certificat requis pour la requête manque ou a expiré) - la juridiction émettrice doit contacter l'équipe technique côté Infogreffe afin de vérifier les paramètres de connexion avant reprise de l'envoi ;
   - `500` : la requête d'envoi a généré une erreur interne côté SDER (la réponse contient les erreurs constatées) - la juridiction émettrice doit contacter l'équipe technique du SDER afin d'analyser les anomalies avant reprise de l'envoi.

## Collecte (application `JuriTCOM`, côté SDER/Open, plateforme privée)

Chaque décision, reçue via le point d'entrée `PUT /decision` de l'application `JuriTCOM`, est validée :

- Présence et validation des informations obligatoires ;
- Analyse anti-virus du fichier PDF joint à la requête (_a priori_ en utilisant [ESET](https://help.eset.com/essl/91/fr-FR/on_demand_scan_via_terminal.html)) ;
- En cas d'anomalie, une erreur `400` est retournée avec les détails de celle-ci ;
- Sinon, la décision est stockée dans un bucket S3 privé, en vue de sa normalisation ultérieure, et une réponse `201` est retournée.

## Normalisation (application `JuriTCOM`, côté SDER/Open, plateforme privée)

Le batch de normalisation, intégré à l'application `JuriTCOM`, a pour objectif de traiter et de normaliser les données brutes des décisions de justice provenant des TCOM afin de les rendre cohérentes et exploitables par le processus de publication de Judilibre :

- Récupération des décisions brutes en attente de normalisation dans le bucket S3 privé (texte brut et métadonnées définies par le [Swagger](./swagger_tcom_collecte.json)) ;
- Traitement et normalisation des décisions brutes suivant différents modules de normalisation, se concentrant chacun sur un aspect spécifique des données et appliquant des règles de normalisation prédéfinies (lesquelles peuvent utiliser des fichiers de configuration au format JSON pour définir les mappages et les valeurs prédéfinies devant être associées à certains codes ou identifiants reçus) ;
- Enregistrement des décisions normalisées dans la collection `decisions` de la base de données SDER à l'aide de l'API DBSDER. Ces décisions deviennent disponibles pour la suite des traitements orchestrée par l'application Label. Les décisions intègres au format PDF (fichiers non publiés) doivent demeurer archivées dans un bucket S3 privé ;
- Les décisions en anomalie (erreur de normalisation, caractère non public, etc.) doivent être identifiées et bloquées en attendant que la juridiction émettrice soit notifiée et procède aux corrections nécessaires (avant une reprise de l'envoi).

### Gestion des erreurs et journalisation

Tout au long des processus de collecte et de normalisation, les erreurs sont gérées et journalisées à l'aide du module de journalisation (logger.ts).

Les erreurs spécifiques, telles que les erreurs de validation ou les erreurs d'intégrité des données, sont capturées et traitées de manière appropriée.

### Exécution du batch

Le batch de normalisation est exécuté périodiquement ou déclenché manuellement pour traiter les nouvelles données ou mettre à jour les données existantes.

La fréquence et le mode d'exécution du batch peuvent être configurés en fonction des besoins du projet.

## Pseudonymisation et validation (application `Label`, côté SDER, plateforme privée)

Le batch de pseudonymisation, géré par l'application `Label`, récupère les décisions en attente de traitement afin de lancer leur pseudonymisation, puis de procéder à leur relecture pour validation.

## Publication (application `judilibre-sder`, côté SDER, plateformes privée et publique)

Le batch de publication, intégré à l'application `judilibre-sder`, récupère les décisions validées par `Label` afin de les préparer pour leur indexation optimale via l'API Judilibre dans la base Elasticsearch publique.

Cette préparation est assurée par un module spécifique à chaque source de données (CC, CA, TJ, TCOM).

Jusqu'à nouvel ordre, les décisions de TCOM publiées dans Judilibre ne sont accompagnées d'aucun document joint (pas d'interaction avec le S3 public).
