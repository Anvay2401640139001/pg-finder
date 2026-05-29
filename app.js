/**
 * StayNest Frontend App
 * Uses backend APIs instead of localStorage
 * Handles: PG rendering, search/filter, wishlist, bookings, reviews, roommates
 */

let appState = {
  pgs: [],
  filteredPgs: [],
  wishlist: [],
  currentUser: auth.getUser(),
};

let authMode = 'login';

// Initialize app
async function initApp() {
  try {
    // show skeletons while loading
    renderSkeletons();

    // Load current session and PGs from backend
    if (auth.isAuthenticated()) {
      const user = await auth.me().catch(() => null);
      appState.currentUser = user || auth.getUser();
    } else {
      appState.currentUser = auth.getUser();
    }

    appState.pgs = await pgs.getAll();
    appState.filteredPgs = [...appState.pgs];

    renderPGCards();
    setupEventListeners();
    updateWishlistCounter();
    updateAuthUI();
  } catch (err) {
    console.error('Init error:', err);
    showAlert('Error loading data from backend. Using demo data.', 'warning');
    // Fallback: use demo data if backend fails so UI can be previewed without backend
    appState.pgs = getDemoPgs();
    appState.filteredPgs = [...appState.pgs];
    renderPGCards();
    setupEventListeners();
    updateWishlistCounter();
    updateAuthUI();
  }
}

function renderSkeletons(count = 6) {
  const container = document.getElementById('pgContainer');
  if (!container) return;
  const skeletons = new Array(count).fill(0).map(() => `
    <div class="col-lg-4 col-md-6">
      <div class="luxury-card p-3">
        <div class="image-box" style="height:220px;background:linear-gradient(90deg,#f3f4f6,#eef2ff);border-radius:12px;"></div>
        <div class="card-details mt-3">
          <div style="height:18px;width:70%;background:#f3f4f6;border-radius:8px;margin-bottom:8px;"></div>
          <div style="height:14px;width:40%;background:#f3f4f6;border-radius:8px;margin-bottom:6px;"></div>
          <div style="height:12px;width:60%;background:#f3f4f6;border-radius:8px;margin-bottom:6px;"></div>
        </div>
      </div>
    </div>
  `).join('');
  container.innerHTML = skeletons;
}

// Demo PGs used when backend is not available so frontend UI can be previewed
function getDemoPgs() {
  return [
    {
      _id: 'demo1',
      title: 'Urban Chic PG',
      address: 'Aishbagh, Lucknow',
      city: 'Lucknow',
      rent: 13500,
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200'],
      features: ['WiFi', 'AC', 'Food Included', 'Gym'],
      description: 'Premium PG with modern amenities and safe locality.',
      distance: '1.7 KM from College',
    },
    {
      _id: 'demo2',
      title: 'Cozy Girls Hostel Downtown',
      address: 'Bandra, Mumbai',
      city: 'Mumbai',
      rent: 9500,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200'],
      features: ['Girls PG', 'AC', 'WiFi'],
      description: 'Safe and comfortable girls-only hostel.',
      distance: '0.9 KM from College',
    },
    {
      _id: 'demo3',
      title: 'Budget Student Hostel',
      address: 'College Road, Pune',
      city: 'Pune',
      rent: 6500,
      images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200'],
      features: ['WiFi', 'Food Included'],
      description: 'Affordable stays for students close to campus.',
      distance: '2.1 KM from College',
    },
  ];
}

