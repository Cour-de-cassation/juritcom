import { ApiProperty } from '@nestjs/swagger'
import { MetadonneeDto } from './metadonnee.dto'

export class CollectDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Décision intègre au format wordperfect.'
  })
  decisionIntegre: Express.Multer.File

  @ApiProperty({
    description: 'Metadonnées associées à la décision intègre.'
  })
  metadonnee: MetadonneeDto
}
