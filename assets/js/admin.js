let blogQuillEditor = null;
let prodDescEditor = null;
let prodMaterialsEditor = null;
let prodCareEditor = null;
let specQuillStory = null;

let uploadedProdImages = [];
let uploadedBlogImages = [];
let uploadedSpecImage = "";

let unsubscribeOrders = null;
let unsubscribeInquiries = null;

// Escape HTML utility to prevent Stored XSS
function escapeHTML(str) {
  if (!str) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Edit session state tracking
let editingProductId = null;
let editingBlogId = null;
let editingSpeciesId = null;

document.addEventListener("DOMContentLoaded", () => {
  // HTML Nesting Guardrail to ensure panels are never nested inside other panels even if HTML tags mismatch
  const workspace = document.querySelector(".admin-workspace");
  if (workspace) {
    const panels = ["#panel-orders", "#panel-inquiries", "#panel-products", "#panel-blogs", "#panel-species"];
    panels.forEach(id => {
      const panel = document.querySelector(id);
      if (panel && panel.parentElement !== workspace) {
        console.warn(`Structure Correction: Reparenting nested panel ${id} to workspace.`);
        workspace.appendChild(panel);
      }
    });
  }

  initAdminAuth();
  initAdminTabs();
  initFormSubmissions();
  initRichEditors();
  initImageUploaders();
  initLivePreviewListeners();
  initBlogViewToggles();
});

let db = null;
if (typeof firebase !== 'undefined') {
  db = firebase.firestore();
}

// 1. ADMIN SESSION MONITORING
function initAdminAuth() {
  const loginForm = document.querySelector("#admin-login-form");
  const loginPanel = document.querySelector("#admin-login-panel");
  const workspacePanel = document.querySelector("#admin-workspace-panel");
  const profilePanel = document.querySelector("#admin-user-profile");
  const userEmailEl = document.querySelector("#admin-user-email");
  const logoutBtn = document.querySelector("#admin-logout-btn");

  if (!loginForm || !loginPanel || !workspacePanel) return;

  // Monitor Auth State
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // User is logged in
      loginPanel.style.display = "none";
      workspacePanel.style.display = "block";
      if (profilePanel) profilePanel.style.display = "flex";
      if (userEmailEl) userEmailEl.textContent = user.email;

      // Initialize dashboards (Realtime)
      syncAllDashboards();
    } else {
      // User is logged out
      loginPanel.style.display = "block";
      workspacePanel.style.display = "none";
      if (profilePanel) profilePanel.style.display = "none";
      
      // Cancel listeners
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeInquiries) unsubscribeInquiries();
    }
  });

  // Submit Login Credential Card
  loginForm.addEventListener("submit", () => {
    const email = document.querySelector("#admin-email").value.trim();
    const pass = document.querySelector("#admin-pass").value.trim();
    const submitBtn = document.querySelector("#admin-login-submit");

    submitBtn.disabled = true;
    submitBtn.textContent = "Authenticating Atelier credentials...";

    firebase.auth().signInWithEmailAndPassword(email, pass)
      .catch(error => {
        alert(`Authentication failed: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = "Authenticate Workspace";
      });
  });

  // Logout Click
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      firebase.auth().signOut().then(() => {
        window.location.reload();
      });
    });
  }
}

// 2. DASHBOARD TABS TRANSITIONS
function initAdminTabs() {
  const tabBtns = document.querySelectorAll(".admin-nav-btn");
  const panels = document.querySelectorAll(".admin-panel");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      tabBtns.forEach(b => b.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.querySelector(`#panel-${targetTab}`);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Sync Refresh triggers
  const syncOrders = document.querySelector("#refresh-orders-btn");
  const syncInq = document.querySelector("#refresh-inquiries-btn");

  if (syncOrders) syncOrders.addEventListener("click", loadAdminOrders);
  if (syncInq) syncInq.addEventListener("click", loadAdminInquiries);
}

// 3. SECURED DATA SYNC CHANNELS (Realtime listeners for orders/inquiries)
function syncAllDashboards() {
  loadAdminOrders(); // Sets up realtime listener
  loadAdminInquiries(); // Sets up realtime listener
  loadAdminProducts();
  loadAdminBlogs();
  loadAdminSpecies();
}

// A. CUSTOMER ORDERS LOGS (Realtime snapshot sync)
function loadAdminOrders() {
  const list = document.querySelector("#admin-orders-list");
  if (!list || !db) return;

  list.innerHTML = `<tr><td colspan="7" class="text-center">Syncing orders in real-time...</td></tr>`;

  if (unsubscribeOrders) unsubscribeOrders();

  unsubscribeOrders = db.collection("orders").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    if (snapshot.empty) {
      list.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px 0;">No customer shipments found in registry.</td></tr>`;
      return;
    }

    let html = "";
    snapshot.forEach(doc => {
      const order = doc.data();
      const docId = doc.id;
      const date = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleDateString() : "Just Now";

      let itemsHtml = order.items.map(it => `<div>${escapeHTML(it.name)} (x${it.quantity})</div>`).join("");
      
      html += `
        <tr>
          <td style="font-family:monospace; font-weight:600;">${escapeHTML(order.orderId || docId.substring(0, 8).toUpperCase())}</td>
          <td>
            <strong>${escapeHTML(order.customerName)}</strong><br>
            <span style="font-size:12px; color:var(--text-secondary);">${escapeHTML(order.email)}</span>
          </td>
          <td>
            <span>OTP Primary: ${escapeHTML(order.phoneNumber)}</span><br>
            <span style="font-size:12px; color:var(--text-secondary);">Alt Contact: ${escapeHTML(order.alternativeNumber || 'None')}</span>
          </td>
          <td style="max-width:200px; font-size:13px;">${escapeHTML(order.address)}</td>
          <td>${itemsHtml}</td>
          <td style="font-weight:600; color:var(--primary);">₹ ${order.subtotal.toLocaleString('en-IN')}</td>
          <td>
            <select class="form-control" style="padding:6px 12px; font-size:12px; border-radius:20px; font-weight:600;" onchange="updateOrderStatus('${docId}', this.value)">
              <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
              <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
              <option value="Completed" ${order.status === "Completed" ? "selected" : ""}>Completed</option>
            </select>
          </td>
        </tr>
      `;
    });
    list.innerHTML = html;
  }, error => {
    console.error("Orders realtime sync error:", error);
    list.innerHTML = `<tr><td colspan="7" class="text-center error">Sync error: ${error.message}</td></tr>`;
  });
}

window.updateOrderStatus = function(docId, newStatus) {
  if (!db) return;
  db.collection("orders").doc(docId).update({ status: newStatus })
    .catch(error => {
      alert(`Status update failed: ${error.message}`);
    });
};

// B. INQUIRIES & BESPOKE COMMISSIONS (Realtime snapshot sync)
function loadAdminInquiries() {
  const list = document.querySelector("#admin-inquiries-list");
  if (!list || !db) return;

  list.innerHTML = `<tr><td colspan="5" class="text-center">Syncing inquiries in real-time...</td></tr>`;

  if (unsubscribeInquiries) unsubscribeInquiries();

  unsubscribeInquiries = db.collection("inquiries").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    if (snapshot.empty) {
      list.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:40px 0;">No bespoke commission inquiries received.</td></tr>`;
      return;
    }

    let html = "";
    snapshot.forEach(doc => {
      const inq = doc.data();
      const date = inq.timestamp ? new Date(inq.timestamp.seconds * 1000).toLocaleDateString() : "Just Now";
      
      let detailsHtml = `<strong>Bespoke Inquiry:</strong> ${escapeHTML(inq.request || inq.message)}`;
      if (inq.scale) detailsHtml += `<br><span style="font-size:12px; color:var(--primary);">Scale: ${escapeHTML(inq.scale)} &bull; Budget: ${escapeHTML(inq.budget)}</span>`;
      if (inq.location) detailsHtml += `<br><span style="font-size:12px; color:var(--text-secondary);">Origin: ${escapeHTML(inq.location)}</span>`;

      html += `
        <tr>
          <td><strong>${escapeHTML(inq.name)}</strong></td>
          <td>${escapeHTML(inq.email)}</td>
          <td>${escapeHTML(inq.phone || 'None')}</td>
          <td>${detailsHtml}</td>
          <td style="white-space:nowrap; font-size:13px;">${escapeHTML(date)}</td>
        </tr>
      `;
    });
    list.innerHTML = html;
  }, error => {
    console.error("Inquiries realtime sync error:", error);
    list.innerHTML = `<tr><td colspan="5" class="text-center error">Sync error: ${error.message}</td></tr>`;
  });
}