// Render all PG cards
function renderPGCards() {
  const container = document.getElementById('pgContainer');
  const noResults = document.getElementById('noResultsMessage');

  if (!container) return;

  if (appState.filteredPgs.length === 0) {
    container.innerHTML = '';
    noResults.classList.remove('d-none');
    return;
  }

  noResults.classList.add('d-none');
  container.innerHTML = appState.filteredPgs.map(buildPGCard).join('');

  // Attach listeners to wishlist, booking, and review buttons
  document.querySelectorAll('.wishlist-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const pgId = e.currentTarget.dataset.pgId;
      toggleWishlist(pgId);
    });
  });

  document.querySelectorAll('.details-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const pgId = e.currentTarget.dataset.pgId;
      openDetailsModal(pgId);
    });
  });

  document.querySelectorAll('.book-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const pgId = e.currentTarget.dataset.pgId;
      openBookingModal(pgId);
    });
  });

  document.querySelectorAll('.review-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const pgId = e.currentTarget.dataset.pgId;
      openReviewModal(pgId);
    });
  });
}

// Build HTML for a single PG card
function buildPGCard(pg) {
  const title = pg.title || pg.name || 'Property';
  const city = pg.city || pg.location || '';
  const address = pg.address || pg.location || '';
  const rent = pg.rent ?? pg.price ?? 0;
  const images = pg.images || pg.image || [];
  const features = pg.features || pg.facilities || pg.amenities || [];

  const featureSpans = (features || []).map((f) => `<span>${f}</span>`).join('');
  const inWishlist = appState.wishlist.includes(pg._id);
  const heartIcon = inWishlist ? 'bi-heart-fill' : 'bi-heart';
  const savedClass = inWishlist ? 'active' : '';

  return `
    <div class="col-lg-4 col-md-6">
      <div class="luxury-card">
        <div class="image-box">
          <img src="${(Array.isArray(images) ? images[0] : images) || 'https://via.placeholder.com/300'}" alt="${title}" loading="lazy" />
          <button type="button" class="wishlist-btn ${savedClass}" data-pg-id="${pg._id}">
            <i class="bi ${heartIcon}"></i>
          </button>
          <div class="image-overlay">
            <h4>${title}</h4>
            <p>${city}</p>
            <div class="overlay-buttons">
              <button class="details-btn" data-pg-id="${pg._id}">View Details</button>
              <button class="book-btn" data-pg-id="${pg._id}">Book Now</button>
              <button class="review-btn" data-pg-id="${pg._id}">Reviews</button>
            </div>
          </div>
        </div>
        <div class="card-details">
          <div class="top-content">
            <h3>${title}</h3>
            <div class="price">₹${rent}</div>
          </div>
          <div class="location">${address}</div>
          <div class="facilities">${featureSpans}</div>
        </div>
      </div>
    </div>
  `;
}


// Toggle wishlist
function toggleWishlist(pgId) {
  const index = appState.wishlist.indexOf(pgId);
  if (index === -1) {
    appState.wishlist.push(pgId);
  } else {
    appState.wishlist.splice(index, 1);
  }
  localStorage.setItem('staynest_wishlist', JSON.stringify(appState.wishlist));
  updateWishlistCounter();
  renderPGCards(); // Update visual state
}

// Update wishlist counter
function updateWishlistCounter() {
  const counter = document.getElementById('wishlistCount');
  if (counter) counter.textContent = appState.wishlist.length;
}

// Open booking modal
function openBookingModal(pgId) {
  // Allow booking for both authenticated users and guests

  const pg = appState.pgs.find((p) => p._id === pgId);
  if (!pg) return;

  document.getElementById('selectedPgName').textContent = pg.title;
  document.getElementById('selectedPgId').value = pgId;
  document.getElementById('bookingForm').reset();
  document.getElementById('bookingAlert').classList.add('d-none');

  const currentUser = appState.currentUser || auth.getUser();
  if (currentUser) {
    document.getElementById('bookingName').value = currentUser.name || '';
    document.getElementById('bookingEmail').value = currentUser.email || '';
  }

  new bootstrap.Modal(document.getElementById('bookingModal')).show();
}

