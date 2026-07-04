// CENTRAL PRODUCT CATALOG
let PRODUCT_DATABASE = [
  {
    id: "wild-fern",
    name: "Wild Fern Artwork",
    price: 10000,
    category: "wall-art",
    categoryLabel: "Wall Art",
    image: "assets/botanical_fern.png",
    description: "Handcrafted cyanotype artwork capturing the intricate, delicate outlines of wild forest ferns on premium deckled watercolor paper.",
    details: {
      origin: "Coorg, Western Ghats",
      exposure: "12 minutes under natural sunlight",
      paper: "300gsm hand-made deckled edge cotton paper",
      dimensions: "18 x 24 inches",
      framing: "Reclaimed teakwood float frame with exhibition glass",
      care: "Avoid direct prolonged sunlight to keep the cyanotype blue stable."
    }
  },
  {
    id: "forest-rhythm-lamp",
    name: "Forest Rhythm Tower Lamp",
    price: 12000,
    category: "tower-lamps",
    categoryLabel: "Tower Lamps",
    image: "assets/lamp_tower.png",
    glb: "assets/screenshot-2026-06-29-181834-png.glb",
    description: "A solid teakwood column lamp clad in pressed translucent botanicals, casting warm silhouettes of autumn leaves onto your interior spaces.",
    details: {
      origin: "Ahmedabad Studio Garden",
      exposure: "Natural pressed botanical preservation",
      paper: "Custom translucent mulberry fibers",
      dimensions: "6 x 6 x 18 inches",
      framing: "Hand-finished teakwood frame with oil finish",
      care: "Clean with a soft dry microfiber cloth. Includes low-heat LED bulb."
    }
  },
  {
    id: "murmuration",
    name: "Murmuration Starling Panel",
    price: 24000,
    category: "wall-art",
    categoryLabel: "Wall Art",
    image: "assets/murmuration.png",
    description: "Immersive visual study depicting the fluid shapes of starlings in flight, rendered in deep indigo shades with highlights of hand-applied silver leaf.",
    details: {
      origin: "Nalsarovar Lake Observations",
      exposure: "Layered triple exposure print",
      paper: "French Arches 100% cotton rag",
      dimensions: "24 x 36 inches",
      framing: "Matte black wood molding with white core matting",
      care: "Do not expose to high moisture. Hang in dry editorial environments."
    }
  },
  {
    id: "botanical-studies",
    name: "Botanical Study Set (Triptych)",
    price: 15000,
    category: "sets",
    categoryLabel: "Sets",
    image: "assets/journal_notebook.png",
    description: "A premium triptych set of detailed pressed wildflowers and meadow grass exposures, highlighting the botanical anatomy.",
    details: {
      origin: "Himalayan Foothills Collection",
      exposure: "8 minutes solar exposure per panel",
      paper: "Unbleached organic cotton rag",
      dimensions: "12 x 16 inches per panel (Set of 3)",
      framing: "Thin profiles of natural maple framing",
      care: "Hang side-by-side with 2-inch gaps for optimal museum composition."
    }
  },
  {
    id: "blue-bird-series",
    name: "Blue Bird Flight Study",
    price: 18000,
    category: "limited-edition",
    categoryLabel: "Limited Edition",
    image: "assets/blue_bird_series.png",
    description: "An ethereal and rhythmic capture of local birds in flight, utilizing double-exposure cyanotype techniques to emphasize movement.",
    details: {
      origin: "Sabarmati Riverbed",
      exposure: "Double exposure and wash developer",
      paper: "Fabriano Artistico watercolor paper",
      dimensions: "20 x 20 inches",
      framing: "Bespoke distressed grey wash oakwood",
      care: "Includes signed and numbered certificate of authenticity."
    }
  },
  {
    id: "ocean-whispers",
    name: "Ocean Whispers Canvas",
    price: 28000,
    category: "wall-art",
    categoryLabel: "Wall Art",
    image: "assets/murmurations_and_schooling.png",
    description: "Large-scale blueprint captures of marine sea grasses drifting in shallow ocean bays, creating deep visual calmness.",
    details: {
      origin: "Mandvi Coastlines",
      exposure: "15 minutes solar imprint",
      paper: "Stretched raw organic linen canvas",
      dimensions: "30 x 40 inches",
      framing: "Raw ash wood floating box frame",
      care: "Keep in climate-controlled spaces. Treated with UV protectant sealant."
    }
  },
  {
    id: "sunlit-leaves",
    name: "Sunlit Ginkgo Leaves",
    price: 9500,
    category: "wall-art",
    categoryLabel: "Wall Art",
    image: "assets/hero_flatlay.png",
    description: "Golden hues of ginkgo leaves exposed against a contrasting dark blueprint base, showcasing clean botanical forms.",
    details: {
      origin: "Kyoto Gardens Specimen",
      exposure: "Double-bath cyanotype toning",
      paper: "Khadi paper with raw deckled edges",
      dimensions: "14 x 14 inches",
      framing: "Hand-waxed dark walnut wood frame",
      care: "Dust lightly. Keep away from direct water contact."
    }
  }
];