// C. CATALOG PRODUCTS
function loadAdminProducts() {
  const list = document.querySelector("#admin-products-list");
  if (!list || !db) return;

  list.innerHTML = `<tr><td colspan="5" class="text-center">Loading catalog...</td></tr>`;

  db.collection("products").get()
    .then(snapshot => {
      if (snapshot.empty) {
        // Seed catalog with PRODUCT_DATABASE if empty
        list.innerHTML = `<tr><td colspan="5" class="text-center">Seeding catalog database...</td></tr>`;
        const batch = db.batch();
        PRODUCT_DATABASE.forEach(p => {
          const docRef = db.collection("products").doc(p.id);
          batch.set(docRef, p);
        });
        batch.commit().then(() => {
          loadAdminProducts();
        });
        return;
      }

      let html = "";
      snapshot.forEach(doc => {
        const p = doc.data();
        html += `
          <tr>
            <td><img src="${p.image}" alt="${p.name}" style="width:50px; height:50px; object-fit:cover; border-radius:var(--rounded-xs); border:1px solid var(--border);"></td>
            <td>
              <strong>${p.name}</strong><br>
              <span style="font-size:12px; color:var(--text-secondary); font-family:monospace;">ID: ${p.id}</span>
            </td>
            <td><span class="label-md" style="font-size:10px;">${p.categoryLabel || p.category}</span></td>
            <td style="font-weight:600; color:var(--primary);">₹ ${p.price.toLocaleString('en-IN')}</td>
            <td>
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border:1px solid var(--primary); color:var(--primary); margin-right:6px;" onclick="editProduct('${doc.id}')">Edit</button>
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border:1px solid var(--error); color:var(--error);" onclick="deleteProduct('${doc.id}')">Delete</button>
            </td>
          </tr>
        `;
      });
      list.innerHTML = html;
    });
}

