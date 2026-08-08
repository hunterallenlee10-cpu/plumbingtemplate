/* ============================================================
   CLEARFLOW — HERO SCENE CHOREOGRAPHY (photoreal)
   ------------------------------------------------------------
   A pinned, scroll-scrubbed sequence over four photographic
   stages, with a diagnostic SVG overlay on top:

     01 PROBLEM    exterior photo, damp stain + warning pulse
     02 DIAGNOSIS  x-ray scan wipe into the cutaway photo,
                   reticle locks onto the failing joint
     03 REPAIR     camera dives into the wall — close-up photo
                   of the new copper section, fittings verified
     04 RESTORED   warm evening cutaway, water flow traced
                   through the system

   The "camera" is a wrapper div; cam(fx, fy, s) computes the
   transform that puts photo-fraction (fx, fy) at frame center
   at scale s — so zooms track the same spot at any frame size.
   ============================================================ */
(function () {
  "use strict";

  var hero = document.querySelector("[data-hero]");
  if (!hero) return;

  var q = function (sel) { return hero.querySelector(sel); };
  var qa = function (sel) { return Array.prototype.slice.call(hero.querySelectorAll(sel)); };

  /* camera helper: focus point (fractions of frame) + scale */
  function cam(fx, fy, s) {
    return {
      scale: s,
      xPercent: (0.5 - fx) * 100 * s,
      yPercent: (0.5 - fy) * 100 * s,
      transformOrigin: "50% 50%"
    };
  }

  function goStatic() {
    hero.classList.add("hero--static");
    var title = hero.querySelector(".hero__title");
    if (title && !title.hasAttribute("data-motion-title")) {
      title.setAttribute("data-motion-title", title.innerHTML);
      title.innerHTML = "Restore your home.";
    }
  }
  function clearStatic() {
    hero.classList.remove("hero--static");
    var title = hero.querySelector(".hero__title");
    if (title && title.hasAttribute("data-motion-title")) {
      title.innerHTML = title.getAttribute("data-motion-title");
      title.removeAttribute("data-motion-title");
    }
  }

  if (!window.gsap || !window.ScrollTrigger) { goStatic(); return; }

  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();

  mm.add(
    {
      desktop: "(min-width: 901px)",
      mobile: "(max-width: 900px)",
      reduce: "(prefers-reduced-motion: reduce)"
    },
    function (ctx) {
      var c = ctx.conditions;

      if (c.reduce) { goStatic(); return function () { clearStatic(); }; }
      clearStatic();

      var isMobile = c.mobile;
      var camera = q("[data-hero-camera]");
      var scan = q("[data-scanline]");
      var stage1 = q('[data-stage="1"]');
      var stage2 = q('[data-stage="2"]');
      var stage2Reveal = q("[data-stage2-reveal]");
      var stage3 = q('[data-stage="3"]');
      var stage4 = q('[data-stage="4"]');
      var flowGroup = document.getElementById("ov-flow");

      /* camera framings: desktop shows the full plate; mobile
         crops in, so every framing carries a higher base scale */
      var F = isMobile ? {
        s1a: cam(0.47, 0.52, 1.35), s1b: cam(0.47, 0.54, 1.28),
        wipe: cam(0.48, 0.55, 1.3),
        diagA: cam(0.48, 0.55, 1.3), diagB: cam(0.5, 0.55, 1.5),
        joint: cam(0.497, 0.545, 1.85),
        rest: cam(0.5, 0.55, 1.32), restB: cam(0.5, 0.52, 1.26),
        settle: cam(0.5, 0.52, 1.28)
      } : {
        s1a: cam(0.5, 0.54, 1.08), s1b: cam(0.5, 0.53, 1.03),
        wipe: cam(0.5, 0.52, 1.0),
        diagA: cam(0.5, 0.52, 1.0), diagB: cam(0.5, 0.53, 1.07),
        joint: cam(0.497, 0.545, 1.6),
        rest: cam(0.5, 0.53, 1.05), restB: cam(0.5, 0.5, 1.0),
        settle: cam(0.5, 0.5, 1.03)
      };

      /* ---------------- initial state ---------------------- */
      gsap.set(camera, F.s1a);
      gsap.set(stage1, { autoAlpha: 1 });
      gsap.set(stage2Reveal, { xPercent: 100 });
      gsap.set(stage2, { autoAlpha: 1, xPercent: -100 });
      gsap.set(stage3, { autoAlpha: 0 });
      gsap.set(stage4, { autoAlpha: 0 });
      gsap.set(scan, { autoAlpha: 0, xPercent: 0 });
      gsap.set("#ov-problem, #ov-grid-rect, #ov-reticle, #ov-tag, #ov-flow, #ov-heater-ring", { autoAlpha: 0 });
      gsap.set("#ov-fit-l, #ov-fit-r, #ov-sealed", { autoAlpha: 0 });
      gsap.set("[data-hero-final]", { autoAlpha: 0, y: 26 });
      gsap.set("[data-hero-rail]", { autoAlpha: 0 });
      if (flowGroup) flowGroup.classList.remove("is-flowing");

      var railFill = q("[data-rail-fill]");
      var railSet = railFill ? gsap.quickSetter(railFill, "scaleY") : null;
      var railSteps = qa("[data-rail-step]");
      var captions = qa("[data-caption]");
      gsap.set(captions, { autoAlpha: 0, y: 30 });

      /* ---------------- ambient loops ---------------------- */
      var loops = {};

      loops.pulse = gsap.timeline({ repeat: -1, paused: true })
        .fromTo("#ov-pulse", { attr: { r: 12 }, autoAlpha: 0.95 },
          { attr: { r: 46 }, autoAlpha: 0, duration: 1.6, ease: "power1.out" })
        .fromTo("#ov-pulse-dot", { autoAlpha: 0.95 }, { autoAlpha: 0.3, duration: 1.6 }, 0)
        .to({}, { duration: 0.4 });

      loops.retGlow = gsap.timeline({ repeat: -1, yoyo: true, paused: true })
        .fromTo("#ov-reticle-glow", { autoAlpha: 0.3 },
          { autoAlpha: 0.75, duration: 0.7, ease: "sine.inOut" });

      loops.heater = gsap.timeline({ repeat: -1, paused: true })
        .fromTo("#ov-heater-ring", { attr: { r: 14 }, autoAlpha: 0.85 },
          { attr: { r: 38 }, autoAlpha: 0, duration: 1.5, ease: "power1.out" })
        .to({}, { duration: 0.5 });

      function gate(loop, on, el) {
        if (on && loop.paused()) { loop.play(0); }
        else if (!on && !loop.paused()) {
          loop.pause();
          if (el) gsap.set(el, { autoAlpha: 0 });
        }
      }

      /* ---------------- master timeline -------------------- */
      var tl = gsap.timeline({
        defaults: { ease: "none", force3D: true },
        scrollTrigger: {
          trigger: "[data-hero-pin]",
          start: "top top",
          end: "+=" + (isMobile ? 3800 : 5200),
          pin: true,
          scrub: isMobile ? 0.7 : 1.2,
          anticipatePin: 1,
          onToggle: function (self) {
            hero.classList.toggle("is-scene-active", self.isActive);
            if (!self.isActive && flowGroup) flowGroup.classList.remove("is-flowing");
          },
          onUpdate: function (self) {
            var p = self.progress;
            gate(loops.pulse, p > 0.04 && p < 0.19, "#ov-pulse, #ov-pulse-dot");
            gate(loops.retGlow, p > 0.36 && p < 0.46, "#ov-reticle-glow");
            gate(loops.heater, p > 0.72 && p < 0.82, "#ov-heater-ring");
            if (flowGroup) flowGroup.classList.toggle("is-flowing", self.isActive && p > 0.72);
            if (railSet) railSet(p);
            var stage = p < 0.2 ? 1 : p < 0.46 ? 2 : p < 0.68 ? 3 : 4;
            railSteps.forEach(function (s) {
              s.classList.toggle("is-active", +s.getAttribute("data-rail-step") === stage);
            });
          }
        }
      });

      var CAPTION_IN = { autoAlpha: 1, y: 0, duration: 3, ease: "power2.out" };
      var CAPTION_OUT = { autoAlpha: 0, y: -26, duration: 2.5, ease: "power2.in" };

      /* ---- 0 · settle in ---------------------------------- */
      tl.to("[data-hero-intro]", { autoAlpha: 0, y: -46, duration: 5, ease: "power1.in" }, 0)
        .to("[data-hero-cue]", { autoAlpha: 0, duration: 3 }, 0)
        .to("[data-hero-rail]", { autoAlpha: 1, duration: 3 }, 2);

      /* ---- 01 · THE PROBLEM ------------------------------- */
      tl.to(camera, Object.assign({ duration: 18 }, F.s1b), 0)
        .to("[data-caption='1']", CAPTION_IN, 4)
        .to("#ov-problem", { autoAlpha: 1, duration: 6 }, 6)
        .to("[data-caption='1']", CAPTION_OUT, 16);

      /* ---- 01 → 02 · X-RAY WIPE --------------------------- */
      var scrim = q("[data-hero-scrim]");
      if (scrim && !isMobile) {
        tl.to(scrim, { autoAlpha: 0.52, duration: 8 }, 18)
          .to(scrim, { autoAlpha: 0.74, duration: 5 }, 46)
          .to(scrim, { autoAlpha: 0.5, duration: 6 }, 66);
      }
      tl.to(scan, { autoAlpha: 0.95, duration: 1.2 }, 18)
        .to(scan, { xPercent: 940, duration: 8, ease: "power1.inOut" }, 18)
        .to(scan, { autoAlpha: 0, duration: 1.2 }, 25.4)
        .to(stage2Reveal, { xPercent: 0, duration: 8, ease: "power1.inOut" }, 18)
        .to(stage2, { xPercent: 0, duration: 8, ease: "power1.inOut" }, 18)
        .to("#ov-grid-rect", { autoAlpha: 0.4, duration: 3 }, 18)
        .to("#ov-grid-rect", { autoAlpha: 0, duration: 3.5 }, 25)
        .to("#ov-problem", { autoAlpha: 0, duration: 3 }, 18.5)
        .to(camera, Object.assign({ duration: 8, ease: "power1.inOut" }, F.wipe), 18);

      /* ---- 02 · DIAGNOSIS --------------------------------- */
      tl.to("[data-caption='2']", CAPTION_IN, 21)
        .to(camera, Object.assign({ duration: 20 }, F.diagB), 26)
        .fromTo("#ov-reticle",
          { autoAlpha: 0, scale: 0.55, svgOrigin: "685 419" },
          { autoAlpha: 1, scale: 1, duration: 3.5, ease: "back.out(1.4)", immediateRender: false }, 31)
        .to("#ov-tag", { autoAlpha: 1, duration: 2.5 }, 36)
        .to("[data-caption='2']", CAPTION_OUT, 43);

      /* ---- 02 → 03 · DIVE INTO THE WALL ------------------- */
      tl.to("#ov-reticle, #ov-tag", { autoAlpha: 0, duration: 2 }, 46)
        .to(camera, Object.assign({ duration: 6, ease: "power2.inOut" }, F.joint), 46)
        .to(stage3, { autoAlpha: 1, duration: 3.5 }, 48.5)
        .to("[data-caption='3']", CAPTION_IN, 47);

      /* camera resets invisibly behind the close-up */
      tl.set(camera, F.rest, 52.4);

      /* ---- 03 · THE REPAIR -------------------------------- */
      tl.fromTo("#ov-fit-l",
          { autoAlpha: 0, scale: 0.5, svgOrigin: "847 402" },
          { autoAlpha: 1, scale: 1, duration: 3, ease: "back.out(1.5)", immediateRender: false }, 54)
        .fromTo("#ov-fit-r",
          { autoAlpha: 0, scale: 0.5, svgOrigin: "1067 402" },
          { autoAlpha: 1, scale: 1, duration: 3, ease: "back.out(1.5)", immediateRender: false }, 55.5)
        .to("#ov-sealed", { autoAlpha: 1, duration: 2.5, ease: "power2.out" }, 59.5)
        .to("#ov-fit-l, #ov-fit-r", { autoAlpha: 0.5, duration: 3 }, 62)
        .to("[data-caption='3']", CAPTION_OUT, 64);

      /* ---- 03 → 04 · RESTORED ----------------------------- */
      tl.set(stage4, { autoAlpha: 1 }, 63.5)
        .to("#ov-fit-l, #ov-fit-r, #ov-sealed", { autoAlpha: 0, duration: 2 }, 65)
        .to(stage3, { autoAlpha: 0, duration: 5, ease: "power1.inOut" }, 66)
        .to(camera, Object.assign({ duration: 12, ease: "power1.out" }, F.restB), 66)
        .to("[data-caption='4']", CAPTION_IN, 71);

      tl.to("#ov-flow", { autoAlpha: 1, duration: 1 }, 72);
      qa(".flow-path").forEach(function (path, i) {
        tl.fromTo(path, { autoAlpha: 0 },
          { autoAlpha: 0.85, duration: 3.5, ease: "power1.in", immediateRender: false }, 72.5 + i * 2.6);
      });

      /* ---- finale ----------------------------------------- */
      tl.to(camera, Object.assign({ duration: 14 }, F.settle), 86)
        .to("[data-hero-final]", { autoAlpha: 1, y: 0, duration: 5, ease: "power2.out" }, 90)
        .to({}, { duration: 6 });

      return function () {
        Object.keys(loops).forEach(function (k) { loops[k].kill(); });
      };
    }
  );
})();
