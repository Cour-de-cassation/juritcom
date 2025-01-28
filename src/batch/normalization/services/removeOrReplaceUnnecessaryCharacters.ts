import { characterReplacementMap } from '../infrastructure/characterReplacementMap'

export const replaceUnknownCharacters = (text: string) => {
  let replacedText = ''
  for (const character of text) {
    if (characterReplacementMap[character] == undefined) {
      replacedText += character
    } else {
      replacedText += characterReplacementMap[character]
    }
  }
  return replacedText
}

export const removeOrReplaceUnnecessaryCharacters = (rawString: string): string => {
  // Regular expressions to remove specific characters
  const tabOrPageBreakRegex = /\t|\f/gi
  const carriageReturnRegex = /\r\n|\r/gi
  const multipleSpaceRegex = /[ ]{2,}/gi
  const spaceAndReturnAndNonSpaceRegex = / \n(\S)/gim
  const wordBreakRegex = /(\S)-\n(\S)/gim
  // const nonSpaceAndReturnAndNonSpaceRegex = /(\S)\n(\S)/gim

  // Replace tab or pageBreak characters with an empty string
  const stringWithoutTabOrPageBreak = rawString.replace(tabOrPageBreakRegex, ' ')

  // Replace carriageReturn characters with a newline character
  const stringWithoutCarriageReturn = stringWithoutTabOrPageBreak.replace(carriageReturnRegex, '\n')

  // Try to get rid of useless newline and word break characters
  const stringWithoutSpaceAndReturnAndNonSpace = stringWithoutCarriageReturn.replace(
    spaceAndReturnAndNonSpaceRegex,
    ' $1'
  )
  
  const stringWithoutWordBreak = stringWithoutSpaceAndReturnAndNonSpace.replace(
    wordBreakRegex,
    '$1-$2'
  )
  
  /*
  const stringWithoutNonSpaceAndReturnAndNonSpace = stringWithoutWordBreak.replace(
    nonSpaceAndReturnAndNonSpaceRegex,
    '$1 $2'
  )
  */

  // Replace multiple consecutive spaces with a white space
  const stringWithoutConsecutiveSpaces = stringWithoutWordBreak.replace(
    multipleSpaceRegex,
    ' '
  )

  //replace tibetain characters
  const normalizedText = replaceUnknownCharacters(stringWithoutConsecutiveSpaces)

  return normalizedText
}
