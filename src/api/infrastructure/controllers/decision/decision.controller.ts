import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Put,
  Delete,
  Req,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { ReceiveDto } from '../../../../shared/infrastructure/dto/receive.dto'
import { MetadonneeDto } from '../../../../shared/infrastructure/dto/metadonnee.dto'
import {
  BadFileFormatException,
  BadFileSizeException
} from '../../exceptions/badFileFormat.exception'
import { StringToJsonPipe } from '../../pipes/stringToJson.pipe'
import { ValidateDtoPipe } from '../../pipes/validateDto.pipe'
import { LogsFormat } from '../../../../shared/infrastructure/utils/logsFormat.utils'
import { Request } from 'express'
import { BucketError } from '../../../../shared/domain/errors/bucket.error'
import { InfrastructureExpection } from '../../../../shared/infrastructure/exceptions/infrastructure.exception'
import { UnexpectedException } from '../../../../shared/infrastructure/exceptions/unexpected.exception'
import { SaveDecisionUsecase } from '../../../usecase/saveDecision.usecase'
import { DecisionS3Repository } from '../../../../shared/infrastructure/repositories/decisionS3.repository'
import { JwtAuthGuard } from '../../../../shared/infrastructure/security/auth/auth.guard'

const FILE_MAX_SIZE = {
  size: 10000000,
  readSize: '10Mo'
} as const

export interface DecisionResponse {
  jsonFileName: string | void
  pdfFileName: string | void
  body: string
}

@ApiBearerAuth()
@ApiTags('decision')
@Controller('/decision')
@UseGuards(JwtAuthGuard)
export class DecisionController {
  private readonly logger = new Logger()

  @Delete(':decisionId')
  @ApiOperation({
    summary: 'Supprimer une décision intègre',
    description:
      "Une décision intègre sera supprimée et, le cas échéant, dépubliée de Judilibre (fonctionnalité non implémentée pour l'instant)",
    operationId: 'deleteDecision'
  })
  @ApiParam({
    name: 'decisionId',
    type: 'string'
  })
  @ApiNoContentResponse({
    description:
      "L'ordre de suppression de la décision a bien été reçu, mais la suppression n'est pas encore implémentée pour l'instant."
  })
  @ApiNotFoundResponse({ description: 'La décision est introuvable' })
  @ApiBadRequestResponse({
    description: "La requête n'est pas correcte"
  })
  @ApiInternalServerErrorResponse({
    description: "Une erreur interne s'est produite"
  })
  @ApiUnauthorizedResponse({
    description: "La requête n'est pas autorisée"
  })
  @ApiServiceUnavailableResponse({
    description: "Une erreur inattendue liée à une dépendance de l'API a été rencontrée. "
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDecision(@Param('decisionId') decisionId: string, @Req() request: Request) {
    const routePath = request.method + ' ' + request.path
    const formatLogs: LogsFormat = {
      operationName: 'deleteDecision',
      httpMethod: request.method,
      path: request.path,
      msg: `Starting ${routePath}...`,
      correlationId: request.headers['x-correlation-id']
    }

    this.logger.log({
      ...formatLogs,
      msg: routePath + ' returns ' + HttpStatus.NO_CONTENT,
      data: {
        decisionId: decisionId
      },
      statusCode: HttpStatus.NO_CONTENT
    })

    return `L'ordre de suppression de la décision ${decisionId} a bien été reçu, mais la suppression n'est pas encore implémentée pour l'instant.`
  }

  @Put()
  @ApiOperation({
    summary: 'Ressource manipulant des décisions intègres',
    description:
      'Une décision intègre au format PDF ainsi que son contenu en texte brut et ses métadonnées associées seront téléchargés dans un but de pseudonymisation et de normalisation en aval par Judilibre',
    operationId: 'putDecision'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Les ressources pour modifier des décisions intègres sont :\n* PUT : envoi d\'une décision intègre',
    type: ReceiveDto
  })
  @ApiCreatedResponse({ description: 'La requête a été acceptée et va être traitée.' })
  @ApiBadRequestResponse({
    description: 'La requête n\'est pas correcte'
  })
  @ApiInternalServerErrorResponse({
    description: 'Une erreur interne s\'est produite'
  })
  @ApiUnauthorizedResponse({
    description: 'La requête n\'est pas autorisée'
  })
  @ApiServiceUnavailableResponse({
    description: 'Une erreur inattendue liée à une dépendance de l\'API a été rencontrée. '
  })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('fichierDecisionIntegre'))
  async receiveDecision(
    @UploadedFile() fichierDecisionIntegre: Express.Multer.File,
    @Body('texteDecisionIntegre') texteDecisionIntegre: string,
    @Body('metadonnees', new StringToJsonPipe(), new ValidateDtoPipe())
      metadonneeDto: MetadonneeDto,
    @Req() request: Request
  ): Promise<DecisionResponse> {
    if (!fichierDecisionIntegre || !isPdfFile(fichierDecisionIntegre.mimetype)) {
      throw new BadFileFormatException('fichierDecisionIntegre', 'PDF')
    }
    if (fichierDecisionIntegre.size >= FILE_MAX_SIZE.size) {
      throw new BadFileSizeException(FILE_MAX_SIZE.readSize)
    }

    const routePath = request.method + ' ' + request.path
    const decisionUseCase = new SaveDecisionUsecase(new DecisionS3Repository(this.logger))
    const formatLogs: LogsFormat = {
      operationName: 'putDecision',
      httpMethod: request.method,
      path: request.path,
      msg: `Starting ${routePath}...`,
      correlationId: request.headers['x-correlation-id']
    }

    const bucketFileDto = await decisionUseCase
      .putDecision(fichierDecisionIntegre, texteDecisionIntegre, metadonneeDto)
      .catch((error) => {
        if (error instanceof BucketError) {
          this.logger.error({
            ...formatLogs,
            msg: error.message,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
          throw new InfrastructureExpection(error.message)
        }
        this.logger.error({
          ...formatLogs,
          msg: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        })
        throw new UnexpectedException(error)
      })

    // Suppression des données sensibles décrite dans le fichier 2024 07 29 - Convention de code - logging.md
    // Les données sensibles sont par exemple le texte d'une décision ou les parties de cette décisions.
    delete metadonneeDto.parties
    delete metadonneeDto.composition

    this.logger.log({
      ...formatLogs,
      msg: routePath + ' returns ' + HttpStatus.CREATED,
      data: {
        decision: metadonneeDto
      },
      statusCode: HttpStatus.CREATED
    })

    return {
      jsonFileName: bucketFileDto.jsonFileName,
      pdfFileName: bucketFileDto.pdfFileName,
      body: `la décision a bien été prise en compte`
    }
  }
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}
