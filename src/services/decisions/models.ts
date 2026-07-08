import { z } from 'zod'
import { ValidationError } from '../error'

export enum TypePartieExhaustive {
  PP = 'PP',
  PM = 'PM',
  AA = 'AA',
  NA = 'NA'
}

export enum QualitePartieExhaustive {
  F = 'F',
  G = 'G',
  I = 'I',
  J = 'J',
  K = 'K',
  L = 'L',
  M = 'M',
  N = 'N'
}

export enum JusticeFunctionTcom {
  GRF = 'GRF',
  JUG = 'JUG',
  PDT = 'PDT',
  PRO = 'PRO',
  JUS = 'JUS'
}

export enum JusticeRoleTcom {
  AVOCAT = 'AVOCAT',
  AVOCAT_GENERAL = 'AVOCAT GENERAL',
  RAPPORTEUR = 'RAPPORTEUR',
  MANDATAIRE = 'MANDATAIRE',
  PARTIE = 'PARTIE',
  AUTRE = 'AUTRE'
}

const CompositionSchema = z.object({
  fonction: z.nativeEnum(JusticeFunctionTcom).optional().nullable(),
  nom: z.string(),
  prenom: z.string().optional().nullable(),
  civilite: z.string().optional().nullable()
})

const AdresseSchema = z.object({
  numero: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  voie: z.string().optional().nullable(),
  codePostal: z.string().optional().nullable(),
  pays: z.string().optional().nullable(),
  localite: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  bureau: z.string().optional().nullable()
})

const PartieSchema = z.object({
  type: z.nativeEnum(TypePartieExhaustive),
  role: z.nativeEnum(JusticeRoleTcom),
  nom: z.string(),
  nomUsage: z.string().optional().nullable(),
  prenom: z.string().optional().nullable(),
  alias: z.string().optional().nullable(),
  prenomAutre: z.string().optional().nullable(),
  civilite: z.string().optional().nullable(),
  qualite: z.nativeEnum(QualitePartieExhaustive),
  adresse: AdresseSchema.optional().nullable()
})

const OccultationsComplementairesSchema = z.object({
  personneMorale: z.boolean(),
  personnePhysicoMoraleGeoMorale: z.boolean(),
  adresse: z.boolean(),
  dateCivile: z.boolean(),
  plaqueImmatriculation: z.boolean(),
  cadastre: z.boolean(),
  chaineNumeroIdentifiante: z.boolean(),
  coordonneeElectronique: z.boolean(),
  professionnelMagistratGreffier: z.boolean(),
  motifsDebatsChambreConseil: z.boolean(),
  motifsSecretAffaires: z.boolean(),
  conserverElement: z.string().optional().nullable(),
  supprimerElement: z.string().optional().nullable()
})

export const MetadonneeSchema = z.object({
  idDecision: z.string(),
  idGroupement: z.string().min(1).max(4),
  idJuridiction: z.string().regex(/^[0-9]{4}$/),
  libelleJuridiction: z.string().min(2).max(42),
  dateDecision: z.string().regex(/^[0-9]{8}$/),
  numeroDossier: z.string().min(1).max(20),
  idChambre: z.string().optional().nullable(),
  libelleChambre: z.string().optional().nullable(),
  idMatiere: z.string().optional().nullable(),
  libelleMatiere: z.string().optional().nullable(),
  idProcedure: z.string().optional().nullable(),
  libelleProcedure: z.string().optional().nullable(),
  decisionPublique: z.boolean(),
  debatChambreDuConseil: z.boolean(),
  interetParticulier: z.boolean(),
  composition: z.array(CompositionSchema).optional().nullable(),
  parties: z.array(PartieSchema).optional().nullable(),
  occultationsComplementaires: OccultationsComplementairesSchema.optional().nullable()
})

export type Metadonnee = z.infer<typeof MetadonneeSchema>
export type Composition = z.infer<typeof CompositionSchema>
export type Partie = z.infer<typeof PartieSchema>
export type Adresse = z.infer<typeof AdresseSchema>
export type OccultationsComplementaires = z.infer<typeof OccultationsComplementairesSchema>

export function parseMetadonnees(x: unknown): Metadonnee {
  const result = MetadonneeSchema.safeParse(x)
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message
    }))
    throw new ValidationError('Les métadonnées ne sont pas valides', errors)
  }
  return result.data
}
