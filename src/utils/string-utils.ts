/**
 * Converts a string from PascalCase to camelCase
 * @example PascalToCamelCase("InProgress") => "inProgress"
 */
export function pascalToCamelCase(str: string): string {
  return str.replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * Converts a space-separated string to camelCase
 * @example spacesToCamelCase("Computer Science") => "computerScience"
 */
export function spacesToCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, '');
}

/**
 * Converts any string to a valid object key by removing spaces and special characters
 * @example toObjectKey("Computer Science & Math") => "computerScienceMath"
 */
export function toObjectKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, '');
} 