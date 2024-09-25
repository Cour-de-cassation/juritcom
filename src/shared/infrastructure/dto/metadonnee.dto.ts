import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import { QualitePartie, TypePartie } from 'dbsder-api-types'

export class CompositionDto {
  @ApiPropertyOptional({
    description: 'Fonction',
    type: String,
    example: 'GRF'
  })
  @IsString()
  @IsOptional()
  fonction?: string

  @ApiProperty({
    description: 'Nom',
    type: String,
    example: 'Dupond'
  })
  @IsString()
  nom: string

  @ApiPropertyOptional({
    description: 'Prénom',
    type: String,
    example: 'Henry'
  })
  @IsString()
  @IsOptional()
  prenom?: string

  @ApiPropertyOptional({
    description: 'Civilité',
    type: String,
    example: 'Monsieur'
  })
  @IsString()
  @IsOptional()
  civilite?: string
}

export class AdresseDto {
  @ApiPropertyOptional({
    description: "Numéro d'adresse",
    type: String,
    example: '20bis'
  })
  @IsString()
  @IsOptional()
  numero?: string

  @ApiPropertyOptional({
    description: "Type de voie d'adresse",
    type: String,
    example: 'rue'
  })
  @IsString()
  @IsOptional()
  type?: string

  @ApiPropertyOptional({
    description: "Voie d'adresse",
    type: String,
    example: 'du Bourg'
  })
  @IsString()
  @IsOptional()
  voie?: string

  @ApiPropertyOptional({
    description: 'Code postal',
    type: String,
    example: '39100'
  })
  @IsString()
  @IsOptional()
  @Matches('^[0-9]{5}$')
  codePostal?: string

  @ApiPropertyOptional({
    description: 'Localité',
    type: String,
    example: 'Dole'
  })
  @IsString()
  @IsOptional()
  localite?: string

  @ApiPropertyOptional({
    description: "Complement d'adresse",
    type: String,
    example: "Complement d'adresse"
  })
  @IsString()
  @IsOptional()
  complement?: string

  @ApiPropertyOptional({
    description: 'Bureau distributeur',
    type: String,
    example: 'Bureau distributeur'
  })
  @IsString()
  @IsOptional()
  bureau?: string
}

export class PartieDto {
  @ApiProperty({
    description: 'Type du partie de la décision',
    enum: TypePartie,
    example: TypePartie.PP
  })
  @IsEnum(TypePartie)
  type: TypePartie

  @ApiProperty({
    description: 'Nom du partie de la décision',
    type: String,
    example: 'Dupond'
  })
  @IsString()
  nom: string

  @ApiPropertyOptional({
    description: 'Nom usage du partie de la décision',
    type: String,
    example: 'Nom usage'
  })
  @IsString()
  @IsOptional()
  nomUsage?: string

  @ApiPropertyOptional({
    description: 'Prénom du partie de la décision',
    type: String,
    example: 'Julien'
  })
  @IsString()
  @IsOptional()
  prenom?: string

  @ApiPropertyOptional({
    description: 'Alias du partie de la décision',
    type: String,
    example: 'Jul'
  })
  @IsString()
  @IsOptional()
  alias?: string

  @ApiPropertyOptional({
    description: 'Prénoms autres du partie de la décision',
    type: String,
    example: 'Alain Patrick'
  })
  @IsString()
  @IsOptional()
  prenomAutre?: string

  @ApiPropertyOptional({
    description: 'Civilité du partie de la décision',
    type: String,
    example: 'Monsieur'
  })
  @IsString()
  @IsOptional()
  civilite?: string

  @ApiProperty({
    description: 'Qualité du partie de la décision',
    enum: QualitePartie,
    example: QualitePartie.I
  })
  @IsEnum(QualitePartie)
  qualite: QualitePartie

  @ApiProperty({
    description: 'Permet de factoriser la définition "Avocats", "Mandataires", "Autres"',
    type: String,
    example: 'Monsieur'
  })
  @IsString()
  role: string

