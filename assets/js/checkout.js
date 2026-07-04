document.addEventListener("DOMContentLoaded", () => {
  renderCheckoutInvoice();
  initCheckoutOTP();
  initOrderSubmission();
});

let cartItems = [];
let confirmationResult = null;
let isPhoneVerified = false;

// 1. RENDER INVOICE ITEMS
function renderCheckoutInvoice() {
  const invoiceContainer = document.querySelector("#checkout-invoice-items");
  const subtotalEl = document.querySelector("#invoice-subtotal");
  const totalEl = document.querySelector("#invoice-total");

  if (!invoiceContainer) return;

  const rawCart = localStorage.getItem("alchemy_cart");
  cartItems = rawCart ? JSON.parse(rawCart) : [];

  if (cartItems.length === 0) {
    invoiceContainer.innerHTML = `<p class="body-sm" style="color: var(--text-secondary); text-align: center; padding: 20px 0;">Your gallery bag is empty.</p>`;
    // Redirect back to shop if empty bag
    setTimeout(() => {
      alert("Your gallery bag is empty. Returning to Collections.");
      window.location.href = "collection.html";
    }, 1500);
    return;
  }

  let html = "";
  let subtotal = 0;

  cartItems.forEach(item => {
    // Lookup product metadata from product database in main.js
    const product = PRODUCT_DATABASE.find(p => p.id === item.id);
    if (!product) return;

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    html += `
      <div class="checkout-item">
        <div style="flex-grow: 1; padding-right: 12px;">
          <div style="font-weight: 600; color: var(--neutral);">${product.name}</div>
          <div style="font-size: 13px; color: var(--text-secondary);">Qty: ${item.quantity} &bull; ₹ ${product.price.toLocaleString('en-IN')} each</div>
        </div>
        <div style="font-weight: 600; color: var(--primary);">₹ ${itemTotal.toLocaleString('en-IN')}</div>
      </div>
    `;
  });

  invoiceContainer.innerHTML = html;
  if (subtotalEl) subtotalEl.textContent = `₹ ${subtotal.toLocaleString('en-IN')}`;
  if (totalEl) totalEl.textContent = `₹ ${subtotal.toLocaleString('en-IN')}`;
}

// 2. PHONE OTP AUTHENTICATION
function initCheckoutOTP() {
  const sendOtpBtn = document.querySelector("#send-otp-btn");
  const verifyOtpBtn = document.querySelector("#verify-otp-btn");
  const resendOtpBtn = document.querySelector("#resend-otp-btn");
  const phoneInput = document.querySelector("#cust-phone");
  const codeInput = document.querySelector("#otp-code");
  const statusMsg = document.querySelector("#otp-status-msg");
  const otpDialogWrap = document.querySelector("#otp-dialog-wrap");
  const submitBtn = document.querySelector("#checkout-submit-btn");

  if (!sendOtpBtn || !phoneInput || !statusMsg) return;

  // Initialize invisible Recaptcha Verifier
  if (typeof firebase !== 'undefined') {
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved
      }
    });
  }

  const triggerVerification = () => {
    const phoneNumber = phoneInput.value.trim();
    const altPhoneInput = document.querySelector("#cust-altphone");
    const altPhoneNumber = altPhoneInput ? altPhoneInput.value.trim() : "";

    const cleanPhone = (str) => str.replace(/[\s\-\(\)]/g, "");

    if (!phoneNumber.startsWith("+")) {
      statusMsg.className = "otp-status error";
      statusMsg.textContent = "Please include country code (e.g. +91 9876543210)";
      return;
    }

    if (altPhoneNumber && cleanPhone(phoneNumber) === cleanPhone(altPhoneNumber)) {
      statusMsg.className = "otp-status error";
      statusMsg.textContent = "Error: Primary and alternative contact numbers cannot be identical.";
      return;
    }

    statusMsg.className = "otp-status pending";
    statusMsg.textContent = "Sending SMS code...";
    sendOtpBtn.disabled = true;

    firebase.auth().signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier)
      .then(result => {
        confirmationResult = result;
        statusMsg.className = "otp-status success";
        statusMsg.textContent = "OTP code sent successfully!";
        
        // Show code entry fields
        if (otpDialogWrap) otpDialogWrap.style.display = "block";
      })
      .catch(error => {
        console.error("SMS Delivery Failed:", error);
        statusMsg.className = "otp-status error";
        statusMsg.textContent = `Error: ${error.message}`;
        sendOtpBtn.disabled = false;
        
        // Reset Recaptcha Verifier on error
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.render().then(widgetId => {
            grecaptcha.reset(widgetId);
          });
        }
      });
  };

  sendOtpBtn.addEventListener("click", triggerVerification);
  if (resendOtpBtn) resendOtpBtn.addEventListener("click", triggerVerification);

  // Confirm Verification OTP Code
  if (verifyOtpBtn && codeInput) {
    verifyOtpBtn.addEventListener("click", () => {
      const code = codeInput.value.trim();
      if (code.length !== 6) {
        alert("Please enter a valid 6-digit code.");
        return;
      }

      verifyOtpBtn.disabled = true;
      statusMsg.className = "otp-status pending";
      statusMsg.textContent = "Confirming code...";

      confirmationResult.confirm(code)
        .then(result => {
          isPhoneVerified = true;
          statusMsg.className = "otp-status success";
          statusMsg.innerHTML = `<i data-lucide="check-circle" style="display:inline-block; vertical-align:middle; width:16px; height:16px; margin-right:4px;"></i> Phone Verified!`;
          if (typeof lucide !== 'undefined') lucide.createIcons();

          // Hide OTP Entry, freeze phone inputs
          if (otpDialogWrap) otpDialogWrap.style.display = "none";
          phoneInput.disabled = true;
          sendOtpBtn.style.display = "none";

          // Enable Submit button
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Place Order & Create Gallery Shipment";
          }
        })
        .catch(error => {
          console.error("OTP Code Failed:", error);
          statusMsg.className = "otp-status error";
          statusMsg.textContent = "Invalid code. Please try again.";
          verifyOtpBtn.disabled = false;
        });
    });
  }
}

