// Drop-in replacement for StayNest/frontend/api.js to provide detailed error logging.

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('staynest_token') || null;

window.addEventListener('storage', () => {
  authToken = localStorage.getItem('staynest_token') || null;
});

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  try {
    console.log('[API] ->', { url, endpoint, options: { method: options.method, hasBody: !!options.body } });

  const response = await fetch(url, { ...options, headers });

    // Read response as text first so we can show non-JSON errors too.
    const rawText = await response.text();

    let data = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = { _raw: rawText };
    }

    if (!response.ok) {
      console.error('[API] <- HTTP error', { status: response.status, url, endpoint, data });
      throw new Error(data?.message || `API Error: ${response.status}`);
    }

    console.log('[API] <- OK', { url, endpoint, data });
    return data;
  } catch (err) {
    console.error('[API] <- FETCH FAILED', { url, endpoint, name: err?.name, message: err?.message, stack: err?.stack });
    throw err;
  }
}

const auth = {
  register: (name, email, password) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }).then((res) => {
      authToken = res.token;
      localStorage.setItem('staynest_token', authToken);
      localStorage.setItem('staynest_user', JSON.stringify(res.user));
      return res;
    }),

  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((res) => {
      authToken = res.token;
      localStorage.setItem('staynest_token', authToken);
      localStorage.setItem('staynest_user', JSON.stringify(res.user));
      return res;
    }),

  logout: () => {
    authToken = null;
    localStorage.removeItem('staynest_token');
    localStorage.removeItem('staynest_user');
  },

  me: async () => {
    const data = await apiCall('/auth/me');
    if (data?.user) {
      localStorage.setItem('staynest_user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  },

  getUser: () => {
    const user = localStorage.getItem('staynest_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!authToken,
};

const pgs = {
  getAll: () => apiCall('/pgs'),
  getById: (id) => apiCall(`/pgs/${id}`),
  create: (data) => apiCall('/pgs', { method: 'POST', body: JSON.stringify(data) }),
};

const bookings = {
  create: (data) => apiCall('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => apiCall('/bookings'),
  getMy: () => apiCall('/bookings/me'),
};

const payments = {
  createOrder: (data) => apiCall('/payments/order', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data) => apiCall('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
};

const reviews = {
  create: (data) => apiCall('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getByPg: (pgId) => apiCall(`/reviews/${pgId}`),
};

const roommates = {
  create: (data) => apiCall('/roommates', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiCall(`/roommates${query ? '?' + query : ''}`);
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { auth, pgs, bookings, payments, reviews, roommates, apiCall };
}

