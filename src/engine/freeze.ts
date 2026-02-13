export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const val of Object.values(obj)) deepFreeze(val);
  return obj;
}
