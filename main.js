// -----------------------------------------
// OSMO PAGE TRANSITION + WEBFLOW IX2/IX3 + GSAP RE-INIT
// -----------------------------------------
gsap.registerPlugin(CustomEase, ScrollTrigger, Observer, SplitText);
history.scrollRestoration = "manual";

let lenis = null; 
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);
const staggerDefault = 0.05;
const durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

const shutterAmountConfig = { desktop: 10, tablet: 10, mobileLandscape: 10, mobile: 10 };
const transitionDuration = 0.5;
const shutterStaggerAmount = 0.3;

// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------
function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;
  initCheckSectionThemeScroll(next);
  initNavbarHideOnScroll(next);
  if (next.querySelector('[data-draggable-marquee-init]')) initDraggableMarquee(next);
  if (next.querySelector('.section-middelpunt')) initMiddelpuntScroll(next);
  if (hasLenis) lenis.resize();
  if (hasScrollTrigger) ScrollTrigger.refresh();
  if (document.querySelector('.navbar-link-large')) initNavbarLinkHover(document);
  if (next.querySelector('[data-route-origin]')) initRouteToBankoh(next);
  if (next.querySelector('.faq3_accordion')) initFaqAccordion(next);
  if (next.querySelector('.bnackup')) initLogoReveal(next);
  if (next.querySelector('[data-highlight-text]')) initHighlightText(next);
  if (next.querySelector('[data-parallax="trigger"]')) initGlobalParallax(next);
}

// -----------------------------------------
// PAGE TRANSITIONS (shutters)
// -----------------------------------------
function runPageOnceAnimation(next) {
  const tl = gsap.timeline();
  tl.call(() => resetPage(next), null, 0);
  return tl;
}

function runPageLeaveAnimation(current, next) {
  generateShutters();
  const transitionPanel = document.querySelector("[data-transition-panel]");
  const allShutters = transitionPanel
    ? transitionPanel.querySelectorAll("[data-transition-shutter]")
    : [];
  const tl = gsap.timeline({ onComplete: () => current.remove() });

  if (reducedMotion || !transitionPanel) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(next, { autoAlpha: 0 }, 0);
  tl.set(transitionPanel, { opacity: 1, pointerEvents: "none" }, 0);
  tl.set(allShutters, {
    scaleY: 1.02,
    yPercent: 50,
    clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
  }, 0);
  tl.to(allShutters, {
    duration: transitionDuration,
    ease: "power3.in",
    yPercent: 0,
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    stagger: { amount: shutterStaggerAmount, from: "end" }
  }, 0);
  tl.fromTo(current,
    { y: "0vh" },
    { y: "-15vh", ease: "power3.in", duration: transitionDuration * 1.5 },
    0
  );
  return tl;
}

function runPageEnterAnimation(next) {
  const transitionPanel = document.querySelector("[data-transition-panel]");
  const allShutters = transitionPanel
    ? transitionPanel.querySelectorAll("[data-transition-shutter]")
    : [];
  const tl = gsap.timeline();

  if (reducedMotion || !transitionPanel) {
    tl.call(reinitWebflow, null, 0);
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  const totalCoverDuration = transitionDuration + shutterStaggerAmount;
  tl.add("startEnter", totalCoverDuration);

  tl.call(reinitWebflow, null, "startEnter");
  tl.set(next, { autoAlpha: 1 }, "startEnter");

  tl.to(allShutters, {
    duration: transitionDuration * 1.5,
    ease: "expo.out",
    clipPath: "polygon(0% 0%, 100% 0%, 100% -2%, 0% -2%)",
    yPercent: -50,
    stagger: { amount: shutterStaggerAmount, from: "end" },
    overwrite: "auto",
  }, "startEnter");
  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");
  tl.from(next, {
    ease: "expo.out",
    y: "20vh",
    duration: totalCoverDuration,
  }, "startEnter");

  return new Promise(resolve => tl.call(resolve, null, "pageReady"));
}

function generateShutters() {
  const panel = document.querySelector("[data-transition-panel]");
  if (!panel) return;
  const width = window.innerWidth;
  const isLandscape = window.innerWidth > window.innerHeight;
  let shutterAmount = shutterAmountConfig.desktop;
  if (width <= 479) shutterAmount = shutterAmountConfig.mobile;
  else if (width <= 767) shutterAmount = isLandscape ? shutterAmountConfig.mobileLandscape : shutterAmountConfig.mobile;
  else if (width <= 991) shutterAmount = shutterAmountConfig.tablet;

  const shutters = panel.querySelectorAll("[data-transition-shutter]");
  if (shutters.length === shutterAmount) return;
  const template = shutters[0];
  if (!template) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < shutterAmount; i++) frag.appendChild(template.cloneNode(true));
  panel.replaceChildren(frag);
}

