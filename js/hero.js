/* ============================================================
   CLEARFLOW — HERO SCENE CHOREOGRAPHY
   ------------------------------------------------------------
   A pinned, scroll-scrubbed timeline in four stages:

     01 PROBLEM    exterior view, subtle leak indicators
     02 DIAGNOSIS  facade parts, pipes draw in, scan finds leak
     03 REPAIR     camera zooms, section replaced, joints sealed
     04 RESTORED   water flows branch by branch, fixtures wake

   The "camera" is the SVG viewBox, tweened between framings —
   which keeps every zoom crisp (it's vectors all the way down).
   Ambient loops (drips, pulses) are gated by scroll progress so
   nothing runs when it isn't on screen.
   ============================================================ */
(function () {
  "use strict";

  var hero = document.querySelector("[data-hero]");
  if (!hero) return;

  var svg = document.getElementById("house");
  var q = function (sel) { return hero.querySelector(sel); };
  var qa = function (sel) { return Array.prototype.slice.call(hero.querySelectorAll(sel)); };

  /* ---------- camera framings (viewBox strings) ---------- */
  var CAM = {
    full:   "0 0 1180 840",
    fullM:  "165 55 910 785",    // mobile: house fills the frame
    joint:  "316 348 500 356",   // tight on the failed coupling
    lowerM: "180 310 820 585",   // mobile: kitchen + basement zone
    jointM: "336 360 460 327"    // mobile repair framing
  };

  /* ---------- static fallback (no JS-motion) -------------- */
  function goStatic() {
    hero.classList.add("hero--static");
    // show the restored cutaway: facade off, flow on, notes on
    var hide = ["#facade", "#scan-trail", "#scan-head", "#pipe-damaged",
                "#leak-tag", "#leak-glow", "#pulse-int", "#droplets", "#puddle",
                "#cut-marks"];
    hide.forEach(function (s) {
      var el = svg.querySelector(s);
      if (el) el.style.display = "none";
    });
    var show = ["#pipe-new", "#notes", "#flow", "#stream-kitchen",
                "#stream-bath", "#stream-shower", "#ambient", "#light-1", "#light-2"];
    show.forEach(function (s) {
      var el = svg.querySelector(s);
      if (el) el.style.opacity = 1;
    });
    var heaterDot = svg.querySelector("#heater-dot");
    if (heaterDot) { heaterDot.style.fill = "#3E8FB0"; heaterDot.style.opacity = 1; }
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

      if (c.reduce) { goStatic(); return function () { hero.classList.remove("hero--static"); }; }
      hero.classList.remove("hero--static");

      var isMobile = c.mobile;

      /* =====================================================
         INITIAL STATE
      ====================================================== */
      gsap.set(svg, { attr: { viewBox: isMobile ? CAM.fullM : CAM.full } });
      gsap.set("#notes, #flow, #pipe-new, #cut-marks", { autoAlpha: 0 });
      gsap.set("#stream-kitchen, #stream-bath, #stream-shower", { autoAlpha: 0 });
      gsap.set("#stain, #drips-ext, #pulse-ext, #pulse-ext-dot, #pulse-int, #leak-glow, #leak-tag, #puddle", { autoAlpha: 0 });
      gsap.set("#scan-trail, #scan-head", { autoAlpha: 0 });
      gsap.set("#ambient, #light-1, #light-2", { autoAlpha: 0 });
      gsap.set(".facade-panel", { autoAlpha: 1, x: 0, y: 0 });
      gsap.set("#pipe-damaged", { autoAlpha: 1, y: 0 });
      gsap.set(".droplet", { autoAlpha: 0 });
      gsap.set("[data-hero-final]", { autoAlpha: 0, y: 26 });
      gsap.set("[data-hero-rail]", { autoAlpha: 0 });
      var railFill = q("[data-rail-fill]");
      var railSteps = qa("[data-rail-step]");
      var captions = qa("[data-caption]");
      gsap.set(captions, { autoAlpha: 0, y: 30 });
      document.getElementById("flow").classList.remove("is-flowing");

      /* =====================================================
         AMBIENT LOOPS (gated by scroll progress)
      ====================================================== */
      var loops = {};

      loops.pulseExt = gsap.timeline({ repeat: -1, paused: true })
        .fromTo("#pulse-ext", { attr: { r: 8 }, autoAlpha: 0.9 },
          { attr: { r: 30 }, autoAlpha: 0, duration: 1.6, ease: "power1.out" })
        .fromTo("#pulse-ext-dot", { autoAlpha: 0.9 }, { autoAlpha: 0.25, duration: 1.6 }, 0)
        .to({}, { duration: 0.4 });

      loops.pulseInt = gsap.timeline({ repeat: -1, paused: true })
        .fromTo("#pulse-int", { attr: { r: 9 }, autoAlpha: 0.9 },
          { attr: { r: 26 }, autoAlpha: 0, duration: 1.4, ease: "power1.out" })
        .to({}, { duration: 0.35 });

      loops.drip = gsap.timeline({ repeat: -1, paused: true });
      qa(".droplet").forEach(function (d, i) {
        loops.drip.fromTo(d,
          { attr: { cy: 529 }, autoAlpha: 0 },
          { attr: { cy: 539 }, autoAlpha: 1, duration: 0.55, ease: "power2.in",
            onComplete: function () { gsap.set(d, { autoAlpha: 0 }); } },
          i * 0.6);
      });

      loops.glow = gsap.timeline({ repeat: -1, yoyo: true, paused: true })
        .fromTo("#leak-glow", { autoAlpha: 0.25 }, { autoAlpha: 0.6, duration: 0.7, ease: "sine.inOut" });

      function gate(loop, on, el) {
        if (on && loop.paused()) { loop.play(0); }
        else if (!on && !loop.paused()) {
          loop.pause();
          if (el) gsap.set(el, { autoAlpha: 0 });
        }
      }

      /* =====================================================
         MASTER TIMELINE  (100 arbitrary units, scrubbed)
      ====================================================== */
      var tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "[data-hero-pin]",
          start: "top top",
          end: "+=" + (isMobile ? 3400 : 4400),
          pin: true,
          scrub: isMobile ? 0.6 : 1,
          anticipatePin: 1,
          onUpdate: function (self) {
            var p = self.progress;
            gate(loops.pulseExt, p > 0.04 && p < 0.2, "#pulse-ext, #pulse-ext-dot");
            gate(loops.pulseInt, p > 0.2 && p < 0.44, "#pulse-int");
            gate(loops.drip, p > 0.2 && p < 0.52, ".droplet");
            gate(loops.glow, p > 0.4 && p < 0.5, null);
            document.getElementById("flow").classList.toggle("is-flowing", p > 0.7);
            // progress rail
            if (railFill) gsap.set(railFill, { scaleY: p });
            var stage = p < 0.2 ? 1 : p < 0.46 ? 2 : p < 0.7 ? 3 : 4;
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
      tl.to("[data-caption='1']", CAPTION_IN, 4)
        .to("#stain", { autoAlpha: 0.75, duration: 6 }, 5)
        .to("#drips-ext", { autoAlpha: 0.9, duration: 4 }, 8)
        .to("[data-caption='1']", CAPTION_OUT, 16);

      /* ---- 02 · DIAGNOSIS --------------------------------- */
      // facade parts: panels drift apart and dissolve
      tl.to("[data-panel='ground']", { autoAlpha: 0, y: 16, duration: 6, ease: "power2.inOut" }, 18.5)
        .to("[data-panel='1']", { autoAlpha: 0, x: -46, duration: 6, ease: "power2.inOut" }, 19)
        .to("[data-panel='3']", { autoAlpha: 0, x: 46, duration: 6, ease: "power2.inOut" }, 20)
        .to("[data-panel='2']", { autoAlpha: 0, y: 24, duration: 6, ease: "power2.inOut" }, 21)
        .to("[data-panel='2b']", { autoAlpha: 0, y: -30, duration: 6, ease: "power2.inOut" }, 21.5);

      if (isMobile) {
        tl.to(svg, { attr: { viewBox: CAM.lowerM }, duration: 8, ease: "power1.inOut" }, 20);
      }

      tl.to("[data-caption='2']", CAPTION_IN, 21)
        .to("#puddle", { autoAlpha: 0.5, duration: 4 }, 24)
        .to("#puddle", { attr: { rx: 24 }, duration: 18 }, 26)
        .to("#notes", { autoAlpha: 1, duration: 4 }, 26);

      // scan traveller
      var scanPath = svg.querySelector("#scan-path");
      var scanTrail = svg.querySelector("#scan-trail");
      var scanHead = svg.querySelector("#scan-head");
      var scanLen = scanPath.getTotalLength();
      scanTrail.style.strokeDasharray = scanLen;
      scanTrail.style.strokeDashoffset = scanLen;
      var scanState = { p: 0 };

      tl.to("#scan-trail, #scan-head", { autoAlpha: 1, duration: 1.5 }, 29)
        .to(scanState, {
          p: 1, duration: 10, ease: "power1.inOut",
          onUpdate: function () {
            var pt = scanPath.getPointAtLength(scanState.p * scanLen);
            scanHead.setAttribute("cx", pt.x);
            scanHead.setAttribute("cy", pt.y);
            scanTrail.style.strokeDashoffset = scanLen * (1 - scanState.p);
          }
        }, 29.5)
        .to("#leak-glow", { autoAlpha: 0.55, duration: 1.5 }, 39)
        .to("#leak-tag", { autoAlpha: 1, duration: 2 }, 39.5)
        .to("#scan-head", { autoAlpha: 0, duration: 2 }, 40.5)
        .to("#scan-trail", { autoAlpha: 0, duration: 3 }, 41);

      /* ---- 03 · THE REPAIR -------------------------------- */
      tl.to("[data-caption='2']", CAPTION_OUT, 43)
        .to(svg, {
          attr: { viewBox: isMobile ? CAM.jointM : CAM.joint },
          duration: 6, ease: "power2.inOut"
        }, 43.5)
        .to("[data-caption='3']", CAPTION_IN, 46)
        .to("#leak-tag", { autoAlpha: 0, duration: 2 }, 46)
        .to("#notes", { autoAlpha: 0, duration: 3 }, 44);

      tl.to("#cut-marks", { autoAlpha: 1, duration: 1.5 }, 48)
        .to("#leak-glow", { autoAlpha: 0, duration: 3 }, 49)
        .to("#pipe-damaged", { y: 42, autoAlpha: 0, duration: 5, ease: "power2.in" }, 50.5)
        .to("#puddle", { autoAlpha: 0, duration: 4 }, 52)
        .fromTo("#pipe-new", { y: -54, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 5, ease: "back.out(1.3)" }, 55)
        .to("#cut-marks", { autoAlpha: 0, duration: 1.5 }, 56)
        .to("#fitting-l", { rotation: 100, transformOrigin: "50% 50%", duration: 2.5, ease: "power2.inOut" }, 60)
        .to("#fitting-r", { rotation: -100, transformOrigin: "50% 50%", duration: 2.5, ease: "power2.inOut" }, 61)
        .fromTo("#seal-l", { attr: { r: 6 }, autoAlpha: 0.9 },
          { attr: { r: 20 }, autoAlpha: 0, duration: 2.5, ease: "power1.out", immediateRender: false }, 62.5)
        .fromTo("#seal-r", { attr: { r: 6 }, autoAlpha: 0.9 },
          { attr: { r: 20 }, autoAlpha: 0, duration: 2.5, ease: "power1.out", immediateRender: false }, 63.5);

      /* ---- 04 · RESTORED ---------------------------------- */
      tl.to("[data-caption='3']", CAPTION_OUT, 65)
        .to(svg, { attr: { viewBox: isMobile ? CAM.fullM : CAM.full }, duration: 6, ease: "power2.inOut" }, 65.5)
        .to("[data-caption='4']", CAPTION_IN, 71);

      tl.to("#flow", { autoAlpha: 1, duration: 1 }, 70);
      var flowPaths = qa(".flow-path");
      flowPaths.forEach(function (p, i) {
        tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 0.95, duration: 3.5, ease: "power1.in" }, 70.5 + i * 2.2);
      });

      tl.to("#heater-dot", { fill: "#3E8FB0", autoAlpha: 1, duration: 3 }, 74)
        .to("#ambient", { autoAlpha: 1, duration: 8 }, 74)
        .fromTo("#stream-kitchen", { autoAlpha: 0, scaleY: 0.2, svgOrigin: "500 492" },
          { autoAlpha: 1, scaleY: 1, duration: 3, ease: "power2.out" }, 79)
        .fromTo("#stream-bath", { autoAlpha: 0, scaleY: 0.2, svgOrigin: "684 346" },
          { autoAlpha: 1, scaleY: 1, duration: 2.5, ease: "power2.out" }, 82)
        .fromTo("#stream-shower", { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 3 }, 84.5)
        .to("#light-1", { autoAlpha: 0.9, duration: 3 }, 81)
        .to("#light-2", { autoAlpha: 0.9, duration: 3 }, 84);

      /* ---- finale ----------------------------------------- */
      tl.to("[data-hero-final]", { autoAlpha: 1, y: 0, duration: 5, ease: "power2.out" }, 90)
        .to({}, { duration: 6 }); // breathing room at the end

      return function () {
        Object.keys(loops).forEach(function (k) { loops[k].kill(); });
      };
    }
  );
})();