  @ApiPropertyOptional({
    description: 'Adresse',
    type: AdresseDto,
    example: {
      numero: '20bis',
      type: 'rue',
      voie: 'du Bourg',
      codePostal: '39100',
      localite: 'Dole'
    }
  })
  @IsOptional()
  @IsDefined()
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => AdresseDto)
  adresse?: AdresseDto
}

export class OccultationComplementaireDto {
  @ApiProperty({
    description: 'Personne morale',
    type: Boolean,
    example: true
  })
  @IsBoolean()
  personneMorale: boolean

  @ApiProperty({
    description: 'Personne physico-morale géo-morale',
    type: Boolean,
    example: false
  })
  @IsBoolean()
  personnePhysicoMoraleGeoMorale: boolean

  @ApiProperty({
    description: 'Adresse',
    type: Boolean,
    example: true
  })
  @IsBoolean()
  adresse: boolean

  @ApiProperty({
    description: 'Date civile',
    type: Boolean,
    example: false
  })
  @IsBoolean()
  dateCivile: boolean

  @ApiProperty({
    description: "Plaque d'immatriculation",
    type: Boolean,
    example: true
  })
  @IsBoolean()
  plaqueImmatriculation: boolean

  @ApiProperty({
    description: 'Cadastre',
    type: Boolean,
    example: false
  })
  @IsBoolean()
  cadastre: boolean

  @ApiProperty({
    description: 'Chaine numéro identifiante',
    type: Boolean,
    example: false
  })
  @IsBoolean()
  chaineNumeroIdentifiante: boolean

  @ApiProperty({
    description: 'Coordonnée éléctronique',
    type: Boolean,
    example: true
  })
  @IsBoolean()
  coordonneeElectronique: boolean

  @ApiProperty({
    description: 'Professionnel Magistrat/Gréffier',
    type: Boolean,
    example: false
  })
  @IsBoolean()
  professionnelMagistratGreffier: boolean

  @ApiProperty({
    description: 'Motifs des débats de la chambre du conseil',
    type: Boolean,
    example: true
  })
  @IsBoolean()
  motifsDebatsChambreConseil: boolean

  @ApiProperty({
    description: "Motifs du secret d'affaires",
    type: Boolean,
    example: false
  })
  @IsBoolean()
  motifsSecretAffaires: boolean

  @ApiPropertyOptional({
    description: 'Conserver élément',
    type: String,
    example: '#dateCivile|automobile'
  })
  @IsString()
  @IsOptional()
  conserverElement: string

  @ApiPropertyOptional({
    description: 'Supprimer élément',
    type: String,
    example: '#magistratGreffe|120.000€'
  })
  @IsString()
  @IsOptional()
  supprimerElement: string
}

export class MetadonneeDto {
  @ApiProperty({
    description: 'Identifiant de la décision dans le système source TCOM',
    type: String,
    example: '66177ce6e5d'
  })
  @IsString()
  idDecision: string

  @ApiProperty({
    description: 'Identifiant de groupement',
    type: String,
    example: 'ABDC'
  })
  @IsString()
  @Length(1, 4)
  idGroupement: string

  @ApiProperty({
    description:
      'Identifiant de la juridiction émettrice propre au système d’information originel. Au format ^TJ[0-9]{4}$',
    type: String,
    example: 'TJ7500'
  })
  @IsString()
  @Matches('^TJ[0-9]{4}$')
  idJuridiction: string

  @ApiProperty({
    description: 'Libellé de la juridiction émettrice propre au système d’information originel.',
    type: String,
    example: 'Tribunal judiciaire de Paris'
  })
  @IsString()
  @Length(2, 42)
  libelleJuridiction: string

  @ApiProperty({
    description: 'Date de rendu de la décision. Au format : AAAAMMJJ',
    type: String,
    example: '20240322'
  })
  @IsString()
  @Matches('^[0-9]{8}$')
  @IsDateString()
  dateDecision: string