window.deleteProduct = function(docId) {
  if (!db || !confirm("Are you sure you want to delete this product?")) return;
  db.collection("products").doc(docId).delete().then(() => {
    loadAdminProducts();
  });
};

// D. JOURNAL STORIES
function loadAdminBlogs() {
  const list = document.querySelector("#admin-blogs-list");
  if (!list || !db) return;

  list.innerHTML = `<tr><td colspan="4" class="text-center">Loading journal entries...</td></tr>`;

  db.collection("journal").get()
    .then(snapshot => {
      if (snapshot.empty) {
        // Seed from blog-data.js if empty
        list.innerHTML = `<tr><td colspan="4" class="text-center">Seeding journal database...</td></tr>`;
        const batch = db.batch();
        
        // Grab dummy dataset
        const mockBlogs = [
          { id: "featured", title: "The Blue Hour: Rediscovering Cyanotype Art", category: "Featured Field Note", author: "Reena Jasani", date: "June 15, 2026", readTime: "5 Min Read", image: "assets/hero_flatlay.png", description: "Exploring the history of cyanotype art.", content: ["<p>The cyanotype process is a fascinating intersection of chemistry, history, and photography...</p>"] },
          { id: "1", title: "The Memory of Ferns", category: "Botanical Studies", author: "Reena Jasani", date: "June 25, 2026", readTime: "5 Min Read", image: "assets/journal_notebook.png", description: "Exploring ancient symmetry of ferns.", content: ["<p>Ferns are living fossils, dating back over 300 million years...</p>"] }
        ];

        mockBlogs.forEach(b => {
          const docRef = db.collection("journal").doc(b.id);
          batch.set(docRef, b);
        });
        batch.commit().then(() => {
          loadAdminBlogs();
        });
        return;
      }

      let html = "";
      snapshot.forEach(doc => {
        const b = doc.data();
        html += `
          <tr>
            <td><strong>${b.title}</strong></td>
            <td>${b.author}</td>
            <td><span class="label-md" style="font-size:10px;">${b.category}</span></td>
            <td>
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border:1px solid var(--primary); color:var(--primary); margin-right:6px;" onclick="editBlog('${doc.id}')">Edit</button>
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border:1px solid var(--error); color:var(--error);" onclick="deleteBlog('${doc.id}')">Delete</button>
            </td>
          </tr>
        `;
      });
      list.innerHTML = html;
    });
}

window.deleteBlog = function(docId) {
  if (!db || !confirm("Are you sure you want to delete this blog story?")) return;
  db.collection("journal").doc(docId).delete().then(() => {
    loadAdminBlogs();
  });
};

