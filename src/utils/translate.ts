export function interpolateWith<T extends Record<string, string | number>>(
  input: string,
  data: T
): string {
  const regex = /\$[a-zA-Z]+/g;

  return input.replace(regex, match => {
    const originalKey = match.slice(1);

    const keyLower = originalKey.toLowerCase();
    const value = data[keyLower];

    if (value === undefined) {
      return match;
    }

    if (originalKey === originalKey.toUpperCase()) {
      return String(value).toUpperCase();
    } else if (originalKey === originalKey.toLowerCase()) {
      return String(value).toLowerCase();
    } else if (
      originalKey[0] === originalKey[0].toUpperCase() &&
      originalKey.slice(1) === originalKey.slice(1).toLowerCase()
    ) {
      return (
        String(value).charAt(0).toUpperCase() +
        String(value).slice(1).toLowerCase()
      );
    } else {
      return String(value);
    }
  });
}
