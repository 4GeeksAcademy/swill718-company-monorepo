export function parseProfileUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch (error) {
    if (error instanceof TypeError) return null;
    throw error;
  }
}
