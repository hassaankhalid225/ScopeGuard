type ClassValue = string | number | null | false | undefined;

/** Minimal classnames helper — joins truthy class values with spaces. */
export function clsx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
