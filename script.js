(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      { rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // ---- Header: highlight the nav item for the section in view ----
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var ids = ["top"].concat(navLinks.map(function (a) { return a.getAttribute("href").slice(1); }));
  var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);

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
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
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

  menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
  document.querySelectorAll("[data-close-menu]").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
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
    status.textContent = copied ? "Copied" : state === "failed" ? "Copy failed" : "";
  }

  copyBtn.addEventListener("click", function () {
    var email = copyBtn.getAttribute("data-email");
    var done = function (ok) {
      showState(ok ? "copied" : "failed");
      window.setTimeout(function () { showState("idle"); }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  });

  // ---- Footer year ----
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