// Handle booking form submission
document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();


  try {
    const pgId = document.getElementById('selectedPgId').value;
    const selectedPg = appState.pgs.find((p) => p._id === pgId);
    const bookingDate = document.getElementById('bookingDate').value;
    const durationMonths = parseInt(document.getElementById('bookingDuration').value, 10);
    const totalPrice = Number(selectedPg?.rent || 0) * durationMonths;

    if (!selectedPg || !bookingDate || !durationMonths) {
      throw new Error('Please complete all booking details.');
    }

    const bookingPayload = {
      pg: pgId,
      startDate: bookingDate,
      endDate: new Date(new Date(bookingDate).getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalPrice,
      guestName: document.getElementById('bookingName').value,
      guestEmail: document.getElementById('bookingEmail').value,
    };

    const booking = await bookings.create(bookingPayload);

    const orderData = await payments.createOrder({
      bookingId: booking._id,
      amount: totalPrice,
    });

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'StayNest',
      description: 'Booking token amount',
      order_id: orderData.orderId,
      prefill: {
        name: document.getElementById('bookingName').value,
        email: document.getElementById('bookingEmail').value,
      },
      notes: {
        bookingId: booking._id,
        pgId,
      },
      theme: {
        color: '#7c3aed',
      },
      handler: async function (response) {
        try {
          await payments.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: booking._id,
          });

          showAlert('Payment successful! Your booking is confirmed.', 'success');
          document.getElementById('bookingForm').reset();
          setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
          }, 1200);
        } catch (verifyError) {
          console.error('Payment verify error:', verifyError);
          showAlert('Payment verification failed. Please contact support.', 'danger');
        }
      },
      modal: {
        ondismiss: function () {
          showAlert('Payment cancelled. Your booking remains pending.', 'warning');
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error('Booking submit error:', err);
    showAlert(`Booking failed: ${err.message}`, 'danger');
  }
});

// Open review modal
async function openReviewModal(pgId) {
  if (!auth.isAuthenticated()) {
    showAlert('Please login to write a review', 'info');
    new bootstrap.Modal(document.getElementById('loginModal')).show();
    return;
  }

  const pg = appState.pgs.find((p) => p._id === pgId);
  if (!pg) return;

  document.getElementById('selectedReviewPgName').textContent = pg.title;
  document.getElementById('selectedReviewPgId').value = pgId;
  document.getElementById('reviewForm').reset();

  // Load reviews for this PG
  try {
    const pgReviews = await reviews.getByPg(pgId);
    const reviewList = document.getElementById('reviewList');
    if (pgReviews.length === 0) {
      reviewList.innerHTML = '<p class="text-muted">No reviews yet. Be the first!</p>';
    } else {
      reviewList.innerHTML = pgReviews
        .map(
          (r) => `
        <div class="review-item">
          <h6>${r.user?.name || 'Anonymous'}</h6>
          <div class="rating-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          <p>${r.comment}</p>
          <span>${new Date(r.createdAt).toLocaleDateString()}</span>
        </div>
      `,
        )
        .join('');
    }
  } catch (err) {
    console.error('Error loading reviews:', err);
  }

  new bootstrap.Modal(document.getElementById('reviewModal')).show();
}


