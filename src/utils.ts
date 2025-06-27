/**
 * Converts a value into an array. If the value is already an array, it’s returned as-is.
 * If the value is null or undefined, an array with a default value is returned.
 * Otherwise, the value is wrapped in an array.
 *
 * @param value - The value to convert to an array.
 * @returns An array containing the input value, or an empty array if the input is null or undefined.
 */
export function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value
  return value === null || value === undefined ? [] : [value]
}

/**
 * Transforms Date instances into ISO string format across various data structures.
 * This function processes inputs immutably, returning new objects or arrays with Dates converted.
 * - Arrays: Maps each element recursively.
 * - Objects (not Dates): Copies properties, converting Date values to ISO strings.
 * - Date instances: Converts to ISO string or null if invalid.
 * - Other types: Returns unchanged.
 *
 * @param input The value to transform (array, object, Date, or primitive).
 * @returns A new transformed value with Dates as ISO strings.
 */
export function convertDatesToISO(input: any): any {
  if (Array.isArray(input)) return input.map(convertDatesToISO)

  if (input && typeof input === 'object' && !(input instanceof Date)) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(input)) {
      result[key] = convertDatesToISO(value)
    }

    return result
  }

  if (input instanceof Date) return formatDateToISO(input)

  return input
}

/**
 * Formats a Date object into an ISO string, handling invalid dates gracefully.
 * Returns null if the Date is invalid to prevent runtime errors.
 *
 * @param date The Date object to format.
 * @returns The ISO string representation or null if the date is invalid.
 */
export function formatDateToISO(date: Date): string | null {
  return date && !isNaN(date.getTime()) ? date.toISOString() : null
}

/**
 * Escapes special characters in a string to make it safe for Lucene-based queries (e.g., Solr).
 * Prevents query syntax misinterpretation by escaping characters like +, -, *, etc.
 *
 * @param text The input string to escape.
 * @returns The string with special characters escaped.
 */
export function escapeLuceneChars(text: string): string {
  if (typeof text !== 'string') return text

  return text
    .replace(/([+\-!(){}[\]^"~*?:\\/])/g, '\\$1') // Escape single special chars
    .replace(/&&/g, '\\&\\&') // Escape AND operator
    .replace(/\|\|/g, '\\|\\|') // Escape OR operator
}
