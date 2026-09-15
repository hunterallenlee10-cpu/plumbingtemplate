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

  /* Claim the counters + process pipe from main.js (which runs
     after this file) whenever motion is allowed at load. */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    docEl.classList.add("sfx-counters", "sfx-process");
  }

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
      desktop: "(min-width: 1101px)",
      compact: "(max-width: 1100px)",
      reduce: "(prefers-reduced-motion: reduce)",
      fine: "(pointer: fine)"
    },
    function (ctx) {
      var c = ctx.conditions;
      var cleanups = [];

      /* -------- reduced motion → settle owned pieces -------- */
      if (c.reduce) {
        if (docEl.classList.contains("sfx-counters")) {
          qa("[data-counter]").forEach(counterFinish);
        }
        if (docEl.classList.contains("sfx-process")) {
          var fillStatic = q("[data-process-fill]");
          if (fillStatic) fillStatic.style.strokeDashoffset = 0;
          qa(".process__step").forEach(function (s) { s.classList.add("is-passed"); });
        }
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
        var loop = gsap.to(mTrack, { xPercent: -50, ease: "none", duration: 34, repeat: -1 });
        var mDir = 1;
        ScrollTrigger.create({
          onUpdate: function (self) {
            var v = self.getVelocity();
            if (Math.abs(v) > 60) {
              mDir = v > 0 ? 1 : -1;
              loop.timeScale(gsap.utils.clamp(-4, 4, v / 380));
            }
          }
        });
        var marqueeTick = function () {
          loop.timeScale(gsap.utils.interpolate(loop.timeScale(), mDir, 0.05));
        };
        gsap.ticker.add(marqueeTick);
        cleanups.push(function () {
          gsap.ticker.remove(marqueeTick);
          marquee.classList.remove("marquee--js");
        });
      }

      /* ======================================================
         04 · STAT COUNTERS — the numbers are driven by the
         scrollbar itself instead of a one-shot tween.
      ====================================================== */
      qa("[data-counter]").forEach(function (el) {
        var state = { p: 0 };
        gsap.to(state, {
          p: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest(".stats__item") || el,
            start: "top 94%",
            end: "top 52%",
            scrub: 0.5
          },
          onUpdate: function () { el.textContent = counterFormat(el, counterValue(el) * state.p); }
        });
      });
      cleanups.push(function () { qa("[data-counter]").forEach(counterFinish); });

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
        gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, {
          yPercent: 7,
          scale: 1.16,
          ease: "none",
          scrollTrigger: {
            trigger: img.closest("figure") || img,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6
          }
        });
      });

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
        gsap.set(reviewCards, {
          y: 64,
          autoAlpha: 0,
          rotation: function (i) { return i % 2 ? 1.4 : -1.4; }
        });
        ScrollTrigger.create({
          trigger: "[data-reviews]",
          start: "top 88%",
          once: true,
          onEnter: function () {
            gsap.to(reviewCards, {
              y: 0, autoAlpha: 1, rotation: 0,
              duration: 1, ease: "power3.out", stagger: 0.09
            });
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
      var skewTargets = qa(".work__media, .reviews__card, .intro__media, .services__preview-frame");
      if (skewTargets.length) {
        var skewSetters = skewTargets.map(function (el) {
          return gsap.quickSetter(el, "skewY", "deg");
        });
        var skewProxy = { s: 0 };
        var applySkew = function () {
          skewSetters.forEach(function (set) { set(skewProxy.s); });
        };
        var clampSkew = gsap.utils.clamp(-3.2, 3.2);
        ScrollTrigger.create({
          onUpdate: function (self) {
            var s = clampSkew(self.getVelocity() / 400);
            if (Math.abs(s) > Math.abs(skewProxy.s)) {
              skewProxy.s = s;
              gsap.to(skewProxy, {
                s: 0, duration: 0.75, ease: "power3.out",
                overwrite: true, onUpdate: applySkew
              });
            }
          }
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
