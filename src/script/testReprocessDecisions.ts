import { DbSderApiGateway } from '../batch/normalization/repositories/gateways/dbsderApi.gateway'

const dbSderApiGateway = new DbSderApiGateway()
let batchSize: number

async function main(count: string) {
  batchSize = parseInt(count, 10)

  if (isNaN(batchSize)) {
    batchSize = 100
  }

  const decisions = await dbSderApiGateway.listDecisions(
    'juritcom',
    'ignored_controleRequis',
    new Date(process.env.COMMISSIONING_DATE).toISOString(),
    new Date('2025-03-04').toISOString()
  )

  console.log(decisions)
}

main(process.argv[2])
