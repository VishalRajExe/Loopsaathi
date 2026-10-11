const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
      body: body instanceof FormData ? body : body == null ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the local API. Start Spring Boot on port 8080 and retry.', 0)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      typeof payload?.error === 'string' ? payload.error : `Request failed (${response.status}). Please retry.`,
      response.status,
    )
  }
  return payload
}

const query = (params) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') search.set(key, value)
  })
  return search.size ? `?${search}` : ''
}

export const api = {
  classifyText(text, signal) {
    const body = new FormData()
    body.append('text', text)
    return request('/classify', { method: 'POST', body, signal })
  },
  classifyPhoto(file, signal) {
    const body = new FormData()
    body.append('image', file)
    return request('/classify', { method: 'POST', body, signal })
  },
  wasteItems(search, signal) {
    return request(`/waste-items${query({ search })}`, { signal })
  },
  pickups(filters = {}, signal) {
    return request(`/pickups${query(filters)}`, { signal })
  },
  createPickup(body) {
    return request('/pickups', { method: 'POST', body })
  },
  acceptPickup(id) {
    return request(`/pickups/${encodeURIComponent(id)}/accept`, {
      method: 'PATCH', body: { collectorId: 'COLLECTOR-DEMO' },
    })
  },
  collectPickup(id, confirmedWeightKg) {
    return request(`/pickups/${encodeURIComponent(id)}/collect`, {
      method: 'PATCH', body: { confirmedWeightKg },
    })
  },
  deliverPickup(id, destinationId) {
    return request(`/pickups/${encodeURIComponent(id)}/deliver`, {
      method: 'PATCH', body: { destinationId },
    })
  },
  partners(stream, signal) {
    return request(`/partners${query({ stream })}`, { signal })
  },
  impact(signal) {
    return request('/impact', { signal })
  },
}
