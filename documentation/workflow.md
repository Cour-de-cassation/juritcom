# Workflow général du processus de collecte et de publication des décisions des TCOM

## Envoi (côté TCOM/Infogreffe)

1. Pour chaque décision à publier dans Judilibre (nouvelle ou mise à jour), la juridiction émettrice effectue une requête HTTPS `PUT /decision` sur l'API de collecte du SDER, suivant les spécifications du [Swagger](./swagger_tcom_collecte.json) (texte brut issu du fichier PDF, fichier PDF signé et métadonnées complètes) ;
2. La juridiction émettrice attend la réponse de l'API et agit suivant le code HTTP associée à celle-ci :
   - `201` : la décision a bien été prise en compte ;
   - `400` : la requête d'envoi est incorrecte (la réponse contient les erreurs constatées côté SDER) - la juridiction émettrice doit reprendre l'envoi dès que possible, avec une décision et des données corrigées ;
   - `401` : la requête d'envoi n'est pas autorisée (le certificat requis pour la requête manque ou a expiré) - la juridiction émettrice doit contacter l'équipe technique côté Infogreffe afin de vérifier les paramètres de connexion avant reprise de l'envoi ;
   - `500` : la requête d'envoi a généré une erreur interne côté SDER (la réponse contient les erreurs constatées) - la juridiction émettrice doit contacter l'équipe technique du SDER afin d'analyser les anomalies avant reprise de l'envoi.

