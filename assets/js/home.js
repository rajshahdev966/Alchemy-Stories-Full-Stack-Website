document.addEventListener("DOMContentLoaded", () => {
  initHeroCarousel();
  initProcessScroll();
  initInteriorHotspots();
  initTestimonialCarousel();
  initCommissionInquiry();
});

// HERO BACKGROUND CAROUSEL
function initHeroCarousel() {
  const slides = document.querySelectorAll(".hero-slide");
  if (slides.length <= 1) return;

  let currentSlide = 0;
  
  setInterval(() => {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
  }, 5000);
}

// STICKY ORIGAMI PAPER TIMELINE FOR "THE ALCHEMY PROCESS"
function initProcessScroll() {
  const scrollWrapper = document.querySelector(".process-scroll-wrapper");
  const stickyContainer = document.querySelector(".process-sticky-container");
  const viewport = document.querySelector(".process-animation-viewport");
  const paperStage = document.querySelector(".process-paper-stage");
  const paper = document.querySelector(".process-paper");

  if (!scrollWrapper || !stickyContainer || !viewport || !paperStage || !paper) return;

  // Step databases containing content, coordinates annotation, and sketch paths (matching timeline icons in 24x24 viewBox)
  const PROCESS_STEPS = [
    {
      num: "01",
      title: "Observe Nature",
      desc: "We wander local forests, wetlands, and mountain paths, observing the seasonal geometries of wild botanicals and avian behaviors.",
      annoText: "sabarmati valley botanical study",
      annoPin: "23.02° N, 72.57° E",
      img1: "assets/hero_flatlay.png",
      img2: "assets/interior_studio.png",
      paths: [
        "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",
        "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      ]
    },
    {
      num: "02",
      title: "Collect Elements",
      desc: "Gathering fallen leaves, grasses, and seedpods. We press and dry these specimens to capture their delicate structural blueprints.",
      annoText: "pressed specimens cataloged",
      annoPin: "aravali foothills collection",
      img1: "assets/botanical_fern.png",
      img2: "assets/journal_notebook.png",
      paths: [
        "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "M20 4L8.12 15.88",
        "M14.47 14.48L20 20",
        "M8.12 8.12L12 12"
      ]
    },
    {
      num: "03",
      title: "Compose Story",
      desc: "Specimens are arranged on papers in our darkroom, forming detailed botanical narratives and visual starling movements.",
      annoText: "murmuration composition draft",
      annoPin: "NAL SAROVAR WETLANDS STUDY",
      img1: "assets/murmuration.png",
      img2: "assets/blue_bird_series.png",
      paths: [
        "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z",
        "M3 9h18",
        "M9 21V9"
      ]
    },
    {
      num: "04",
      title: "Sun Exposure",
      desc: "Arrangements are carried out under the Gujarat sun. The UV rays initiate chemistry, darkening exposed sections while leaves block light.",
      annoText: "solar reaction — UV index 8.5",
      annoPin: "AHMEDABAD TERRACOTTA ROOF",
      img1: "assets/hero_flatlay.png",
      img2: "assets/lamp_tower.png",
      paths: [
        "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
        "M12 2v2",
        "M12 20v2",
        "M4.93 4.93l1.41 1.41",
        "M17.66 17.66l1.41 1.41",
        "M2 12h2",
        "M20 12h2",
        "M6.34 17.66l-1.41 1.41",
        "M19.07 4.93l-1.41 1.41"
      ]
    },
    {
      num: "05",
      title: "Water Development",
      desc: "Exposed papers are washed in fresh water. The unexposed chemicals wash away, revealing Prussian Blue prints.",
      annoText: "chemical reduction wash phase",
      annoPin: "filtered rainwater reservoir",
      img1: "assets/botanical_fern.png",
      img2: "assets/murmurations_and_schooling.png",
      paths: [
        "M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7Z"
      ]
    },
    {
      num: "06",
      title: "Hand Finishing",
      desc: "Prints are dried, hand-signed, categorized with coordinates, and mounted inside custom wood frames.",
      annoText: "signed, authenticated by founder",
      annoPin: "BODAKDEV WORKSHOP ATELIER",
      img1: "assets/founders.png",
      img2: "assets/interior_studio.png",
      paths: [
        "M12 19l7-7 3 3-7 7-3-3z",
        "M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z",
        "M2 2l5 5",
        "M11 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
      ]
    }
  ];

  let lastStepIdx = -1;
  let lastProgress = -1;

  const adjustScrollHeight = () => {
    scrollWrapper.style.height = `${window.innerHeight * 6}px`;
  };

  adjustScrollHeight();
  window.addEventListener("resize", adjustScrollHeight);

  // Update paper HTML contents dynamically
  const updatePaperContent = (stepIdx) => {
    const step = PROCESS_STEPS[stepIdx];
    if (!step) return;

    paper.querySelector(".paper-title").textContent = step.title;
    paper.querySelector(".paper-step-num").textContent = step.num;
    paper.querySelector(".paper-desc").textContent = step.desc;
    paper.querySelector(".annotation-text").textContent = step.annoText;
    paper.querySelector(".annotation-pin").innerHTML = `<i data-lucide="map-pin"></i> ${step.annoPin}`;
    
    // Swap images
    paper.querySelector(".step-img-1").src = step.img1;
    paper.querySelector(".step-img-2").src = step.img2;

    // Redraw SVG path layers
    const svg = paper.querySelector(".sketch-svg");
    svg.innerHTML = "";
    step.paths.forEach((p) => {
      const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathEl.setAttribute("d", p);
      pathEl.setAttribute("stroke", "rgba(255, 255, 255, 0.45)");
      pathEl.setAttribute("stroke-width", "1.0");
      pathEl.setAttribute("fill", "none");
      pathEl.setAttribute("class", "sketch-path");
      svg.appendChild(pathEl);
    });

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  };

  // Scroll event bound logic
  window.addEventListener("scroll", () => {
    const rect = scrollWrapper.getBoundingClientRect();
    const scrollableRange = rect.height - window.innerHeight;
    
    let scrollProgress = 0;
    if (rect.top <= 0 && -rect.top <= scrollableRange) {
      scrollProgress = -rect.top / scrollableRange;
    } else if (-rect.top > scrollableRange) {
      scrollProgress = 1.0;
    }
    
    scrollProgress = Math.max(0, Math.min(1.0, scrollProgress));

    // Optimize performance and guarantee clean cleanup by skipping if progress hasn't changed
    if (scrollProgress === lastProgress) {
      return;
    }
    lastProgress = scrollProgress;

    const numSteps = 6;
    const rawStepProgress = scrollProgress * numSteps;
    let activeStepIdx = Math.floor(rawStepProgress);
    if (activeStepIdx >= numSteps) activeStepIdx = numSteps - 1;

    // Calculate localProgress correctly so it reaches exactly 1.0 at the absolute end of the segment
    let localProgress = rawStepProgress - activeStepIdx;
    if (scrollProgress >= 1.0) {
      localProgress = 1.0;
    }
    const sec = localProgress * 2.8;

    // Swap content if step index changes
    if (activeStepIdx !== lastStepIdx) {
      updatePaperContent(activeStepIdx);
      lastStepIdx = activeStepIdx;
    }

    const timelineSteps = document.querySelectorAll(".timeline-step");
    const activeStep = timelineSteps[activeStepIdx];
    if (!activeStep) return;

    // 1. Manage timeline step glows and dimmed opacities
    timelineSteps.forEach((step, idx) => {
      const iconWrap = step.querySelector(".timeline-icon-wrap");
      if (idx === activeStepIdx) {
        step.classList.add("active");
        if (sec <= 0.10) {
          const scale = 1.0 + (sec / 0.10) * 0.12;
          iconWrap.style.transform = `scale(${scale})`;
        } else if (sec >= 2.65) {
          const scale = 1.12 - ((sec - 2.65) / 0.15) * 0.12;
          iconWrap.style.transform = `scale(${scale})`;
        } else {
          iconWrap.style.transform = `scale(1.12)`;
        }
      } else {
        step.classList.remove("active");
        iconWrap.style.transform = "";
      }
    });

    // 2. Track screen coordinates to arise paper from active icon center
    const iconWrap = activeStep.querySelector(".timeline-icon-wrap");
    const iconRect = iconWrap.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();

    const iconCenterX = iconRect.left + iconRect.width / 2;
    const iconCenterY = iconRect.top + iconRect.height / 2;
    const viewportCenterX = viewportRect.left + viewportRect.width / 2;
    const viewportCenterY = viewportRect.top + viewportRect.height / 2;

    const deltaX = iconCenterX - viewportCenterX;
    const deltaY = iconCenterY - viewportCenterY;

    // Animation phases mathematical mapping
    let scale = 0;
    let rotateX = 85;
    let rotateY = 0;
    let translateZ = 0;
    let tx = deltaX;
    let ty = deltaY;

    let blueprintActive = false;
    let blueprintOpacity = 0;
    let sketchActive = false;
    let textActive = false;
    let photosActive = false;
    let foldLinesOpacity = 0.8;

    if (sec < 0.10) {
      // Phase 0: Idle scale 0 inside icon
      scale = 0;
      tx = deltaX;
      ty = deltaY;
      rotateX = 85;
      foldLinesOpacity = 0.8;
    } 
    else if (sec >= 0.10 && sec < 0.30) {
      // Phase 1: Arise from icon (Emerges as a paper ball)
      const prog = (sec - 0.10) / 0.20;
      scale = prog * 0.65;
      rotateX = 85 - (prog * 60); // 85 -> 25
      tx = deltaX * (1 - prog);
      ty = deltaY * (1 - prog) - (prog * 10);
      foldLinesOpacity = 0.8;
    } 
    else if (sec >= 0.30 && sec < 0.55) {
      // Phase 2: Unfold completely into flat card
      const prog = (sec - 0.30) / 0.25;
      const bounceProg = Math.sin(prog * Math.PI / 2);
      scale = 0.65 + (bounceProg * 0.35);
      rotateX = 25 - (bounceProg * 25); // 25 -> 0
      tx = 0;
      ty = -10 * (1 - prog);
      foldLinesOpacity = 0.8 * (1 - prog);
    } 
    else if (sec >= 0.55 && sec < 2.35) {
      // Phase 3: Flattened & Active layers
      scale = 1.0;
      rotateX = 0;
      tx = 0;
      ty = 0;
      foldLinesOpacity = 0;

      // Gentle ambient floating movement (breathing)
      const breatheTime = Date.now() / 1200;
      rotateY = Math.sin(breatheTime) * 1.5;
      rotateX = Math.cos(breatheTime) * 1;
      translateZ = Math.sin(breatheTime * 1.5) * 4;

      // Layer 1: Blueprint develops (0.55 - 0.70s)
      if (sec >= 0.55) {
        blueprintActive = true;
        const bpProg = Math.min(1, (sec - 0.55) / 0.15);
        blueprintOpacity = bpProg * 0.82;
      }
      // Layer 2: Text fades up (0.70 - 0.90s)
      if (sec >= 0.70) {
        textActive = true;
      }
      // Layer 3: Pencil sketch draws (1.20 - 1.50s)
      if (sec >= 1.20) {
        sketchActive = true;
      }
      // Layer 4: Photos slide up (1.50 - 2.10s)
      if (sec >= 1.50) {
        photosActive = true;
      }
    } 
    else if (sec >= 2.35 && sec < 2.50) {
      // Phase 4: Dissolving layers back to blank paper
      scale = 1.0;
      rotateX = 0;
      tx = 0;
      ty = 0;
      foldLinesOpacity = 0;

      const bpProg = 1 - ((sec - 2.35) / 0.15);
      blueprintActive = bpProg > 0;
      blueprintOpacity = bpProg * 0.82;
      textActive = false;
      sketchActive = false;
      photosActive = false;
    } 
    else if (sec >= 2.50 && sec < 2.65) {
      // Phase 5: Fold closing back into ball
      const prog = (sec - 2.50) / 0.15;
      scale = 1.0 - (prog * 0.35); // 1.0 -> 0.65
      rotateX = prog * 25; // 0 -> 25
      tx = deltaX * prog;
      ty = deltaY * prog;
      foldLinesOpacity = prog * 0.8;
    } 
    else if (sec >= 2.65 && sec <= 2.80) {
      // Phase 6: Final retract
      const prog = (sec - 2.65) / 0.15;
      scale = 0.65 * (1 - prog); // 0.65 -> 0
      rotateX = 25 + (prog * 60); // 25 -> 85
      tx = deltaX;
      ty = deltaY;
      foldLinesOpacity = 0.8;
    }

    // Toggle flat-paper shape class (border-radius and clip-path transition)
    if (sec >= 0.30 && sec < 2.50) {
      paper.classList.add("flat-paper");
    } else {
      paper.classList.remove("flat-paper");
    }

    // Apply calculated transitions to stage DOM
    paperStage.style.transform = `translate3d(${tx}px, ${ty}px, ${translateZ}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
    // Toggle active layout tags
    const bpLayer = paper.querySelector(".layer-blueprint");
    if (blueprintActive) {
      bpLayer.classList.add("blueprint-active");
      bpLayer.style.opacity = blueprintOpacity;
    } else {
      bpLayer.classList.remove("blueprint-active");
      bpLayer.style.opacity = 0;
    }

    if (sketchActive) {
      paper.classList.add("timeline-sketch-active");
      paper.querySelector(".layer-sketch").classList.add("sketch-active");
    } else {
      paper.classList.remove("timeline-sketch-active");
      paper.querySelector(".layer-sketch").classList.remove("sketch-active");
    }

    if (textActive) {
      paper.classList.add("text-active");
    } else {
      paper.classList.remove("text-active");
    }

    if (photosActive) {
      paper.classList.add("photos-active");
    } else {
      paper.classList.remove("photos-active");
    }

    // Set crease overlay visibility
    document.querySelectorAll(".origami-fold-line").forEach(line => {
      line.style.opacity = foldLinesOpacity;
    });
  });
}

// ART MEETS INTERIOR - HOTSPOTS SWITCHER & INTERACTION
function initInteriorHotspots() {
  const roomButtons = document.querySelectorAll(".interior-room-btn");
  const showcaseImage = document.querySelector(".interior-main-img");
  const hotspotContainer = document.querySelector(".interior-hotspots-overlay");

  if (!roomButtons.length || !showcaseImage || !hotspotContainer) return;

  // Data representing rooms, their showcase background and coordinates for hotspots
  const roomData = {
    "living-room": {
      image: "assets/living_room_art.png",
      hotspots: [
        {
          productId: "wild-fern",
          top: "35%",
          left: "48%",
          title: "Wild Fern Framed Print",
          price: "₹ 10,000"
        },
        {
          productId: "forest-rhythm-lamp",
          top: "65%",
          left: "22%",
          title: "Forest Rhythm Tower Lamp",
          price: "₹ 12,000"
        },
        {
          productId: "sunlit-leaves",
          top: "40%",
          left: "82%",
          title: "Sunlit Ginkgo Leaves Frame",
          price: "₹ 9,500"
        }
      ]
    },
    "study": {
      image: "assets/interior_studio.png",
      hotspots: [
        {
          productId: "botanical-studies",
          top: "40%",
          left: "50%",
          title: "Botanical Study Set",
          price: "₹ 15,000"
        }
      ]
    },
    "villa": {
      image: "assets/hero_flatlay.png",
      hotspots: [
        {
          productId: "blue-bird-series",
          top: "35%",
          left: "30%",
          title: "Blue Bird Flight Study",
          price: "₹ 18,000"
        },
        {
          productId: "ocean-whispers",
          top: "50%",
          left: "70%",
          title: "Ocean Whispers Canvas",
          price: "₹ 28,000"
        }
      ]
    }
  };

  const renderRoomHotspots = (roomKey) => {
    const data = roomData[roomKey];
    if (!data) return;

    // Fade image transition
    showcaseImage.style.opacity = 0;
    setTimeout(() => {
      showcaseImage.src = data.image;
      showcaseImage.style.opacity = 1;
    }, 150);

    // Render hotspots
    let html = "";
    data.hotspots.forEach(hs => {
      // Find item details from database
      const product = PRODUCT_DATABASE.find(p => p.id === hs.productId) || { image: "assets/horizontal_logo-removebg.png" };
      
      html += `
        <div class="interior-hotspot" style="top: ${hs.top}; left: ${hs.left};">
          <button class="hotspot-trigger" aria-label="View product details"></button>
          <div class="hotspot-card">
            <img class="hotspot-img" src="${product.image}" alt="${hs.title}">
            <h4 class="hotspot-title">${hs.title}</h4>
            <div class="hotspot-price">${hs.price}</div>
            <div style="display: flex; gap: var(--spacing-xs); margin-top: 8px;">
              <a href="product.html?id=${hs.productId}" class="btn btn-primary" style="padding: 6px 12px; font-size: 10px; flex-grow: 1; border-radius: var(--rounded-xs);">View Detail</a>
              <button data-cart-add="${hs.productId}" class="btn btn-secondary" style="padding: 6px 12px; font-size: 10px; border-radius: var(--rounded-xs);">+ Cart</button>
            </div>
          </div>
        </div>
      `;
    });

    hotspotContainer.innerHTML = html;

    // Toggle hotspots on touch device
    const hotspots = document.querySelectorAll(".interior-hotspot");
    hotspots.forEach(hs => {
      const trigger = hs.querySelector(".hotspot-trigger");
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const active = hs.classList.contains("active");
        hotspots.forEach(h => h.classList.remove("active"));
        if (!active) hs.classList.add("active");
      });
    });
  };

  // Close hotspots if clicked outside
  document.addEventListener("click", () => {
    const hotspots = document.querySelectorAll(".interior-hotspot");
    hotspots.forEach(h => h.classList.remove("active"));
  });

  // Wire tab switchers
  roomButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      roomButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const roomKey = btn.getAttribute("data-room");
      renderRoomHotspots(roomKey);
    });
  });

  // Render initial room
  renderRoomHotspots("living-room");
}

// TESTIMONIALS SLIDER
function initTestimonialCarousel() {
  const track = document.querySelector(".testimonial-track");
  const slides = document.querySelectorAll(".testimonial-slide");
  const indicatorsContainer = document.querySelector(".carousel-indicators");

  if (!track || !slides.length) return;

  let currentIndex = 0;
  const totalSlides = slides.length;

  // Build dots dynamically
  let dotsHtml = "";
  slides.forEach((_, idx) => {
    dotsHtml += `<button class="indicator-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Go to slide ${idx + 1}"></button>`;
  });
  if (indicatorsContainer) indicatorsContainer.innerHTML = dotsHtml;

  const dots = document.querySelectorAll(".indicator-dot");

  const goToSlide = (index) => {
    currentIndex = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    dots.forEach(dot => dot.classList.remove("active"));
    if (dots[currentIndex]) dots[currentIndex].classList.add("active");
  };

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const index = parseInt(dot.getAttribute("data-index"), 10);
      goToSlide(index);
    });
  });

  // Auto scroll every 7 seconds
  setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 7000);
}

// Instagram grid initialized statically in HTML.

// HOMEPAGE STORY COMMISSION SUBMISSIONS
function initCommissionInquiry() {
  const commForm = document.querySelector("#home-commission-form");
  if (commForm) {
    commForm.removeAttribute("onsubmit");
    commForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.querySelector("#comm-name").value.trim();
      const email = document.querySelector("#comm-email").value.trim();
      const phone = document.querySelector("#comm-phone").value.trim();
      const location = document.querySelector("#comm-location").value.trim();
      const story = document.querySelector("#comm-story").value.trim();
      const scale = document.querySelector("#comm-size").value;
      const budget = document.querySelector("#comm-budget").value;

      const payload = {
        name: name,
        email: email,
        phone: phone || "Not Provided",
        location: location || "Not Provided",
        request: story,
        scale: scale,
        budget: budget,
        timestamp: typeof firebase !== 'undefined' ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
      };

      if (typeof firebase !== 'undefined') {
        firebase.firestore().collection("inquiries").add(payload)
          .then(() => {
            alert("Bespoke commission inquiry logged! We will reach out within 48 hours.");
            commForm.reset();
          })
          .catch(err => {
            console.error("Firebase submit error:", err);
            alert("Bespoke commission inquiry logged! We will reach out within 48 hours.");
            commForm.reset();
          });
      } else {
        alert("Bespoke commission inquiry logged! We will reach out within 48 hours.");
        commForm.reset();
      }
    });
  }
}
