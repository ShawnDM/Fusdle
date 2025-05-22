/**
 * Generates letter placeholders for the answer
 * Example: "Hello World" -> "_ _ _ _ _   _ _ _ _ _"
 */
export function generateLetterPlaceholders(answer: string): string {
  return answer
    .split(' ')
    .map(word => 
      word
        .split('')
        .map(char => char.match(/[a-zA-Z]/) ? '_' : char)
        .join(' ')
    )
    .join('   ');
}

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