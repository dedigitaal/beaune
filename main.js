// ===========================================
// STATE + CLEANUP REFS
// ===========================================
let bannerAnim = null;
let bannerST = null;
let menuPhotoCleanup = null;
let listSlider = null;
let loaderShouldBeHidden = false;
let parallaxMM = null;
let mobileMenuCleanup = null;
let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

// ===========================================
// GSAP SETUP
// ===========================================
gsap.registerPlugin(CustomEase);
history.scrollRestoration = "manual";
CustomEase.create("osmo", "0.625, 0.05, 0, 1");
CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");
gsap.defaults({ ease: "osmo", duration: 0.6 });

const themeConfig = {
  light: { nav: "dark",  transition: "light" },
  dark:  { nav: "light", transition: "dark"  }
};

// ===========================================
// PAGE-SPECIFIC INIT FUNCTIONS
// ===========================================
function initBgVideos() {
  const videos = nextPage.querySelectorAll('video');
  if (!videos.length) return;
  videos.forEach(v => {
    v.muted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  });
}

function initGlobalParallax() {
  if (parallaxMM) { parallaxMM.kill(); parallaxMM = null; }
  parallaxMM = gsap.matchMedia();
  parallaxMM.add(
    {
      isMobile: "(max-width:479px)",
      isMobileLandscape: "(max-width:767px)",
      isTablet: "(max-width:991px)",
      isDesktop: "(min-width:992px)"
    },
    (context) => {
      const { isMobile, isMobileLandscape, isTablet } = context.conditions;
      const ctx = gsap.context(() => {
        nextPage.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
          const disable = trigger.getAttribute("data-parallax-disable");
          if (
            (disable === "mobile" && isMobile) ||
            (disable === "mobileLandscape" && isMobileLandscape) ||
            (disable === "tablet" && isTablet)
          ) return;
          const target = trigger.querySelector('[data-parallax="target"]') || trigger;
          const direction = trigger.getAttribute("data-parallax-direction") || "vertical";
          const prop = direction === "horizontal" ? "xPercent" : "yPercent";
          const scrubAttr = trigger.getAttribute("data-parallax-scrub");
          const scrub = scrubAttr ? parseFloat(scrubAttr) : true;
          const startAttr = trigger.getAttribute("data-parallax-start");
          const startVal = startAttr !== null ? parseFloat(startAttr) : 20;
          const endAttr = trigger.getAttribute("data-parallax-end");
          const endVal = endAttr !== null ? parseFloat(endAttr) : -20;
          const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") || "top bottom";
          const scrollStart = `clamp(${scrollStartRaw})`;
          const scrollEndRaw = trigger.getAttribute("data-parallax-scroll-end") || "bottom top";
          const scrollEnd = `clamp(${scrollEndRaw})`;
          gsap.fromTo(target, { [prop]: startVal }, {
            [prop]: endVal, ease: "none",
            scrollTrigger: { trigger, start: scrollStart, end: scrollEnd, scrub }
          });
        });
      });
      return () => ctx.revert();
    }
  );
}

Bonjour, Salut, Bienvenue, Bonsoir, Allô, Bon appétit, À table!

function initBannerMarquee() {
  if (bannerAnim) { bannerAnim.kill(); bannerAnim = null; }
  if (bannerST)   { bannerST.kill();   bannerST = null; }
  const banners = nextPage.querySelectorAll('.banner-text');
  if (!banners.length) return;
  gsap.set(banners, { xPercent: 0 });

  let xp = 0;
  let direction = 1;
  const SPEED = 100 / 30;

  const tick = (time, dt) => {
    xp -= direction * SPEED * (dt / 1000);
    if (xp <= -100) xp += 100;
    if (xp > 0)     xp -= 100;
    gsap.set(banners, { xPercent: xp });
  };
  gsap.ticker.add(tick);

  bannerAnim = { kill: () => gsap.ticker.remove(tick) };

  bannerST = ScrollTrigger.create({
    trigger: banners[0].parentElement,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      direction = self.direction === -1 ? -1 : 1;
    }
  });
}

