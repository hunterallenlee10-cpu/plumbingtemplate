/* ============================================================
   CLEARFLOW — ENTRANCE (load-in choreography)
   ------------------------------------------------------------
   Runs once the page has parsed. The <head> bootstrap already
   holds the hero and header (html.is-loading) and, on the first
   visit of a session, shows the brand-mark curtain (html.is-curtain,
   config: SITE.intro).

     curtain   the mark draws itself (CSS keyframes, from first paint);
               once the hero photo and fonts are in — never longer than
               ~2s — the curtain lifts on an expo in-out
     hero      the photo settles from a slight over-zoom, the headline
               rises line by line out of its masks (80ms apart), then
               eyebrow → lede → actions → trust, header items 50ms
               apart, the scroll cue last

   Skipped (everything shown immediately) under reduced motion,
   without GSAP, on deep links, or when the page opens scrolled.
   Any scroll during the sequence fast-forwards it: the user is
   never held back by a decoration.
   ============================================================ */
(function () {
  "use strict";

  var docEl = document.documentElement;
  var curtain = document.querySelector("[data-curtain]");
  var hero = document.querySelector("[data-hero]");
  var done = false;

  function finish() {
    if (done) return;
    done = true;
    docEl.classList.remove("is-loading", "is-curtain");
    if (curtain && curtain.parentNode) curtain.parentNode.removeChild(curtain);
    if (window.siteLenis) window.siteLenis.start();
  }

  var wantsLoad = docEl.classList.contains("is-loading");
  var wantsCurtain = wantsLoad && docEl.classList.contains("is-curtain") && !!curtain;

  if (!wantsLoad || !hero || !window.gsap || hero.classList.contains("hero--static") || window.scrollY > 40) {
    finish();
    return;
  }

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
  var eyebrow = q(".hero__intro .eyebrow");
  var rest = q(".hero__lede, .hero__actions, .hero__trust");
  var cue = q("[data-hero-cue]");
  var headerBits = Array.prototype.slice.call(document.querySelectorAll(".site-header__inner > *"));
  var tl = null;

  function build() {
    var split = splitLines(title);
    var lines = split.inners;
    var all = [].concat(frame, eyebrow, title, rest, cue, headerBits);
    tl = gsap.timeline({
      paused: true,
      defaults: { ease: "expo.out" },
      onComplete: function () {
        split.restore();
        gsap.set(all, { clearProps: "transform,opacity,visibility" });
        finish();
      }
    });
    // y: 0 alongside yPercent so no stray pixel offset is ever parsed in
    tl.fromTo(frame, { scale: 1.07, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6 }, 0)
      .fromTo(eyebrow, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.16)
      .set(title, { autoAlpha: 1 }, 0.2)
      .fromTo(lines, { yPercent: 112, y: 0 }, { yPercent: 0, y: 0, duration: 1.05, stagger: 0.08 }, 0.22)
      .fromTo(rest, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07 }, 0.52)
      .fromTo(headerBits, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.05 }, 0.44)
      .fromTo(cue, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.95);
    return tl;
  }

  // the user scrolls → the entrance is over, immediately
  var onScroll = function () {
    if (!tl) return;
    if (window.scrollY > 10 && tl.progress() < 1) tl.progress(1);
    if (tl.progress() === 1) window.removeEventListener("scroll", onScroll);
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  var fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  var after = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------------- the curtain ---------------------------- */
  if (!wantsCurtain) {
    // no curtain: one short beat for the fonts (line breaks depend on
    // them), then the hero plays
    Promise.race([fontsReady, after(700)]).then(function () { build().play(); });
    return;
  }

  if (window.siteLenis) window.siteLenis.stop();
  var t0 = performance.now();
  var photo = hero.querySelector('[data-stage="1"]');
  var photoReady = photo && photo.decode ? photo.decode().catch(function () {}) : Promise.resolve();

  function lift() {
    try { window.sessionStorage.setItem("cf-intro", "1"); } catch (e) {}
    if (window.siteLenis) window.siteLenis.start();
    var mark = curtain.querySelector(".curtain__mark");
    gsap.timeline()
      .to(mark, { yPercent: -60, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, 0)
      .to(curtain, {
        yPercent: -100, duration: 1.05, ease: "expo.inOut",
        onComplete: function () { if (curtain.parentNode) curtain.parentNode.removeChild(curtain); }
      }, 0.1)
      .add(function () { build().play(); }, 0.36);
  }

  Promise.race([Promise.all([fontsReady, photoReady]), after(2000)]).then(function () {
    // let the mark finish drawing (about a second from first paint)
    var wait = Math.max(0, 900 - (performance.now() - t0));
    return after(wait);
  }).then(lift);
})();
