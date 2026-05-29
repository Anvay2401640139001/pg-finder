// StayNest Dashboard UI (sidebar + sections)
// Production-ready: pulls real user data from backend and uses Razorpay retry via backend.

let dashboardState = {
  currentUser: null,
  bookings: [],
  wishlist: [],
  pgs: [],
};

const $ = (id) => document.getElementById(id);

function requireAuthOrRedirect() {
  if (!auth.isAuthenticated()) {
    showAlert('Please login to access your dashboard.', 'warning', $('globalAlert'));
    new bootstrap.Modal($('loginModal')).show();
    throw new Error('Not authenticated');
  }
}

function setActiveNav(sectionId) {
  document.querySelectorAll('[data-dashboard-nav]').forEach((el) => {
    el.classList.toggle('active', el.dataset.dashboardNav === sectionId);
  });

  document.querySelectorAll('[data-dashboard-content]').forEach((el) => {
    el.classList.toggle('d-none', el.dataset.dashboardContent !== sectionId);
  });
}

function money(n) {
  const num = Number(n || 0);
  return `₹${num.toLocaleString('en-IN')}`;
}

function pill(type, text) {
  const map = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    primary: 'bg-primary',
    muted: 'bg-secondary',
  };
  const klass = map[type] || 'bg-secondary';
  return `<span class="badge ${klass} text-white">${text}</span>`;
}

function showAlert(message, type = 'info', targetDiv = null) {
  const bookingAlert = targetDiv || $('globalAlert');
  if (bookingAlert) {
    bookingAlert.classList.remove('d-none');
    bookingAlert.className = `alert alert-${type} mt-3`;
    bookingAlert.innerHTML = `${message}`;
    return;
  }

  // Fallback: create one
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.body.prepend(alertDiv);
  setTimeout(() => alertDiv.remove(), 4500);
}

async function loadDashboardData() {
  dashboardState.currentUser = await auth.me().catch(() => auth.getUser());
  dashboardState.bookings = await bookings.getMy().catch(() => []);

  // Wishlist is currently stored locally in this project.
  try {
    const raw = localStorage.getItem('staynest_wishlist');
    dashboardState.wishlist = raw ? JSON.parse(raw) : [];
  } catch {
    dashboardState.wishlist = [];
  }
}

function renderWelcome() {
  $('welcomeName').textContent = dashboardState.currentUser?.name || 'Student';
  $('welcomeEmail').textContent = dashboardState.currentUser?.email || '';
}

function renderUserStats() {
  const total = dashboardState.bookings.length;
  const paid = dashboardState.bookings.filter((b) => b.paymentStatus === 'Paid').length;
  const failed = dashboardState.bookings.filter((b) => b.paymentStatus === 'Failed').length;
  const pending = dashboardState.bookings.filter((b) => b.paymentStatus === 'Pending').length;

  // animate counters
  animateCounter('statTotal', total);
  animateCounter('statPaid', paid);
  animateCounter('statFailed', failed);
  animateCounter('statPending', pending);
}