function initMenuPhotoMouse() {
  if (menuPhotoCleanup) { menuPhotoCleanup(); menuPhotoCleanup = null; }
  const items = nextPage.querySelectorAll('.menu-item');
  if (!items.length) return;
  const fotos = Array.from(nextPage.querySelectorAll('.menu-foto'));
  if (!fotos.length) return;
  gsap.set(fotos, { opacity: 0, display: 'none', xPercent: -100, y: 0 });

  let targetX = 0, targetY = 0.5, smoothX = 0, smoothY = 0.5;
  const SMOOTH = 0.08;

  const onMove = (e) => {
    targetX = e.clientX / window.innerWidth;
    targetY = e.clientY / window.innerHeight;
  };
  const tickerFn = () => {
    smoothX += (targetX - smoothX) * SMOOTH;
    smoothY += (targetY - smoothY) * SMOOTH;
    gsap.set(fotos, {
      xPercent: -100 + smoothX * 100,
      y: (0.5 - smoothY) * window.innerHeight
    });
  };

  window.addEventListener('mousemove', onMove);
  gsap.ticker.add(tickerFn);

  const hovers = [];
  items.forEach((item) => {
    const foto = item.querySelector('.menu-foto');
    if (!foto) return;
    const enter = () => {
      gsap.killTweensOf(foto, 'opacity');
      gsap.set(foto, { display: 'block' });
      gsap.to(foto, { opacity: 1, duration: 0.3, ease: 'power3.out' });
    };
    const leave = () => {
      gsap.killTweensOf(foto, 'opacity');
      gsap.to(foto, {
        opacity: 0, duration: 0.3, ease: 'power3.out',
        onComplete: () => gsap.set(foto, { display: 'none' })
      });
    };
    item.addEventListener('mouseenter', enter);
    item.addEventListener('mouseleave', leave);
    hovers.push({ item, enter, leave });
  });

  menuPhotoCleanup = () => {
    window.removeEventListener('mousemove', onMove);
    gsap.ticker.remove(tickerFn);
    hovers.forEach(({ item, enter, leave }) => {
      item.removeEventListener('mouseenter', enter);
      item.removeEventListener('mouseleave', leave);
    });
  };
}

function initLocatieSlider() {
  if (listSlider && listSlider.length) {
    try {
      if (listSlider.hasClass('slick-initialized')) listSlider.slick('unslick');
    } catch (e) {}
    listSlider = null;
  }
  if (typeof window.jQuery === 'undefined') return;
  const $list = window.jQuery(nextPage).find('.list');
  if (!$list.length || typeof $list.slick !== 'function') return;
  $list.slick({
    dots: false, speed: 700, infinite: true,
    slidesToShow: 3, slidesToScroll: 1, arrows: false, touchThreshold: 100,
    responsive: [
      { breakpoint: 767, settings: { slidesToShow: 2 } },
      { breakpoint: 479, settings: { slidesToShow: 1 } }
    ]
  });
  listSlider = $list;
}

function initNavbarScroll() {
  const navWrapper = document.querySelector('.nav-wrapper');
  const navLogos = document.querySelectorAll('.navbar3_logo');
  if (!navWrapper) return;
  const LARGE = { wrapperHeight: '5.5rem', logoSize: 60 };
  const SMALL = { wrapperHeight: '3rem',  logoSize: 30 };
  const THRESHOLD = 50;
  const DURATION = 0.5;
  const EASE = 'power4.out';
  let state = window.scrollY > THRESHOLD ? 'small' : 'large';
  if (state === 'small') {
    gsap.set(navWrapper, { height: SMALL.wrapperHeight });
    gsap.set(navLogos, { width: SMALL.logoSize, height: SMALL.logoSize });
  } else {
    gsap.set(navWrapper, { height: LARGE.wrapperHeight });
    gsap.set(navLogos, { width: LARGE.logoSize, height: LARGE.logoSize });
  }
  const navToSmall = () => {
    gsap.to(navWrapper, { height: SMALL.wrapperHeight, duration: DURATION, ease: EASE });
    gsap.to(navLogos,   { width: SMALL.logoSize, height: SMALL.logoSize, duration: DURATION, ease: EASE });
  };
  const navToLarge = () => {
    gsap.to(navWrapper, { height: LARGE.wrapperHeight, duration: DURATION, ease: EASE });
    gsap.to(navLogos,   { width: LARGE.logoSize, height: LARGE.logoSize, duration: DURATION, ease: EASE });
  };
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > THRESHOLD && state === 'large') { state = 'small'; navToSmall(); }
    else if (y <= THRESHOLD && state === 'small') { state = 'large'; navToLarge(); }
  }, { passive: true });
}