// E. SPECIES LIBRARY
function loadAdminSpecies() {
  const list = document.querySelector("#admin-species-list");
  if (!list || !db) return;

  list.innerHTML = `<tr><td colspan="5" class="text-center">Loading species records...</td></tr>`;

  db.collection("species").get()
    .then(snapshot => {
      if (snapshot.empty) {
        // Seed species database if empty
        list.innerHTML = `<tr><td colspan="5" class="text-center">Seeding species library...</td></tr>`;
        const batch = db.batch();
        const initialSpecies = [
          { id: "adiantum", name: "Maidenhair Fern", scientific: "Adiantum capillus-veneris", type: "Leaves / Ferns", image: "assets/botanical_fern.png", origin: "Western Ghats, India", story: "<p>Practical insights on Maidenhair specimens.</p>" },
          { id: "ginkgo", name: "Ginkgo Biloba", scientific: "Ginkgo biloba", type: "Leaves / Trees", image: "assets/hero_flatlay.png", origin: "Kyoto Temple Groves", story: "<p>Botanical records of temple specimen trees.</p>" }
        ];

        initialSpecies.forEach(s => {
          const docRef = db.collection("species").doc(s.id);
          batch.set(docRef, s);
        });
        batch.commit().then(() => {
          loadAdminSpecies();
        });
        return;
      }

      let html = "";
      snapshot.forEach(doc => {
        const s = doc.data();
        html += `
          <tr>
            <td>
              <strong>${s.name}</strong><br>
              <span style="font-size:12px; color:var(--text-secondary); font-family:monospace;">ID: ${s.id}</span>
            </td>
            <td style="font-style:italic;">${s.scientific}</td>
            <td>${s.type}</td>
            <td>${s.origin}</td>
            <td>
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border:1px solid var(--primary); color:var(--primary); margin-right:6px;" onclick="editSpecies('${doc.id}')">Edit</button>
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border:1px solid var(--error); color:var(--error);" onclick="deleteSpecies('${doc.id}')">Delete</button>
            </td>
          </tr>
        `;
      });
      list.innerHTML = html;
    });
}

window.deleteSpecies = function(docId) {
  if (!db || !confirm("Are you sure you want to delete this species record?")) return;
  db.collection("species").doc(docId).delete().then(() => {
    loadAdminSpecies();
  });
};

// 4. RICH TEXT EDITOR MODULES
function initRichEditors() {
  if (typeof Quill !== 'undefined') {
    // Premium customizable formatting toolbar (style, headers, script formatting, alignments, video/images/embeds)
    const fullToolbar = [
      [{ 'font': [] }, { 'size': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }, { 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ];

    const quillConfig = {
      theme: 'snow',
      modules: {
        toolbar: fullToolbar
      }
    };
    
    if (document.querySelector("#blog-quill-editor")) {
      blogQuillEditor = new Quill('#blog-quill-editor', quillConfig);
      // Bind live preview compiler
      blogQuillEditor.on('text-change', updateBlogLivePreview);
    }
    if (document.querySelector("#prod-quill-desc")) {
      prodDescEditor = new Quill('#prod-quill-desc', quillConfig);
    }
    if (document.querySelector("#prod-materials-editor")) {
      prodMaterialsEditor = new Quill('#prod-materials-editor', quillConfig);
    }
    if (document.querySelector("#prod-care-editor")) {
      prodCareEditor = new Quill('#prod-care-editor', quillConfig);
    }
    if (document.querySelector("#spec-quill-story")) {
      specQuillStory = new Quill('#spec-quill-story', quillConfig);
    }
  }
}

// 5. IMAGE UPLOADING & BASE64 PARSING DECK
function initImageUploaders() {
  // A. Product Form Images
  const prodDropzone = document.querySelector("#prod-images-dropzone");
  const prodUploader = document.querySelector("#prod-images-uploader");
  if (prodDropzone && prodUploader) {
    prodDropzone.addEventListener("click", () => prodUploader.click());
    prodDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      prodDropzone.style.borderColor = "var(--primary)";
      prodDropzone.style.background = "var(--surface)";
    });
    prodDropzone.addEventListener("dragleave", () => {
      prodDropzone.style.borderColor = "var(--border)";
      prodDropzone.style.background = "white";
    });
    prodDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      prodDropzone.style.borderColor = "var(--border)";
      prodDropzone.style.background = "white";
      handleProdImageFiles(e.dataTransfer.files);
    });
    prodUploader.addEventListener("change", (e) => {
      handleProdImageFiles(e.target.files);
    });
  }

  // B. Blog Editor Media
  const blogDropzone = document.querySelector("#blog-media-dropzone");
  const blogUploader = document.querySelector("#blog-media-uploader");
  if (blogDropzone && blogUploader) {
    blogDropzone.addEventListener("click", () => blogUploader.click());
    blogDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      blogDropzone.style.borderColor = "var(--primary)";
      blogDropzone.style.background = "var(--surface)";
    });
    blogDropzone.addEventListener("dragleave", () => {
      blogDropzone.style.borderColor = "var(--border)";
      blogDropzone.style.background = "white";
    });
    blogDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      blogDropzone.style.borderColor = "var(--border)";
      blogDropzone.style.background = "white";
      handleBlogMediaFiles(e.dataTransfer.files);
    });
    blogUploader.addEventListener("change", (e) => {
      handleBlogMediaFiles(e.target.files);
    });
  }

  // C. Species Specimen Images
  const specDropzone = document.querySelector("#spec-images-dropzone");
  const specUploader = document.querySelector("#spec-images-uploader");
  if (specDropzone && specUploader) {
    specDropzone.addEventListener("click", () => specUploader.click());
    specDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      specDropzone.style.borderColor = "var(--primary)";
      specDropzone.style.background = "var(--surface)";
    });
    specDropzone.addEventListener("dragleave", () => {
      specDropzone.style.borderColor = "var(--border)";
      specDropzone.style.background = "white";
    });
    specDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      specDropzone.style.borderColor = "var(--border)";
      specDropzone.style.background = "white";
      handleSpecImageFiles(e.dataTransfer.files);
    });
    specUploader.addEventListener("change", (e) => {
      handleSpecImageFiles(e.target.files);
    });
  }
}

