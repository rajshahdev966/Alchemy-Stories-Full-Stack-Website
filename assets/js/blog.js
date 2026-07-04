let dbBlogs = [];

// Client-side HTML sanitizer to prevent Stored/DOM XSS
function sanitizeHTML(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  temp.querySelectorAll("script").forEach(s => s.remove());
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
  initBlogDetails();
});

function initBlogDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id') || 'featured';

  // Try fetching blogs from Firestore with fallback to JOURNAL_DATABASE
  if (typeof firebase !== 'undefined' && typeof JOURNAL_DATABASE !== 'undefined') {
    dbBlogs = [...JOURNAL_DATABASE];
    firebase.firestore().collection("journal").get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => {
            list.push(doc.data());
          });
          dbBlogs = list;
        }
        renderBlogDetails(postId);
      })
      .catch(() => {
        renderBlogDetails(postId);
      });
  } else {
    if (typeof JOURNAL_DATABASE !== 'undefined') {
      dbBlogs = [...JOURNAL_DATABASE];
    }
    renderBlogDetails(postId);
  }
}

function renderBlogDetails(postId) {
  const post = dbBlogs.find(p => p.id === postId) || dbBlogs[0];
  if (!post) return;

  // Update page title & description for SEO
  document.title = `${post.title} — Alchemy Stories`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && post.description) {
    metaDesc.setAttribute("content", post.description.substring(0, 155) + (post.description.length > 155 ? "..." : ""));
  }

  // Dynamic OpenGraph & Canonical Link SEO updates
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', `${post.title} — Alchemy Stories`);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  if (post.description) {
    ogDesc.setAttribute('content', post.description.substring(0, 155));
  }

  let ogImage = document.querySelector('meta[property="og:image"]');
  if (!ogImage) {
    ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    document.head.appendChild(ogImage);
  }
  ogImage.setAttribute('content', window.location.origin + "/" + post.image);

  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', window.location.href);

  // Inject BlogPosting JSON-LD Schema
  let schemaScript = document.querySelector("#blog-schema-jsonld");
  if (!schemaScript) {
    schemaScript = document.createElement("script");
    schemaScript.type = "application/ld+json";
    schemaScript.id = "blog-schema-jsonld";
    document.head.appendChild(schemaScript);
  }
  const schemaPayload = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.image ? [window.location.origin + "/" + post.image] : [],
    "datePublished": post.date || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author || "Reena Jasani"
    },
    "description": post.description || ""
  };
  schemaScript.text = JSON.stringify(schemaPayload);

  // Populate meta details
  document.querySelector(".blog-meta-category").textContent = post.category;
  document.querySelector(".blog-meta-title").textContent = post.title;
  document.querySelector(".blog-author").textContent = post.author;
  document.querySelector(".blog-date").textContent = post.date;
  document.querySelector(".blog-read-time").textContent = post.readTime;
  
  // Populate main image
  const mainImg = document.querySelector(".blog-main-image");
  mainImg.src = post.image;
  mainImg.alt = post.title;

  // Populate content paragraphs
  const bodyContent = document.querySelector(".blog-body-content");
  bodyContent.innerHTML = "";
  if (Array.isArray(post.content)) {
    post.content.forEach(para => {
      if (para.trim().startsWith("<")) {
        const div = document.createElement("div");
        div.innerHTML = sanitizeHTML(para);
        while (div.firstChild) {
          bodyContent.appendChild(div.firstChild);
        }
      } else {
        const p = document.createElement("p");
        p.textContent = para;
        bodyContent.appendChild(p);
      }
    });
  } else if (typeof post.content === 'string') {
    bodyContent.innerHTML = sanitizeHTML(post.content);
  }

  // Populate specimen
  const specimenBox = document.querySelector(".blog-specimen-box");
  if (post.specimen) {
    specimenBox.style.display = "flex";
    specimenBox.querySelector(".blog-specimen-name").textContent = post.specimen.name;
    specimenBox.querySelector(".blog-specimen-coords").textContent = post.specimen.coordinates;
  } else {
    specimenBox.style.display = "none";
  }

  // Populate Read Next recommendations (up to 2 related articles)
  const readNextGrid = document.querySelector("#read-next-grid");
  if (readNextGrid) {
    readNextGrid.innerHTML = "";
    const otherPosts = dbBlogs.filter(p => p.id !== post.id).slice(0, 2);
    
    otherPosts.forEach(other => {
      const card = document.createElement("article");
      card.className = "art-card";
      card.style.padding = "var(--spacing-sm)";
      card.style.cursor = "pointer";
      card.onclick = () => {
        window.location.href = `blog.html?id=${other.id}`;
      };

      card.innerHTML = `
        <div class="art-card-image-wrap" style="aspect-ratio: 16/10; margin-bottom: var(--spacing-sm);">
          <img src="${other.image}" alt="${other.title}">
        </div>
        <span class="art-card-category" style="color: var(--accent-forest);">${other.category}</span>
        <h3 class="font-display" style="font-size: 22px; margin-bottom: 8px;">${other.title}</h3>
        <p class="body-sm" style="margin-bottom: var(--spacing-md); line-height: 1.5;">${other.description}</p>
        <a href="blog.html?id=${other.id}" class="btn btn-link">Read Entry</a>
      `;
      readNextGrid.appendChild(card);
    });
  }

  // Collapsible Admin Toggle
  const adminToggle = document.querySelector("#admin-toggle");
  const adminContent = document.querySelector("#admin-content");
  const adminChevron = document.querySelector("#admin-chevron");

  if (adminToggle && adminContent) {
    adminToggle.addEventListener("click", () => {
      const isActive = adminContent.classList.toggle("active");
      if (isActive) {
        adminChevron.style.transform = "rotate(180deg)";
      } else {
        adminChevron.style.transform = "rotate(0deg)";
      }
    });
  }

  // Reload Lucide Icons if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
