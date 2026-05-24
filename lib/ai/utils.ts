let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000

export async function throttle(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))

      const err = error as { response?: { status?: number }; message?: string }
      const message = err instanceof Error ? err.message : String(error)
      const isRetryable =
        message.includes("503") ||
        message.includes("429") ||
        message.includes("overloaded") ||
        message.includes("UNAVAILABLE") ||
        message.includes("network") ||
        message.includes("ECONNRESET") ||
        err?.response?.status === 503 ||
        err?.response?.status === 429

      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError
      }

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`API call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("Failed after retries")
}