// -----------------------------------------
// BARBA HOOKS
// -----------------------------------------
barba.hooks.beforeEnter(data => {
  const parsed = new DOMParser().parseFromString(data.next.html, "text/html");
  const wfPage = parsed.documentElement.getAttribute("data-wf-page");
  if (wfPage) document.documentElement.setAttribute("data-wf-page", wfPage);

  gsap.set(data.next.container, { position: "fixed", top: 0, left: 0, right: 0 });
  if (lenis && typeof lenis.stop === "function") lenis.stop();
  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) ScrollTrigger.getAll().forEach(t => t.kill());
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);
  if (hasLenis) { lenis.resize(); lenis.start(); }
  if (hasScrollTrigger) ScrollTrigger.refresh();
});

barba.init({
  debug: true,
  timeout: 7000,
  preventRunning: true,
  transitions: [{
    name: "default",
    sync: true,
    async once(data) {
      initOnceFunctions();
      initAfterEnterFunctions(data.next.container);
      return runPageOnceAnimation(data.next.container);
    },
    async leave(data) { return runPageLeaveAnimation(data.current.container, data.next.container); },
    async enter(data) { return runPageEnterAnimation(data.next.container); }
  }]
});

// -----------------------------------------
// WEBFLOW IX2 + IX3 RE-INIT
// -----------------------------------------
function reinitWebflow() {
  if (!window.Webflow) return;
  try {
    window.Webflow.destroy();
    window.Webflow.ready();

    const req = window.Webflow.require;
    if (req) {
      const ix2 = req("ix2");
      if (ix2 && typeof ix2.init === "function") ix2.init();
      const ix3 = req("ix3");
      if (ix3 && typeof ix3.init === "function") ix3.init();
    }

    document.dispatchEvent(new Event("readystatechange"));
  } catch (e) {
    console.warn("Webflow re-init failed:", e);
  }
}

// -----------------------------------------
// HELPERS
// -----------------------------------------
const themeConfig = {
  light: { nav: "dark", transition: "light" },
  dark:  { nav: "light", transition: "dark" }
};

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
  lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9 });
  if (hasScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });
  if (hasLenis) { lenis.resize(); lenis.start(); }
}

function initBarbaNavUpdate(data) {
  const tpl = document.createElement("template");
  tpl.innerHTML = data.next.html.trim();
  const nextNodes = tpl.content.querySelectorAll("[data-barba-update]");
  const currentNodes = document.querySelectorAll("nav [data-barba-update]");
  currentNodes.forEach((curr, index) => {
    const next = nextNodes[index];
    if (!next) return;
    const newStatus = next.getAttribute("aria-current");
    if (newStatus !== null) curr.setAttribute("aria-current", newStatus);
    else curr.removeAttribute("aria-current");
    curr.setAttribute("class", next.getAttribute("class") || "");
  });
}

// -----------------------------------------
// THEME SECTION ON SCROLL
// -----------------------------------------
let _themeScrollCleanup = null;