function initNavSubmenus() {
  const groups = ['menus', 'locatie', 'zakelijk', 'events', 'beaune'];
  const allSubmenus = document.querySelectorAll('.submenu');
  if (!allSubmenus.length) return;
  const OPEN_HEIGHT = 46;
  const DURATION = 0.2;
  const EASE = 'power4.out';
  gsap.set(allSubmenus, { height: 0, overflow: 'hidden' });
  const openGroup = (key) => {
    const target = document.querySelector(`.submenu.${key}`);
    if (!target) return;
    allSubmenus.forEach((s) => {
      if (s !== target) gsap.to(s, { height: 0, duration: DURATION, ease: EASE });
    });
    gsap.to(target, { height: OPEN_HEIGHT, duration: DURATION, ease: EASE });
  };
  groups.forEach((key) => {
    const link = document.querySelector(`.navbar-link.${key}`);
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openGroup(key);
    });
  });
  allSubmenus.forEach((submenu) => {
    submenu.addEventListener('mouseleave', () => {
      gsap.to(submenu, { height: 0, duration: DURATION, ease: EASE });
    });
  });
}

function initWelcomingWordsLoader() {
  const loadingContainer = document.querySelector('[data-loading-container]');
  if (!loadingContainer) return;
  const loadingWords = loadingContainer.querySelector('[data-loading-words]');
  const wordsTarget = loadingWords.querySelector('[data-loading-words-target]');
  const words = loadingWords.getAttribute('data-loading-words').split(',').map(w => w.trim());

  const tl = gsap.timeline();
  tl.set(loadingWords, { yPercent: 50 });
  tl.to(loadingWords, { opacity: 1, yPercent: 0, duration: 1.5, ease: "Expo.easeInOut" });
  words.forEach(word => {
    tl.call(() => { wordsTarget.textContent = word; }, null, '+=0.15');
  });
  tl.to(loadingWords, { opacity: 0, yPercent: -75, duration: 0.8, ease: "Expo.easeIn" });
  tl.to(loadingContainer, { autoAlpha: 0, duration: 0.6, ease: "Power1.easeInOut" }, "+ -0.2");
}

// ===========================================
// BARBA INIT FUNCTIONS
// ===========================================
function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;
  initNavbarScroll();
  initNavSubmenus();
  initBannerMarquee();
  initMenuPhotoMouse();
  initLocatieSlider();
  initBgVideos();
  initGlobalParallax();
  initMobileMenu();
}

function initBeforeEnterFunctions(next) { nextPage = next || document; }

function initAfterEnterFunctions(next) {
  nextPage = next || document;
  initBannerMarquee();
  initMenuPhotoMouse();
  initLocatieSlider();
  initBgVideos();
  initGlobalParallax();
  initMobileMenu();
  if (hasLenis) lenis.resize();
  if (hasScrollTrigger) ScrollTrigger.refresh();
}

