const characterReplacementMapUnicode = {
  '4013': ' ',
  '64257': 'fi',
  '3844': 'É',
  '3845': '',
  '173': '',
  '768': '',
  '710': '',
  '900': '',
  '3874': 'À',
  '3943': "'",
  '769': '',
  '3942': '€',
  '3986': '',
  '4017': '',
  '3938': '-',
  '4018': '',
  '3881': 'Ç',
  '64256': 'ff',
  '4003': '',
  '4006': '',
  '3918': '-',
  '4009': '',
  '3905': '',
  '7922': '-',
  '3967': '',
  '3876': 'Â',
  '3853': 'Ê',
  '3940': '-',
  '3934': '«',
  '3931': ' »',
  '3924': '-',
  '61623': '●',
  '61485': '●',
  '8712': '€',
  '12298': '«',
  '12299': '»',
  '65306': ':',
  '65289': ')',
  '65292': ',',
  '65288': '(',
  '19968': '-',
  '65294': '.',
  '65295': '/',
  '65307': ';',
  '61500': '●',
  '770': '^',
  '1077': 'e',
  '1089': 'c',
  '61644': '',
  '61489': '',
  '61488': '',
  '61494': '',
  '61639': '',
  '61477': '',
  '61562': '',
  '61637': '',
  '61548': '',
  '61556': '',
  '61502': '',
  '61646': '',
  '61537': '',
  '61498': '',
  '61543': '',
  '61552': '',
  '61546': '',
  '61515': '',
  '61565': '',
  '61480': '',
  '61566': '',
  '61635': '',
  '61636': '',
  '61507': '',
  '12289': '',
  '61516': '',
  '61534': '',
  '61549': '',
  '61472': '',
  '61475': '',
  '61555': '',
  '61527': '',
  '61503': '',
  '61607': '',
  '61482': '',
  '61656': '',
  '61506': '',
  '61493': '',
  '61561': '',
  '61520': '',
  '61487': '',
  '61490': '',
  '61525': '',
  '8595': ''
}

export const characterReplacementMap = Object.keys(characterReplacementMapUnicode).reduce(
  (result, key) => {
    result[String.fromCharCode(parseInt(key))] = characterReplacementMapUnicode[key]
    return result
  },
  {}
)
