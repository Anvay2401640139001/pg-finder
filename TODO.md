# StayNest TODO

## Goal: bring ALL features back (PGs + wishlist + booking+payment + reviews + dashboard)

### Step 1 — Identify current entrypoint used
- Confirm browser loads the integrated UI from: `StayNest/frontend/index.html`
- (Root `website/index.html` should redirect to that.)

### Step 2 — Fix script confusion
- Ensure root page never loads demo `script.js` booking flow.

### Step 3 — Wishlist consistency
- Main page wishlist uses localStorage key `staynest_wishlist`.
- Dashboard reads the same key.

### Step 4 — Booking/payment end-to-end
- Ensure booking uses backend PG ids (`pg._id`) not demo numeric ids.
- Ensure Razorpay createOrder + verifyPayment match backend payload.

### Step 5 — Dashboard data + retry
- Ensure `StayNest/frontend/dashboard.html` loads `api.js`, `app.js`, and `dashboard.js` in the correct order.
- Ensure retryPayment uses `payments.createOrder` with `amount: booking.totalPrice`.

## Status
- [x] Step 1 (integrated redirect confirmed)
- [ ] Step 2
- [ ] Step 3
- [ ] Step 4
- [ ] Step 5