// Upload Handling Binders
function handleProdImageFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedProdImages.push(e.target.result);
      renderProdThumbnails();
    };
    reader.readAsDataURL(file);
  });
}

function renderProdThumbnails() {
  const container = document.querySelector("#prod-uploaded-thumbnails");
  if (!container) return;
  container.innerHTML = "";
  uploadedProdImages.forEach((img, idx) => {
    const div = document.createElement("div");
    div.className = "thumbnail-item";
    div.innerHTML = `
      <img src="${img}">
      <button type="button" class="remove-btn" onclick="removeProdImage(${idx})">&times;</button>
    `;
    container.appendChild(div);
  });
}

window.removeProdImage = function(idx) {
  uploadedProdImages.splice(idx, 1);
  renderProdThumbnails();
};

function handleBlogMediaFiles(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedBlogImages.push(e.target.result);
      renderBlogThumbnails();
    };
    reader.readAsDataURL(file);
  });
}

function renderBlogThumbnails() {
  const container = document.querySelector("#blog-media-thumbnails");
  if (!container) return;
  container.innerHTML = "";
  uploadedBlogImages.forEach((img, idx) => {
    const div = document.createElement("div");
    div.className = "thumbnail-item";
    div.innerHTML = `
      <img src="${img}">
      <button type="button" class="remove-btn" onclick="removeBlogImage(${idx})">&times;</button>
      <button type="button" class="insert-btn" onclick="insertBlogImageIntoEditor(${idx})">Insert</button>
      <button type="button" class="insert-btn" style="bottom:22px; background:rgba(22,120,60,0.85);" onclick="setBlogCoverImage(${idx})">Cover</button>
    `;
    container.appendChild(div);
  });
}

window.removeBlogImage = function(idx) {
  uploadedBlogImages.splice(idx, 1);
  renderBlogThumbnails();
};

window.insertBlogImageIntoEditor = function(idx) {
  if (!blogQuillEditor) return;
  const img = uploadedBlogImages[idx];
  const range = blogQuillEditor.getSelection(true);
  blogQuillEditor.insertEmbed(range.index, 'image', img);
};

window.setBlogCoverImage = function(idx) {
  const img = uploadedBlogImages[idx];
  const coverInput = document.querySelector("#blog-image");
  if (coverInput) {
    coverInput.value = img;
    updateBlogLivePreview();
  }
};

function handleSpecImageFiles(files) {
  if (files.length === 0) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedSpecImage = e.target.result;
    document.querySelector("#spec-image").value = e.target.result;
    renderSpecThumbnails();
  };
  reader.readAsDataURL(files[0]);
}

function renderSpecThumbnails() {
  const container = document.querySelector("#spec-uploaded-thumbnails");
  if (!container) return;
  container.innerHTML = "";
  if (uploadedSpecImage) {
    const div = document.createElement("div");
    div.className = "thumbnail-item";
    div.innerHTML = `
      <img src="${uploadedSpecImage}">
      <button type="button" class="remove-btn" onclick="removeSpecImage()">&times;</button>
    `;
    container.appendChild(div);
  }
}

