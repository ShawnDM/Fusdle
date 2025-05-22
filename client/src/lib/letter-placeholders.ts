/**
 * Gets the word structure of an answer
 * Example: "Hello World" -> [5, 5] (two words with 5 letters each)
 */
export function getWordStructure(answer: string): number[] {
  return answer
    .split(' ')
    .map(word => word.replace(/[^a-zA-Z]/g, '').length)
    .filter(length => length > 0);
}