function initCheckSectionThemeScroll(scope) {
  if (_themeScrollCleanup) _themeScrollCleanup();
  let ticking = false;
  let currentTheme = null;
  let currentBg = null;

  const navBarHeight = document.querySelector('[data-nav-bar-height]');
  const themeObserverOffset = navBarHeight ? navBarHeight.offsetHeight / 2 : 0;
  const themeSections = scope.querySelectorAll('[data-theme-section]');
  const themeNavElements = document.querySelectorAll('[data-theme-nav]');
  const bgNavElements = document.querySelectorAll('[data-bg-nav]');

  function updateElements(elements, attribute, value) {
    elements.forEach(el => el.setAttribute(attribute, value));
  }

  function checkThemeSection() {
    for (const section of themeSections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= themeObserverOffset && rect.bottom >= themeObserverOffset) {
        const themeActive = section.getAttribute('data-theme-section');
        const bgActive = section.getAttribute('data-bg-section');
        if (themeActive !== currentTheme) {
          updateElements(themeNavElements, 'data-theme-nav', themeActive);
          currentTheme = themeActive;
        }
        if (bgActive && bgActive !== currentBg) {
          updateElements(bgNavElements, 'data-bg-nav', bgActive);
          currentBg = bgActive;
        }
        break;
      }
    }
    ticking = false;
  }

  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(checkThemeSection); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  checkThemeSection();

  _themeScrollCleanup = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

// -----------------------------------------
// NAVBAR HIDE ON SCROLL
// -----------------------------------------
let _navbarST = null;

function initNavbarHideOnScroll(scope) {
  if (_navbarST) { _navbarST.kill(); _navbarST = null; }
  const navbar = (scope && scope.querySelector(".navbar")) || document.querySelector(".navbar");
  if (!navbar) return;

  let isHidden = false;
  gsap.set(navbar, { y: 0 });
  const navHeight = navbar.offsetHeight;

  _navbarST = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const currentScrollY = self.scroll();
      const velocity = self.getVelocity();

      if (currentScrollY < 50) {
        if (isHidden) {
          gsap.to(navbar, { y: 0, duration: 0.5, ease: "power3.out" });
          isHidden = false;
        }
        return;
      }

      if (Math.abs(velocity) < 100) return;

      if (velocity > 0 && !isHidden) {
        gsap.to(navbar, { y: -navHeight, duration: 0.5, ease: "power3.inOut" });
        isHidden = true;
      } else if (velocity < 0 && isHidden) {
        gsap.to(navbar, { y: 0, duration: 0.5, ease: "power3.out" });
        isHidden = false;
      }
    },
  });
}

// -----------------------------------------
// DRAGGABLE MARQUEE (scroll-driven direction)
// -----------------------------------------
function initDraggableMarquee(scope) {
  scope = scope || document;
  const wrappers = scope.querySelectorAll("[data-draggable-marquee-init]");
  const getNumberAttr = (el, name, fallback) => {
    const value = parseFloat(el.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };

  wrappers.forEach((wrapper) => {
    if (wrapper.getAttribute("data-draggable-marquee-init") === "initialized") return;
    const collection = wrapper.querySelector("[data-draggable-marquee-collection]");
    const list = wrapper.querySelector("[data-draggable-marquee-list]");
    if (!collection || !list) return;

    const duration = getNumberAttr(wrapper, "data-duration", 20);
    const multiplier = getNumberAttr(wrapper, "data-multiplier", 8);
    const sensitivity = getNumberAttr(wrapper, "data-sensitivity", 0.004);

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const listWidth = list.scrollWidth || list.getBoundingClientRect().width;
    if (!wrapperWidth || !listWidth) return;

    const minRequiredWidth = wrapperWidth + listWidth + 2;
    while (collection.scrollWidth < minRequiredWidth) {
      const listClone = list.cloneNode(true);
      listClone.setAttribute("data-draggable-marquee-clone", "");
      listClone.setAttribute("aria-hidden", "true");
      collection.appendChild(listClone);
    }

    const wrapX = gsap.utils.wrap(-listWidth, 0);
    gsap.set(collection, { x: 0 });

    const marqueeLoop = gsap.to(collection, {
      x: -listWidth,
      duration,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: (x) => wrapX(parseFloat(x)) + "px"
      }
    });

    let scrollDirection = 1;
    let dragInfluence = 0;
    let currentTimeScale = 1;
    let lastDirAttr = "left";
    let isInView = true;
    wrapper.setAttribute("data-direction", "left");

    const tickerFn = () => {
      if (!wrapper.isConnected) {
        gsap.ticker.remove(tickerFn);
        if (cleanupScroll) cleanupScroll();
        return;
      }
      if (Math.abs(dragInfluence) > 0.01) dragInfluence *= 0.92;
      else dragInfluence = 0;

      const target = scrollDirection + dragInfluence;
      currentTimeScale += (target - currentTimeScale) * 0.12;
      marqueeLoop.timeScale(currentTimeScale);

      const dir = currentTimeScale < 0 ? "right" : "left";
      if (dir !== lastDirAttr) {
        wrapper.setAttribute("data-direction", dir);
        lastDirAttr = dir;
      }
    };
    gsap.ticker.add(tickerFn);

    const marqueeObserver = Observer.create({
      target: wrapper,
      type: "pointer,touch",
      preventDefault: true,
      onChangeX: (e) => {
        if (!isInView) return;
        const velocity = e.velocityX * -sensitivity;
        dragInfluence = gsap.utils.clamp(-multiplier, multiplier, velocity);
      }
    });

    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      if (Math.abs(delta) < 1) return;
      scrollDirection = delta > 0 ? 1 : -1;
      lastScrollY = currentY;
    };
    let cleanupScroll;
    if (typeof lenis !== "undefined" && lenis && typeof lenis.on === "function") {
      lenis.on("scroll", onScroll);
      cleanupScroll = () => { try { lenis.off("scroll", onScroll); } catch(e){} };
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanupScroll = () => window.removeEventListener("scroll", onScroll);
    }

    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "bottom top",
      onEnter:     () => { isInView = true;  marqueeLoop.resume(); marqueeObserver.enable(); },
      onEnterBack: () => { isInView = true;  marqueeLoop.resume(); marqueeObserver.enable(); },
      onLeave:     () => { isInView = false; marqueeLoop.pause();  marqueeObserver.disable(); },
      onLeaveBack: () => { isInView = false; marqueeLoop.pause();  marqueeObserver.disable(); }
    });

    wrapper.setAttribute("data-draggable-marquee-init", "initialized");
  });
}