window.removeSpecImage = function() {
  uploadedSpecImage = "";
  document.querySelector("#spec-image").value = "";
  renderSpecThumbnails();
};

// 6. REALTIME BLOG LIVE PREVIEW COMPILER
function initLivePreviewListeners() {
  const fields = ["#blog-title", "#blog-category", "#blog-author", "#blog-readtime", "#blog-image"];
  fields.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) el.addEventListener("input", updateBlogLivePreview);
  });
}

function updateBlogLivePreview() {
  const titleVal = document.querySelector("#blog-title").value.trim() || "The Blue Hour: Rediscovering Cyanotype Art";
  const catVal = document.querySelector("#blog-category").value.trim() || "Featured Note";
  const authVal = document.querySelector("#blog-author").value.trim() || "Reena Jasani";
  const readVal = document.querySelector("#blog-readtime").value.trim() || "5 Min Read";
  const imgVal = document.querySelector("#blog-image").value.trim() || "assets/hero_flatlay.png";
  
  const quillHTML = blogQuillEditor ? blogQuillEditor.root.innerHTML.trim() : "";
  const bodyHTML = (quillHTML === "<p><br></p>" || !quillHTML) ? "<p>Write content in the rich editor on the left to see the layout preview update in real-time...</p>" : quillHTML;

  const previewCat = document.querySelector("#preview-blog-cat");
  const previewTitle = document.querySelector("#preview-blog-title");
  const previewAuthor = document.querySelector("#preview-blog-author");
  const previewRead = document.querySelector("#preview-blog-read");
  const previewImg = document.querySelector("#preview-blog-img");
  const previewBody = document.querySelector("#preview-blog-body");

  if (previewCat) previewCat.textContent = catVal;
  if (previewTitle) previewTitle.textContent = titleVal;
  if (previewAuthor) previewAuthor.textContent = authVal;
  if (previewRead) previewRead.textContent = readVal;
  if (previewImg) previewImg.src = imgVal;
  if (previewBody) previewBody.innerHTML = bodyHTML;
}

// 7. BLOG WRITER VIEW TOGGLING (DISTRACTION-FREE VIEW)
function initBlogViewToggles() {
  const createBtn = document.querySelector("#blog-create-mode-btn");
  const cancelBtn = document.querySelector("#blog-cancel-btn");
  const listView = document.querySelector("#blog-list-view");
  const editorView = document.querySelector("#blog-editor-view");

  if (createBtn && listView && editorView) {
    createBtn.addEventListener("click", () => {
      listView.style.display = "none";
      editorView.style.display = "block";
      createBtn.style.display = "none";
    });
  }
  if (cancelBtn && listView && editorView) {
    cancelBtn.addEventListener("click", () => {
      listView.style.display = "block";
      editorView.style.display = "none";
      if (createBtn) createBtn.style.display = "block";
    });
  }
}

// 8. EDIT MODE DATABASE PULLS
window.editProduct = function(id) {
  if (!db) return;
  db.collection("products").doc(id).get()
    .then(doc => {
      if (!doc.exists) return;
      const p = doc.data();
      editingProductId = id;
      
      document.querySelector("#prod-id").value = p.id;
      document.querySelector("#prod-id").disabled = true;
      document.querySelector("#prod-name").value = p.name;
      document.querySelector("#prod-price").value = p.price;
      document.querySelector("#prod-category").value = p.category;
      document.querySelector("#prod-glb").value = p.glb || "";
      
      // Load technical specs
      if (p.details) {
        document.querySelector("#prod-origin").value = p.details.origin || "";
        document.querySelector("#prod-exposure").value = p.details.exposure || "";
        document.querySelector("#prod-paper").value = p.details.paper || "";
        document.querySelector("#prod-dimensions").value = p.details.dimensions || "";
        document.querySelector("#prod-framing").value = p.details.framing || "";
      }

      // Load Quill editors
      if (prodDescEditor) prodDescEditor.root.innerHTML = p.description || "";
      if (prodMaterialsEditor) prodMaterialsEditor.root.innerHTML = (p.details && p.details.materials) ? p.details.materials : "";
      if (prodCareEditor) prodCareEditor.root.innerHTML = (p.details && p.details.care) ? p.details.care : "";

      // Load images
      uploadedProdImages = p.images ? [...p.images] : [p.image];
      renderProdThumbnails();

      // Scroll to form and update button
      document.querySelector("#admin-product-form button[type='submit']").textContent = "Update Product";
      document.querySelector("#admin-product-form").scrollIntoView({ behavior: 'smooth' });
    });
};

