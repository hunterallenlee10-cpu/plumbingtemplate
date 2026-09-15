/* ============================================================
   CLEARFLOW — ENTRANCE (load-in choreography)
   ------------------------------------------------------------
   Loaded right behind GSAP. The <head> bootstrap already holds the
   hero copy (html.is-loading) and, on the first visit of a session,
   shows the brand-mark curtain (html.is-curtain, config: SITE.intro).
   The header is never held and scrolling is never locked.

     curtain   the mark draws itself (CSS keyframes, from first paint);
               once the hero photo and fonts are in — never longer than
               ~1.5s — the curtain lifts (0.9s) with the hero already
               settling underneath
     hero      three beats: the photo settles from a slight over-zoom
               under a paper veil that fades (the photo itself is
               painted from the first frame); the headline rises line
               by line out of its masks (80ms apart); then eyebrow,
               copy, buttons, trust line and scroll cue fade up as one
               group, 40ms apart

   Skipped (everything shown immediately) under reduced motion,
   without GSAP, on deep links, or when the page opens scrolled. Any
   scroll during the sequence fast-forwards it, curtain included: the
   user is never held back by a decoration.
   ============================================================ */
(function () {
  "use strict";

  var docEl = document.documentElement;
  var curtain = document.querySelector("[data-curtain]");
  var hero = document.querySelector("[data-hero]");
  var done = false;
  var tl = null;

  // the bootstrap's safety timer is ours now: this file owns the deadline
  if (window.__introTimer) { clearTimeout(window.__introTimer); window.__introTimer = null; }

  function finish() {
    if (done) return;
    done = true;
    docEl.classList.remove("is-loading", "is-curtain");
    if (curtain && curtain.parentNode) curtain.parentNode.removeChild(curtain);
  }

  var wantsLoad = docEl.classList.contains("is-loading");
  var wantsCurtain = wantsLoad && docEl.classList.contains("is-curtain") && !!curtain;
  var deepLink = !!(window.location.hash && document.getElementById(window.location.hash.slice(1)));

  if (!wantsLoad || !hero || !window.gsap || deepLink || window.scrollY > 40) {
    finish();
    return;
  }

  // if the scripts are slow and nothing has started in 2.5s, show the page
  var deadline = setTimeout(function () { if (!tl) finish(); }, 2500);

  /* ---------------- split the headline into lines ----------
     Words are wrapped and measured so each *visual* line gets its
     own overflow mask (a <br> in the markup forces a break). The
     original markup is restored afterwards so the headline keeps
     reflowing naturally at any width. */
  function splitLines(el) {
    var original = el.innerHTML;
    var segments = original.split(/<br\s*\/?>/i).map(function (html) {
      var tmp = document.createElement("div");
      tmp.innerHTML = html;
      return tmp.textContent.replace(/\s+/g, " ").trim();
    });
    el.textContent = "";
    var words = [];
    segments.forEach(function (seg) {
      var block = document.createElement("span");
      block.style.display = "block";
      seg.split(" ").forEach(function (word, i) {
        if (i) block.appendChild(document.createTextNode(" "));
        var w = document.createElement("span");
        w.textContent = word;
        block.appendChild(w);
        words.push(w);
      });
      el.appendChild(block);
    });
    var lines = [];
    var lastTop = null;
    words.forEach(function (w) {
      var top = w.offsetTop;
      if (top !== lastTop) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.textContent = "";
    var inners = lines.map(function (line) {
      var mask = document.createElement("span");
      mask.className = "line";
      var inner = document.createElement("span");
      inner.className = "line-inner";
      inner.textContent = line.join(" ");
      mask.appendChild(inner);
      el.appendChild(mask);
      return inner;
    });
    return { inners: inners, restore: function () { el.innerHTML = original; } };
  }

  /* ---------------- the hero sequence ---------------------- */
  var q = gsap.utils.selector(hero);
  var title = q(".hero__title")[0];
  var frame = q(".hero__frame");
  var group = q(".hero__intro .eyebrow, .hero__lede, .hero__actions, .hero__trust, [data-hero-cue]");
  var photo = hero.querySelector('[data-stage="1"]');
  var photoPainted = false;

  function build() {
    if (tl) return tl;
    if (!docEl.classList.contains("is-loading")) { finish(); return null; } // the deadline won
    var split = splitLines(title);
    var lines = split.inners;
    var all = [].concat(frame, title, group);
    tl = gsap.timeline({
      paused: true,
      defaults: { ease: "expo.out" },
      onComplete: function () {
        split.restore();
        gsap.set(all, { clearProps: "transform,opacity,visibility" });
        frame[0] && frame[0].style.removeProperty("--veil");
        finish();
      }
    });
    // beat 1 — the photo: veil fades; the settle waits for one painted
    // frame of the photo so it stays the page's largest paint
    tl.fromTo(frame, { "--veil": 1 }, { "--veil": 0, duration: 1, ease: "power2.out" }, 0);
    if (photoPainted) tl.fromTo(frame, { scale: 1.06 }, { scale: 1, duration: 1.5 }, 0);
    // beat 2 — the headline (y: 0 alongside yPercent so no stray pixel
    // offset is ever parsed from the hold state)
    tl.set(title, { autoAlpha: 1 }, 0.08)
      .fromTo(lines, { yPercent: 130, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.08 }, 0.1)
    // beat 3 — everything else, as one group
      .fromTo(group, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.04 }, 0.42);
    return tl;
  }

  // the user scrolls → the entrance is over, immediately (curtain included)
  var onScroll = function () {
    if (window.scrollY <= 10) return;
    window.removeEventListener("scroll", onScroll);
    if (curtain && curtain.parentNode) curtain.parentNode.removeChild(curtain);
    if (tl) { if (tl.progress() < 1) tl.progress(1); }
    else finish();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  var after = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  var photoReady = photo && photo.decode ? photo.decode().catch(function () {}) : Promise.resolve();
  var painted = photoReady.then(function () {
    return new Promise(function (r) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { photoPainted = true; r(); }); });
    });
  });
  var assetsReady = Promise.all([fontsReady, painted]);

  function play() {
    clearTimeout(deadline);
    var t = build();
    if (t) t.play();
  }

  /* ---------------- the curtain ---------------------------- */
  if (!wantsCurtain) {
    // no curtain: a short beat for fonts and the photo's first paint
    // (line breaks depend on the fonts), then the hero plays
    Promise.race([assetsReady, after(700)]).then(play);
    return;
  }

  var t0 = performance.now();
  function lift() {
    if (done) return;
    try { window.sessionStorage.setItem("cf-intro", "1"); } catch (e) {}
    var mark = curtain.querySelector(".curtain__mark");
    curtain.classList.add("is-drawn");
    gsap.timeline()
      .to(mark, { yPercent: -40, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0)
      .to(curtain, {
        yPercent: -100, duration: 0.9, ease: "power3.inOut",
        onComplete: function () { if (curtain.parentNode) curtain.parentNode.removeChild(curtain); }
      }, 0)
      .add(play, 0.25);
  }

  Promise.race([assetsReady, after(1500)]).then(function () {
    // let the mark finish drawing (about 0.75s from first paint)
    return after(Math.max(0, 650 - (performance.now() - t0)));
  }).then(lift);
})();