// -----------------------------------------
// MIDDELPUNT SCROLL ANIMATION
// -----------------------------------------
let _middelpuntST = null;
function initMiddelpuntScroll(scope) {
  scope = scope || document;
  if (_middelpuntST) { _middelpuntST.kill(); _middelpuntST = null; }
  const section = scope.querySelector('.section-middelpunt');
  if (!section) return;
  const image = section.querySelector('.middelpunt-image');
  if (!image) return;

  const targetWidth = window.innerWidth <= 991 ? '16svw' : '12svw';

  gsap.set(image, { width: '0svw' });
  const tween = gsap.to(image, {
    width: targetWidth,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      end: 'bottom 25%',
      scrub: 0.8,
    }
  });
  _middelpuntST = tween.scrollTrigger;
}

// -----------------------------------------
// NAVBAR LINK HOVER (gradient sweep)
// -----------------------------------------
function initNavbarLinkHover(scope) {
  scope = scope || document;
  const links = scope.querySelectorAll('.navbar-link-large');

  links.forEach(link => {
    if (link.dataset.hoverInit === 'true') return;
    const bg = link.querySelector('.menu-nav-button-bg');
    if (!bg) return;

    gsap.set(bg, { xPercent: -100 });

    link.addEventListener('mouseenter', () => {
      gsap.fromTo(bg,
        { xPercent: -100 },
        { xPercent: -33, duration: 1, ease: 'power2.out', overwrite: true }
      );
    });

    link.addEventListener('mouseleave', () => {
      gsap.fromTo(bg,
        { xPercent: -33 },
        { xPercent: 34, duration: 1, ease: 'power2.out', overwrite: true }
      );
    });

    link.dataset.hoverInit = 'true';
  });
}

// -----------------------------------------
// ROUTE NAAR BANKOH
// -----------------------------------------
function initRouteToBankoh(scope) {
  scope = scope || document;
  const destination = 'Kaapstander 286, 6541 EX Nijmegen';
  const input = scope.querySelector('[data-route-origin]');
  const button = scope.querySelector('[data-route-submit]');
  if (!input || !button) return;
  if (button.dataset.routeInit === 'true') return;

  const openRoute = (e) => {
    e.preventDefault();
    const origin = input.value.trim();
    if (!origin) {
      input.focus();
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  button.addEventListener('click', openRoute);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') openRoute(e);
  });

  button.dataset.routeInit = 'true';
}

