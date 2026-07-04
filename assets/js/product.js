let dbProducts = [];

// Lightweight client-side HTML sanitizer to prevent DOM XSS in rich content
function sanitizeHTML(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  
  // Strip script elements
  temp.querySelectorAll("script").forEach(s => s.remove());
  
  // Strip on-event attributes and malicious Javascript protocols
  temp.querySelectorAll("*").forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
      if (attr.name === "href" || attr.name === "src") {
        const val = attr.value.trim().toLowerCase();
        if (val.startsWith("javascript:") || val.startsWith("data:text/html")) {
          el.removeAttribute(attr.name);
        }
      }
    });
  });
  
  return temp.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  // Try fetching products from Firestore with fallback to PRODUCT_DATABASE
  if (typeof firebase !== 'undefined' && typeof PRODUCT_DATABASE !== 'undefined') {
    dbProducts = [...PRODUCT_DATABASE];
    firebase.firestore().collection("products").get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            list.push(doc.data());
          });
          dbProducts = list;
        }
        initProductPage();
      })
      .catch(() => {
        initProductPage();
      });
  } else {
    if (typeof PRODUCT_DATABASE !== 'undefined') {
      dbProducts = [...PRODUCT_DATABASE];
    }
    initProductPage();
  }
});

function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  let productId = params.get("id");
  
  // Fallback to first product if none specified
  if (!productId) {
    productId = dbProducts[0] ? dbProducts[0].id : "";
  }

  const product = dbProducts.find(p => p.id === productId);
  
  if (!product) {
    renderProductError();
    return;
  }

  renderProductDetails(product);
  initProductAccordions();
  initThumbnailSwitcher();
  initInquiryModal(product);
  renderRelatedProducts(product);
  initProductAR(product);
}

