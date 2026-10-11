export function createLatestRequest() {
  let sequence = 0
  let controller = null
  return {
    begin() {
      controller?.abort()
      controller = new AbortController()
      const current = ++sequence
      const signal = controller.signal
      return {
        signal,
        isCurrent: () => current === sequence && !signal.aborted,
        finish: () => { if (current === sequence) controller = null },
      }
    },
    cancel() {
      sequence++
      controller?.abort()
      controller = null
    },
  }
}