// -----------------------------------------
// FAQ ACCORDION (Relume)
// -----------------------------------------
function initFaqAccordion(scope) {
  scope = scope || document;
  const items = scope.querySelectorAll('.faq3_accordion');

  items.forEach(item => {
    if (item.dataset.faqInit === 'true') return;
    const question = item.querySelector('.faq3_question');
    const answer = item.querySelector('.faq3_answer');
    const icon = item.querySelector('.faq3_icon-wrapper');
    if (!question || !answer) return;

    gsap.set(answer, { height: 0, overflow: 'hidden' });
    if (icon) gsap.set(icon, { rotation: 0 });
    question.style.cursor = 'pointer';

    let isOpen = false;

    question.addEventListener('click', () => {
      isOpen = !isOpen;
      gsap.to(answer, {
        height: isOpen ? 'auto' : 0,
        duration: 0.5,
        ease: isOpen ? 'power2.out' : 'power2.in'
      });
      if (icon) {
        gsap.to(icon, {
          rotation: isOpen ? 180 : 0,
          duration: 0.5,
          ease: isOpen ? 'power2.out' : 'power2.in'
        });
      }
    });

    item.dataset.faqInit = 'true';
  });
}

// -----------------------------------------
// BANKOH LOGO REVEAL
// -----------------------------------------
function initLogoReveal(scope) {
  scope = scope || document;
  const wrapper = scope.querySelector('.bnackup');
  if (!wrapper || wrapper.dataset.logoInit === 'true') return;

  const paths = wrapper.querySelectorAll('path[data-letter]');
  if (!paths.length) return;

  const grouped = {};
  paths.forEach(p => {
    const letter = p.dataset.letter;
    (grouped[letter] = grouped[letter] || []).push(p);
  });

  const order = ['b', 'a', 'n', 'k', 'o', 'h'];
  const letterGroups = order.map(l => grouped[l]).filter(Boolean);

  letterGroups.forEach(g => gsap.set(g, { opacity: 0, y: 150 }));

  letterGroups.forEach((g, i) => {
    gsap.to(g, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: 0.2 + i * 0.1
    });
  });

  wrapper.dataset.logoInit = 'true';
}

// -----------------------------------------
// HIGHLIGHT TEXT ON SCROLL
// -----------------------------------------
function initHighlightText(scope) {
  scope = scope || document;
  const targets = scope.querySelectorAll("[data-highlight-text]");

  targets.forEach((heading) => {
    if (heading.dataset.highlightInit === 'true') return;

    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 70%";
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "bottom 70%";
    const fadedValue = parseFloat(heading.getAttribute("data-highlight-fade")) || 0.1;
    const staggerValue = parseFloat(heading.getAttribute("data-highlight-stagger")) || 0.1;

    new SplitText(heading, {
      type: "words, chars",
      autoSplit: true,
      onSplit(self) {
        return gsap.context(() => {
          gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading,
              start: scrollStart,
              end: scrollEnd,
            }
          }).from(self.chars, {
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear"
          });
        });
      }
    });

    heading.dataset.highlightInit = 'true';
  });
}
// -----------------------------------------
// GLOBAL PARALLAX
// -----------------------------------------
let _parallaxMM = null;

function initGlobalParallax(scope) {
  scope = scope || document;
  if (_parallaxMM) { _parallaxMM.revert(); _parallaxMM = null; }

  _parallaxMM = gsap.matchMedia();
  _parallaxMM.add({
    isMobile: "(max-width:479px)",
    isMobileLandscape: "(max-width:767px)",
    isTablet: "(max-width:991px)",
    isDesktop: "(min-width:992px)"
  }, (context) => {
    const { isMobile, isMobileLandscape, isTablet } = context.conditions;

    scope.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
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

      gsap.fromTo(target,
        { [prop]: startVal },
        {
          [prop]: endVal,
          ease: "none",
          scrollTrigger: {
            trigger,
            start: scrollStart,
            end: scrollEnd,
            scrub,
          },
        }
      );
    });
  });
}