// Open PG details modal
async function openDetailsModal(pgId) {
  const pg = appState.pgs.find((p) => p._id === pgId);
  if (!pg) return;

  // Populate hero
  document.getElementById('detailsHeroImage').src = (Array.isArray(pg.images) ? pg.images[0] : pg.images) || 'https://via.placeholder.com/1200x500';
  document.getElementById('detailsTitle').textContent = pg.title || pg.name;
  document.getElementById('detailsLocation').textContent = (pg.address || pg.city || pg.location) + ' • ' + (pg.distance || '—');
  document.getElementById('detailsPrice').textContent = pg.rent ?? pg.price ?? 0;

  // Reviews and rating
  try {
    const pgReviews = await reviews.getByPg(pgId);
    const avg = pgReviews.length ? Math.round((pgReviews.reduce((s, r) => s + (r.rating || 0), 0) / pgReviews.length)) : 0;
    document.getElementById('detailsStars').textContent = '★'.repeat(avg) + '☆'.repeat(5 - avg);
    document.getElementById('detailsReviewCount').textContent = `${pgReviews.length} reviews`;
  } catch (err) {
    document.getElementById('detailsStars').textContent = '☆☆☆☆☆';
    document.getElementById('detailsReviewCount').textContent = '';
  }

  // Features
  const features = pg.features || pg.facilities || pg.amenities || [];
  const featuresDiv = document.getElementById('detailsFeatures');
  featuresDiv.innerHTML = (features || []).map(f => `<span class="badge bg-light text-purple me-2">${f}</span>`).join('');

  // Description
  document.getElementById('detailsDescription').textContent = pg.description || pg.summary || '';

  // Wishlist icon state
  const inWishlist = appState.wishlist.includes(pg._id);
  const heart = document.getElementById('modalHeartIcon');
  heart.className = inWishlist ? 'bi bi-heart-fill' : 'bi bi-heart';

  // Book and review buttons inside modal
  document.getElementById('detailsBookBtn').onclick = () => openBookingModal(pgId);
  document.getElementById('detailsReviewBtn').onclick = () => openReviewModal(pgId);

  // Modal wishlist toggle
  document.getElementById('modalWishlistBtn').onclick = (e) => {
    e.preventDefault();
    toggleWishlist(pgId);
    const nowIn = appState.wishlist.includes(pgId);
    heart.className = nowIn ? 'bi bi-heart-fill' : 'bi bi-heart';
  };

  // Set map iframe src based on pg address/city
  try {
    const addr = encodeURIComponent((pg.address || pg.city || pg.location || '').trim());
    const iframe = document.getElementById('detailsMapIframe');
    const mapsLink = document.getElementById('openInMapsLink');
    if (addr && iframe) {
      iframe.src = `https://www.google.com/maps?q=${addr}&output=embed`;
      if (mapsLink) mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${addr}`;
    } else if (iframe) {
      iframe.src = `https://www.google.com/maps?q=india&output=embed`;
      if (mapsLink) mapsLink.href = `https://www.google.com/maps`;
    }
  } catch (e) {
    console.warn('Map set failed', e);
  }

  const modalInstance = new bootstrap.Modal(document.getElementById('pgDetailsModal'));
  modalInstance.show();
  // focus modal title for keyboard users
  setTimeout(() => {
    const title = document.getElementById('pgDetailsModalLabel');
    if (title) title.focus();
  }, 120);
}

// Handle review form submission
document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!auth.isAuthenticated()) {
    showAlert('Please login first', 'warning');
    return;
  }

  try {
    const review = {
      pg: document.getElementById('selectedReviewPgId').value,
      rating: parseInt(document.getElementById('reviewRating').value),
      comment: document.getElementById('reviewComment').value,
    };

    await reviews.create(review);
    showAlert('Review posted successfully!', 'success');
    document.getElementById('reviewForm').reset();
    setTimeout(() => {
      bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
    }, 1500);
  } catch (err) {
    showAlert(`Review failed: ${err.message}`, 'danger');
  }
});

// Initialize Bootstrap tooltips for onboarding and hints
document.addEventListener('DOMContentLoaded', () => {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (el) {
    return new bootstrap.Tooltip(el, {trigger: 'hover focus'});
  });
});

// Card reveal using IntersectionObserver
function initRevealObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  const cards = document.querySelectorAll('.luxury-card, .roommate-card, .service-box');
  cards.forEach((c) => observer.observe(c));
}

