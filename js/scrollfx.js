/* ============================================================
   CLEARFLOW — SITE-WIDE SCROLL CHOREOGRAPHY
   ------------------------------------------------------------
   Extends the hero's cinematic language across the whole page.
   Loaded BEFORE js/main.js so it can claim ownership of the
   stat counters and the process pipe (main.js checks the
   sfx-* classes on <html> and skips its simpler fallbacks).

     01 · page water gauge — fills as the page scrolls
     02 · statement — pinned, word-by-word reveal
     03 · service marquee — velocity-reactive loop
     04 · stat counters — scrubbed by scroll position
     05 · parallax system — [data-parallax] / [data-parallax-img]
     06 · process — pinned horizontal pipeline (desktop)
     07 · reviews — staggered entrance
     08 · final CTA — slow push-in
     09 · footer — parallax reveal
     10 · velocity skew on media
     11 · cursor — trailing water-drop pointer (fine pointers)

   Everything lives inside gsap.matchMedia(): reduced-motion
   users get the calm static page, and the IntersectionObserver
   reveals in main.js remain the base layer under all of this.
   ============================================================ */
(function () {
  "use strict";

  var docEl = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var q = function (sel) { return document.querySelector(sel); };
  var qa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* Claim the counters + process pipe from main.js (which runs after
     this file) whenever GSAP is here: the reduced-motion branch below
     settles them itself, so ownership never changes hands at runtime. */
  docEl.classList.add("sfx-counters", "sfx-process");

  /* main.js hydrates data-target from config.js after this file runs;
     a static settle must wait for it */
  function afterHydration(fn) {
    if (document.readyState !== "loading") setTimeout(fn, 0);
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* on paper: final numbers, no pins */
  window.addEventListener("beforeprint", function () {
    qa("[data-counter]").forEach(counterFinish);
    ScrollTrigger.getAll().forEach(function (t) { t.disable(true); });
  });
  window.addEventListener("afterprint", function () {
    ScrollTrigger.getAll().forEach(function (t) { t.enable(); });
    ScrollTrigger.refresh();
  });

  /* counter formatting mirrors main.js — values are read from the
     DOM on every update so config.js hydration (which runs later)
     is always respected */
  function counterValue(el) { return parseFloat(el.getAttribute("data-target")) || 0; }
  function counterFormat(el, value) {
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var s = value.toFixed(decimals);
    if (el.hasAttribute("data-comma")) s = Number(s).toLocaleString("en-US");
    return s;
  }
  function counterFinish(el) { el.textContent = counterFormat(el, counterValue(el)); }

  /* split a [data-words] element into word spans (idempotent) */
  function splitWords(el) {
    if (el.hasAttribute("data-words-ready")) return qa(".w", el);
    var text = el.textContent;
    el.setAttribute("aria-label", text.replace(/\s+/g, " ").trim()); // read as one sentence
    el.textContent = "";
    var frag = document.createDocumentFragment();
    text.split(/(\s+)/).forEach(function (chunk) {
      if (!chunk) return;
      if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(" ")); return; }
      var w = document.createElement("span");
      w.className = "w";
      w.textContent = chunk;
      frag.appendChild(w);
    });
    el.appendChild(frag);
    el.setAttribute("data-words-ready", "");
    return qa(".w", el);
  }

  var mm = gsap.matchMedia();

  mm.add(
    {
      // exact complement of the CSS breakpoint (no gap at fractional widths)
      desktop: "not all and (max-width: 1100px)",
      compact: "(max-width: 1100px)",
      reduce: "(prefers-reduced-motion: reduce)",
      fine: "(pointer: fine)"
    },
    function (ctx) {
      var c = ctx.conditions;
      var cleanups = [];

      /* -------- reduced motion → settle owned pieces -------- */
      if (c.reduce) {
        afterHydration(function () { qa("[data-counter]").forEach(counterFinish); });
        var fillStatic = q("[data-process-fill]");
        if (fillStatic) fillStatic.style.strokeDashoffset = 0;
        qa(".process__step").forEach(function (s) { s.classList.add("is-passed"); });
        return;
      }

      /* ======================================================
         01 · PAGE WATER GAUGE — a thin line on the left edge
         fills like a sight glass as the whole page scrolls.
         Appears once the hero's own rail has finished its job.
      ====================================================== */
      var gauge = q("[data-page-gauge]");
      if (c.desktop && gauge) {
        var gaugeFill = gauge.querySelector("[data-page-gauge-fill]");
        var gaugeDrop = gauge.querySelector("[data-page-gauge-drop]");
        var gaugeTrack = gauge.querySelector(".page-gauge__track");
        var fillSet = gsap.quickSetter(gaugeFill, "scaleY");
        var dropSet = gsap.quickSetter(gaugeDrop, "y", "px");
        var gaugeSpan = 0;
        var measureGauge = function () {
          gaugeSpan = Math.max(0, gaugeTrack.clientHeight - gaugeDrop.offsetHeight);
        };
        measureGauge();
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onRefresh: function (self) { measureGauge(); fillSet(self.progress); dropSet(self.progress * gaugeSpan); },
          onUpdate: function (self) { fillSet(self.progress); dropSet(self.progress * gaugeSpan); }
        });
        ScrollTrigger.create({
          trigger: ".statement",
          start: "top 85%",
          end: "max",
          toggleClass: { targets: gauge, className: "is-visible" }
        });
        cleanups.push(function () { gauge.classList.remove("is-visible"); });
      }

      /* ======================================================
         02 · STATEMENT — the brand promise pins and lights up
         word by word as scroll pours through it.
      ====================================================== */
      var stTitle = q(".statement__title[data-words]");
      if (stTitle) {
        var words = splitWords(stTitle);
        gsap.set(words, { opacity: 0.13 });
        gsap.to(words, {
          opacity: 1,
          stagger: 0.35,
          ease: "none",
          scrollTrigger: {
            trigger: ".statement",
            start: "top top",
            end: "+=" + (c.desktop ? "120%" : "90%"),
            pin: true,
            scrub: 0.5,
            anticipatePin: 1
          }
        });
      }

      /* ======================================================
         03 · SERVICE MARQUEE — an endless strip of what we do.
         Scroll velocity feeds its speed and direction.
      ====================================================== */
      var marquee = q("[data-marquee]");
      var mTrack = q("[data-marquee-track]");
      if (marquee && mTrack) {
        marquee.classList.add("marquee--js");
        var loop = gsap.to(mTrack, { xPercent: -50, ease: "none", duration: 34, repeat: -1, paused: true });
        var mDir = 1;
        // runs only while the strip is on screen
        ScrollTrigger.create({
          trigger: marquee, start: "top bottom", end: "bottom top",
          onToggle: function (self) { loop.paused(!self.isActive); }
        });
        var mClamp = c.desktop ? 4 : 2.5;
        ScrollTrigger.create({
          onUpdate: function (self) {
            var v = self.getVelocity();
            if (Math.abs(v) > 60 && !loop.paused()) {
              mDir = v > 0 ? 1 : -1;
              loop.timeScale(gsap.utils.clamp(-mClamp, mClamp, v / 380));
            }
          }
        });
        var marqueeTick = function () {
          if (loop.paused()) return;
          loop.timeScale(gsap.utils.interpolate(loop.timeScale(), mDir, 0.05));
        };
        gsap.ticker.add(marqueeTick);
        cleanups.push(function () {
          gsap.ticker.remove(marqueeTick);
          marquee.classList.remove("marquee--js");
        });
      }

      /* ======================================================
         04 · STAT COUNTERS — count up once as the band arrives,
         70ms apart, and always land exactly on the real value
         (a reader pausing mid-scroll never sees "3.6 stars").
      ====================================================== */
      var counters = qa("[data-counter]");
      if (counters.length) {
        var counted = false;
        /* assistive technology keeps the real value: a visually-hidden
           twin carries it and only the aria-hidden number animates */
        var twins = [];
        var ensureTwins = function () {
          if (twins.length) return;
          counters.forEach(function (el) {
            var real = document.createElement("span");
            real.className = "sr-only";
            real.textContent = counterFormat(el, counterValue(el));
            el.parentNode.insertBefore(real, el);
            el.setAttribute("aria-hidden", "true");
            twins.push(real);
          });
        };
        afterHydration(function () {
          if (counted) return;
          ensureTwins();
          counters.forEach(function (el) { el.textContent = counterFormat(el, 0); });
        });
        ScrollTrigger.create({
          trigger: ".stats__row",
          start: "top 85%",
          once: true,
          onEnter: function () {
            counted = true;
            ensureTwins();
            counters.forEach(function (el, i) {
              var state = { p: 0 };
              gsap.to(state, {
                p: 1, duration: 1.4, delay: i * 0.07, ease: "expo.out",
                onUpdate: function () { el.textContent = counterFormat(el, counterValue(el) * state.p); },
                onComplete: function () { counterFinish(el); }
              });
            });
          }
        });
        cleanups.push(function () {
          counted = true;
          counters.forEach(function (el) { counterFinish(el); el.removeAttribute("aria-hidden"); });
          twins.forEach(function (t) { if (t.parentNode) t.parentNode.removeChild(t); });
          twins = [];
        });
      }

      /* ======================================================
         05 · PARALLAX — depth drift for annotated elements.
         [data-parallax="0.2"]  whole element drifts vertically
         [data-parallax-img]    image drifts inside its clipped
                                frame (pre-scaled so no edges show)
      ====================================================== */
      qa("[data-parallax]").forEach(function (el) {
        var depth = parseFloat(el.getAttribute("data-parallax")) || 0.15;
        gsap.fromTo(el, { y: depth * 130 }, {
          y: -depth * 130,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") || el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7
          }
        });
      });
      qa("[data-parallax-img]").forEach(function (img) {
        var frame = img.closest("figure") || img;
        var mask = img.closest("[data-reveal-mask]");
        // interior drift: pre-scaled so no edges show, y scrubbed by scroll
        gsap.set(img, { scale: 1.08 });
        gsap.fromTo(img, { yPercent: -4 }, {
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6
          }
        });
        // entrance: the image settles from an over-zoom as its curtain
        // mask lifts. The same trigger raises the mask (main.js's
        // observer would add the class a few frames later)
        gsap.fromTo(img, { scale: 1.2 }, {
          scale: 1.08,
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: {
            trigger: mask || frame,
            start: "top 88%",
            once: true,
            onEnter: function () { if (mask) mask.classList.add("is-inview"); }
          }
        });
      });

      /* emergency waves drift only while the section is on screen */
      var emergency = q(".emergency");
      if (emergency) {
        ScrollTrigger.create({ trigger: emergency, start: "top bottom", end: "bottom top", toggleClass: "is-onscreen" });
        cleanups.push(function () { emergency.classList.remove("is-onscreen"); });
      }

      /* CTA background: slow push-in while the section passes */
      var ctaImg = q(".cta__bg img");
      if (ctaImg) {
        gsap.fromTo(ctaImg, { scale: 1.18, yPercent: -6 }, {
          scale: 1.02,
          yPercent: 5,
          ease: "none",
          scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: 0.6 }
        });
      }

      /* ======================================================
         06 · PROCESS — on desktop the four steps become a
         pinned horizontal pipeline: the page scrolls, the
         steps slide, and the pipe fills with water alongside.
         Below desktop the pipe fills vertically in place.
      ====================================================== */
      var proc = q(".process");
      var procTrack = q("[data-process]");
      var procFill = q("[data-process-fill]");
      if (proc && procTrack && procFill) {
        var procSteps = qa(".process__step", proc);
        var setSteps = function (p) {
          procSteps.forEach(function (step, i) {
            step.classList.toggle("is-passed", p > (i + 0.5) / procSteps.length - 0.12);
          });
        };
        if (c.desktop) {
          proc.classList.add("process--flow");
          var flowDist = function () {
            var parent = procTrack.parentElement;
            var cs = getComputedStyle(parent);
            var visible = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
            return Math.max(0, procTrack.scrollWidth - visible);
          };
          gsap.to(procTrack, {
            x: function () { return -flowDist(); },
            ease: "none",
            scrollTrigger: {
              trigger: proc,
              start: "top top",
              end: function () { return "+=" + Math.round(flowDist() + window.innerHeight * 0.35); },
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: function (self) {
                gsap.set(procFill, { strokeDashoffset: 1200 * (1 - self.progress) });
                setSteps(self.progress);
              }
            }
          });
          cleanups.push(function () { proc.classList.remove("process--flow"); });
        } else {
          gsap.to(procFill, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: proc,
              start: "top 72%",
              end: "bottom 45%",
              scrub: 0.8,
              onUpdate: function (self) { setSteps(self.progress); }
            }
          });
        }
      }

      /* ======================================================
         07 · REVIEWS — cards deal themselves onto the table.
      ====================================================== */
      var reviewCards = qa(".reviews__card");
      if (reviewCards.length) {
        gsap.set(reviewCards, { y: 48, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: "[data-reviews]",
          start: "top 88%",
          once: true,
          onEnter: function () {
            gsap.to(reviewCards, { y: 0, autoAlpha: 1, duration: 1, ease: "expo.out", stagger: 0.08 });
          }
        });
      }

      /* ======================================================
         09 · FOOTER — revealed with a gentle parallax lift.
      ====================================================== */
      var footInner = q(".site-footer > .container");
      if (footInner) {
        gsap.fromTo(footInner, { y: -80 }, {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: ".site-footer",
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.6
          }
        });
      }

      /* ======================================================
         10 · VELOCITY SKEW — media leans into fast scrolling,
         then settles. The signature "the page is liquid" feel.
      ====================================================== */
      var skewTargets = c.desktop && c.fine ? qa(".work__media, .intro__media") : [];
      if (skewTargets.length) {
        var skewSetters = skewTargets.map(function (el) {
          return gsap.quickSetter(el, "skewY", "deg");
        });
        // only targets on screen are written to (and promoted while they are)
        var skewInView = [];
        var skewIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            var i = skewTargets.indexOf(e.target);
            var at = skewInView.indexOf(i);
            if (e.isIntersecting) {
              if (at === -1) skewInView.push(i);
              e.target.style.willChange = "transform";
            } else {
              if (at !== -1) skewInView.splice(at, 1);
              skewSetters[i](0);
              e.target.style.willChange = "";
            }
          });
        }, { rootMargin: "15% 0px" });
        skewTargets.forEach(function (el) { skewIO.observe(el); });
        var skewProxy = { s: 0 };
        var applySkew = function () {
          skewInView.forEach(function (i) { skewSetters[i](skewProxy.s); });
        };
        var clampSkew = gsap.utils.clamp(-2, 2);
        ScrollTrigger.create({
          onUpdate: function (self) {
            if (!skewInView.length) return;
            var s = clampSkew(self.getVelocity() / 550);
            if (Math.abs(s) > Math.abs(skewProxy.s)) {
              skewProxy.s = s;
              gsap.to(skewProxy, {
                s: 0, duration: 0.6, ease: "power3.out",
                overwrite: true, onUpdate: applySkew
              });
            }
          }
        });
        cleanups.push(function () {
          skewIO.disconnect();
          skewTargets.forEach(function (el, i) { el.style.willChange = ""; skewSetters[i](0); });
        });
      }

      /* ======================================================
         11 · CURSOR — a trailing water-drop ring on desktop.
         The native cursor stays; this is an accent, not a veil.
      ====================================================== */
      if (c.desktop && c.fine) {
        var dot = document.createElement("div");
        dot.className = "cursor-dot";
        var ring = document.createElement("div");
        ring.className = "cursor-ring";
        var ringLabel = document.createElement("span");
        ringLabel.className = "cursor-ring__label";
        ringLabel.textContent = "Drag";
        ring.appendChild(ringLabel);
        dot.setAttribute("aria-hidden", "true");
        ring.setAttribute("aria-hidden", "true");
        document.body.appendChild(dot);
        document.body.appendChild(ring);
        gsap.set([dot, ring], { x: -100, y: -100, autoAlpha: 0 });
        var dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
        var dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
        var ringX = gsap.quickTo(ring, "x", { duration: 0.38, ease: "power3.out" });
        var ringY = gsap.quickTo(ring, "y", { duration: 0.38, ease: "power3.out" });
        var cursorOn = false;
        var onMove = function (e) {
          if (!cursorOn) { cursorOn = true; gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 }); }
          dotX(e.clientX); dotY(e.clientY);
          ringX(e.clientX); ringY(e.clientY);
        };
        var onOver = function (e) {
          if (!e.target.closest) return;
          var link = e.target.closest("a, button");
          var drag = e.target.closest("[data-reviews]");
          ring.classList.toggle("is-link", !!link);
          ring.classList.toggle("is-drag", !!drag && !link);
        };
        var onLeave = function () {
          cursorOn = false;
          gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 });
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        document.addEventListener("mouseover", onOver);
        document.documentElement.addEventListener("mouseleave", onLeave);
        cleanups.push(function () {
          window.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseover", onOver);
          document.documentElement.removeEventListener("mouseleave", onLeave);
          dot.remove(); ring.remove();
        });
      }

      return function () {
        cleanups.forEach(function (fn) { fn(); });
      };
    }
  );
})();
