/**
 * Converts snake_case strings to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/(_\w)/g, (match) => match[1]?.toUpperCase() || "");
}

/**
 * Converts camelCase strings to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converts kebab-case strings to camelCase
 */
export function kebabToCamel(str: string): string {
  return str.replace(/(-\w)/g, (match) => match[1]?.toUpperCase() || "");
}

/**
 * Converts camelCase strings to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to Title Case
 */
export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
