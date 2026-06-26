// Mobile-only extras, shared by every *-mobile variant.
//
//  1. Below-hero content: a scrolling LOGO SOUP marquee followed by the
//     FEATURES section (the two components that follow the hero on
//     shopify.com/free-trial — logo soup, then the feature cards).
//  2. A STICKY black email CTA pinned to the bottom of the viewport. On the
//     persistent variants (v2 fan, v7 world) it is shown from the start while
//     the white intro card stays in the hero and scrolls up with the page; on
//     the marquee variant (v1) it slides in once the in-hero card scrolls out
//     of view. Mirrors shopify.com/free-trial's bottom-pinned CTA.
//
//  Each variant only needs `<div id="below-hero"></div>` and a
//  `<script src="mobile-extras.js"></script>` before </body>.

(function () {
  // Real brand logos already shipped with the prototype. The track holds two
  // identical sets so the -50% marquee loops seamlessly.
  var LOGOS = [
    ["assets/logos/allbirds.svg", "Allbirds"],
    ["assets/logos/leesa.svg", "Leesa"],
    ["assets/logos/monte.svg", "Monte Design"],
    ["assets/logos/clek.svg", "Clek"],
    ["assets/logos/sheertek.svg", "Sheertex"],
    ["assets/logos/untuckit.svg", "UNTUCKit"],
  ];
  function soupSet() {
    return (
      '<div class="m-soup__set">' +
      LOGOS.map(function (l) {
        return '<img src="' + l[0] + '" alt="' + l[1] + '" />';
      }).join("") +
      "</div>"
    );
  }

  var below = document.getElementById("below-hero");
  if (below) {
    below.innerHTML =
      // Logo soup — scrolling marquee
      '<section class="m-soup" aria-label="Brands built on Shopify">' +
      '<div class="m-soup__track">' +
      soupSet() +
      soupSet() +
      "</div>" +
      "</section>" +
      // Features — the component below the soup (reuses the shared .ftr2)
      '<section class="ftr2 m-ftr2" aria-label="Why sell with Shopify">' +
      '<div class="ftr2__row">' +
      '<figure class="ftr2__card">' +
      '<div class="ftr2__media">' +
      '<img src="assets/cards/themes-fan.jpg" alt="Customizable Shopify store themes shown in 3D perspective" />' +
      '<span class="ftr2__badge">Customizable themes</span>' +
      "</div>" +
      '<figcaption class="ftr2__text">' +
      '<h2 class="ftr2__title">Create a stunning store in seconds</h2>' +
      '<p class="ftr2__body">Pre-built designs make it fast and easy to kickstart your brand.</p>' +
      "</figcaption>" +
      "</figure>" +
      '<figure class="ftr2__card">' +
      '<div class="ftr2__media">' +
      '<img src="assets/cards/gmv-rewards.png" alt="A sales chart showing total sales and credits, with gold coins" />' +
      '<span class="ftr2__badge">Get rewarded</span>' +
      "</div>" +
      '<figcaption class="ftr2__text">' +
      '<h2 class="ftr2__title">Your plan can pay for itself</h2>' +
      '<p class="ftr2__body">Turn sales into savings with 1% back as subscription credits.</p>' +
      "</figcaption>" +
      "</figure>" +
      "</div>" +
      "</section>";
  }

  // Capture the in-hero (resting) CTA before we build the sticky bar.
  var rest = document.querySelector(".signup-card");

  // Persistent variants (v2 fan, v7 world) keep a white intro card in the hero
  // and pin a black CTA to the bottom of the viewport. The white card scrolls
  // up with the page; the black bar stays put — mirroring shopify.com/free-trial.
  // The marquee variant (v1) has no white intro, so it keeps the plain black
  // CTA that slides in once the in-hero card scrolls out of view.
  var introSrc =
    document.querySelector(".m7-intro") || document.querySelector(".m2-intro");

  // Disclaimer copy (wording varies slightly per variant); fall back to the
  // live page's wording if none is present.
  var discEl = document.querySelector(".signup-card__disclaimer");
  var discText = discEl
    ? discEl.textContent.trim()
    : "You agree to receive Shopify marketing emails.";

  var sticky = document.createElement("div");
  sticky.className = "m-sticky";

  function cardMarkup() {
    return rest
      ? '<form class="signup-card" action="#" method="post">' +
          rest.innerHTML +
          "</form>" +
          '<p class="m-sticky__disclaimer">' +
          discText +
          "</p>"
      : "";
  }

  // Fan (v2): the white intro + black CTA stay INSIDE the hero, directly below
  // the photo arc — no bottom-pinned bar. The in-hero .m2-stack already sits
  // there, so we leave it untouched and build no sticky unit (the hero sizes to
  // content via CSS, so the logo soup follows right under the CTA).
  var isFan = !!document.querySelector(".m2-intro");

  if (isFan && rest) {
    // Nothing to build — .m2-stack remains the visible, in-flow CTA.
  } else if (introSrc && rest) {
    // ---- Persistent (v7 world): white intro + black CTA as one pinned unit ----
    // The white intro card is rendered INSIDE the pinned bar, directly above
    // the black card (and the in-hero copy is hidden). This guarantees the
    // white box sits ABOVE the black box and is always fully visible — matching
    // the reference mock — with no fragile pixel/measurement guessing.
    sticky.classList.add("is-visible", "is-persistent");
    sticky.innerHTML = cardMarkup();

    // Stagger the pinned unit in on load, mirroring the in-hero stack on the
    // live page: the white intro rises + fades first, the black card follows a
    // beat later. The cloned intro below already carries `ft-in-white` from its
    // source (.m7-intro), so here we only tag the freshly-built black card.
    var persistentCard = sticky.querySelector(".signup-card");
    if (persistentCard) persistentCard.classList.add("ft-in-black");

    // Clone the white intro into the top of the bar; force it solid (the
    // source may be a frosted-glass card) via the .m-sticky__intro class.
    var introClone = introSrc.cloneNode(true);
    introClone.classList.add("m-sticky__intro");
    sticky.insertBefore(introClone, sticky.firstChild);

    document.body.appendChild(sticky);

    // Hide the in-hero message stack entirely — its content now lives in the
    // pinned bar, so the hero shows only the photos behind it.
    var heroStack = document.querySelector(".m7-stack");
    if (heroStack) heroStack.style.display = "none";
  } else {
    // ---- variant 1 (marquee): black CTA twin that slides in on scroll ----
    sticky.innerHTML = cardMarkup();
    document.body.appendChild(sticky);

    // Reveal the sticky CTA as the hero card scrolls away; hide it again when
    // the hero card is back on screen. The negative top rootMargin pulls the
    // trigger line ~220px down from the top edge, so the bar slides in while
    // the hero card is still partway out of view rather than fully gone.
    if (rest && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          sticky.classList.toggle("is-visible", !entries[0].isIntersecting);
        },
        { threshold: 0, rootMargin: "-220px 0px 0px 0px" },
      );
      io.observe(rest);
    } else if (rest) {
      // Fallback for environments without IntersectionObserver.
      window.addEventListener(
        "scroll",
        function () {
          sticky.classList.toggle("is-visible", window.scrollY > 320);
        },
        { passive: true },
      );
    }
  }
})();
