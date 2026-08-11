export type Locale = 'ru' | 'en';

export type TranslationParams = Record<string, string | number>;

/** Recursively maps literal translation trees to plain strings (for locale variants). */
export type DeepStringRecord<T> = T extends string
  ? string
  : T extends readonly string[]
    ? string[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: DeepStringRecord<T[K]> }
      : never;
