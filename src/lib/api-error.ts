export function extractApiErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const e = error as { response?: { data?: { message?: string } } };
    return e.response?.data?.message || fallback;
  }
  return fallback;
}