// 3. ORDER DATA RECORDING
function initOrderSubmission() {
  const form = document.querySelector("#checkout-form");
  const submitBtn = document.querySelector("#checkout-submit-btn");

  if (!form || !submitBtn) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!isPhoneVerified) {
      alert("Please verify your phone number via SMS OTP first.");
      return;
    }

    // Prepare Customer Payload
    const name = document.querySelector("#cust-name").value.trim();
    const email = document.querySelector("#cust-email").value.trim();
    const address = document.querySelector("#cust-address").value.trim();
    const city = document.querySelector("#cust-city").value.trim();
    const state = document.querySelector("#cust-state").value.trim();
    const zip = document.querySelector("#cust-zip").value.trim();
    const phone = document.querySelector("#cust-phone").value.trim();
    const altPhone = document.querySelector("#cust-altphone").value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = "Processing order details...";

    // Calculate subtotal
    let subtotal = 0;
    const itemsPayload = cartItems.map(item => {
      const prod = PRODUCT_DATABASE.find(p => p.id === item.id);
      subtotal += prod ? (prod.price * item.quantity) : 0;
      return {
        id: item.id,
        name: prod ? prod.name : "Unknown Item",
        price: prod ? prod.price : 0,
        quantity: item.quantity
      };
    });

    const orderId = "ALCH-" + Math.floor(100000 + Math.random() * 900000);

    const orderPayload = {
      orderId: orderId,
      customerName: name,
      email: email,
      address: `${address}, ${city}, ${state} - ${zip}`,
      phoneNumber: phone,
      alternativeNumber: altPhone || "None Provided",
      items: itemsPayload,
      subtotal: subtotal,
      verified: true,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: "Pending"
    };

    // Save to Firestore 'orders' collection
    if (typeof firebase !== 'undefined') {
      firebase.firestore().collection("orders").add(orderPayload)
        .then(() => {
          // Clear bag & Redirect
          localStorage.removeItem("alchemy_cart");
          showCheckoutSuccessModal(orderId);
        })
        .catch(error => {
          console.error("Order Submission Failed:", error);
          alert(`Order processing failed: ${error.message}. Please contact Ahmedabad studio support.`);
          submitBtn.disabled = false;
          submitBtn.textContent = "Place Order & Create Gallery Shipment";
        });
    } else {
      // Offline fallback success for simulation
      localStorage.removeItem("alchemy_cart");
      showCheckoutSuccessModal(orderId);
    }
  });
}

function showCheckoutSuccessModal(orderId) {
  const successModal = document.createElement("div");
  successModal.className = "modal-overlay active";
  successModal.style.zIndex = "6000";
  successModal.innerHTML = `
    <div class="modal-content text-center" style="max-width: 500px; padding: var(--spacing-xl);">
      <i data-lucide="check-circle" style="width: 72px; height: 72px; color: var(--success); margin: 0 auto var(--spacing-md);"></i>
      <h2 class="font-display" style="font-size: 36px; color: var(--neutral); margin-bottom: var(--spacing-sm);">Order Placed</h2>
      <p class="body-sm" style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">Your Prussian Blue collection order has been authenticated.</p>
      
      <div style="background-color: var(--secondary); padding: var(--spacing-md); border-radius: var(--rounded-xs); border: 1px solid var(--border); margin-bottom: var(--spacing-lg); text-align: left; font-size: 14px;">
        <div style="margin-bottom: 4px;"><strong>Order Reference:</strong> <span style="font-family: monospace; font-size:15px; color: var(--primary);">${orderId}</span></div>
        <div><strong>Curation Period:</strong> 5-7 business days for custom framing & wood finishes.</div>
      </div>

      <button class="btn btn-primary close-order-btn" style="width: 100%;">Return to Gallery</button>
    </div>
  `;
  document.body.appendChild(successModal);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  successModal.querySelector(".close-order-btn").addEventListener("click", () => {
    successModal.remove();
    window.location.href = "index.html";
  });
}
