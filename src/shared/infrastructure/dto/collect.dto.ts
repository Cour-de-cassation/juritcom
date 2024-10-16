import { ApiProperty } from '@nestjs/swagger'
import { MetadonneeDto } from './metadonnee.dto'

export class CollectDto {
  @ApiProperty({
    type: 'string',
    description: 'Contenu de la décision intègre.'
  })
  texteDecisionIntegre: string

  @ApiProperty({
    description: 'Metadonnées associées à la décision intègre.'
  })
  metadonnees: MetadonneeDto
}