// Simple onboarding tour: shows tooltips on key elements sequentially
async function runTour() {
  try {
    if (localStorage.getItem('staynest_tour_seen')) return;
    const steps = [];
    const search = document.getElementById('searchInput');
    const filters = document.getElementById('budgetSelect');
    const firstCardBtn = document.querySelector('.book-btn');
    if (search) steps.push({ el: search, title: 'Search', content: 'Search by PG name or area.' });
    if (filters) steps.push({ el: filters, title: 'Budget filters', content: 'Filter listings by budget ranges.' });
    if (firstCardBtn) steps.push({ el: firstCardBtn, title: 'Book', content: 'Click here to book a room quickly.' });

    for (const s of steps) {
      const tip = new bootstrap.Tooltip(s.el, { title: `<strong>${s.title}</strong><div>${s.content}</div>`, html: true, placement: 'bottom', trigger: 'manual' });
      tip.show();
      await new Promise((r) => setTimeout(r, 2200));
      tip.dispose();
    }

    localStorage.setItem('staynest_tour_seen', '1');
  } catch (e) {
    console.warn('Tour failed', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // wire take tour button
  document.getElementById('takeTourBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    // allow repeating tour
    localStorage.removeItem('staynest_tour_seen');
    runTour();
  });

  // run reveal observer after small delay to ensure cards exist
  setTimeout(initRevealObserver, 250);
});

// Theme toggle logic
function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('staynest_theme') || 'light';
  applyTheme(saved);
  if (btn) {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('staynest_theme', next);
    });
  }
}

// Toast helper
function showToast(message, type = 'info', timeout = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const id = 't' + Date.now();
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0 show`;
  toast.role = 'alert';
  toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.remove('show'); toast.remove(); }, timeout);
}

// Initialize theme toggle and bind to onboarding modal
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  // show onboarding modal once for first-time visitors
  if (!localStorage.getItem('staynest_seen_onboarding')) {
    const m = new bootstrap.Modal(document.getElementById('onboardingModal'));
    m.show();
    localStorage.setItem('staynest_seen_onboarding', '1');
  }
  document.getElementById('startTourBtn')?.addEventListener('click', () => {
    runTour();
    bootstrap.Modal.getInstance(document.getElementById('onboardingModal')).hide();
  });
});

// Roommate Finder: persistence via backend API
let roommatePool = [];

async function fetchRoommates(filters = {}) {
  try {
    const qs = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/roommates${qs ? '?' + qs : ''}`);
    if (!res.ok) throw new Error('Failed to load roommates');
    return await res.json();
  } catch (e) {
    console.warn('fetchRoommates failed', e);
    return [];
  }
}

async function createRoommate(profile) {
  try {
    const res = await fetch('/api/roommates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to create roommate');
    return await res.json();
  } catch (e) {
    console.warn('createRoommate failed', e);
    return null;
  }
}

// Ensure we have some demo roommates on the server (if server empty)
async function ensureDemoRoommates() {
  const list = await fetchRoommates();
  if (list.length === 0) {
    const demo = [
      { name: 'Aisha', gender: 'female', budget: 9000, studyStyle: 'early', prefs: ['neat'], avatar: 'https://i.pravatar.cc/80?u=aisha' },
      { name: 'Rohit', gender: 'male', budget: 7000, studyStyle: 'night', prefs: ['music'], avatar: 'https://i.pravatar.cc/80?u=rohit' },
      { name: 'Sneha', gender: 'female', budget: 8500, studyStyle: 'balanced', prefs: ['pets'], avatar: 'https://i.pravatar.cc/80?u=sneha' },
      { name: 'Karan', gender: 'male', budget: 8000, studyStyle: 'balanced', prefs: ['neat','music'], avatar: 'https://i.pravatar.cc/80?u=karan' },
    ];
    for (const d of demo) {
      // best-effort seed
      await createRoommate(d);
    }
    const newList = await fetchRoommates();
    roommatePool = newList;
    return newList;
  }
  roommatePool = list;
  return list;
}

