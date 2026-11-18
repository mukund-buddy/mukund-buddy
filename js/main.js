(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = () => motionQuery.matches;

  const revealElements = $$("[data-reveal]");
  revealElements.forEach((element) => {
    const siblings = element.parentElement
      ? Array.from(element.parentElement.children).filter((child) => child.hasAttribute("data-reveal"))
      : [];
    const index = siblings.indexOf(element);
    if (index > 0) {
      element.style.setProperty("--delay", `${Math.min(index * 70, 280)}ms`);
    }
  });

  if ("IntersectionObserver" in window && !reduceMotion()) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  const header = $(".site-header");
  const progressBar = $(".scroll-progress span");
  const navLinks = $$(".site-nav a");
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      const section = id && id.startsWith("#") ? $(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const setActiveSection = () => {
    if (!sections.length) return;
    const marker = window.scrollY + 150;
    let current = null;

    sections.forEach(({ link, section }) => {
      if (section.getBoundingClientRect().top + window.scrollY <= marker) {
        current = link;
      }
    });

    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = sections[sections.length - 1].link;

    navLinks.forEach((link) => {
      if (link === current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  let scrollTicking = false;
  const updateScrollUI = () => {
    const scrollTop = window.scrollY;
    if (header) header.classList.toggle("scrolled", scrollTop > 6);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(Math.max(scrollTop / max, 0), 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }
    setActiveSection();
    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollUI();

  const menuToggle = $(".menu-toggle");
  const mobileMenu = $("#mobile-menu");
  let menuOpen = false;

  const menuItems = () => {
    if (!mobileMenu || !menuToggle) return [];
    return [menuToggle, ...$$("a[href]", mobileMenu)];
  };

  const setMenu = (open, restoreFocus = false) => {
    if (!menuToggle || !mobileMenu) return;
    menuOpen = open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.toggleAttribute("inert", !open);
    document.body.classList.toggle("menu-open", open);

    if (open) {
      const firstLink = $("a[href]", mobileMenu);
      if (firstLink) {
        const focusFirstLink = () => {
          if (menuOpen) firstLink.focus({ preventScroll: true });
        };
        focusFirstLink();
        window.setTimeout(focusFirstLink, 380);
      }
    } else if (restoreFocus) {
      menuToggle.focus();
    }
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => setMenu(!menuOpen));

    $$("a[href]", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (!menuOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(false, true);
        return;
      }

      if (event.key !== "Tab") return;
      const items = menuItems();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !items.includes(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !items.includes(active)) {
        event.preventDefault();
        first.focus();
      }
    });

    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = (event) => {
      if (event.matches && menuOpen) setMenu(false);
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", closeOnDesktop);
    else desktopQuery.addListener(closeOnDesktop);
  }

  if (window.matchMedia("(pointer: fine)").matches) {
    $$(".spotlight").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mx", `${x}%`);
        card.style.setProperty("--my", `${y}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
      });
    });

    const hero = $(".hero");
    const heroCursor = $("#hero-cursor");
    if (hero && heroCursor) {
      let heroTicking = false;
      let heroX = 0;
      let heroY = 0;
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        heroX = event.clientX - rect.left;
        heroY = event.clientY - rect.top;
        if (heroTicking) return;
        heroTicking = true;
        window.requestAnimationFrame(() => {
          heroCursor.style.setProperty("--x", `${heroX}px`);
          heroCursor.style.setProperty("--y", `${heroY}px`);
          heroTicking = false;
        });
      });
    }
  }

  const terminal = $(".console-body");
  const terminalLines = terminal ? $$(".terminal-line[data-text]", terminal) : [];
  if (terminalLines.length) {
    if (reduceMotion()) {
      terminalLines.forEach((line) => {
        line.textContent = line.dataset.text || "";
      });
    } else {
      let lineIndex = 0;
      let typeTimer = null;

      const typeNextLine = () => {
        if (lineIndex >= terminalLines.length) return;
        const line = terminalLines[lineIndex];
        const text = line.dataset.text || "";

        if (!line.classList.contains("cmd")) {
          line.textContent = text;
          lineIndex += 1;
          typeTimer = window.setTimeout(typeNextLine, 170);
          return;
        }

        let charIndex = 0;
        line.textContent = "";

        const typeCharacter = () => {
          charIndex += 1;
          line.textContent = text.slice(0, charIndex);
          if (charIndex < text.length) {
            typeTimer = window.setTimeout(typeCharacter, 18 + Math.random() * 16);
          } else {
            lineIndex += 1;
            typeTimer = window.setTimeout(typeNextLine, 260);
          }
        };

        typeCharacter();
      };

      typeTimer = window.setTimeout(typeNextLine, 600);
      window.addEventListener("pagehide", () => window.clearTimeout(typeTimer));
    }
  }

  const counters = $$("[data-count]");
  if (counters.length) {
    const animateCounter = (element) => {
      const target = Number(element.dataset.count);
      if (!Number.isFinite(target)) return;
      if (reduceMotion()) {
        element.textContent = String(target);
        return;
      }
      const duration = 1100;
      const start = performance.now();
      element.textContent = "0";
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = String(Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    };

    const counterHost = counters[0].closest(".console-stats");
    if ("IntersectionObserver" in window && counterHost) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            counters.forEach(animateCounter);
            counterObserver.disconnect();
          });
        },
        { threshold: 0.5 }
      );
      counterObserver.observe(counterHost);
    } else {
      counters.forEach(animateCounter);
    }
  }

  const timeElement = $("#local-time");
  if (timeElement) {
    let timeFormatter = null;
    try {
      timeFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      });
    } catch (error) {
      timeFormatter = null;
    }

    const updateTime = () => {
      if (!timeFormatter) return;
      timeElement.textContent = timeFormatter.format(new Date());
    };

    updateTime();
    window.setInterval(updateTime, 10000);
  }

  const toast = $("#toast");
  let toastTimer = null;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  };

  const copyText = async (text) => {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-9999px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    field.remove();
    return copied;
  };

  $$(".copy-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy || "";
      const label = $("span", button);
      const copied = await copyText(value);

      if (copied) {
        showToast("Email copied. Talk soon.");
        if (label) {
          const original = label.textContent;
          label.textContent = "Copied";
          window.setTimeout(() => {
            label.textContent = original;
          }, 2200);
        }
      } else {
        showToast("Copy failed — email me instead.");
      }
    });
  });

  const yearElement = $("#year");
  if (yearElement) yearElement.textContent = String(new Date().getFullYear());

  if (window.console && console.log) {
    console.log(
      "%cMUKUND.%c\nSmall tools. Big curiosity. Useful things.\nBuilt with vanilla HTML, CSS & JS — no trackers, no cookies.\nSay hello: https://www.youtube.com/@notgamingplayz",
      "font-family:Georgia,serif;font-size:28px;color:#ff7a2f;",
      "font-family:monospace;font-size:12px;color:#a8a49b;line-height:1.7;"
    );
  }
})();