**Note** : dans le cas où la collecte s'effectuerait de manière asynchrone (scénario _4_ ci-après), alors l'instance émettrice recevrait immédiatement une réponse avec un code HTTP `202` ("Accepted", cf. [RFC](https://www.rfc-editor.org/rfc/rfc9110.html#name-202-accepted)) indiquant que la requête a bien été réceptionnée et qu'elle est en cours de traitement. Cette réponse contiendrait un identifiant (ou URI) permettant à l'instance émettrice d'interroger ultérieurement le serveur afin de connaître l'état d'avancement du traitement de la requête (modalités de réponses à spécifier le cas échéant).

## Collecte (application `JuriTCOM`, côté SDER/Open, plateforme privée)

Chaque décision, reçue via le point d'entrée `PUT /decision` de l'application `JuriTCOM`, est validée suivant 4 scénarii possibles :

1. Pas d'analyse anti-virus :

   - Présence et validation des informations obligatoires (texte brut, fichier PDF signé et métadonnées) en suivant les spécifications du [Swagger](./swagger_tcom_collecte.json) ;
   - En cas d'anomalie, une erreur `400` est retournée avec les détails des erreurs rencontrées ;
   - Sinon, l'ensemble de la décision est stocké dans un bucket S3 privé, en vue de sa normalisation ultérieure, et une réponse `201` est retournée.

2. Analyse anti-virus effectuée au niveau de la couche réseau :

   - Si la présence d'un virus est détectée dans le flux, en amont de la collecte, alors une erreur est censée être retournée à l'émetteur et le workflow de collecte n'est jamais sollicité (_à préciser suivant les spécifications techniques de la solution préconisée par le MJ_). Dans ce cas, un mécanisme secondaire (possiblement en batch) doit être implémenté afin d'analyser les logs de l'anti-virus de sorte à intégrer l'erreur dans le système d'information et, si nécessaire, correctement en informer l'instance émettrice ;
   - En l'absence de virus, le workflow de collecte est sollicité :
     - Présence et validation des informations obligatoires (texte brut, fichier PDF signé et métadonnées) en suivant les spécifications du [Swagger](./swagger_tcom_collecte.json) ;
     - En cas d'anomalie de validation, une erreur `400` est retournée avec les détails des erreurs rencontrées ;
     - Sinon, l'ensemble de la décision est stocké dans un bucket S3 privé, en vue de sa normalisation ultérieure, et une réponse `201` est retournée.

3. Analyse anti-virus effectuée à la volée lors de la collecte, de manière **synchrone** (dans le cas où le temps d'analyse n'est pas susceptible de provoquer un _timeout_ de la requête d'origine) :

   - Présence et validation des informations obligatoires (texte brut, fichier PDF signé et métadonnées) en suivant les spécifications du [Swagger](./swagger_tcom_collecte.json) ;
   - Analyse anti-virus à la volée du fichier PDF joint à la requête (_a priori_ en utilisant [ESET](https://help.eset.com/essl/91/fr-FR/on_demand_scan_via_terminal.html), ce qui nécessite le stockage du fichier reçu dans un espace temporaire devant être détruit après analyse) ;
   - En cas d'anomalie, une erreur `400` est retournée avec les détails des erreurs rencontrées ;
   - Sinon, l'ensemble de la décision est stocké dans un bucket S3 privé, en vue de sa normalisation ultérieure, et une réponse `201` est retournée.

4. Analyse anti-virus effectuée à la volée lors de la collecte, de manière **asynchrone** (dans le cas où le temps d'analyse est susceptible de provoquer un _timeout_ de la requête d'origine) :

   - Une réponse avec un code HTTP `202` et les informations requises pour le suivi du traitement (identifiant de "job" ou URI de suivi) est retournée immédiatement à l'émetteur, avant de poursuivre "en tâche de fond" le workflow de collecte (sous la forme d'un "job" identifié) ;
     - Présence et validation des informations obligatoires (texte brut, fichier PDF signé et métadonnées) en suivant les spécifications du [Swagger](./swagger_tcom_collecte.json) ;
     - Analyse anti-virus à la volée du fichier PDF joint à la requête (_a priori_ en utilisant [ESET](https://help.eset.com/essl/91/fr-FR/on_demand_scan_via_terminal.html), ce qui nécessite le stockage du fichier reçu dans un espace temporaire devant être détruit après analyse) ;
     - En cas d'anomalie, le "job" est clos en état d'erreur, avec les détails des erreurs rencontrées ;
     - Sinon, le "job" est clos en état de succès et l'ensemble de la décision est stocké dans un bucket S3 privé, en vue de sa normalisation ultérieure.
   - En parallèle, un point d'entrée additionnel de l'API de collecte (par exemple : `POST /jobStatus`) est accessible à l'instance émettrice pour le suivi du "job" considéré. Ce point d'entrée retourne l'état d'avancement du job sous la forme d'un objet JSON du type `{ "jobId": "<ID ou URI>", "jobStatus": "<status>", "elapsedTime": <temps écoulé> }`, la propriété `jobStatus` pouvant prendre les valeurs `pending` (en cours), `failure` (échoué) ou `success` (succès). Dans le cas où le "job" est dans un état `failure`, l'objet JSON doit contenir une propriété `reason` détaillant les raisons de l'échec de la collecte (contenu manquant ou invalide, virus détecté, etc.).

## Normalisation (application `JuriTCOM`, côté SDER/Open, plateforme privée)

Le batch de normalisation, intégré à l'application `JuriTCOM`, a pour objectif de traiter et de normaliser les données brutes des décisions de justice provenant des TCOM et validées lors de la collecte, afin de les rendre cohérentes et exploitables par le processus de publication de Judilibre.

Pour référence, le processus de normalisation des décisions des tribunaux judiciaires est détaillé dans le script [normalization.ts](https://github.com/Cour-de-cassation/juritj/blob/dev/src/batch/normalization/normalization.ts) du projet [JuriTJ](https://github.com/Cour-de-cassation/juritj). Seule l'étape 4 de ce processus (transformation de la décision intègre WordPerfect en document texte brut) ne concerne pas la normalisation des décisions des TCOM (la transformation en texte brut étant effectuée en amont par l'instance émettrice).

En résumé :

- Récupération des décisions brutes en attente de normalisation dans le bucket S3 privé (texte brut et métadonnées définies par le [Swagger](./swagger_tcom_collecte.json)) ;
- Traitement et normalisation des décisions brutes suivant différents modules de normalisation, se concentrant chacun sur un aspect spécifique des données et appliquant des règles de normalisation prédéfinies (lesquelles peuvent utiliser des fichiers de configuration au format JSON pour définir les mappages et les valeurs prédéfinies devant être associées à certains codes ou identifiants reçus). Une attention particulièr est portée sur les données relatives aux occultations complémentaires (afin que l'application Label puisse traiter au mieux la décision), ainsi qu'à toutes les informations susceptibles de valider le caractère public de la décision (en cas d'anomalie ou d'indétermination, la décision doit être bloquée en lui appliquant l'un des états `labelStatus` prédéfinis, par exemple : `ignored_decisionNonPublique`, `ignored_dateDecisionIncoherente`, `ignored_controleRequis`, etc.) ;
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