// ===========================================
// BARBA TRANSITIONS
// ===========================================
function runPageOnceAnimation(next) {
  const tl = gsap.timeline();
  tl.call(() => { resetPage(next); }, null, 0);
  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap ? transitionWrap.querySelector("[data-transition-dark]") : null;
  const tl = gsap.timeline({ onComplete: () => { current.remove(); } });
  if (reducedMotion) return tl.set(current, { autoAlpha: 0 });
  if (transitionWrap) tl.set(transitionWrap, { zIndex: 2 });
  if (transitionDark) {
    tl.fromTo(transitionDark, { autoAlpha: 0 }, {
      autoAlpha: 0.8, duration: 1.2, ease: "parallax"
    }, 0);
  }
  tl.fromTo(current, { y: "0vh", filter: "blur(0px)" }, {
    y: "-25vh", filter: "blur(8px)", duration: 1.2, ease: "parallax"
  }, 0);
  if (transitionDark) tl.set(transitionDark, { autoAlpha: 0 });
  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();
  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }
  tl.add("startEnter", 0);
  tl.set(next, { zIndex: 3 });
  tl.fromTo(next, { y: "100vh" }, {
    y: "0vh", duration: 1.2, clearProps: "all", ease: "parallax"
  }, "startEnter");
  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");
  return new Promise(resolve => tl.call(resolve, null, "pageReady"));
}

// ===========================================
// BARBA HOOKS
// ===========================================
barba.hooks.beforeEnter(data => {
  gsap.set(data.next.container, { position: "fixed", top: 0, left: 0, right: 0 });
  if (lenis && typeof lenis.stop === "function") lenis.stop();
  initBeforeEnterFunctions(data.next.container);
  if (loaderShouldBeHidden) {
    const containers = data.next.container.querySelectorAll('[data-loading-container]');
    containers.forEach(c => gsap.set(c, { autoAlpha: 0 }));
  }
  applyThemeFrom(data.next.container);
});

barba.hooks.beforeLeave(() => {
  // Sluit mobiel menu instant bij elke Barba navigatie
  document.querySelectorAll('.submenus-mobiel, .submenu-mobiel').forEach(el => {
    gsap.set(el, { height: 0 });
  });
  const menuIcon = document.querySelector('.menu-icon');
  if (menuIcon) {
    gsap.set(menuIcon, { rotate: 0 });
    menuIcon.classList.remove('is-open');
  }
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) ScrollTrigger.getAll().forEach(t => t.kill());
  if (menuPhotoCleanup) { menuPhotoCleanup(); menuPhotoCleanup = null; }
  if (bannerAnim)       { bannerAnim.kill();  bannerAnim = null; }
  if (mobileMenuCleanup) { mobileMenuCleanup(); mobileMenuCleanup = null; }
  if (listSlider && listSlider.length) {
    try {
      if (listSlider.hasClass('slick-initialized')) listSlider.slick('unslick');
    } catch (e) {}
    listSlider = null;
  }
});

barba.hooks.enter(data => { initBarbaNavUpdate(data); });

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);
  if (hasLenis) { lenis.resize(); lenis.start(); }
  if (hasScrollTrigger) ScrollTrigger.refresh();
  loaderShouldBeHidden = true;
});

// ===========================================
// BARBA INIT
// ===========================================
barba.init({
  debug: true,
  timeout: 7000,
  preventRunning: true,
  transitions: [{
    name: "default",
    sync: true,
    async once(data) {
      initOnceFunctions();
      return runPageOnceAnimation(data.next.container);
    },
    async leave(data) {
      return runPageLeaveAnimation(data.current.container, data.next.container);
    },
    async enter(data) {
      return runPageEnterAnimation(data.next.container);
    }
  }]
});

// ===========================================
// HELPERS
// ===========================================
function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;
  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) transitionEl.dataset.themeTransition = config.transition;
  const nav = document.querySelector('[data-theme-nav]');
  if (nav) nav.dataset.themeNav = config.nav;
}

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;
  lenis = new Lenis({ lerp: 0.165, wheelMultiplier: 1.25 });
  if (hasScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });
  if (hasLenis) { lenis.resize(); lenis.start(); }
}

function initBarbaNavUpdate(data) {
  const tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  const nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  const currentNodes = document.querySelectorAll('nav [data-barba-update]');
  currentNodes.forEach((curr, index) => {
    const next = nextNodes[index];
    if (!next) return;
    const newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) curr.setAttribute('aria-current', newStatus);
    else curr.removeAttribute('aria-current');
    const newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });
}

// ===========================================
// WELCOMING WORDS LOADER (DOMContentLoaded safe)
// ===========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWelcomingWordsLoader);
} else {
  initWelcomingWordsLoader();
}
