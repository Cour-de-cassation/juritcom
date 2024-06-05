# Workflow général du processus de collecte et de publication des décisions des TCOM

## Envoi (côté TCOM/Infogreffe)

1. Pour chaque décision à publier dans Judilibre (nouvelle ou mise à jour), la juridiction émettrice effectue une requête HTTPS `PUT /decision` sur l'API de collecte du SDER, suivant les spécifications du [Swagger](./swagger_tcom_collecte.json) (texte brut issu du fichier PDF, fichier PDF signé et métadonnées complètes) ;
2. La juridiction émettrice attend la réponse de l'API et agit suivant le code HTTP associée à celle-ci :
   - `201` : la décision a bien été prise en compte ;
   - `400` : la requête d'envoi est incorrecte (la réponse contient les erreurs constatées côté SDER) - la juridiction émettrice doit reprendre l'envoi dès que possible, avec une décision et des données corrigées ;
   - `401` : la requête d'envoi n'est pas autorisée (le certificat requis pour la requête manque ou a expiré) - la juridiction émettrice doit contacter l'équipe technique côté Infogreffe afin de vérifier les paramètres de connexion avant reprise de l'envoi ;
   - `500` : la requête d'envoi a généré une erreur interne côté SDER (la réponse contient les erreurs constatées) - la juridiction émettrice doit contacter l'équipe technique du SDER afin d'analyser les anomalies avant reprise de l'envoi.

