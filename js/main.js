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

  // stats band: values + labels from config (markup is the fallback)
  if (Array.isArray(S.stats)) {
    var statItems = document.querySelectorAll(".stats__item");
    S.stats.forEach(function (stat, i) {
      var item = statItems[i];
      if (!item) return;
      var label = item.querySelector(".stats__label");
      var counter = item.querySelector("[data-counter]");
      var sup = item.querySelector("sup");
      if (label && stat.label) label.textContent = stat.label;
      if (counter && stat.value != null) {
        counter.setAttribute("data-target", stat.value);
        if (stat.decimals) counter.setAttribute("data-decimals", stat.decimals);
      }
      if (sup && stat.suffix != null) {
        sup.textContent = stat.suffix.trim();
        sup.classList.toggle("stats__star", stat.suffix.indexOf("\u2605") !== -1);
      }
    });
  }

  // service areas: both the areas section list and the footer list
  if (Array.isArray(S.serviceAreas)) {
    var areasList = document.querySelector("[data-areas-list]");
    if (areasList) {
      areasList.innerHTML = "";
      S.serviceAreas.forEach(function (town, i) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#contact";
        a.setAttribute("data-area", i);
        a.textContent = town;
        li.appendChild(a);
        areasList.appendChild(li);
      });
    }
    var footArea = document.querySelector("[data-footer-areas]");
    if (footArea) {
      footArea.innerHTML = "";
      S.serviceAreas.forEach(function (town) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#areas";
        a.textContent = town;
        li.appendChild(a);
        footArea.appendChild(li);
      });
    }
  }

  // social links: render from config, hide entries with empty hrefs
  if (Array.isArray(S.social)) {
    var socialList = document.querySelector("[data-social]");
    if (socialList) {
      socialList.innerHTML = "";
      S.social.forEach(function (link) {
        if (!link.href) return;
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.className = "link-underline link-underline--light";
        a.href = link.href;
        a.textContent = link.label;
        li.appendChild(a);
        socialList.appendChild(li);
      });
    }
  }

  /* ==========================================================
     01b · SMOOTH SCROLL — Lenis, wired into ScrollTrigger.
     Skipped entirely under prefers-reduced-motion.
  ========================================================== */
  var lenis = null;
  function startLenis() {
    if (lenis || reduced() || !window.Lenis || !window.gsap || !window.ScrollTrigger) return;
    docEl.classList.add("has-lenis");
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function stopLenis() {
    if (!lenis) return;
    lenis.destroy();
    lenis = null;
    docEl.classList.remove("has-lenis");
  }
  startLenis();
  REDUCE.addEventListener("change", function () { reduced() ? stopLenis() : startLenis(); });

  // in-page anchors scroll through Lenis (native fallback otherwise)
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a || !lenis) return;
    var id = a.getAttribute("href").slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: id === "top" ? 0 : -64 });
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
    if (e.key === "Escape" && menuOpen) { setMenu(false); toggle.focus(); return; }
    if (e.key !== "Tab" || !menuOpen) return;
    // keep focus inside the open menu (toggle button included)
    var focusables = [toggle].concat(
      Array.prototype.slice.call(menu.querySelectorAll("a[href], button"))
    );
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (focusables.indexOf(document.activeElement) === -1) { e.preventDefault(); first.focus(); }
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

  /* nav scrollspy: aria-current on the section in view */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav__link"));
  var spyMap = {};
  spyLinks.forEach(function (link) {
    var id = (link.getAttribute("href") || "").slice(1);
    var section = id && document.getElementById(id);
    if (section) spyMap[id] = link;
  });
  var spyIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = spyMap[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) {
        spyLinks.forEach(function (l) { l.removeAttribute("aria-current"); });
        link.setAttribute("aria-current", "true");
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  Object.keys(spyMap).forEach(function (id) { spyIO.observe(document.getElementById(id)); });

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
    var detail = row.querySelector(".services__detail");
    if (detail) {
      detail.id = "svc-detail-" + idx;
      trigger.setAttribute("aria-controls", detail.id);
    }
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
      velocity = 0;
      startX = lastX = e.clientX;
      startScroll = viewport.scrollLeft;
      viewport.classList.add("is-dragging");
      viewport.classList.remove("is-settling");
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
      if (reduced() || Math.abs(velocity) < 2) return;
      viewport.classList.add("is-settling");
      var v = -velocity * 14;
      var decel = function () {
        v *= 0.92;
        viewport.scrollLeft += v * 0.016;
        if (Math.abs(v) > 8) raf = requestAnimationFrame(decel);
        else viewport.classList.remove("is-settling");
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
    var errorNote = form.querySelector("[data-form-error]");
    var fields = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      fields.forEach(function (input) {
        var valid = input.checkValidity();
        input.classList.toggle("is-invalid", !valid);
        if (valid) input.removeAttribute("aria-invalid");
        else {
          input.setAttribute("aria-invalid", "true");
          if (!firstInvalid) firstInvalid = input;
        }
      });
      if (firstInvalid) {
        errorNote.hidden = false;
        errorNote.textContent = "Please check the highlighted fields.";
        firstInvalid.focus();
        return;
      }
      errorNote.hidden = true;

      var submitBtn = form.querySelector(".contact__submit");
      var finish = function () {
        form.classList.add("is-done");
        var success = form.querySelector("[data-form-success]");
        success.hidden = false;
        success.setAttribute("tabindex", "-1");
        success.focus({ preventScroll: true });
      };
      var fail = function () {
        submitBtn.disabled = false;
        errorNote.hidden = false;
        errorNote.textContent = "Something went wrong sending your request. Please try again, or call " + (S.phone || "us") + ".";
      };

      if (S.formEndpoint) {
        submitBtn.disabled = true;
        fetch(S.formEndpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        }).then(function (res) {
          if (res.ok) finish(); else fail();
        }).catch(fail);
      } else {
        finish();
      }
    });

    fields.forEach(function (input) {
      input.addEventListener("input", function () {
        input.classList.remove("is-invalid");
        input.removeAttribute("aria-invalid");
      });
    });
  }
})();
