// StayNest PG search + filter logic with wishlist persistence
// IMPORTANT: This file now integrates Razorpay end-to-end using the backend as source of truth.
// Booking is created in MongoDB before payment, then payment is verified on the backend.

const STORAGE_KEY = 'stayNestWishlist';
const REVIEW_STORAGE_KEY = 'stayNestReviews';

const API_BASE_URL = 'http://localhost:5000/api';

function getAuthToken() {
  return localStorage.getItem('staynest_token') || null;
}

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }
  return data;
}

function setBookingLoading(isLoading) {
  const bookingForm = document.getElementById('bookingForm');
  const submitBtn = bookingForm?.querySelector('button[type="submit"], button.btn-primary');
  if (submitBtn) submitBtn.disabled = !!isLoading;
  if (bookingForm) bookingForm.dataset.loading = isLoading ? '1' : '0';
}

function showBookingAlert(message, type = 'success') {
  const bookingAlert = document.getElementById('bookingAlert');
  if (!bookingAlert) return;
  bookingAlert.classList.remove('d-none');
  bookingAlert.className = `alert alert-${type} mt-4`;
  bookingAlert.innerHTML = message;
}

function hideBookingAlert() {
  const bookingAlert = document.getElementById('bookingAlert');
  if (!bookingAlert) return;
  bookingAlert.classList.add('d-none');
  bookingAlert.textContent = '';
}


const pgData = [
  {
    id: 1,
    name: 'Sunrise Premium PG',
    gender: 'Boys PG',
    price: 6500,
    budget: 'budget',
    location: 'Gomti Nagar, Lucknow',
    distance: '1.2 KM from College',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    features: ['WiFi', 'AC', 'Food Included', 'Gym'],
  },
  {
    id: 2,
    name: 'Comfort Girls PG',
    gender: 'Girls PG',
    price: 7200,
    budget: 'budget',
    location: 'Aliganj, Lucknow',
    distance: '1 KM from College',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156',
    features: ['WiFi', 'Food Included', 'Laundry', 'Parking'],
  },
  {
    id: 3,
    name: 'Elite Luxury Hostel',
    gender: 'Boys PG',
    price: 9500,
    budget: 'mid',
    location: 'Hazratganj, Lucknow',
    distance: '2 KM from College',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
    features: ['WiFi', 'Study Room', 'Security', 'Parking'],
  },
  {
    id: 4,
    name: 'Campus Breeze PG',
    gender: 'Girls PG',
    price: 11500,
    budget: 'mid',
    location: 'Dilkusha, Lucknow',
    distance: '1.4 KM from College',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
    features: ['WiFi', 'AC', 'Food Included', 'Housekeeping'],
  },
  {
    id: 5,
    name: 'NestHub Budget Rooms',
    gender: 'Boys PG',
    price: 5800,
    budget: 'budget',
    location: 'Gomti Nagar, Lucknow',
    distance: '0.9 KM from College',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
    features: ['WiFi', 'Food Included', 'Locker', 'Study Table'],
  },
  {
    id: 6,
    name: 'Urban Chic PG',
    gender: 'Girls PG',
    price: 13500,
    budget: 'premium',
    location: 'Aishbagh, Lucknow',
    distance: '1.7 KM from College',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
    features: ['WiFi', 'AC', 'Food Included', 'Gym'],
  },
];

const state = {
  searchInput: document.getElementById('searchInput'),
  filterCheckboxes: document.querySelectorAll('.filter-checkbox'),
  budgetSelect: document.getElementById('budgetSelect'),
  pgContainer: document.getElementById('pgContainer'),
  noResultsMessage: document.getElementById('noResultsMessage'),
  wishlistCounter: document.getElementById('wishlistCount'),
  wishlist: [],
};

// Roommate storage key and state
const ROOMMATE_KEY = 'stayNestRoommates';
state.roommates = [];

// Sample roommate profiles to seed matches (for demo)
const sampleRoommates = [
  { id: 101, name: 'Aarav', gender: 'Male', budget: 8000, studyStyle: 'Early Bird', prefs: ['NonSmoker', 'NoPets'] },
  { id: 102, name: 'Meera', gender: 'Female', budget: 9000, studyStyle: 'Night Owl', prefs: ['FoodShared'] },
  { id: 103, name: 'Karan', gender: 'Male', budget: 7000, studyStyle: 'Quiet', prefs: ['NonSmoker'] },
  { id: 104, name: 'Sana', gender: 'Female', budget: 12000, studyStyle: 'Social', prefs: ['NoPets', 'FoodShared'] },
];