function renderProductError() {
  const container = document.querySelector("#product-detail-container");
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 120px 0; max-width: 600px; margin: 0 auto;">
        <i data-lucide="alert-circle" style="width: 64px; height: 64px; margin-bottom: 24px; color: var(--border);"></i>
        <h1 class="font-display" style="font-size: 36px; margin-bottom: 16px;">Artwork Not Found</h1>
        <p class="body-md" style="margin-bottom: 32px; color: var(--text-secondary);">The artwork you are looking for does not exist in our registry or has been moved to a private collection.</p>
        <a href="collection.html" class="btn btn-primary">Return to Collections</a>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function renderProductDetails(product) {
  // Update page title
  document.title = `${product.name} — Alchemy Stories`;

  // Map elements
  const breadcrumb = document.querySelector("#product-breadcrumb-name");
  const mainImage = document.querySelector("#product-main-image");
  const thumbnailContainer = document.querySelector("#product-thumbnails-container");
  const categoryLabel = document.querySelector("#product-category-label");
  const name = document.querySelector("#product-name");
  const price = document.querySelector("#product-price");
  const desc = document.querySelector("#product-desc");
  const specsList = document.querySelector("#product-specs-list");
  const wishlistBtn = document.querySelector("#product-wishlist-btn");
  const addToCartBtn = document.querySelector("#product-add-cart-btn");

  if (breadcrumb) breadcrumb.textContent = product.name;
  if (mainImage) {
    mainImage.src = product.image;
    mainImage.alt = product.name;
  }

  // Thumbnails (render at least 3, using other images from database to simulate gallery)
  if (thumbnailContainer) {
    let thumbs = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      thumbs = [...product.images];
    } else {
      thumbs = [product.image];
    }
    
    if (thumbs.length > 1) {
      thumbnailContainer.style.display = "flex";
      let thumbHtml = "";
      thumbs.forEach((img, idx) => {
        thumbHtml += `
          <div class="product-thumb ${idx === 0 ? 'active' : ''}">
            <img src="${img}" alt="${product.name} View ${idx + 1}">
          </div>
        `;
      });
      thumbnailContainer.innerHTML = thumbHtml;
    } else {
      thumbnailContainer.innerHTML = "";
      thumbnailContainer.style.display = "none";
    }
  }

  if (categoryLabel) {
    categoryLabel.textContent = product.categoryLabel;
    categoryLabel.href = `collection.html?category=${product.category}`;
  }
  
  if (name) name.textContent = product.name;
  if (price) price.textContent = `₹ ${product.price.toLocaleString('en-IN')}`;
  
  if (desc) desc.innerHTML = sanitizeHTML(product.description);

  // Dynamic Page Title & Meta Description SEO updates
  document.title = `${product.name} — Alchemy Stories`;
  const metaDesc = document.querySelector('meta[name="description"]');
  let plainDesc = "";
  if (product.description) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = product.description;
    plainDesc = tempDiv.textContent || tempDiv.innerText || "";
  }
  if (metaDesc && plainDesc) {
    metaDesc.setAttribute("content", plainDesc.substring(0, 155) + (plainDesc.length > 155 ? "..." : ""));
  }

  // Dynamic OpenGraph & Canonical Link SEO updates
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', `${product.name} — Alchemy Stories`);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  if (plainDesc) {
    ogDesc.setAttribute('content', plainDesc.substring(0, 155));
  }

  let ogImage = document.querySelector('meta[property="og:image"]');
  if (!ogImage) {
    ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    document.head.appendChild(ogImage);
  }
  ogImage.setAttribute('content', window.location.origin + "/" + product.image);

  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', window.location.href);

  // Dynamic Product JSON-LD Schema injection
  let schemaScript = document.querySelector("#product-schema-jsonld");
  if (!schemaScript) {
    schemaScript = document.createElement("script");
    schemaScript.type = "application/ld+json";
    schemaScript.id = "product-schema-jsonld";
    document.head.appendChild(schemaScript);
  }
  const schemaPayload = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image ? [window.location.origin + "/" + product.image] : [],
    "description": product.description ? product.description.replace(/<[^>]*>/g, '').substring(0, 160) : "",
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };
  schemaScript.text = JSON.stringify(schemaPayload);

  // Specifications Accordion Populate
  if (specsList && product.details) {
    specsList.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-xs); padding: var(--spacing-sm) 0;">
        <div style="display: flex; justify-content: space-between; font-size: 15px;"><span style="color: var(--text-secondary);">Origin</span><span style="font-weight:600; color: var(--text-primary);">${product.details.origin}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 15px;"><span style="color: var(--text-secondary);">Exposure</span><span style="font-weight:600; color: var(--text-primary);">${product.details.exposure}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 15px;"><span style="color: var(--text-secondary);">Paper / Base</span><span style="font-weight:600; color: var(--text-primary);">${product.details.paper}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 15px;"><span style="color: var(--text-secondary);">Dimensions</span><span style="font-weight:600; color: var(--text-primary);">${product.details.dimensions}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 15px;"><span style="color: var(--text-secondary);">Framing style</span><span style="font-weight:600; color: var(--text-primary);">${product.details.framing}</span></div>
      </div>
    `;
    
    // Dynamic Materials override
    const materialsEl = document.querySelector("#product-materials-content");
    if (materialsEl && product.details.materials) {
      materialsEl.innerHTML = sanitizeHTML(product.details.materials);
    }
    
    // Dynamic Care override
    const careEl = document.querySelector("#product-care-content");
    if (careEl && product.details.care) {
      careEl.innerHTML = sanitizeHTML(product.details.care);
    }
  }

  // Set initial wishlist state
  if (wishlistBtn) {
    const savedWishlist = JSON.parse(localStorage.getItem("alchemy_wishlist")) || [];
    const isWishlisted = savedWishlist.includes(product.id);
    wishlistBtn.setAttribute("data-wishlist-toggle", product.id);
    if (isWishlisted) {
      wishlistBtn.innerHTML = `<i data-lucide="heart" fill="currentColor"></i> Wishlisted`;
      wishlistBtn.classList.add("saved");
    } else {
      wishlistBtn.innerHTML = `<i data-lucide="heart"></i> Save to Wishlist`;
      wishlistBtn.classList.remove("saved");
    }
  }

  // Set cart button product ID
  if (addToCartBtn) {
    addToCartBtn.setAttribute("data-cart-add", product.id);
  }

  // Initialize WebAR experiences
  initProductAR(product);
}

// SWITCH IMAGES ON THUMBNAIL CLICK
function initThumbnailSwitcher() {
  const container = document.querySelector("#product-thumbnails-container");
  const mainImage = document.querySelector("#product-main-image");

  if (!container || !mainImage) return;

  container.addEventListener("click", (e) => {
    const thumb = e.target.closest(".product-thumb");
    if (!thumb) return;

    // Toggle active thumbnail styling
    document.querySelectorAll(".product-thumb").forEach(t => t.classList.remove("active"));
    thumb.classList.add("active");

    const img = thumb.querySelector("img");
    if (img && mainImage) {
      mainImage.src = img.src;
    }
  });
}

// EXPANDABLE ACCORDIONS FOR SPECIFICATIONS / CARE GUIDE
function initProductAccordions() {
  const headers = document.querySelectorAll(".accordion-header");
  
  headers.forEach(header => {
    header.addEventListener("click", () => {
      const item = header.closest(".accordion-item");
      const isActive = item.classList.contains("active");
      
      // Close all accordions
      document.querySelectorAll(".accordion-item").forEach(i => i.classList.remove("active"));
      
      // Open clicked one if was not active
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

// INQUIRY / CUSTOM COMMISSION MODALS
function initInquiryModal(product) {
  const customizeBtn = document.querySelector("#product-customize-btn");
  const modalOverlay = document.querySelector("#inquiry-modal-overlay");
  const modalClose = document.querySelector("#inquiry-modal-close");
  const form = document.querySelector("#inquiry-form");
  const productFieldName = document.querySelector("#inquiry-product-name");

  if (!modalOverlay) return;

  if (customizeBtn) {
    customizeBtn.addEventListener("click", () => {
      if (productFieldName) {
        productFieldName.value = `Customisation: ${product.name} (ID: ${product.id})`;
      }
      modalOverlay.classList.add("active");
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modalOverlay.classList.remove("active");
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove("active");
      }
    });
  }

  // Handle form submission
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      // Select form fields
      const name = form.querySelector("[name='name']").value.trim();
      const email = form.querySelector("[name='email']").value.trim();
      const request = form.querySelector("[name='request']").value.trim();
      const productSelected = form.querySelector("[name='product']").value.trim();
      
      if (!name || !email) return;

      const inquiryPayload = {
        name: name,
        email: email,
        request: `Bespoke Customization Inquiry for [${productSelected}] - Details: ${request}`,
        timestamp: typeof firebase !== 'undefined' ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
      };

      if (typeof firebase !== 'undefined') {
        firebase.firestore().collection("inquiries").add(inquiryPayload)
          .then(() => {
            modalOverlay.classList.remove("active");
            showCommissionSuccessToast();
            form.reset();
          })
          .catch(err => {
            console.error("Failed logging inquiry:", err);
            modalOverlay.classList.remove("active");
            showCommissionSuccessToast();
            form.reset();
          });
      } else {
        modalOverlay.classList.remove("active");
        showCommissionSuccessToast();
        form.reset();
      }
    });
  }
}

function showCommissionSuccessToast() {
  // Create beautiful popup alert
  const alertBox = document.createElement("div");
  alertBox.className = "modal-overlay active";
  alertBox.style.zIndex = "5000";
  alertBox.innerHTML = `
    <div class="modal-content text-center" style="max-width: 480px;">
      <i data-lucide="check-circle-2" style="width: 64px; height: 64px; color: var(--success); margin: 0 auto var(--spacing-md);"></i>
      <h3 class="font-display" style="font-size: 32px; margin-bottom: var(--spacing-sm);">Inquiry Logged</h3>
      <p class="body-sm" style="margin-bottom: var(--spacing-lg);">Thank you for sharing your story. Our Ahmedabad studio artisans will review your customization request and reach out via email within 48 hours.</p>
      <button class="btn btn-primary close-success-btn" style="width: 100%;">Close</button>
    </div>
  `;
  document.body.appendChild(alertBox);

  if (typeof lucide !== 'undefined') lucide.createIcons();

  const closeBtn = alertBox.querySelector(".close-success-btn");
  closeBtn.addEventListener("click", () => {
    alertBox.remove();
  });
}

// RELATED PRODUCTS RANDOM CARDS GENERATION
function renderRelatedProducts(currentProduct) {
  const container = document.querySelector("#related-products-grid");
  if (!container) return;

  // Filter out current product, prefer same category
  let matches = PRODUCT_DATABASE.filter(p => p.id !== currentProduct.id && p.category === currentProduct.category);
  
  // If not enough items in same category, pull others
  if (matches.length < 3) {
    const remaining = PRODUCT_DATABASE.filter(p => p.id !== currentProduct.id && p.category !== currentProduct.category);
    matches = [...matches, ...remaining].slice(0, 3);
  } else {
    matches = matches.slice(0, 3);
  }

  let html = "";
  matches.forEach(p => {
    html += `
      <div class="art-card">
        <div class="art-card-image-wrap">
          <a href="product.html?id=${p.id}">
            <img src="${p.image}" alt="${p.name}">
          </a>
        </div>
        <span class="art-card-category">${p.categoryLabel}</span>
        <h3 class="art-card-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="art-card-footer">
          <div class="art-card-price">₹ ${p.price.toLocaleString('en-IN')}</div>
          <a href="product.html?id=${p.id}" class="btn btn-secondary" style="padding: 10px 18px; font-size: 11px; border-radius: var(--rounded-xs);">
            View details
          </a>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// WebAR 3D AND AR EXPERIENCES
