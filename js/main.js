/* ============================================================
   CLEARFLOW — SITE INTERACTIONS
   ------------------------------------------------------------
   01 · Config hydration        06 · Services index
   02 · Header / mobile menu    07 · Testimonial drag scroller
   03 · Scroll reveals          08 · Process pipe line
   04 · Counters                09 · Service-area map sync
   05 · Magnetic CTAs           10 · Contact form
   ============================================================ */
(function () {
  "use strict";

  var docEl = document.documentElement;
  docEl.classList.add("js");

  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = function () { return REDUCE.matches; };

  /* ==========================================================
     01 · CONFIG HYDRATION — inject js/config.js values into
     every [data-bind] / [data-bind-href] element.
  ========================================================== */
  var S = window.SITE || {};
  var BINDINGS = {
    companyName: S.companyName,
    companyShort: S.companyShort,
    phone: S.phone,
    email: S.email,
    address: S.address,
    license: S.license,
    regionShort: S.regionShort,
    hoursWeekdays: S.hours && S.hours.weekdays,
    hoursSaturday: S.hours && S.hours.saturday,
    hoursEmergency: S.hours && S.hours.emergency
  };
  var HREFS = {
    phoneHref: S.phoneHref ? "tel:" + S.phoneHref : null,
    emailHref: S.email ? "mailto:" + S.email : null
  };
  document.querySelectorAll("[data-bind]").forEach(function (el) {
    var v = BINDINGS[el.getAttribute("data-bind")];
    if (v) el.textContent = v;
  });
  document.querySelectorAll("[data-bind-href]").forEach(function (el) {
    var v = HREFS[el.getAttribute("data-bind-href")];
    if (v) el.setAttribute("href", v);
  });
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ==========================================================
     02 · HEADER — solid on scroll, hide on fast down-scroll
  ========================================================== */
  var header = document.querySelector("[data-header]");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-solid", y > 24);
    if (y > 900 && y - lastY > 6 && !menuOpen) header.classList.add("is-hidden");
    else if (lastY - y > 4 || y < 900) header.classList.remove("is-hidden");
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var menu = document.querySelector("[data-mobile-menu]");
  var toggle = document.querySelector("[data-nav-toggle]");
  var menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      var first = menu.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
  }
  toggle.addEventListener("click", function () { setMenu(!menuOpen); });
  menu.querySelectorAll("[data-nav-close]").forEach(function (el) {
    el.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menuOpen) { setMenu(false); toggle.focus(); }
  });

  /* ==========================================================
     03 · SCROLL REVEALS — IntersectionObserver, varied mechanics
  ========================================================== */
  // wrap each [data-reveal-lines] line for the mask reveal
  document.querySelectorAll("[data-reveal-lines] > span").forEach(function (span) {
    var inner = document.createElement("span");
    inner.className = "line-inner";
    while (span.firstChild) inner.appendChild(span.firstChild);
    span.appendChild(inner);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-inview");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });

  document.querySelectorAll("[data-reveal], [data-reveal-lines], [data-reveal-mask]")
    .forEach(function (el) { io.observe(el); });

  /* ==========================================================
     04 · COUNTERS — count up when the stat band scrolls in
  ========================================================== */
  var counterIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      counterIO.unobserve(el);
      var target = parseFloat(el.getAttribute("data-target"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var comma = el.hasAttribute("data-comma");
      var format = function (v) {
        var s = v.toFixed(decimals);
        if (comma) s = Number(s).toLocaleString("en-US");
        return s;
      };
      if (reduced() || !window.gsap) { el.textContent = format(target); return; }
      var state = { v: 0 };
      gsap.to(state, {
        v: target, duration: 1.8, ease: "power3.out",
        onUpdate: function () { el.textContent = format(state.v); },
        onComplete: function () { el.textContent = format(target); }
      });
    });
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-counter]").forEach(function (el) { counterIO.observe(el); });

  /* ==========================================================
     05 · MAGNETIC CTAS — desktop pointer only, restrained pull
  ========================================================== */
  if (window.matchMedia("(pointer: fine)").matches && window.gsap) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = 14;
      var xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      var yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
      el.addEventListener("mousemove", function (e) {
        if (reduced()) return;
        var r = el.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - 0.5) * strength);
        yTo(((e.clientY - r.top) / r.height - 0.5) * strength);
      });
      el.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ==========================================================
     06 · SERVICES INDEX — hover preview (desktop) + accordion
  ========================================================== */
  var serviceRows = Array.prototype.slice.call(document.querySelectorAll("[data-service]"));
  var previewImgs = Array.prototype.slice.call(document.querySelectorAll("[data-preview-img]"));
  var previewNote = document.querySelector("[data-preview-note]");
  var isDesktopSvc = function () { return window.matchMedia("(min-width: 1101px)").matches; };

  function activateService(idx) {
    serviceRows.forEach(function (row) {
      row.classList.toggle("is-active", +row.getAttribute("data-service") === idx);
    });
    previewImgs.forEach(function (img) {
      img.classList.toggle("is-active", +img.getAttribute("data-preview-img") === idx);
    });
    var active = serviceRows[idx];
    if (previewNote && active) {
      var p = active.querySelector(".services__detail p");
      if (p) previewNote.textContent = p.textContent;
    }
  }

  serviceRows.forEach(function (row) {
    var idx = +row.getAttribute("data-service");
    var trigger = row.querySelector(".services__trigger");
    row.addEventListener("mouseenter", function () {
      if (isDesktopSvc()) activateService(idx);
    });
    trigger.addEventListener("focus", function () {
      if (isDesktopSvc()) activateService(idx);
    });
    trigger.addEventListener("click", function () {
      var open = row.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(open));
      if (isDesktopSvc()) activateService(idx);
    });
  });
  activateService(0);

  /* ==========================================================
     07 · TESTIMONIALS — native scroll + drag with momentum
  ========================================================== */
  var viewport = document.querySelector("[data-reviews]");
  if (viewport) {
    var isDown = false, startX = 0, startScroll = 0, velocity = 0, lastX = 0, raf;
    viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return; // touch uses native scrolling
      isDown = true;
      startX = lastX = e.clientX;
      startScroll = viewport.scrollLeft;
      viewport.classList.add("is-dragging");
      cancelAnimationFrame(raf);
    });
    window.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      velocity = e.clientX - lastX;
      lastX = e.clientX;
      viewport.scrollLeft = startScroll - (e.clientX - startX);
    });
    window.addEventListener("pointerup", function () {
      if (!isDown) return;
      isDown = false;
      viewport.classList.remove("is-dragging");
      if (reduced()) return;
      var v = -velocity * 14;
      var decel = function () {
        v *= 0.92;
        viewport.scrollLeft += v * 0.016;
        if (Math.abs(v) > 8) raf = requestAnimationFrame(decel);
      };
      raf = requestAnimationFrame(decel);
    });
  }

  /* ==========================================================
     08 · PROCESS — pipe fills with water as you scroll through
  ========================================================== */
  var processEl = document.querySelector("[data-process]");
  if (processEl && window.gsap && window.ScrollTrigger && !reduced()) {
    var fill = processEl.querySelector("[data-process-fill]");
    var steps = Array.prototype.slice.call(processEl.querySelectorAll(".process__step"));
    gsap.to(fill, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: processEl,
        start: "top 72%",
        end: "bottom 45%",
        scrub: 0.8,
        onUpdate: function (self) {
          steps.forEach(function (step, i) {
            step.classList.toggle("is-passed", self.progress > (i + 0.5) / steps.length - 0.12);
          });
        }
      }
    });
  } else if (processEl) {
    var fillStatic = processEl.querySelector("[data-process-fill]");
    if (fillStatic) fillStatic.style.strokeDashoffset = 0;
    processEl.querySelectorAll(".process__step").forEach(function (s) { s.classList.add("is-passed"); });
  }

  /* ==========================================================
     09 · SERVICE AREA — list hover highlights map markers
  ========================================================== */
  var markers = Array.prototype.slice.call(document.querySelectorAll("[data-marker]"));
  document.querySelectorAll("[data-area]").forEach(function (link) {
    var idx = +link.getAttribute("data-area");
    var marker = markers.filter(function (m) { return +m.getAttribute("data-marker") === idx; })[0];
    if (!marker) return;
    ["mouseenter", "focus"].forEach(function (ev) {
      link.addEventListener(ev, function () { marker.classList.add("is-hot"); });
    });
    ["mouseleave", "blur"].forEach(function (ev) {
      link.addEventListener(ev, function () { marker.classList.remove("is-hot"); });
    });
  });

  /* ==========================================================
     10 · CONTACT FORM — light validation + success state.
     Set formEndpoint in js/config.js to actually send.
  ========================================================== */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var required = form.querySelectorAll("[required]");
      var ok = true;
      required.forEach(function (input) {
        var valid = input.checkValidity();
        input.classList.toggle("is-invalid", !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;

      var finish = function () {
        var success = form.querySelector("[data-form-success]");
        success.hidden = false;
        success.setAttribute("tabindex", "-1");
        success.focus({ preventScroll: true });
      };

      if (S.formEndpoint) {
        var data = new FormData(form);
        fetch(S.formEndpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" }
        }).then(finish).catch(finish);
      } else {
        finish();
      }
    });
    form.querySelectorAll("[required]").forEach(function (input) {
      input.addEventListener("input", function () { input.classList.remove("is-invalid"); });
    });
  }
})();
