import { hashDecisionId } from './hash.utils'
import { MockUtils } from './mock.utils'

describe('hashDecisionId', () => {
  it('returns hashed value of a normal string', () => {
    // GIVEN
    const testValue = 'test'
    const expectedHashedValue = 2087933171

    // WHEN
    const hashedValue = hashDecisionId(testValue)

    // THEN
    expect(hashedValue).toEqual(expectedHashedValue)
  })

  it('returns the hashed valued of a decisionId-like string', () => {
    // GIVEN
    const { uniqueDecisionId, decisionMock } = new MockUtils()

    // WHEN
    const hashedValue = hashDecisionId(uniqueDecisionId)

    // THEN
    expect(hashedValue).toEqual(decisionMock.sourceId)
  })
})
