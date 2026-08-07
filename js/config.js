/* ============================================================
   CLEARFLOW — SITE CONFIGURATION
   ------------------------------------------------------------
   This is the single place to customize the template for a new
   plumbing company. Everything here is injected into elements
   marked with [data-bind] attributes at runtime, and the same
   values are mirrored in index.html for SEO — search for
   "EDIT:" comments there when rebranding.

   Brand colors live in css/main.css under ":root" — see the
   "DESIGN TOKENS" block at the top of that file.
   ============================================================ */

window.SITE = {
  /* ---- Identity ------------------------------------------ */
  companyName: "ClearFlow Plumbing",
  companyShort: "ClearFlow",
  tagline: "Dependable plumbing. Done right the first time.",

  /* ---- Contact ------------------------------------------- */
  phone: "(555) 555-0123",
  phoneHref: "+15555550123",          // tel: link format
  email: "service@clearflowplumbing.com",
  address: "41780 Commerce Lane, Leonardtown, MD 20650",

  /* ---- Service area -------------------------------------- */
  region: "St. Mary's County, Maryland",
  regionShort: "St. Mary's County",
  serviceAreas: [
    "Leonardtown", "California", "Lexington Park", "Hollywood",
    "Mechanicsville", "Great Mills", "Charlotte Hall", "Lusby"
  ],

  /* ---- Credentials ---------------------------------------- */
  license: "MD Master Plumber Lic. #12345",
  hours: {
    weekdays: "Mon – Fri · 7:00a – 6:00p",
    saturday: "Sat · 8:00a – 2:00p",
    emergency: "Emergency service · 24 / 7"
  },

  /* ---- Statistics (trust band) ---------------------------- */
  stats: [
    { value: 20,   suffix: "+",  label: "Years experience" },
    { value: 4.9,  suffix: " ★", label: "Customer rating", decimals: 1 },
    { value: 2500, suffix: "+",  label: "Homes served" },
    { value: 24,   suffix: "/7", label: "Emergency service" }
  ],

  /* ---- Form ------------------------------------------------
     Point this at your form handler (Formspree, Netlify Forms,
     Basin, your own endpoint...). Leave empty to demo the
     success state without sending anywhere. */
  formEndpoint: "",

  /* ---- Social (leave href empty to hide a link) ----------- */
  social: [
    { label: "Google",    href: "#" },
    { label: "Facebook",  href: "#" },
    { label: "Instagram", href: "#" },
    { label: "Nextdoor",  href: "#" }
  ]
};
