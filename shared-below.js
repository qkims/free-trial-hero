// Shared "everything below the hero" — brand logo row + feature cards.
// Authored once here and injected into every variant (and the control) so the
// only thing that differs between variants is the hero above it.
//
// Each page that uses this just needs: <div id="below-hero"></div>
// and <script src="shared-below.js"></script>.

document.getElementById("below-hero").innerHTML = `
  <!-- Brand logo row -->
  <section class="logos" aria-label="Brands built on Shopify">
    <ul class="logos__list">
      <li><img src="assets/logos/allbirds.svg" alt="Allbirds" /></li>
      <li><img src="assets/logos/clek.svg" alt="Clek" /></li>
      <li><img src="assets/logos/sheertek.svg" alt="Sheertex" /></li>
      <li><img src="assets/logos/monte.svg" alt="Monte Design" /></li>
      <li><img src="assets/logos/leesa.svg" alt="Leesa" /></li>
      <li><img src="assets/logos/untuckit.svg" alt="UNTUCKit" /></li>
    </ul>
  </section>

  <!-- Feature cards (2-up) — Figma node 123:4009 -->
  <section class="ftr2" aria-label="Why sell with Shopify">
    <div class="ftr2__row">
      <figure class="ftr2__card">
        <div class="ftr2__media">
          <img src="assets/cards/themes-fan.jpg" alt="Customizable Shopify store themes shown in 3D perspective" />
          <span class="ftr2__badge">Customizable themes</span>
        </div>
        <figcaption class="ftr2__text">
          <h2 class="ftr2__title">Create a stunning store in seconds</h2>
          <p class="ftr2__body">Pre-built designs make it fast and easy to kickstart your brand.</p>
        </figcaption>
      </figure>

      <figure class="ftr2__card">
        <div class="ftr2__media">
          <img src="assets/cards/gmv-rewards.png" alt="A sales chart showing $1,000,000 in total sales and +$10,000 in credits, with gold coins" />
          <span class="ftr2__badge">Get rewarded</span>
        </div>
        <figcaption class="ftr2__text">
          <h2 class="ftr2__title">Your plan can pay for itself</h2>
          <p class="ftr2__body">Turn sales into savings with 1% back as subscription credits.</p>
        </figcaption>
      </figure>
    </div>
  </section>
`;