/**
 * Load saved roommates from localStorage (returns array)
 */
function getSavedRoommates() {
  const raw = localStorage.getItem(ROOMMATE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save roommate profile to localStorage
 */
function saveRoommateProfile(profile) {
  const all = getSavedRoommates();
  all.push(profile);
  localStorage.setItem(ROOMMATE_KEY, JSON.stringify(all));
}

/**
 * Simple matching algorithm: score based on budget proximity, same studyStyle, and shared prefs
 */
function computeMatchScore(target, candidate) {
  let score = 0;

  // budget: closer budgets get higher score
  const budgetDiff = Math.abs(Number(target.budget) - Number(candidate.budget));
  score += Math.max(0, 30 - budgetDiff / 100); // up to 30 points

  // study style match
  if (target.studyStyle !== 'Any' && candidate.studyStyle === target.studyStyle) score += 40;

  // preferences overlap
  const shared = (target.prefs || []).filter(p => (candidate.prefs || []).includes(p));
  score += shared.length * 10;

  return score;
}

/**
 * Find top matches for a profile
 */
function findMatchesForProfile(profile, maxResults = 6, filters = {}) {
  // source candidates: saved profiles + sample
  const saved = getSavedRoommates();
  const candidates = [...sampleRoommates, ...saved].filter(p => p.id !== profile.id);

  // optional filter by studyStyle
  let filtered = candidates;
  if (filters.studyStyle && filters.studyStyle !== 'Any') {
    filtered = filtered.filter(c => c.studyStyle === filters.studyStyle);
  }

  const scored = filtered.map(c => ({ c, score: computeMatchScore(profile, c) }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map(s => s.c);
}

/**
 * Create HTML for a roommate card
 */
function buildRoommateCard(rm) {
  const prefs = (rm.prefs || []).map(p => `<span>${p}</span>`).join('');
  return `
    <div class="col-md-6">
      <div class="roommate-card">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="mb-1">${rm.name}</h6>
            <div class="meta">${rm.gender} • ₹${rm.budget} • ${rm.studyStyle}</div>
          </div>
          <div class="text-end">
            <div class="roommate-actions">
              <button class="btn btn-sm btn-outline-primary contact-rm" data-rm-id="${rm.id}">Contact</button>
            </div>
          </div>
        </div>
        <div class="prefs">${prefs}</div>
      </div>
    </div>
  `;
}

/**
 * Render matches area based on current filters and saved profile (if any)
 */
function renderRoommateMatches(profile) {
  const container = document.getElementById('rmMatches');
  const noResults = document.getElementById('rmNoResults');
  if (!container) return;

  const filterStyle = document.getElementById('rmFilterStudy')?.value || 'Any';
  const matches = findMatchesForProfile(profile, 8, { studyStyle: filterStyle });

  if (matches.length === 0) {
    container.innerHTML = '';
    noResults.classList.remove('d-none');
    return;
  }

  noResults.classList.add('d-none');
  container.innerHTML = matches.map(buildRoommateCard).join('');
}

/**
 * Load wishlist data from localStorage.
 * @returns {number[]}
 */
function getSavedWishlist() {
  const storedData = localStorage.getItem(STORAGE_KEY);

  try {
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.warn('Unable to parse wishlist storage', error);
    return [];
  }
}

/**
 * Save wishlist state back to localStorage.
 * @param {number[]} wishlist
 */
function saveWishlistToStorage(wishlist) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
}

/**
 * Check if a PG is saved in wishlist.
 * @param {number} pgId
 * @returns {boolean}
 */
function isInWishlist(pgId) {
  return state.wishlist.includes(pgId);
}

/**
 * Update the navbar wishlist counter.
 */
function updateWishlistCounter() {
  if (state.wishlistCounter) {
    state.wishlistCounter.textContent = state.wishlist.length;
  }
}

/**
 * Toggle wishlist on/off for a PG.
 * @param {number} pgId
 */
function toggleWishlist(pgId) {
  const index = state.wishlist.indexOf(pgId);

  if (index === -1) {
    state.wishlist.push(pgId);
  } else {
    state.wishlist.splice(index, 1);
  }

  saveWishlistToStorage(state.wishlist);
  updateWishlistCounter();
}

const initialReviews = {
  1: [
    {
      name: 'Aditi',
      rating: 5,
      comment: 'Great location and very friendly staff.',
      date: 'Apr 2025',
    },
    {
      name: 'Rohit',
      rating: 4,
      comment: 'Good for budget-conscious students.',
      date: 'May 2025',
    },
  ],
  2: [
    {
      name: 'Sneha',
      rating: 4,
      comment: 'Clean rooms and safe atmosphere.',
      date: 'Mar 2025',
    },
  ],
  3: [
    {
      name: 'Mukul',
      rating: 5,
      comment: 'Excellent common area and security.',
      date: 'Feb 2025',
    },
  ],
  4: [
    {
      name: 'Priya',
      rating: 4,
      comment: 'Premium feel with reasonable pricing.',
      date: 'Jan 2025',
    },
  ],
  5: [
    {
      name: 'Anish',
      rating: 4,
      comment: 'Best budget stay near campus.',
      date: 'Jun 2025',
    },
  ],
  6: [
    {
      name: 'Nisha',
      rating: 5,
      comment: 'Stylish rooms and fast WiFi.',
      date: 'Mar 2025',
    },
  ],
};

/**
 * Get saved reviews from localStorage.
 * @returns {Object[]}
 */
function getSavedReviews() {
  const storedData = localStorage.getItem(REVIEW_STORAGE_KEY);

  try {
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.warn('Unable to parse review storage', error);
    return [];
  }
}

/**
 * Save a new review to localStorage.
 * @param {Object} review
 */
function saveReviewToStorage(review) {
  const storedReviews = getSavedReviews();
  storedReviews.push(review);
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(storedReviews));
}

/**
 * Returns all reviews for a specific PG.
 * @param {number} pgId
 * @returns {Object[]}
 */
function getReviewsForPg(pgId) {
  const savedReviews = getSavedReviews().filter(review => review.pgId === pgId);
  return [...(initialReviews[pgId] || []), ...savedReviews];
}

/**
 * Calculate average rating and total review count for a PG.
 * @param {number} pgId
 * @returns {{average:number, count:number}}
 */
function calculateRatingSummary(pgId) {
  const reviews = getReviewsForPg(pgId);
  const count = reviews.length;

  if (count === 0) {
    return { average: 0, count: 0 };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: total / count, count };
}

/**
 * Render rating stars for a value.
 * @param {number} value
 * @returns {string}
 */
function renderStars(value) {
  const fullStars = Math.floor(value);
  const halfStar = value - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  let result = '';

  for (let i = 0; i < fullStars; i++) {
    result += '<i class="bi bi-star-fill"></i>';
  }

  if (halfStar) {
    result += '<i class="bi bi-star-half"></i>';
  }

  for (let i = 0; i < emptyStars; i++) {
    result += '<i class="bi bi-star"></i>';
  }

  return result;
}

/**
 * Render review cards inside the modal.
 * @param {Object[]} reviews
 * @returns {string}
 */
function renderReviewList(reviews) {
  if (reviews.length === 0) {
    return '<p class="text-muted">No reviews yet. Be the first to share your experience.</p>';
  }

  return reviews
    .map(
      review => `
      <div class="review-item">
        <div class="review-summary">
          <h6>${review.name}</h6>
          <span>${renderStars(review.rating)}</span>
        </div>
        <p>${review.comment}</p>
        <span>${review.date}</span>
      </div>
    `,
    )
    .join('');
}

/**
 * Open review modal for the selected PG.
 * @param {number} pgId
 */
function openReviewModal(pgId) {
  const selectedPg = pgData.find(pg => pg.id === pgId);
  if (!selectedPg) {
    return;
  }

  const selectedReviewPgName = document.getElementById('selectedReviewPgName');
  const selectedReviewPgId = document.getElementById('selectedReviewPgId');
  const reviewAlert = document.getElementById('reviewAlert');
  const reviewForm = document.getElementById('reviewForm');
  const reviewList = document.getElementById('reviewList');

  if (reviewForm) {
    reviewForm.reset();
  }

  if (selectedReviewPgName) {
    selectedReviewPgName.textContent = selectedPg.name;
  }

  if (selectedReviewPgId) {
    selectedReviewPgId.value = selectedPg.id;
  }

  if (reviewAlert) {
    reviewAlert.classList.add('d-none');
    reviewAlert.textContent = '';
  }

  if (reviewList) {
    reviewList.innerHTML = renderReviewList(getReviewsForPg(pgId));
  }
}

/**
 * Attach review button listeners after rendering cards.
 */
function attachReviewListeners() {
  const reviewButtons = document.querySelectorAll('.review-btn');

  reviewButtons.forEach(button => {
    button.addEventListener('click', event => {
      const pgId = Number(event.currentTarget.dataset.pgId);
      openReviewModal(pgId);
    });
  });
}

/**
 * Build HTML for a single PG card.
 * @param {Object} pg
 * @returns {string}
 */
function buildPGCard(pg) {
  const featureSpans = pg.features
    .map(feature => `<span>${feature}</span>`)
    .join('');

  const savedClass = isInWishlist(pg.id) ? 'active' : '';
  const heartIcon = isInWishlist(pg.id) ? 'bi-heart-fill' : 'bi-heart';
  const reviewSummary = calculateRatingSummary(pg.id);
  const stars = renderStars(reviewSummary.average);

  return `
    <div class="col-lg-4 col-md-6">
      <div class="luxury-card">
        <div class="image-box">
          <img src="${pg.image}" alt="${pg.name}" />
          <button
            type="button"
            class="wishlist-btn ${savedClass}"
            data-pg-id="${pg.id}"
            aria-label="Save to wishlist"
          >
            <i class="bi ${heartIcon}"></i>
          </button>
          <div class="image-overlay">
            <div class="overlay-content">
              <h4>${pg.name}</h4>
              <p>Starting From ₹${pg.price.toLocaleString()}</p>
              <div class="overlay-buttons">
                <a href="#">View Details</a>
                <button
                  type="button"
                  class="booking-btn"
                  data-pg-id="${pg.id}"
                  data-bs-toggle="modal"
                  data-bs-target="#bookingModal"
                >
                  Book Now
                </button>
                <button
                  type="button"
                  class="review-btn"
                  data-pg-id="${pg.id}"
                  data-bs-toggle="modal"
                  data-bs-target="#reviewModal"
                >
                  Add Review
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-details">
          <div class="top-content">
            <h3>${pg.name}</h3>
            <span class="price">₹${pg.price.toLocaleString()}</span>
          </div>
          <p class="location">${pg.location} • ${pg.distance}</p>
          <div class="review-summary">
            <div class="rating-stars">${stars}</div>
            <span class="review-count">${reviewSummary.count} reviews</span>
          </div>
          <div class="facilities">${featureSpans}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach wishlist button click listeners after rendering cards.
 */
function attachWishlistListeners() {
  const buttons = document.querySelectorAll('.wishlist-btn');

  buttons.forEach(button => {
    button.addEventListener('click', event => {
      const pgId = Number(event.currentTarget.dataset.pgId);
      toggleWishlist(pgId);
      updateResults();
    });
  });
}

/**
 * Open booking modal for the selected PG.
 * @param {number} pgId
 */
function openBookingModal(pgId) {
  const selectedPg = pgData.find(pg => pg.id === pgId);
  if (!selectedPg) {
    return;
  }

  const selectedPgName = document.getElementById('selectedPgName');
  const selectedPgId = document.getElementById('selectedPgId');
  const bookingAlert = document.getElementById('bookingAlert');
  const bookingForm = document.getElementById('bookingForm');

  if (bookingForm) {
    bookingForm.reset();
  }

  if (selectedPgName) {
    selectedPgName.textContent = selectedPg.name;
  }

  if (selectedPgId) {
    selectedPgId.value = selectedPg.id;
  }

  if (bookingAlert) {
    bookingAlert.classList.add('d-none');
    bookingAlert.textContent = '';
  }

  const bookingModalElement = document.getElementById('bookingModal');
  if (bookingModalElement && window.bootstrap?.Modal) {
    const bookingModal = new bootstrap.Modal(bookingModalElement);
    bookingModal.show();
  }
}

/**
 * Save a booking to localStorage.
 * @param {Object} bookingData
 */
function saveBooking(bookingData) {
  const BOOKINGS_KEY = 'stayNestBookings';
  const storedBookings = localStorage.getItem(BOOKINGS_KEY);
  const bookings = storedBookings ? JSON.parse(storedBookings) : [];

  bookings.push(bookingData);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

/**
 * Attach book buttons on each card after render.
 */
function attachBookingListeners() {
  const bookButtons = document.querySelectorAll('.booking-btn');

  bookButtons.forEach(button => {
    button.addEventListener('click', event => {
      const pgId = Number(event.currentTarget.dataset.pgId);
      openBookingModal(pgId);
    });
  });
}

/**
 * Apply active search and filter settings to the PG data.
 * @returns {Object[]}
 */
function filterPGData() {
  const query = state.searchInput.value.trim().toLowerCase();
  const selectedFilters = Array.from(state.filterCheckboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  const selectedGenders = selectedFilters.filter(value => value === 'Boys PG' || value === 'Girls PG');
  const selectedFeatures = selectedFilters.filter(value => value !== 'Boys PG' && value !== 'Girls PG');

  return pgData.filter(pg => {
    const matchesSearch = [pg.name, pg.location, pg.gender, pg.features.join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(query);

    const matchesGender =
      selectedGenders.length === 0 || selectedGenders.includes(pg.gender);

    const matchesFeatures = selectedFeatures.every(feature => pg.features.includes(feature));

    const budgetValue = state.budgetSelect.value;
    const matchesBudget =
      budgetValue === 'all' ||
      (budgetValue === 'budget' && pg.price < 8000) ||
      (budgetValue === 'mid' && pg.price >= 8000 && pg.price <= 12000) ||
      (budgetValue === 'premium' && pg.price > 12000);

    return matchesSearch && matchesGender && matchesFeatures && matchesBudget;
  });
}

/**
 * Render the filtered cards in the UI.
 * @param {Object[]} filteredList
 */
function renderPGCards(filteredList) {
  if (filteredList.length === 0) {
    state.pgContainer.innerHTML = '';
    state.noResultsMessage.classList.remove('d-none');
    return;
  }

  state.noResultsMessage.classList.add('d-none');
  state.pgContainer.innerHTML = filteredList.map(buildPGCard).join('');
  attachWishlistListeners();
  attachBookingListeners();
  attachReviewListeners();
}

/**
 * Rebuild the card list when search or filters change.
 */
function updateResults() {
  const filteredList = filterPGData();
  renderPGCards(filteredList);
}

/**
 * Configure the UI event listeners for live search and filters.
 */
function setupEventListeners() {
  state.searchInput.addEventListener('input', updateResults);
  state.budgetSelect.addEventListener('change', updateResults);
  state.filterCheckboxes.forEach(element => {
    element.addEventListener('change', updateResults);
  });

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const selectedPgId = Number(document.getElementById('selectedPgId').value);
      const selectedPg = pgData.find(pg => pg.id === selectedPgId);
      const durationValue = document.getElementById('bookingDuration').value;
      const durationMonths = Number(durationValue.replace(/\D/g, '')) || 1;
      const bookingAmount = selectedPg ? selectedPg.price * durationMonths : 0;

      const bookingData = {
        pgId: selectedPgId,
        pgName: document.getElementById('selectedPgName').textContent,
        name: document.getElementById('bookingName').value.trim(),
        email: document.getElementById('bookingEmail').value.trim(),
        moveInDate: document.getElementById('bookingDate').value,
        duration: durationValue,
        notes: document.getElementById('bookingMessage').value.trim(),
        amount: bookingAmount,
        createdAt: new Date().toISOString(),
      };

      const bookingAlert = document.getElementById('bookingAlert');

      setBookingLoading(true);
      hideBookingAlert();

      // Production flow (MongoDB + JWT + Razorpay verification)
      // 1) Create booking in MongoDB
      // 2) Create Razorpay order on backend
      // 3) Open Razorpay checkout using backend-provided order_id
      // 4) Verify payment on backend
      (async () => {
        try {
          const token = getAuthToken();
          if (!token) {
            throw new Error('Please login to book a stay.');
          }

          const durationMonths = Number(durationValue.replace(/\D/g, '')) || 1;

          // Root frontend uses demo PG ids (numbers). Backend Booking expects pg as ObjectId.
          // We fail fast if the id isn't a Mongo ObjectId, to avoid creating invalid bookings.
          const pgId = selectedPgId;

          if (String(pgId).length !== 24) {
            throw new Error('PG id mismatch: this page provides demo PG ids. Open the integrated StayNest/frontend UI or connect PG ids from backend.');
          }

          const bookingPayload = {
            pg: pgId,
            startDate: document.getElementById('bookingDate').value,
            // endDate is optional for backend; but include it for completeness.
            endDate: new Date(new Date(document.getElementById('bookingDate').value).getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
            totalPrice: bookingAmount,
          };

          const booking = await apiCall('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingPayload),
          });

          const orderData = await apiCall('/payments/order', {
            method: 'POST',
            body: JSON.stringify({
              bookingId: booking._id,
              amount: bookingAmount,
            }),
          });

          const options = {
            key: orderData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'StayNest',
            order_id: orderData.orderId,
            prefill: {
              name: bookingData.name,
              email: bookingData.email,
            },
            notes: {
              bookingId: booking._id,
              pgId: pgId,
            },
            handler: async function (response) {
              try {
                // Verify payment on backend
                await apiCall('/payments/verify', {
                  method: 'POST',
                  body: JSON.stringify({
                    bookingId: booking._id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });

                showBookingAlert(`Payment successful! Your booking for ${bookingData.pgName} is confirmed.`, 'success');
                event.target.reset();
                const bookingModalElement = document.getElementById('bookingModal');
                bootstrap.Modal.getInstance(bookingModalElement)?.hide();
              } catch (verifyErr) {
                console.error('verifyErr', verifyErr);
                showBookingAlert('Payment verification failed. Your booking is not confirmed.', 'danger');
              } finally {
                setBookingLoading(false);
              }
            },
            modal: {
              ondismiss: function () {
                showBookingAlert('Payment cancelled. Your booking remains pending.', 'warning');
                setBookingLoading(false);
              },
            },
            theme: { color: '#7c3aed' },
          };

          const rzp = new Razorpay(options);
          rzp.open();
        } catch (err) {
          console.error('Booking+payment error:', err);
          showBookingAlert(err.message || 'Booking failed', 'danger');
          setBookingLoading(false);
        }
      })();

    });
  }

  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const reviewData = {
        pgId: Number(document.getElementById('selectedReviewPgId').value),
        name: document.getElementById('reviewerName').value.trim(),
        rating: Number(document.getElementById('reviewRating').value),
        comment: document.getElementById('reviewComment').value.trim(),
        date: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      };

      saveReviewToStorage(reviewData);
      openReviewModal(reviewData.pgId);
      updateResults();

      const reviewAlert = document.getElementById('reviewAlert');
      if (reviewAlert) {
        reviewAlert.textContent = `Thank you! Your review has been added.`;
        reviewAlert.classList.remove('d-none');
      }

      event.target.reset();
    });
  }

  // Roommate form handling
  const roommateForm = document.getElementById('roommateForm');
  if (roommateForm) {
    roommateForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const profile = {
        id: Date.now(),
        name: document.getElementById('rmName').value.trim(),
        gender: document.getElementById('rmGender').value,
        budget: Number(document.getElementById('rmBudget').value) || 0,
        studyStyle: document.getElementById('rmStudyStyle').value,
        prefs: Array.from(document.querySelectorAll('.rm-pref:checked')).map(i => i.value),
        createdAt: new Date().toISOString(),
      };

      saveRoommateProfile(profile);

      // show matches for this profile
      renderRoommateMatches(profile);

      // reset form and show a small alert
      roommateForm.reset();
    });
  }

  // roommate filter change
  const rmFilterStudy = document.getElementById('rmFilterStudy');
  if (rmFilterStudy) {
    rmFilterStudy.addEventListener('change', function () {
      // pick most recent saved profile to base matches on
      const saved = getSavedRoommates();
      const recent = saved.length ? saved[saved.length - 1] : null;
      if (recent) renderRoommateMatches(recent);
    });
  }
}

// Initialize the dynamic listing module.
(function initStayNest() {
  if (!state.pgContainer) {
    return;
  }

  state.wishlist = getSavedWishlist();
  updateWishlistCounter();
  setupEventListeners();
  renderPGCards(pgData);
})();