function animateCounter(id, target) {
  const el = $(id);
  if (!el) return;
  const duration = 700;
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(start + (target - start) * progress);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function getBookingDisplayStatus(b) {
  if (b.paymentStatus === 'Paid') return { kind: 'success', text: 'Confirmed' };
  if (b.paymentStatus === 'Failed') return { kind: 'danger', text: 'Failed' };
  return { kind: 'warning', text: 'Pending' };
}

async function refreshBookings() {
  dashboardState.bookings = await bookings.getMy().catch(() => []);
}

function renderBookings() {
  const list = $('bookingsList');
  if (!list) return;

  if (dashboardState.bookings.length === 0) {
    list.innerHTML = `
      <div class="p-4 bg-white rounded-4 shadow-sm text-center">
        <div class="text-muted">No bookings yet.</div>
      </div>
    `;
    return;
  }

  list.innerHTML = dashboardState.bookings
    .map((b) => {
      const status = getBookingDisplayStatus(b);
      const pgTitle = b.pg?.title || 'Property';
      const amount = money(b.totalPrice);

      const retryBtn =
        b.paymentStatus === 'Failed'
          ? `<button class="btn btn-sm btn-outline-danger" data-retry-booking="${b._id}">Retry Payment</button>`
          : '';

      return `
        <div class="booking-card bg-white rounded-4 shadow-sm p-4 mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div class="fw-bold fs-5">${pgTitle}</div>
              <div class="text-muted small">Booking ID: ${b._id}</div>
              <div class="mt-2">${pill(status.kind, status.text)}</div>
            </div>
            <div class="text-end">
              <div class="fw-bold">${amount}</div>
              <div class="text-muted small">${new Date(b.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <div class="mt-3 d-flex gap-2 align-items-center">
            ${retryBtn}
            <div class="ms-auto small text-muted">
              ${b.razorpayPaymentId ? `Razorpay Payment: ${b.razorpayPaymentId}` : 'Payment not captured yet'}
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  list.querySelectorAll('[data-retry-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.retryBooking;
      const booking = dashboardState.bookings.find((b) => String(b._id) === String(id));
      retryPayment(booking);
    });
  });
}

function renderPaymentsFromBookings() {
  const paymentsList = $('paymentsList');
  if (!paymentsList) return;

  const paid = dashboardState.bookings.filter((b) => b.paymentStatus === 'Paid');
  const failed = dashboardState.bookings.filter((b) => b.paymentStatus === 'Failed');
  const pending = dashboardState.bookings.filter((b) => b.paymentStatus === 'Pending');
  const merged = [...paid, ...failed, ...pending];

  if (merged.length === 0) {
    paymentsList.innerHTML = `<div class="text-muted">No payment records yet.</div>`;
    return;
  }

  paymentsList.innerHTML = merged
    .map((b) => {
      const status = getBookingDisplayStatus(b);
      const pgTitle = b.pg?.title || 'Property';

      return `
        <div class="booking-card bg-white rounded-4 shadow-sm p-4 mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div class="fw-bold fs-5">${pgTitle}</div>
              <div class="text-muted small">${b.razorpayOrderId ? `Order: ${b.razorpayOrderId}` : 'No order created'}</div>
              <div class="mt-2">${pill(status.kind, status.text)}</div>
            </div>
            <div class="text-end">
              <div class="fw-bold">${money(b.totalPrice)}</div>
              <div class="text-muted small">${new Date(b.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          ${b.paymentStatus === 'Failed' ? `<div class="mt-3"><button class="btn btn-sm btn-outline-danger" data-retry-booking="${b._id}">Retry Payment</button></div>` : ''}
        </div>
      `;
    })
    .join('');

  paymentsList.querySelectorAll('[data-retry-booking]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.retryBooking;
      const booking = dashboardState.bookings.find((b) => String(b._id) === String(id));
      retryPayment(booking);
    });
  });
}

async function retryPayment(booking) {
  if (!booking || !booking._id) return;
  if (booking.paymentStatus !== 'Failed') {
    showAlert('Retry is available only for failed payments.', 'info', $('globalAlert'));
    return;
  }

  try {
    showAlert('Creating a new Razorpay order...', 'info', $('globalAlert'));

    const orderData = await payments.createOrder({ bookingId: booking._id, amount: booking.totalPrice });

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'StayNest',
      order_id: orderData.orderId,
      description: `Retry payment for booking ${booking._id}`,
      prefill: {
        name: dashboardState.currentUser?.name || 'Student',
        email: dashboardState.currentUser?.email || '',
      },
      notes: { bookingId: booking._id },
      theme: { color: '#7c3aed' },
      handler: async function (response) {
        try {
          await payments.verifyPayment({
            bookingId: booking._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          showAlert('Payment successful! Your booking is confirmed.', 'success', $('globalAlert'));
          await refreshBookings();
          renderBookings();
          renderPaymentsFromBookings();
        } catch (err) {
          console.error(err);
          showAlert('Payment verification failed. You can retry again.', 'danger', $('globalAlert'));
          await refreshBookings();
          renderBookings();
          renderPaymentsFromBookings();
        }
      },
      modal: {
        ondismiss: function () {
          showAlert('Payment cancelled. Your booking remains pending/failed as per backend.', 'warning', $('globalAlert'));
          refreshBookings().then(() => {
            renderBookings();
            renderPaymentsFromBookings();
          });
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    showAlert(err.message || 'Retry payment failed', 'danger', $('globalAlert'));
  }
}

async function initDashboard() {
  requireAuthOrRedirect();

  if (!window.Razorpay) {
    showAlert('Razorpay checkout library not loaded.', 'danger', $('globalAlert'));
    return;
  }

  try {
    await loadDashboardData();

    renderWelcome();
    renderUserStats();
    renderBookings();
    renderPaymentsFromBookings();

    setActiveNav('dashboard');

    document.querySelectorAll('[data-dashboard-nav]').forEach((nav) => {
      nav.addEventListener('click', () => setActiveNav(nav.dataset.dashboardNav));
    });

    $('dashboardLogout')?.addEventListener('click', () => {
      auth.logout();
      window.location.reload();
    });

    $('profileName') && ($('#profileName').textContent = dashboardState.currentUser?.name || '');
    $('profileEmail') && ($('#profileEmail').textContent = dashboardState.currentUser?.email || '');
  } catch (err) {
    console.error(err);
    showAlert(err.message || 'Failed to load dashboard', 'danger', $('globalAlert'));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-dashboard-root]')) {
    initDashboard();
  }
});

