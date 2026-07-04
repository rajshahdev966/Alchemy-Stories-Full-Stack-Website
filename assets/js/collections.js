let dbProducts = [];

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
        initCollectionsPage();
      })
      .catch(() => {
        initCollectionsPage();
      });
  } else {
    if (typeof PRODUCT_DATABASE !== 'undefined') {
      dbProducts = [...PRODUCT_DATABASE];
    }
    initCollectionsPage();
  }
});

function initCollectionsPage() {
  const grid = document.querySelector("#collection-product-grid");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const sortSelect = document.querySelector("#collection-sort-select");
  const searchInput = document.querySelector("#collection-search-input");
  const clearFiltersBtn = document.querySelector("#clear-filters-btn");
  const resultsCount = document.querySelector("#results-count");

  if (!grid) return;

  // Active filters state
  let activeCategory = "all";
  let activeSearchQuery = "";
  let activeSort = "default";

  // Parse URL queries (e.g., ?category=wall-art or ?search=fern)
  const parseUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const search = params.get("search");

    if (category) {
      activeCategory = category;
      filterTabs.forEach(tab => {
        if (tab.getAttribute("data-category") === category) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });
    }

    if (search) {
      activeSearchQuery = search.toLowerCase();
      if (searchInput) searchInput.value = search;
    }
  };

  const getFilteredProducts = () => {
    let products = [...dbProducts];

    // Filter by Category
    if (activeCategory !== "all") {
      products = products.filter(p => p.category === activeCategory);
    }

    // Filter by Search Query
    if (activeSearchQuery) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(activeSearchQuery) || 
        p.description.toLowerCase().includes(activeSearchQuery) ||
        p.categoryLabel.toLowerCase().includes(activeSearchQuery)
      );
    }

    // Sort Products
    if (activeSort === "price-low") {
      products.sort((a, b) => a.price - b.price);
    } else if (activeSort === "price-high") {
      products.sort((a, b) => b.price - a.price);
    } else if (activeSort === "name") {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    return products;
  };

  const renderProducts = () => {
    const products = getFilteredProducts();
    const savedWishlist = JSON.parse(localStorage.getItem("alchemy_wishlist")) || [];

    if (resultsCount) {
      resultsCount.textContent = `${products.length} Artwork${products.length !== 1 ? 's' : ''}`;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: var(--text-secondary);">
          <i data-lucide="info" style="width: 48px; height: 48px; margin-bottom: var(--spacing-sm); color: var(--border);"></i>
          <p class="font-display" style="font-size: 24px; margin-bottom: var(--spacing-sm);">No artworks match your selection</p>
          <p class="body-sm" style="margin-bottom: var(--spacing-md);">Try adjusting your filters or clearing search queries.</p>
          <button id="reset-filters-btn" class="btn btn-secondary">Clear Filters</button>
        </div>
      `;
      
      const resetBtn = document.querySelector("#reset-filters-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", resetAllFilters);
      }
      
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    let html = "";
    products.forEach(p => {
      const isWishlisted = savedWishlist.includes(p.id);
      
      html += `
        <div class="art-card">
          <div class="art-card-image-wrap">
            <a href="product.html?id=${p.id}">
              <img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
            </a>
            <div class="art-card-actions">
              <button class="btn-icon-round ${isWishlisted ? 'saved' : ''}" data-wishlist-toggle="${p.id}" aria-label="Add to wishlist">
                <i data-lucide="heart" ${isWishlisted ? 'fill="currentColor"' : ''}></i>
              </button>
            </div>
            ${p.category === 'limited-edition' ? '<span class="art-card-badge">Limited</span>' : ''}
          </div>
          <span class="art-card-category">${p.categoryLabel}</span>
          <h3 class="art-card-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
          <div class="art-card-footer" style="margin-top: 20px;">
            <div class="art-card-price">₹ ${p.price.toLocaleString('en-IN')}</div>
            <button class="btn btn-primary" data-cart-add="${p.id}" style="padding: 10px 18px; font-size: 11px; border-radius: var(--rounded-xs);">
              Add to Bag
            </button>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  };

  const resetAllFilters = () => {
    activeCategory = "all";
    activeSearchQuery = "";
    activeSort = "default";

    // Clean inputs
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "default";
    filterTabs.forEach(tab => {
      if (tab.getAttribute("data-category") === "all") {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // Clean URL
    window.history.pushState({}, document.title, window.location.pathname);
    renderProducts();
  };

  // Bind tab filter clicks
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeCategory = tab.getAttribute("data-category");
      renderProducts();
    });
  });

  // Bind sort dropdown
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      activeSort = e.target.value;
      renderProducts();
    });
  }

  // Bind Search input
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeSearchQuery = e.target.value.toLowerCase();
      renderProducts();
    });
  }

  // Bind Clear button
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", resetAllFilters);
  }

  // Initialize
  parseUrlParams();
  renderProducts();
}
