/**
 * API Helper for StayNest Frontend
 * Centralizes all API calls to the backend
 * Handles: authentication, error handling, token management
 */

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('staynest_token') || null;

// Keep in sync with other tabs / after login
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    authToken = localStorage.getItem('staynest_token') || null;
  });
}


/**
 * Generic API request handler
 * Handles auth, errors, and responses
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

/**
 * Authentication APIs
 */
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

/**
 * PG APIs
 */
const pgs = {
  getAll: () => apiCall('/pgs'),
  getById: (id) => apiCall(`/pgs/${id}`),
  create: (data) => apiCall('/pgs', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Booking APIs
 */
const bookings = {
  create: (data) => apiCall('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  // Admin/internal endpoint
  getAll: () => apiCall('/bookings'),
  // User dashboard endpoint
  getMy: () => apiCall('/bookings/me'),
};


/**
 * Payment APIs
 */
const payments = {
  createOrder: (data) => apiCall('/payments/order', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data) => apiCall('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Review APIs
 */
const reviews = {
  create: (data) => apiCall('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getByPg: (pgId) => apiCall(`/reviews/${pgId}`),
};

/**
 * Roommate APIs
 */
const roommates = {
  create: (data) => apiCall('/roommates', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiCall(`/roommates${query ? '?' + query : ''}`);
  },
};

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { auth, pgs, bookings, payments, reviews, roommates, apiCall };
}
