import * as dotenv from 'dotenv'
dotenv.config()

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

import { CollectDto } from '../shared/infrastructure/dto/collect.dto'

import {
  OccultationComplementaireDto,
  MetadonneeDto
} from '../shared/infrastructure/dto/metadonnee.dto'

import { DecisionTCOMDTO, DecisionOccultation, Categories, LabelStatus } from 'dbsder-api-types'

import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common'

import axios from 'axios'

async function main(jurisdiction: string) {
  if (!jurisdiction) {
    throw new Error('Usage : <script> jurisdiction')
  }

  let doneCount = 0
  const decisions = await listDecisions('juritcom', jurisdiction)
  for (let i = 0; i < decisions.length; i++) {
    try {
      const decision: DecisionTCOMDTO = await getDecisionById(decisions[i]._id)
      if (
        /ignored/i.test(decision.labelStatus) === false &&
        /blocked/i.test(decision.labelStatus) === false
      ) {
        const done = await reprocessDecision(decision)
        if (done) {
          console.log(`Reprocess ${decisions[i]._id}`)
          doneCount++
        }
      }
    } catch (e) {
      console.log(`Skip ${decisions[i]._id}: error`, e)
    }
  }

  console.log(`Reprocessed ${doneCount} decisions`)
}

async function listDecisions(source: string, jurisdiction: string) {
  const urlToCall = process.env.DBSDER_API_URL + '/v1/decisions'
  const params: any = {
    sourceName: source
  }
  if (jurisdiction !== 'all' && jurisdiction !== '*') {
    params.jurisdiction = jurisdiction
  }
  const result = await axios
    .get(urlToCall, {
      params: params,
      headers: {
        'x-api-key': process.env.DBSDER_OTHER_API_KEY
      }
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.BAD_REQUEST
          })
          throw new BadRequestException(
            'DbSderAPI Bad request error : ' + error.response.data.message
          )
        } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.UNAUTHORIZED
          })
          throw new UnauthorizedException('You are not authorized to call this route')
        } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.CONFLICT
          })
          throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
        } else {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
        }
      }
      throw new ServiceUnavailableException('DbSder API is unavailable')
    })

  return result.data
}

async function getDecisionById(id: string): Promise<DecisionTCOMDTO> {
  const urlToCall = process.env.DBSDER_API_URL + `/v1/decisions/${id}`

  const result = await axios
    .get(urlToCall, {
      headers: {
        'x-api-key': process.env.DBSDER_OTHER_API_KEY
      }
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.BAD_REQUEST
          })
          throw new BadRequestException(
            'DbSderAPI Bad request error : ' + error.response.data.message
          )
        } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.UNAUTHORIZED
          })
          throw new UnauthorizedException('You are not authorized to call this route')
        } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.CONFLICT
          })
          throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
        } else {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
        }
      }
      throw new ServiceUnavailableException('DbSder API is unavailable')
    })

  return result.data
}

async function saveDecision(decisionToSave: DecisionTCOMDTO) {
  const urlToCall = process.env.DBSDER_API_URL + '/v1/decisions'

  const result = await axios
    .put(
      urlToCall,
      { decision: decisionToSave },
      {
        headers: {
          'x-api-key': process.env.DBSDER_API_KEY
        }
      }
    )
    .catch((error) => {
      if (error.response) {
        if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.BAD_REQUEST
          })
          throw new BadRequestException(
            'DbSderAPI Bad request error : ' + error.response.data.message
          )
        } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.UNAUTHORIZED
          })

          throw new UnauthorizedException('You are not authorized to call this route')
        } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.CONFLICT
          })
          throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
        } else {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
        }
      }
      throw new ServiceUnavailableException('DbSder API is unavailable')
    })

  return result.data
}

async function reprocessDecision(decision: DecisionTCOMDTO): Promise<boolean> {
  const s3Client = new S3Client({
    endpoint: process.env.S3_URL,
    forcePathStyle: true,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  })
  const reqParams = {
    Bucket: process.env.S3_BUCKET_NAME_NORMALIZED,
    Key: decision.filenameSource
  }
  try {
    const decisionFromS3 = await s3Client.send(new GetObjectCommand(reqParams))
    const stringifiedDecision = await decisionFromS3.Body?.transformToString()
    const objectDecision: CollectDto = JSON.parse(stringifiedDecision)
    if (
      objectDecision &&
      objectDecision.metadonnees &&
      `${objectDecision.metadonnees.idDecision}.json` === decision.filenameSource
    ) {
      if (
        decision.occultation.categoriesToOmit.includes(Categories.PERSONNEMORALE) === false ||
        decision.occultation.categoriesToOmit.includes(Categories.NUMEROSIRETSIREN) === false ||
        decision.occultation.categoriesToOmit.includes(
          Categories.PROFESSIONNELMAGISTRATGREFFIER
        ) === false
      ) {
        decision.occultation = {
          additionalTerms: '',
          categoriesToOmit: [],
          motivationOccultation: false
        }
        decision.occultation = computeOccultation(objectDecision.metadonnees)
        decision.labelStatus = LabelStatus.TOBETREATED
        delete decision._id
        await saveDecision(decision)
        return true
      } else {
        throw new Error(
          `Keep occultations ${JSON.stringify(decision.occultation.categoriesToOmit)}`
        )
      }
    } else {
      throw new Error('Decision incomplete or ID mismatch')
    }
  } catch (error) {
    console.error(error)
    return false
  }
}

function computeOccultation(metadonnees: MetadonneeDto): DecisionOccultation {
  const occultationsComplementaires: OccultationComplementaireDto =
    metadonnees.occultationsComplementaires
  const categoriesToOmitRaw = []
  const additionalTermsRaw = []

  const motivationOccultation =
    occultationsComplementaires.motifsDebatsChambreConseil === true ||
    occultationsComplementaires.motifsSecretAffaires === true

  // Apply block 3:
  categoriesToOmitRaw.push(Categories.PERSONNEMORALE)
  categoriesToOmitRaw.push(Categories.NUMEROSIRETSIREN)
  categoriesToOmitRaw.push(Categories.PROFESSIONNELMAGISTRATGREFFIER)

  const categoriesToOmit = categoriesToOmitRaw.filter(
    (value, index, array) => array.indexOf(value) === index
  )

  if (occultationsComplementaires.conserverElement) {
    for (let item of `${occultationsComplementaires.conserverElement}`.split('|')) {
      item = item.trim()
      if (item !== '') {
        additionalTermsRaw.push(`+${item}`)
      }
    }
  }

  if (occultationsComplementaires.supprimerElement) {
    for (let item of `${occultationsComplementaires.supprimerElement}`.split('|')) {
      item = item.trim()
      if (item !== '') {
        additionalTermsRaw.push(item)
      }
    }
  }

  const additionalTerms = additionalTermsRaw
    .filter((value, index, array) => array.indexOf(value) === index)
    .join('|')

  return {
    additionalTerms,
    categoriesToOmit,
    motivationOccultation
  }
}

main(process.argv[2])
