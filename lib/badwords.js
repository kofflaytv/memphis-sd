const BAD_WORDS = [
  'хуй', 'пизда', 'блядь', 'пидор', 'гандон',
  'еблан', 'долбоеб', 'пидр', 'хуесос', 'шлюха',
  'нахуй', 'ебать', 'ебал', 'пиздец', 'залупа',
  'выблядок', 'ублюдок',
  'fuck', 'shit', 'cunt',
  'dick', 'pussy', 'whore', 'slut', 'motherfucker',
  'hui', 'pizda', 'blyad', 'blyat', 'pidor', 'pidr', 'huilo',
  'huy', 'nahuy', 'naxuy', 'ebat', 'ebal', 'pizdec',
  'dolboeb', 'gandon',
  'e6aть', 'e6al', 'naxui', 'nahui', 'xui', 'xuy', '6lyad',
  'х\\.у\\.й', 'п\\.з\\.д\\а', 'б\\.л\\я',
  'негр', 'нигер', 'nigger', 'nigga', 'niga', 'нига',
  'чурка', 'хач', 'хохол', 'москаль',
  'даун', 'даунич'
];

export function containsBadWords(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some(word => lowerText.includes(word));
}

export function findBadWord(text) {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  for (const word of BAD_WORDS) {
    if (lowerText.includes(word)) return word;
  }
  return null;
}

export function findAllBadWords(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const found = [];
  for (const word of BAD_WORDS) {
    if (lowerText.includes(word)) found.push(word);
  }
  return found;
}

export default BAD_WORDS;