function renderMatches(matches) {
  const container = document.getElementById('compatibleList');
  const noMatches = document.getElementById('noMatches');
  container.innerHTML = '';
  if (!matches || matches.length === 0) {
    noMatches.classList.remove('d-none');
    return;
  }
  noMatches.classList.add('d-none');
  matches.forEach(m => {
    const col = document.createElement('div');
    col.className = 'col-12';
    col.innerHTML = `
      <div class="roommate-card">
        <img src="${m.avatar || 'https://via.placeholder.com/80'}" alt="${m.name}" loading="lazy" />
        <div class="roommate-info flex-fill">
          <h6>${m.name} <small class="text-muted">· ${m.studyStyle}</small></h6>
          <p>Budget: ₹${m.budget} • ${m.gender}</p>
          <div class="roommate-tags">
            ${(m.prefs||[]).map(p=>`<span class="badge bg-light text-purple">${p}</span>`).join('')}
          </div>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-2">Message</button>
          <button class="btn btn-sm btn-primary">Save</button>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

function matchRoommates(profile, pool) {
  if (!profile) return [];
  // Simple scoring: studyStyle match + gender preference (if not 'any') + budget proximity + shared prefs
  return (pool || []).map(p => {
    let score = 0;
    if (profile.studyStyle !== 'any' && p.studyStyle === profile.studyStyle) score += 30;
    if (profile.gender !== 'any' && p.gender === profile.gender) score += 20;
    const budgetDiff = Math.abs((p.budget||0) - (profile.budget||0));
    if (!isNaN(budgetDiff)) score += Math.max(0, 30 - Math.min(30, Math.round(budgetDiff/200)));
    const shared = (p.prefs||[]).filter(x => (profile.prefs||[]).includes(x)).length;
    score += shared * 10;
    return { ...p, score };
  }).filter(x => x.name).sort((a,b) => b.score - a.score);
}

async function initRoommateFinder() {
  const pool = await ensureDemoRoommates();
  renderMatches((pool || []).slice(0, 4));

  // preference button toggles
  document.querySelectorAll('.preference-btn').forEach(lbl => {
    lbl.addEventListener('click', () => {
      lbl.classList.toggle('active');
      const cb = lbl.querySelector('.pref-checkbox');
      if (cb) cb.checked = !cb.checked;
    });
  });

  document.getElementById('roommateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profile = {
      name: document.getElementById('rmName').value.trim(),
      gender: document.getElementById('rmGender').value,
      budget: Number(document.getElementById('rmBudget').value) || 0,
      studyStyle: document.getElementById('rmStudyStyle').value,
      prefs: Array.from(document.querySelectorAll('.pref-checkbox:checked')).map(i => i.value),
    };
    // persist to backend
    await createRoommate(profile);
    const poolList = await fetchRoommates();
    const matches = matchRoommates(profile, poolList);
    renderMatches(matches.length ? matches : poolList);
    const noMatches = document.getElementById('noMatches');
    if (matches.length === 0) noMatches.classList.remove('d-none');
    else noMatches.classList.add('d-none');
  });

  document.getElementById('rmFilterStudy')?.addEventListener('change', async (e) => {
    const val = e.target.value;
    const poolList = await fetchRoommates();
    const filtered = val === 'all' ? poolList : poolList.filter(p => p.studyStyle === val);
    renderMatches(filtered);
  });
}

// initialize roommate finder on load
document.addEventListener('DOMContentLoaded', initRoommateFinder);

// Search and filter
document.getElementById('searchInput')?.addEventListener('input', updateResults);
document.getElementById('budgetSelect')?.addEventListener('change', updateResults);
document.querySelectorAll('.filter-checkbox').forEach((cb) => {
  cb.addEventListener('change', updateResults);
});

function updateResults() {
  const searchText = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const budgetFilter = document.getElementById('budgetSelect')?.value || 'all';
  const selectedFeatures = Array.from(document.querySelectorAll('.filter-checkbox:checked')).map((cb) => cb.value);

  appState.filteredPgs = appState.pgs.filter((pg) => {
    const matchesSearch = pg.title.toLowerCase().includes(searchText) || (pg.address || '').toLowerCase().includes(searchText);
    const matchesBudget = budgetFilter === 'all' || (budgetFilter === 'budget' && pg.rent < 8000) || (budgetFilter === 'mid' && pg.rent >= 8000 && pg.rent <= 12000) || (budgetFilter === 'premium' && pg.rent > 12000);
    const matchesFeatures = selectedFeatures.length === 0 || selectedFeatures.some((f) => (pg.features || []).includes(f));

    return matchesSearch && matchesBudget && matchesFeatures;
  });

  renderPGCards();
}

// Authentication
document.getElementById('authForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('authName')?.value;
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const alertDiv = document.getElementById('authAlert');

  try {
    let response;

    if (authMode === 'register') {
      if (!name) {
        showAlert('Please enter your full name to register.', 'warning', alertDiv);
        return;
      }
      response = await auth.register(name, email, password);
      showAlert('Account created and logged in!', 'success', alertDiv);
    } else {
      response = await auth.login(email, password);
      showAlert('Logged in successfully!', 'success', alertDiv);
    }

    appState.currentUser = response?.user || auth.getUser();
    updateAuthUI();
    document.getElementById('authForm').reset();
    setAuthMode('login');
    setTimeout(() => {
      bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    }, 1500);
  } catch (err) {
    showAlert(`Auth failed: ${err.message}`, 'danger', alertDiv);
  }
});

function setAuthMode(mode) {
  authMode = mode;
  const authNameGroup = document.getElementById('authNameGroup');
  const authSubmitButton = document.getElementById('authSubmitButton');
  const authModalTitle = document.getElementById('authModalTitle');
  const authModalSubtitle = document.getElementById('authModalSubtitle');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  if (!authNameGroup || !authSubmitButton || !authModalTitle || !authModalSubtitle || !loginTab || !registerTab) {
    return;
  }

  if (mode === 'register') {
    authNameGroup.classList.remove('d-none');
    authSubmitButton.textContent = 'Register';
    authModalTitle.textContent = 'Create an account';
    authModalSubtitle.textContent = 'Register to manage your bookings and save favorites.';
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  } else {
    authNameGroup.classList.add('d-none');
    authSubmitButton.textContent = 'Login';
    authModalTitle.textContent = 'Student Login';
    authModalSubtitle.textContent = 'Sign in to manage your bookings and save favorites.';
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  }
}

// Helper: show alert
function showAlert(message, type = 'info', targetDiv = null) {
  const alertDiv = targetDiv || document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;

  if (targetDiv) {
    alertDiv.classList.remove('d-none');
  } else {
    document.body.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
  }
}

// Setup all event listeners
function setupEventListeners() {
  const authActionLink = document.getElementById('authActionLink');
  if (authActionLink) {
    authActionLink.addEventListener('click', handleAuthActionClick);
  }

  document.getElementById('loginTab')?.addEventListener('click', () => setAuthMode('login'));
  document.getElementById('registerTab')?.addEventListener('click', () => setAuthMode('register'));
  setAuthMode('login');
}

function handleAuthActionClick(event) {
  const authActionLink = document.getElementById('authActionLink');
  if (auth.isAuthenticated()) {
    event.preventDefault();
    auth.logout();
    appState.currentUser = null;
    updateAuthUI();
    showAlert('Logged out successfully.', 'success');
    return;
  }
}

function updateAuthUI() {
  const authActionLink = document.getElementById('authActionLink');
  const currentUserName = document.getElementById('currentUserName');

  if (!authActionLink || !currentUserName) return;

  if (auth.isAuthenticated() && appState.currentUser) {
    authActionLink.textContent = 'Logout';
    authActionLink.removeAttribute('data-bs-toggle');
    authActionLink.removeAttribute('data-bs-target');
    currentUserName.textContent = `Hi, ${appState.currentUser.name}`;
    currentUserName.classList.remove('d-none');
  } else {
    authActionLink.textContent = 'Login';
    authActionLink.setAttribute('data-bs-toggle', 'modal');
    authActionLink.setAttribute('data-bs-target', '#loginModal');
    currentUserName.textContent = '';
    currentUserName.classList.add('d-none');
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