// STATE MANAGEMENT: CART & WISHLIST
let cart = JSON.parse(localStorage.getItem("alchemy_cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("alchemy_wishlist")) || [];

// INITIALIZE SYSTEM ON LOAD
document.addEventListener("DOMContentLoaded", () => {
  // Sync products from Firestore first, then validate local storage arrays
  if (typeof firebase !== 'undefined') {
    firebase.firestore().collection("products").get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            list.push(doc.data());
          });
          PRODUCT_DATABASE = list;
        }
        
        // Filter invalid cart/wishlist items now that we have loaded all database products
        cart = cart.filter(item => item && item.id && PRODUCT_DATABASE.some(p => p.id === item.id));
        wishlist = wishlist.filter(id => id && PRODUCT_DATABASE.some(p => p.id === id));
        saveCart();
        saveWishlist();
        
        // Re-run UI badge and drawer updates
        updateCartBadge();
        updateWishlistBadge();
        if (document.querySelector(".cart-items-container")) {
          renderCartDrawer();
        }
        document.dispatchEvent(new CustomEvent("productsLoaded"));
      })
      .catch((err) => {
        console.warn("Firebase product sync failed, using static fallback:", err);
        updateCartBadge();
        updateWishlistBadge();
        document.dispatchEvent(new CustomEvent("productsLoaded"));
      });
  } else {
    updateCartBadge();
    updateWishlistBadge();
    document.dispatchEvent(new CustomEvent("productsLoaded"));
  }

  initGlobalNavigation();
  initGlobalCartDrawer();
  initGlobalSearch();
  
  // Override cart checkout click events globally
  const checkoutBtns = document.querySelectorAll(".cart-footer button");
  checkoutBtns.forEach(btn => {
    btn.removeAttribute("onclick");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "checkout.html";
    });
  });
  
  // Init Lucide Icons if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Intercept data-attribute clicks globally
  document.body.addEventListener("click", (e) => {
    // Add to Cart Buttons
    const cartBtn = e.target.closest("[data-cart-add]");
    if (cartBtn) {
      const productId = cartBtn.getAttribute("data-cart-add");
      const qty = parseInt(cartBtn.getAttribute("data-cart-qty") || "1", 10);
      addToCart(productId, qty);
      return;
    }

    // Toggle Wishlist Buttons
    const wishlistBtn = e.target.closest("[data-wishlist-toggle]");
    if (wishlistBtn) {
      e.preventDefault();
      e.stopPropagation();
      const productId = wishlistBtn.getAttribute("data-wishlist-toggle");
      toggleWishlist(productId);
      return;
    }
  });
});

// NAVIGATION SCROLL BEHAVIOR
function initGlobalNavigation() {
  const header = document.querySelector(".header");
  const mobileToggle = document.querySelector(".mobile-menu-toggle");
  const mobileDrawer = document.querySelector(".mobile-nav-drawer");
  
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener("click", () => {
      mobileDrawer.classList.toggle("active");
      const isActive = mobileDrawer.classList.contains("active");
      mobileToggle.innerHTML = isActive 
        ? `<i data-lucide="x"></i>` 
        : `<i data-lucide="menu"></i>`;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  }
}

// SEARCH BEHAVIORS
function initGlobalSearch() {
  const searchBtn = document.querySelector(".search-trigger");
  const searchPanel = document.querySelector(".search-panel");
  const searchClose = document.querySelector(".search-close");
  const searchForm = document.querySelector("#global-search-form");
  const searchInput = document.querySelector("#global-search-input");

  if (searchBtn && searchPanel) {
    searchBtn.addEventListener("click", () => {
      searchPanel.classList.add("active");
      if (searchInput) searchInput.focus();
    });
  }

  if (searchClose && searchPanel) {
    searchClose.addEventListener("click", () => {
      searchPanel.classList.remove("active");
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `collection.html?search=${encodeURIComponent(query)}`;
      }
    });
  }
}