window.editBlog = function(id) {
  if (!db) return;
  db.collection("journal").doc(id).get()
    .then(doc => {
      if (!doc.exists) return;
      const b = doc.data();
      editingBlogId = id;

      document.querySelector("#blog-title").value = b.title;
      document.querySelector("#blog-category").value = b.category;
      document.querySelector("#blog-author").value = b.author;
      document.querySelector("#blog-readtime").value = b.readTime;
      document.querySelector("#blog-image").value = b.image || "";

      // Load Quill content
      if (blogQuillEditor) {
        const bodyContent = Array.isArray(b.content) ? b.content.join("") : (b.content || "");
        blogQuillEditor.root.innerHTML = bodyContent;
      }
      
      // Load uploader files if available
      uploadedBlogImages = b.image ? [b.image] : [];
      renderBlogThumbnails();
      updateBlogLivePreview();

      // Show editor view
      document.querySelector("#blog-list-view").style.display = "none";
      document.querySelector("#blog-editor-view").style.display = "block";
      document.querySelector("#blog-create-mode-btn").style.display = "none";
      document.querySelector("#admin-blog-form button[type='submit']").textContent = "Update Journal Entry";
    });
};

window.editSpecies = function(id) {
  if (!db) return;
  db.collection("species").doc(id).get()
    .then(doc => {
      if (!doc.exists) return;
      const s = doc.data();
      editingSpeciesId = id;

      document.querySelector("#spec-id").value = s.id;
      document.querySelector("#spec-id").disabled = true;
      document.querySelector("#spec-name").value = s.name;
      document.querySelector("#spec-scientific").value = s.scientific;
      document.querySelector("#spec-type").value = s.type;
      document.querySelector("#spec-origin").value = s.origin;
      document.querySelector("#spec-image").value = s.image || "";

      // Load image thumbnail
      uploadedSpecImage = s.image || "";
      renderSpecThumbnails();

      // Load Quill
      if (specQuillStory) specQuillStory.root.innerHTML = s.story || "";

      document.querySelector("#admin-species-form button[type='submit']").textContent = "Update Specimen Record";
      document.querySelector("#admin-species-form").scrollIntoView({ behavior: 'smooth' });
    });
};

