/**
 * Парсит числовую строку в русской локали:
 *   "1 039"   → 1039
 *   "11,2"    → 11.2
 *   "1 039,5" → 1039.5
 *   ""        → null
 *
 * Возвращает число или null, если значение не распознано.
 */
export function parseRuNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;

    const raw = String(value).trim();
    if (raw === "") return null;

    const normalized = raw.replace(/\s/g, "").replace(",", ".");
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
}
