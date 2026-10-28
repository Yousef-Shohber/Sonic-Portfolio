(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ---- Scroll reveal (once, triggers a little before the element enters the viewport bottom) ----
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  // ---- Header: highlight the nav item for the section in view ----
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll("[data-nav]"),
  );
  var ids = ["top"].concat(
    navLinks.map(function (a) {
      return a.getAttribute("href").slice(1);
    }),
  );
  var sections = ids
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (a) {
      var current = a.getAttribute("href").slice(1) === id;
      var bar = a.querySelector("span");
      if (current) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
      a.classList.toggle("text-bone", current);
      a.classList.toggle("text-mute", !current);
      bar.classList.toggle("w-full", current);
      bar.classList.toggle("w-0", !current);
    });
  }

  if ("IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach(function (s) {
      navObserver.observe(s);
    });
  }

  // ---- Mobile menu: toggle, close on link click / Escape, lock page scroll while open ----
  var menuBtn = document.getElementById("menu-btn");
  var menu = document.getElementById("mobile-menu");
  var iconOpen = menuBtn.querySelector("[data-icon-open]");
  var iconClose = menuBtn.querySelector("[data-icon-close]");

  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    iconOpen.hidden = open;
    iconClose.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }

  menuBtn.addEventListener("click", function () {
    setMenu(menu.hidden);
  });
  document.querySelectorAll("[data-close-menu]").forEach(function (a) {
    a.addEventListener("click", function () {
      setMenu(false);
    });
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) setMenu(false);
  });

  // ---- Copy email ----
  var copyBtn = document.getElementById("copy-email");
  var status = document.getElementById("copy-status");
  var copyIcon = copyBtn.querySelector("[data-copy-icon]");
  var checkIcon = copyBtn.querySelector("[data-check-icon]");

  function showState(state) {
    var copied = state === "copied";
    copyIcon.hidden = copied;
    checkIcon.hidden = !copied;
    status.textContent = copied
      ? "Copied"
      : state === "failed"
        ? "Copy failed"
        : "";
  }

  copyBtn.addEventListener("click", function () {
    var email = copyBtn.getAttribute("data-email");
    var done = function (ok) {
      showState(ok ? "copied" : "failed");
      window.setTimeout(function () {
        showState("idle");
      }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(
        function () {
          done(true);
        },
        function () {
          done(false);
        },
      );
    } else {
      done(false);
    }
  });

  // ---- Theme toggle (circular reveal via View Transitions) ----
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-btn");
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  function paintMeta() {
    if (metaTheme)
      metaTheme.setAttribute(
        "content",
        root.getAttribute("data-theme") === "light" ? "#f7f8fc" : "#080a0f",
      );
  }
  paintMeta();
  themeBtn.addEventListener("click", function (e) {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    var apply = function () {
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (_) {}
      paintMeta();
    };
    var r = themeBtn.getBoundingClientRect();
    root.style.setProperty("--tx", r.left + r.width / 2 + "px");
    root.style.setProperty("--ty", r.top + r.height / 2 + "px");
    if (document.startViewTransition && !reduceMotion)
      document.startViewTransition(apply);
    else apply();
  });
  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", function (e) {
      var saved = null;
      try {
        saved = localStorage.getItem("theme");
      } catch (_) {}
      if (!saved) {
        root.setAttribute("data-theme", e.matches ? "light" : "dark");
        paintMeta();
      }
    });

  // ---- Scroll progress + header state ----
  var bar = document.querySelector(".scroll-progress");
  var header = document.querySelector("header");
  var ticking = false;
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform =
      "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();

  // ---- Auto-stagger reveals inside the same parent ----
  var seen = new Map();
  reveals.forEach(function (el) {
    var p = el.parentElement,
      n = seen.get(p) || 0;
    if (!el.style.getPropertyValue("--rd"))
      el.style.setProperty("--rd", Math.min(n, 6) * 70 + "ms");
    seen.set(p, n + 1);
  });

  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduceMotion) {
    // ---- Cursor glow ----
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    var gx = 0,
      gy = 0,
      raf = 0;
    window.addEventListener(
      "pointermove",
      function (e) {
        gx = e.clientX;
        gy = e.clientY;
        glow.style.opacity = 1;
        if (!raf)
          raf = requestAnimationFrame(function () {
            glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
            raf = 0;
          });
      },
      { passive: true },
    );
    document.addEventListener("mouseleave", function () {
      glow.style.opacity = 0;
    });

    // ---- 3D tilt on portrait + architecture images ----
    document
      .querySelectorAll('#top figure > div, a[href*="architecture.webp"]')
      .forEach(function (el) {
        el.setAttribute("data-tilt", "");
        el.addEventListener("pointermove", function (e) {
          var b = el.getBoundingClientRect();
          var x = (e.clientX - b.left) / b.width - 0.5,
            y = (e.clientY - b.top) / b.height - 0.5;
          el.style.transform =
            "perspective(900px) rotateY(" +
            x * 6 +
            "deg) rotateX(" +
            -y * 6 +
            "deg) translateZ(0)";
        });
        el.addEventListener("pointerleave", function () {
          el.style.transform = "";
        });
      });
  }

  // ---- Count-up numbers ----
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = +el.getAttribute("data-count");
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    el.textContent = "0";
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var t0 = performance.now();
      (function step(t) {
        var k = Math.min((t - t0) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
    io.observe(el);
  });

  // ---- Footer year ----
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
