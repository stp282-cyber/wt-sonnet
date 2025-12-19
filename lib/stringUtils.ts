/**
 * Normalizes an answer string for flexible comparison.
 * Converts to lowercase, removes all non-alphanumeric characters, and trims whitespace.
 * 
 * @param answer The answer string to normalize
 * @returns The normalized string containing only lowercase letters and numbers
 */
export function normalizeAnswer(answer: string): string {
    if (!answer) return '';
    return answer
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}