// 9. CREATION & UPDATE FORMS HANDLERS
function initFormSubmissions() {
  const prodForm = document.querySelector("#admin-product-form");
  const blogForm = document.querySelector("#admin-blog-form");
  const specForm = document.querySelector("#admin-species-form");

  if (prodForm && db) {
    // Reset Form hook to clean edit state
    prodForm.addEventListener("reset", () => {
      editingProductId = null;
      document.querySelector("#prod-id").disabled = false;
      document.querySelector("#admin-product-form button[type='submit']").textContent = "Register Product";
      uploadedProdImages = [];
      renderProdThumbnails();
      if (prodDescEditor) prodDescEditor.setContents([]);
      if (prodMaterialsEditor) prodMaterialsEditor.setContents([]);
      if (prodCareEditor) prodCareEditor.setContents([]);
    });

    prodForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.querySelector("#prod-id").value.trim();
      const name = document.querySelector("#prod-name").value.trim();
      const price = parseInt(document.querySelector("#prod-price").value, 10);
      const cat = document.querySelector("#prod-category").value;
      const glb = document.querySelector("#prod-glb").value.trim();

      // Retrieve uploader images
      const imagesArray = [...uploadedProdImages];
      const mainImage = imagesArray[0] || "assets/hero_flatlay.png";

      // Technical specifications
      const origin = document.querySelector("#prod-origin").value.trim() || "Atelier Hand-Crafted Curation";
      const exposure = document.querySelector("#prod-exposure").value.trim() || "Sun Exposure chemistry development";
      const paper = document.querySelector("#prod-paper").value.trim() || "300gsm handmade cotton paper";
      const dimensions = document.querySelector("#prod-dimensions").value.trim() || "Atelier scale dimensions";
      const framing = document.querySelector("#prod-framing").value.trim() || "Reclaimed teakwood design";

      // Quill editor texts
      const descHTML = prodDescEditor ? prodDescEditor.root.innerHTML.trim() : "";
      const descText = (descHTML === "<p><br></p>") ? "" : descHTML;

      const materialsHTML = prodMaterialsEditor ? prodMaterialsEditor.root.innerHTML.trim() : "";
      const materialsText = (materialsHTML === "<p><br></p>") ? "" : materialsHTML;

      const careHTML = prodCareEditor ? prodCareEditor.root.innerHTML.trim() : "";
      const careText = (careHTML === "<p><br></p>") ? "" : careHTML;

      const payload = {
        id: id,
        name: name,
        price: price,
        category: cat,
        categoryLabel: cat === "wall-art" ? "Wall Art" : cat === "tower-lamps" ? "Tower Lamps" : cat === "sets" ? "Botanical Sets" : "Limited Edition",
        image: mainImage,
        images: imagesArray,
        glb: glb || null,
        description: descText,
        details: {
          origin: origin,
          exposure: exposure,
          paper: paper,
          dimensions: dimensions,
          framing: framing,
          materials: materialsText,
          care: careText
        }
      };

      const targetId = editingProductId || id;

      db.collection("products").doc(targetId).set(payload)
        .then(() => {
          alert(editingProductId ? "Product successfully updated!" : "Product successfully registered!");
          prodForm.reset();
          loadAdminProducts();
        })
        .catch(err => alert(`Error writing product: ${err.message}`));
    });
  }

  if (blogForm && db) {
    // Reset Form hook to clean edit state
    blogForm.addEventListener("reset", () => {
      editingBlogId = null;
      document.querySelector("#admin-blog-form button[type='submit']").textContent = "Publish Curation to Journal";
      uploadedBlogImages = [];
      renderBlogThumbnails();
      if (blogQuillEditor) blogQuillEditor.setContents([]);
    });

    blogForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.querySelector("#blog-title").value.trim();
      const cat = document.querySelector("#blog-category").value.trim();
      const auth = document.querySelector("#blog-author").value.trim();
      const read = document.querySelector("#blog-readtime").value.trim();
      const img = document.querySelector("#blog-image").value.trim();

      const storyHTML = blogQuillEditor ? blogQuillEditor.root.innerHTML.trim() : "";
      const storyContent = (storyHTML === "<p><br></p>") ? "" : storyHTML;

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = storyContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      const descriptionSnippet = plainText.substring(0, 160) + (plainText.length > 160 ? "..." : "");

      const slug = editingBlogId || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const date = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

      const payload = {
        id: slug,
        title: title,
        category: cat,
        author: auth,
        readTime: read,
        image: img || uploadedBlogImages[0] || "assets/journal_notebook.png",
        date: date,
        description: descriptionSnippet,
        content: [storyContent]
      };

      db.collection("journal").doc(slug).set(payload)
        .then(() => {
          alert(editingBlogId ? "Journal entry successfully updated!" : "Journal entry successfully published!");
          blogForm.reset();
          
          // Return to lists
          document.querySelector("#blog-list-view").style.display = "block";
          document.querySelector("#blog-editor-view").style.display = "none";
          document.querySelector("#blog-create-mode-btn").style.display = "block";
          loadAdminBlogs();
        })
        .catch(err => alert(`Error publishing entry: ${err.message}`));
    });
  }

  if (specForm && db) {
    // Reset Form hook to clean edit state
    specForm.addEventListener("reset", () => {
      editingSpeciesId = null;
      document.querySelector("#spec-id").disabled = false;
      document.querySelector("#admin-species-form button[type='submit']").textContent = "Save Specimen Record";
      uploadedSpecImage = "";
      renderSpecThumbnails();
      if (specQuillStory) specQuillStory.setContents([]);
    });

    specForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.querySelector("#spec-id").value.trim();
      const name = document.querySelector("#spec-name").value.trim();
      const scientific = document.querySelector("#spec-scientific").value.trim();
      const type = document.querySelector("#spec-type").value.trim();
      const origin = document.querySelector("#spec-origin").value.trim();
      const img = document.querySelector("#spec-image").value.trim();
      
      const storyHTML = specQuillStory ? specQuillStory.root.innerHTML.trim() : "";
      const storyContent = (storyHTML === "<p><br></p>") ? "" : storyHTML;

      const payload = {
        id: id,
        name: name,
        scientific: scientific,
        type: type,
        origin: origin,
        image: img || "assets/botanical_fern.png",
        story: storyContent,
        productId: "wild-fern"
      };

      const targetId = editingSpeciesId || id;

      db.collection("species").doc(targetId).set(payload)
        .then(() => {
          alert(editingSpeciesId ? "Botanical specimen successfully updated!" : "Botanical specimen successfully logged in Registry!");
          specForm.reset();
          loadAdminSpecies();
        })
        .catch(err => alert(`Error writing specimen: ${err.message}`));
    });
  }
}