**Note** : comme détaillé ci-après, l'analyse anti-virus du fichier PDF transmis s'effectuera en tâche de fond et séparément de la collecte. _La réponse à la requête d'envoi ne contiendra donc pas d'information relative au résultat de cette analyse anti-virus_ (en d'autres termes : la présence d'un virus dans le fichier PDF reçu n'est pas une cause d'erreur ni un critère bloquant pour la publication de la décision). En cas de détection _a posteriori_ d'un fichier PDF vérolé, l'instance émettrice en sera notifiée et pourra effectuer les actions nécessaires de son côté avant de procéder à un nouvel envoi. Cela n'aura pas d'impact sur le contenu publié dans Judilibre (qui se base sur la version texte brut soumise à l'origine).

## Collecte (application `JuriTCOM`, côté SDER/Open, plateforme privée) - **LOT1**

Chaque décision, reçue via le point d'entrée `PUT /decision` de l'application `JuriTCOM`, est validée et traitée _de manière synchrone_ :

- Vérification des éléments d'authentification, une erreur `401` étant retournée en cas d'anomalie ;
- Présence et validation des informations obligatoires (texte brut, fichier PDF signé et métadonnées) en suivant les spécifications du [Swagger](./swagger_tcom_collecte.json). En cas d'anomalie, une erreur `400` est retournée avec les détails des erreurs rencontrées ;
- L'ensemble de la décision dûment validée (hors fichier PDF) est stocké dans un bucket S3 privé (bucket "décisions brutes"), en vue de sa normalisation ultérieure, et une réponse `201` est aussitôt retournée ;
- En complément, le fichier PDF signé est déposé dans un espace de stockage prédéfini afin de le soumettre de manière passive à une analyse anti-virus effectuée en tâche de fond (_a priori_ en utilisant `ESET`).

## Normalisation (application `JuriTCOM`, côté SDER, plateforme privée) - **LOT2, a priori internalisé**

Le batch de normalisation, intégré à l'application `JuriTCOM`, a pour objectif de traiter et de normaliser les données brutes des décisions de justice provenant des TCOM et validées lors de la collecte, afin de les rendre cohérentes et exploitables par le processus de publication de Judilibre.

Pour référence, le processus de normalisation des décisions des tribunaux judiciaires est détaillé dans le script [normalization.ts](https://github.com/Cour-de-cassation/juritj/blob/dev/src/batch/normalization/normalization.ts) du projet [JuriTJ](https://github.com/Cour-de-cassation/juritj). Seule l'étape 4 de ce processus (transformation de la décision intègre WordPerfect en document texte brut) ne concerne pas la normalisation des décisions des TCOM (la transformation en texte brut étant effectuée en amont par l'instance émettrice).

En résumé :

- Récupération des décisions brutes en attente de normalisation dans le bucket S3 privé (bucket "décisions brutes", lesquelles contiennent le texte brut et les métadonnées définies par le [Swagger](./swagger_tcom_collecte.json)) ;
- Traitement et normalisation des décisions brutes suivant différents modules de normalisation, se concentrant chacun sur un aspect spécifique des données et appliquant des règles de normalisation prédéfinies (lesquelles peuvent utiliser des fichiers de configuration au format JSON pour définir les mappages et les valeurs prédéfinies devant être associées à certains codes ou identifiants reçus). Une attention particulière est portée sur les données relatives aux occultations complémentaires (afin que l'application Label puisse traiter au mieux la décision), ainsi qu'à toutes les informations susceptibles de valider le caractère public de la décision (en cas d'anomalie ou d'indétermination, la décision doit être bloquée en lui appliquant l'un des états `labelStatus` prédéfinis, par exemple : `ignored_decisionNonPublique`, `ignored_dateDecisionIncoherente`, `ignored_controleRequis`, etc.). Cette normalisation comprend les principales étapes suivantes :

  1.  Génération d'un identifiant unique si la propriété `idDecision` fournie par l'instance émettrice n'est pas exploitable (à réévaluer avec les premiers lots de test), cf. [generateUniqueId.ts](https://github.com/Cour-de-cassation/juritj/blob/dev/src/batch/normalization/services/generateUniqueId.ts) avec, pour les TCOM, l'utilisation des propriétés `idGroupement`, `idJuridiction`, `numeroDossier` et `dateDecision` ;
  1.  Suppression ou remplacement des caractères erronés ou inutiles, cf. [removeOrReplaceUnnecessaryCharacters.ts](https://github.com/Cour-de-cassation/juritj/blob/dev/src/batch/normalization/services/removeOrReplaceUnnecessaryCharacters.ts) (là aussi, à réévaluer avec les premiers lots de test) ;
  1.  Mappage des valeurs suivant les [spécifications de typage de l'API DBSDER](https://github.com/Cour-de-cassation/dbsder-api-types), cf. [decision.dto.ts](https://github.com/Cour-de-cassation/juritj/blob/dev/src/batch/normalization/infrastructure/decision.dto.ts), à reprendre suivant le Swagger des TCOM (pas nécessaire pour la phase de chiffrage, la structure de données étant analogue) ;
  1.  Calcul de l'état `labelStatus`, cf. [computeLabelStatus.ts](https://github.com/Cour-de-cassation/juritj/blob/dev/src/batch/normalization/services/computeLabelStatus.ts), à détailler pour les TCOM (pas nécessaire pour la phase de chiffrage, les règles étant analogues, débarrassées des contraintes du filtrage par code NAC propres aux TJ, et reposant sur des données plus précises, notamment via les propriétés collectées `decisionPublique` et `debatChambreDuConseil`) ;
  1.  Calcul des indicateurs d'occultation, cf. [computeOccultation.ts](https://github.com/Cour-de-cassation/juritj/blob/dev/src/batch/normalization/services/computeOccultation.ts), via la propriété structurée `occultationsComplementaires` :

      - Elaboration de la propriété `categoriesToOmit`, qui liste les catégories _ne devant pas être occultées_ à partir de celles dont l'occultation est demandée en amont (sous-propriétés booléennes de l'objet `occultationsComplementaires` : `personneMorale`, `personnePhysicoMoraleGeoMorale`, `adresse`, `dateCivile`, `plaqueImmatriculation`, `cadastre`, `chaineNumeroIdentifiante`, `coordonneeElectronique`, `professionnelMagistratGreffier`). Par défaut (occultations par défaut, à confirmer par le métier), la propriété `categoriesToOmit` vaut `['dateNaissance','dateMariage','dateDeces','numeroIdentifiant','professionnelMagistratGreffier','personneMorale','etablissement','numeroSiretSiren','adresse','localite','telephoneFax','email','siteWebSensible','compteBancaire','cadastre','plaqueImmatriculation']`. Il s'agit donc de retirer de cette liste par défaut les termes correspondant aux sous-propriétés de `occultationsComplementaires` valant `true` (règles de correspondance spécifiques à préciser pour certains termes, par exemple : la propriété `dateCivile` recouvre les catégories `dateNaissance`, `dateMariage` et `dateDeces`) ;

      - Elaboration de la propriété `additionalTerms` à partir des propriétés `motif` (booléen), `conserverElement` et `supprimerElement` (chaînes de caractères facultatives). Spécifications à confirmer par l'équipe Data Science du SDER (règles de traitement minimales).

- Enregistrement des décisions normalisées dans la collection `decisions` de la base de données SDER à l'aide de l'API DBSDER. Ces décisions deviennent disponibles pour la suite des traitements orchestrée par l'application Label.
- Les décisions normalisées doivent être archivées dans un autre bucket S3 privé (bucket "décisions normalisées") ;
- Les décisions brutes doivent être supprimées du bucket S3 privé (bucket "décisions brutes") à l'issue de la normalisation ;
- Les décisions en anomalie (erreur de normalisation, caractère non public, etc.) doivent être identifiées et bloquées en attendant que la juridiction émettrice soit notifiée et procède aux corrections nécessaires (avant une reprise de l'envoi).

### Batch de suivi de l'analyse anti-virus (application `JuriTCOM`, côté SDER, plateforme privée) - **LOT2 ? a priori internalisé**

Un autre batch, lui aussi intégré à l'application `JuriTCOM`, va analyser ponctuellement les résultats de l'analyse anti-virus des fichiers PDF déposés lors de la collecte :

- Si un virus est détecté, le fichier doit être supprimé et l'instance émettrice doit en être informée (génération d'une alerte ou de toute autre information pouvant être traitée _a posteriori_ par le SDER afin de permettre l'envoi d'un mail comprenant les détails requis : identification de la décision, date de collecte, nature de la menace détectée) ;
- En l'absence de virus, le fichier doit être archivé dans le bucket S3 privé qui le concerne, suivant l'état de la décision qui lui est associée (bucket "décisions brutes" ou bucket "décisions normalisées").

### Gestion des erreurs et journalisation

Tout au long des processus de collecte et de normalisation, les erreurs sont gérées et journalisées à l'aide du module de journalisation.

Les erreurs spécifiques, telles que les erreurs de validation ou les erreurs d'intégrité des données, sont capturées et traitées de manière appropriée.

### Exécution des batchs

Le batch de normalisation et le batch de suivi de l'analyse anti-virus sont exécutés périodiquement ou déclenchés manuellement pour traiter les nouvelles données ou mettre à jour les données existantes.

La fréquence et le mode d'exécution de ces batchs peuvent être configurés en fonction des besoins du projet.

## Pseudonymisation et validation (application `Label`, côté SDER, plateforme privée)

Le batch de pseudonymisation, géré par l'application `Label`, récupère les décisions en attente de traitement afin de lancer leur pseudonymisation, puis de procéder à leur relecture pour validation.

## Publication (application `judilibre-sder`, côté SDER, plateformes privée et publique)

Le batch de publication, intégré à l'application `judilibre-sder`, récupère les décisions validées par `Label` afin de les préparer pour leur indexation optimale via l'API Judilibre dans la base Elasticsearch publique.

Cette préparation est assurée par un module spécifique à chaque source de données (CC, CA, TJ, TCOM).

Jusqu'à nouvel ordre, les décisions de TCOM publiées dans Judilibre ne sont accompagnées d'aucun document joint (pas d'interaction avec le S3 public).
