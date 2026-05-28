import { z } from 'zod'
import {
  JusticeFunctionTcom,
  JusticeRoleTcom,
  QualitePartieExhaustive,
  TypePartieExhaustive
} from 'dbsder-api-types'
import { ValidationError } from '../error'

const CompositionSchema = z.object({
  fonction: z.nativeEnum(JusticeFunctionTcom).optional(),
  nom: z.string(),
  prenom: z.string().optional(),
  civilite: z.string().optional()
})

const AdresseSchema = z.object({
  numero: z.string().optional(),
  type: z.string().optional(),
  voie: z.string().optional(),
  codePostal: z.string().optional(),
  pays: z.string().optional(),
  localite: z.string().optional(),
  complement: z.string().optional(),
  bureau: z.string().optional()
})

const PartieSchema = z.object({
  type: z.nativeEnum(TypePartieExhaustive),
  role: z.nativeEnum(JusticeRoleTcom),
  nom: z.string(),
  nomUsage: z.string().optional(),
  prenom: z.string().optional(),
  alias: z.string().optional(),
  prenomAutre: z.string().optional(),
  civilite: z.string().optional(),
  qualite: z.nativeEnum(QualitePartieExhaustive),
  adresse: AdresseSchema.optional()
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
  conserverElement: z.string().optional(),
  supprimerElement: z.string().optional()
})

export const MetadonneeSchema = z.object({
  idDecision: z.string(),
  idGroupement: z.string().min(1).max(4),
  idJuridiction: z.string().regex(/^[0-9]{4}$/),
  libelleJuridiction: z.string().min(2).max(42),
  dateDecision: z.string().regex(/^[0-9]{8}$/),
  numeroDossier: z.string().min(1).max(20),
  idChambre: z.string().optional(),
  libelleChambre: z.string().optional(),
  idMatiere: z.string().optional(),
  libelleMatiere: z.string().optional(),
  idProcedure: z.string().optional(),
  libelleProcedure: z.string().optional(),
  decisionPublique: z.boolean(),
  debatChambreDuConseil: z.boolean(),
  interetParticulier: z.boolean(),
  composition: z.array(CompositionSchema).optional(),
  parties: z.array(PartieSchema).optional(),
  occultationsComplementaires: OccultationsComplementairesSchema.optional(),
  date: z.unknown().optional()
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