  @ApiProperty({
    description: 'Numéro du dossier au format ^[0-9]{2}/[0-9]{5}$.',
    type: String,
    example: '08/20240'
  })
  @IsString()
  @Length(1, 20)
  @Matches('^[0-9]{2}/[0-9]{5}$')
  numeroDossier: string

  @ApiPropertyOptional({
    description:
      'Identifiant de la chambre de la  juridiction émettrice au format ^[0-9a-zA-Z]{2}$',
    type: String,
    example: 'ID'
  })
  @IsString()
  @IsOptional()
  @Matches('^[0-9a-zA-Z]{2}$')
  idChambre?: string

  @ApiPropertyOptional({
    description: 'Intitulé complet de la chambre de la juridiction émettrice',
    type: String,
    example: 'libelleChambre'
  })
  @IsString()
  @IsOptional()
  libelleChambre?: string

  @ApiPropertyOptional({
    description: 'Code matière de la décision',
    type: String,
    example: 'code matière de la décision'
  })
  @IsString()
  @IsOptional()
  idMatiere?: string

  @ApiPropertyOptional({
    description: 'Intitulé complet associé au code matière de la décision',
    type: String,
    example: "Demande de nullité d'un bail"
  })
  @IsString()
  @IsOptional()
  libelleMatiere?: string

  @ApiPropertyOptional({
    description: 'Code de type de procédure',
    type: String,
    example: 'CODETYPEPROCEDURE'
  })
  @IsString()
  @IsOptional()
  idProcedure?: string

  @ApiPropertyOptional({
    description: 'Intitulé complet associé au type de procédure',
    type: String,
    example: 'Libellé type affaire '
  })
  @IsString()
  @IsOptional()
  libelleProcedure?: string

  @ApiProperty({
    description: 'Caractère public de la décision',
    type: Boolean,
    example: true
  })
  @IsBoolean()
  decisionPublique: boolean

  @ApiProperty({
    description: 'Caractère non public des débats précédant la décision',
    type: Boolean,
    example: false
  })
  @IsBoolean()
  debatChambreDuConseil: boolean

  @ApiProperty({
    description: 'caractère "d\'intérêt particulier" de la décision',
    type: Boolean,
    example: false
  })
  @IsBoolean()
  interetParticulier: boolean

  @ApiPropertyOptional({
    description: 'Liste des compositions de la décision',
    type: [CompositionDto],
    example: [
      {
        fonction: 'GRF',
        nom: 'Dupond',
        prenom: 'Henry',
        civilite: 'Monsieur'
      }
    ]
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompositionDto)
  composition: CompositionDto[]

  @ApiProperty({
    description: 'Liste des parties de la décision',
    type: [PartieDto],
    example: [
      {
        type: TypePartie.PP,
        role: 'PARTIE',
        nom: 'Dupond',
        prenom: 'Julien',
        civilite: 'Monsieur',
        qualite: QualitePartie.I,
        adresse: {
          numero: '20bis',
          type: 'rue',
          voie: 'du Bourg',
          codePostal: '39100',
          localite: 'Dole'
        }
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartieDto)
  @IsOptional()
  parties?: PartieDto[]

  @ApiProperty({
    description: 'Occultations complémentaires',
    type: OccultationComplementaireDto,
    example: {
      personneMorale: true,
      personnePhysicoMoraleGeoMorale: false,
      adresse: true,
      dateCivile: false,
      plaqueImmatriculation: true,
      cadastre: false,
      chaineNumeroIdentifiante: false,
      coordonneeElectronique: true,
      professionnelMagistratGreffier: false,
      motifsDebatsChambreConseil: true,
      motifsSecretAffaires: false,
      conserverElement: '#dateCivile|automobile',
      supprimerElement: '#magistratGreffe|120.000€'
    }
  })
  @IsDefined()
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => OccultationComplementaireDto)
  @IsOptional()
  occultationsComplementaires?: OccultationComplementaireDto
}
