const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('access_token')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Request failed')
  }
  
  return response.json()
}

export const authApi = {
  signup: (email: string, password: string) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: new URLSearchParams({
        username: email,
        password: password,
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),
    
  activate: (token: string) =>
    apiRequest(`/auth/activate?token=${token}`),
    
  getMe: () => apiRequest('/auth/me'),
}