function initProductAR(product) {
  const triggerWrap = document.querySelector("#product-ar-trigger-wrap");
  const triggerBtn = document.querySelector("#product-ar-trigger");
  const arModal = document.querySelector("#ar-modal-overlay");
  const arClose = document.querySelector("#ar-modal-close");
  const modelViewer = document.querySelector("#product-3d-model");
  const desktopContent = document.querySelector("#ar-desktop-content");
  const mobileContent = document.querySelector("#ar-mobile-content");

  if (!triggerWrap || !triggerBtn || !arModal || !arClose || !modelViewer || !desktopContent || !mobileContent) return;

  // Only show AR/3D option if the product has a glb file associated with it
  if (product.glb) {
    triggerWrap.style.display = "block";
    
    // Check if user is on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      desktopContent.style.display = "none";
      mobileContent.style.display = "block";
      modelViewer.setAttribute("src", product.glb);
      
      // Customize mobile trigger button text
      triggerBtn.innerHTML = `<i data-lucide="aperture"></i> View in room (AR)`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
      desktopContent.style.display = "block";
      mobileContent.style.display = "none";
      
      // If desktop, generate QR Code pointing to this URL for mobile scanning
      const qrContainer = document.querySelector("#ar-modal-qrcode");
      if (qrContainer) {
        const currentUrl = window.location.href;
        // Generate with high correction level 'H' so overlay logo does not break it
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&ecc=H&margin=0&data=${encodeURIComponent(currentUrl)}`;
        qrContainer.innerHTML = `<img src="${qrUrl}" alt="Scan to view in AR" style="width: 100%; height: 100%; object-fit: contain;">`;
      }
    }

    // Toggle AR Modal opening
    triggerBtn.addEventListener("click", () => {
      arModal.classList.add("active");
    });

    // Toggle AR Modal closing
    arClose.addEventListener("click", () => {
      arModal.classList.remove("active");
    });

    arModal.addEventListener("click", (e) => {
      if (e.target === arModal) {
        arModal.classList.remove("active");
      }
    });
  } else {
    triggerWrap.style.display = "none";
  }
}
