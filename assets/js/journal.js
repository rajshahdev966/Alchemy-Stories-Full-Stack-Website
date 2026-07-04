document.addEventListener("DOMContentLoaded", () => {
  initJournalFeed();
});

let dbBlogs = [];

function initJournalFeed() {
  const featuredContainer = document.querySelector("#featured-journal-banner");
  const gridContainer = document.querySelector("#journal-grid");

  if (!featuredContainer || !gridContainer) return;

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
        renderJournalUI(dbBlogs, featuredContainer, gridContainer);
      })
      .catch(() => {
        renderJournalUI(dbBlogs, featuredContainer, gridContainer);
      });
  } else {
    if (typeof JOURNAL_DATABASE !== 'undefined') {
      dbBlogs = [...JOURNAL_DATABASE];
    }
    renderJournalUI(dbBlogs, featuredContainer, gridContainer);
  }
}

function renderJournalUI(blogs, featuredContainer, gridContainer) {
  if (blogs.length === 0) return;

  // 1. Find Featured Post (explicitly tagged or just the first item)
  let featuredPost = blogs.find(b => b.id === "featured");
  if (!featuredPost) {
    featuredPost = blogs[0];
  }

  featuredContainer.innerHTML = `
    <div style="border-radius: var(--rounded-lg); overflow: hidden; position: relative; aspect-ratio: 16/7; background-color: #121c2c; box-shadow: var(--shadow-soft);">
      <img src="${featuredPost.image}" alt="Featured story background" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover; opacity: 0.65;">
      <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(29,29,29,0.85) 0%, rgba(29,29,29,0.3) 60%, rgba(29,29,29,0) 100%); z-index: 2;"></div>
      
      <div style="position: absolute; bottom: var(--spacing-xl); left: var(--spacing-xl); z-index: 5; color: white; max-width: 650px; padding-right: var(--spacing-md);">
        <span class="label-md" style="color: var(--tertiary);">Featured Field Note</span>
        <h1 class="display-lg" style="color: white; margin-bottom: var(--spacing-sm); font-size: clamp(32px, 5vw, 56px);">${featuredPost.title}</h1>
        <p class="body-sm" style="color: rgba(255,255,255,0.85); margin-bottom: var(--spacing-md);">${featuredPost.description}</p>
        <a href="blog.html?id=${featuredPost.id}" class="btn btn-primary" style="padding: 10px 24px; font-size: 11px; border-radius: var(--rounded-xs);">Read Journal Entry</a>
      </div>
    </div>
  `;

  // 2. Render remaining items in grid
  const remainingBlogs = blogs.filter(b => b.id !== featuredPost.id);
  let html = "";
  
  remainingBlogs.forEach(b => {
    html += `
      <article class="art-card" style="padding: var(--spacing-sm); cursor: pointer;" onclick="window.location.href='blog.html?id=${b.id}'">
        <div class="art-card-image-wrap" style="aspect-ratio: 16/10; margin-bottom: var(--spacing-sm);">
          <img src="${b.image}" alt="${b.title}">
        </div>
        <span class="art-card-category" style="color: var(--accent-forest);">${b.category}</span>
        <h3 class="font-display" style="font-size: 24px; margin-bottom: 8px;">${b.title}</h3>
        <p class="body-sm" style="margin-bottom: var(--spacing-md);">${b.description}</p>
        <a href="blog.html?id=${b.id}" class="btn btn-link">Read Entry</a>
      </article>
    `;
  });

  gridContainer.innerHTML = html;

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
