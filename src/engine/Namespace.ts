export const namespaced =
  <T extends object>(namespace: string, values: T) =>
  (context: any): any => {
    const parts = namespace.split('.');
    const last = parts.pop()!;

    let base = { ...context };
    let target = base;

    for (const key of parts) {
      target[key] = { ...(target[key] ?? {}) };
      target = target[key];
    }

    target[last] = {
      ...(target[last] ?? {}),
      ...values,
    };

    return base;
  };

export const fromNamespace = <T = any>(context: any, namespace: string): T => {
  const parts = namespace.split('.');
  let current = context;

  for (const key of parts) {
    if (current == null) return {} as T;
    current = current[key];
  }

  return current ?? ({} as T);
};
