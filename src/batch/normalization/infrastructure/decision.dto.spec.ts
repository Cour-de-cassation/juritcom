import { mapDecisionNormaliseeToDecisionDto } from './decision.dto'
import { MockUtils } from '../../../shared/infrastructure/utils/mock.utils'

describe('mapDecisionNormaliseeToDecisionDto', () => {
  const mockUtils = new MockUtils()

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockUtils.dateNow)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('returns an object mapping decision from S3 to DBSDER API decision type', async () => {
    // GIVEN
    const { uniqueDecisionId, decisionContentNormalized, metadonneeDtoMock, decisionMock } =
      new MockUtils()

    // WHEN
    const mappedDecision = mapDecisionNormaliseeToDecisionDto(
      uniqueDecisionId,
      decisionContentNormalized,
      metadonneeDtoMock,
      'filename'
    )

    // THEN
    expect(mappedDecision).toMatchObject(decisionMock)
  })
})