// CART DRAWER BEHAVIORS
function initGlobalCartDrawer() {
  const cartTrigger = document.querySelector(".cart-trigger");
  const cartOverlay = document.querySelector(".cart-drawer-overlay");
  const cartClose = document.querySelector(".cart-close-btn");

  if (cartTrigger && cartOverlay) {
    cartTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  }

  if (cartClose && cartOverlay) {
    cartClose.addEventListener("click", () => {
      closeCartDrawer();
    });
  }

  if (cartOverlay) {
    cartOverlay.addEventListener("click", (e) => {
      if (e.target === cartOverlay) {
        closeCartDrawer();
      }
    });
  }
}

function openCartDrawer() {
  const overlay = document.querySelector(".cart-drawer-overlay");
  if (overlay) {
    renderCartDrawer();
    overlay.classList.add("active");
  }
}

function closeCartDrawer() {
  const overlay = document.querySelector(".cart-drawer-overlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
}

// CART CORE LOGIC
function addToCart(productId, quantity = 1) {
  const product = PRODUCT_DATABASE.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity
    });
  }

  saveCart();
  updateCartBadge();
  openCartDrawer();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function updateCartQuantity(productId, quantity) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart();
    updateCartBadge();
    renderCartDrawer();
  }
}

function saveCart() {
  localStorage.setItem("alchemy_cart", JSON.stringify(cart));
}

function updateCartBadge() {
  const badges = document.querySelectorAll(".cart-badge-count");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  badges.forEach(badge => {
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  });
}

function renderCartDrawer() {
  const itemsContainer = document.querySelector(".cart-items-container");
  const subtotalVal = document.querySelector(".cart-subtotal-val");
  
  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <i data-lucide="shopping-bag" style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--border);"></i>
        <p class="font-display" style="font-size: 20px;">Your gallery bag is empty</p>
        <a href="collection.html" class="btn btn-link" style="margin-top: 12px;">Explore Collections</a>
      </div>
    `;
    if (subtotalVal) subtotalVal.textContent = "₹ 0";
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  let html = "";
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    html += `
      <div class="cart-item">
        <img class="cart-item-image" src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <div class="cart-item-price">₹ ${item.price.toLocaleString('en-IN')}</div>
          <div class="cart-item-controls">
            <div class="quantity-control">
              <button class="quantity-btn minus" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
              <span class="quantity-val">${item.quantity}</span>
              <button class="quantity-btn plus" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `;
  });

  itemsContainer.innerHTML = html;
  if (subtotalVal) subtotalVal.textContent = `₹ ${subtotal.toLocaleString('en-IN')}`;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// WISHLIST CORE LOGIC
function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast("Removed from wishlist");
  } else {
    wishlist.push(productId);
    showToast("Added to wishlist");
  }
  
  saveWishlist();
  updateWishlistBadge();
  
  // Update UI icons if present on active page
  document.querySelectorAll(`[data-wishlist-toggle="${productId}"]`).forEach(btn => {
    const isSaved = wishlist.includes(productId);
    if (isSaved) {
      btn.classList.add("saved");
      btn.innerHTML = `<i data-lucide="heart" fill="currentColor"></i>`;
    } else {
      btn.classList.remove("saved");
      btn.innerHTML = `<i data-lucide="heart"></i>`;
    }
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Refresh page if on wishlist page
  if (window.location.pathname.includes("wishlist.html")) {
    if (typeof renderWishlistPage === 'function') {
      renderWishlistPage();
    }
  }
}

function saveWishlist() {
  localStorage.setItem("alchemy_wishlist", JSON.stringify(wishlist));
}

function updateWishlistBadge() {
  const badges = document.querySelectorAll(".wishlist-badge-count");
  const totalItems = wishlist.length;

  badges.forEach(badge => {
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  });
}

// UTILITY TOAST POPUP
function showToast(message) {
  // Create toast container if doesn't exist
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "32px";
    container.style.right = "32px";
    container.style.zIndex = "4000";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.background = "var(--primary)";
  toast.style.color = "var(--surface)";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "var(--rounded-xs)";
  toast.style.fontFamily = "var(--font-body)";
  toast.style.fontSize = "14px";
  toast.style.letterSpacing = "0.05em";
  toast.style.boxShadow = "var(--shadow-hover)";
  toast.style.transform = "translateY(20px)";
  toast.style.opacity = "0";
  toast.style.transition = "all var(--transition-medium)";
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger reflow & show
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  }, 50);

  // Hide & remove
  setTimeout(() => {
    toast.style.transform = "translateY(-10px)";
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}
