/* ============================================================================
   Shared mosaic builder. Fills a .rotor (containing a .track) with a tilted,
   drifting wall of merchant tiles. Pure DOM, no network of its own; runs during
   parse. Reads --th/--gap from CSS. Tunables via Mosaic.build(rotor, opts):
     halfMul    width of one marquee half as a multiple of rotor width (def 1.3)
     eagerFirst # of above-the-fold tiles to load eager/high-priority (def 4)
     durBase    base row sweep seconds (def 80); landscapeRatio 0..1 (def .42)
     deckOnly   array of tile filenames to draw from (def all 30)
   ============================================================================ */
(function(){
  var ALL = [];
  for (var i = 1; i <= 30; i++) ALL.push('tile-' + String(i).padStart(2,'0') + '.webp');

  function build(rotor, opts){
    opts = opts || {};
    var track = rotor.querySelector('.track');
    if (!track){ track = document.createElement('div'); track.className = 'track'; rotor.appendChild(track); }
    var TILES = opts.deckOnly && opts.deckOnly.length ? opts.deckOnly.slice() : ALL.slice();
    var halfMul = opts.halfMul || 1.3;
    var eagerFirst = opts.eagerFirst != null ? opts.eagerFirst : 4;
    var durBase = opts.durBase || 80;
    var landscape = opts.landscapeRatio != null ? opts.landscapeRatio : 0.42;
    var assetBase = opts.assetBase || 'assets/';

    var seed = opts.seed || 11;
    function rnd(){ seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; }

    var deck = [], recent = [];
    function nextTile(){
      if (deck.length === 0){
        deck = TILES.slice();
        for (var j=deck.length-1;j>0;j--){ var k=Math.floor(rnd()*(j+1)); var t=deck[j];deck[j]=deck[k];deck[k]=t; }
      }
      var pick = deck.pop(), guard = 0;
      while (recent.indexOf(pick) !== -1 && deck.length && guard++ < 8){ deck.unshift(pick); pick = deck.pop(); }
      recent.push(pick); if (recent.length > 6) recent.shift();
      return pick;
    }

    var cs = getComputedStyle(rotor);
    var TH = parseFloat(cs.getPropertyValue('--th')) || 280;
    var GAP = parseFloat(cs.getPropertyValue('--gap')) || 16;
    var W1 = TH * 239/314, W2 = TH * 539/314;
    var halfTargetW = (rotor.clientWidth || 1200) * halfMul;

    var firstRow = true, rowIndex = 0;
    function makeRow(){
      var row = document.createElement('div');
      row.className = 'row' + (rowIndex % 2 ? ' rev' : '');
      var lane = document.createElement('div'); lane.className = 'lane';
      lane.style.setProperty('--dur', (durBase + (rowIndex % 3) * 13) + 's');
      lane.style.animationDelay = -(rowIndex * 9) + 's';

      var cells = [], w = 0;
      while (w < halfTargetW){
        var wide = rnd() < landscape;
        cells.push({ wide: wide, tile: nextTile() });
        w += (wide ? W2 : W1) + GAP;
      }
      for (var rep = 0; rep < 2; rep++){
        for (var i = 0; i < cells.length; i++){
          var cd = cells[i];
          var card = document.createElement('div');
          card.className = 'card ' + (cd.wide ? 'w2' : 'w1');
          var img = document.createElement('img');
          img.src = assetBase + cd.tile; img.alt = ''; img.decoding = 'async';
          if (firstRow && rep === 0 && i < eagerFirst){ img.loading='eager'; img.fetchPriority='high'; }
          else { img.loading='lazy'; }
          card.appendChild(img);
          lane.appendChild(card);
        }
      }
      firstRow = false; rowIndex++;
      row.appendChild(lane);
      return row;
    }

    var maxRows = opts.maxRows || 24;
    var target = (rotor.clientHeight || 800) + TH;
    var r = 0;
    do { track.appendChild(makeRow()); r++; } while (track.offsetHeight < target && r < maxRows);
  }

  // Vertical-columns builder. Fills `container` with N columns of stacked tiles, each
  // an independent vertical marquee (adjacent columns alternate direction). Opts:
  //   cols (def auto from width), colTargetW (def 200), eagerFirst (def 4),
  //   durBase (def 64), deckOnly, assetBase.
  function buildColumns(container, opts){
    opts = opts || {};
    var TILES = opts.deckOnly && opts.deckOnly.length ? opts.deckOnly.slice() : ALL.slice();
    var assetBase = opts.assetBase || 'assets/';
    var eagerFirst = opts.eagerFirst != null ? opts.eagerFirst : 4;
    var durBase = opts.durBase || 64;

    var seed = opts.seed || 17;
    function rnd(){ seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; }
    var deck = [], recent = [];
    function nextTile(){
      if (deck.length === 0){ deck = TILES.slice();
        for (var j=deck.length-1;j>0;j--){ var k=Math.floor(rnd()*(j+1)); var t=deck[j];deck[j]=deck[k];deck[k]=t; } }
      var pick = deck.pop(), guard = 0;
      while (recent.indexOf(pick) !== -1 && deck.length && guard++ < 8){ deck.unshift(pick); pick = deck.pop(); }
      recent.push(pick); if (recent.length > 6) recent.shift();
      return pick;
    }

    var cs = getComputedStyle(container);
    var GAP = parseFloat(cs.getPropertyValue('--gap')) || 14;
    var W = container.clientWidth || 800, H = container.clientHeight || 800;
    var colTargetW = opts.colTargetW || 200;
    var nCols = opts.cols || Math.max(2, Math.round(W / colTargetW));
    var colW = (W - GAP*(nCols-1)) / nCols;
    var aspects = [0.78, 1.0, 1.0, 1.33];   // portrait / square / landscape mix for varied heights

    var wrap = document.createElement('div'); wrap.className = 'cols';
    var made = 0;
    for (var c = 0; c < nCols; c++){
      var col = document.createElement('div'); col.className = 'vcol' + (c % 2 ? ' rev' : '');
      var stack = document.createElement('div'); stack.className = 'vstack';
      stack.style.setProperty('--dur', (durBase + (c % 3) * 12) + 's');
      stack.style.animationDelay = -(c * 7) + 's';

      // build ONE half tall enough to cover the column, then render it twice (seamless -50%).
      var cells = [], h = 0;
      while (h < H * 1.15){
        var ar = aspects[Math.floor(rnd()*aspects.length)];
        cells.push({ tile: nextTile(), ar: ar });
        h += (colW / ar) + GAP;
      }
      for (var rep = 0; rep < 2; rep++){
        for (var i = 0; i < cells.length; i++){
          var cd = cells[i];
          var card = document.createElement('div'); card.className = 'vcard';
          card.style.height = (colW / cd.ar) + 'px';
          var img = document.createElement('img');
          img.src = assetBase + cd.tile; img.alt=''; img.decoding='async';
          if (rep === 0 && made < eagerFirst){ img.loading='eager'; img.fetchPriority='high'; }
          else { img.loading='lazy'; }
          made++;
          card.appendChild(img); stack.appendChild(card);
        }
      }
      col.appendChild(stack); wrap.appendChild(col);
    }
    container.appendChild(wrap);
  }

  // Fixed, addressable grid. Unlike build()'s random deck, this places the SAME cells
  // in the SAME order every load so each can be referenced by a corner badge and swapped
  // by editing the manifest. Reuses the tilt (.rotor) + per-row drift (scrollL/scrollR).
  //   rows : array of rows; each row an array of [code, aspectRatio] pairs (w/h), where
  //          code is the full versioned id, e.g. 'A-1' → loads 'A-1.webp', badge "A-1".
  //          To swap an image, bump the version ('A-1' → 'A-2') and drop in 'A-2.webp'.
  //   opts : { heroCodes ([] — codes that ARE the LCP candidate: loaded eager+high,
  //            preloaded in the HTML; every other tile is lazy+low so it never races the hero),
  //            durBase (def 150), assetBase (def 'assets/') }
  //   Each tile ships a density srcset: '<code>.webp 1x, <code>@2x.webp 2x' — standard displays
  //   pull the right-sized 1x crop, retina pulls the native @2x. Lossless to the eye, ~half bytes.
  function buildFixed(rotor, rows, opts){
    opts = opts || {};
    var track = rotor.querySelector('.track');
    if (!track){ track = document.createElement('div'); track.className = 'track'; rotor.appendChild(track); }
    var heroSet = {}; (opts.heroCodes || []).forEach(function(c){ heroSet[c] = true; });
    var durBase = opts.durBase || 150;
    var assetBase = opts.assetBase || 'assets/';
    var cs = getComputedStyle(rotor);
    var TH = parseFloat(cs.getPropertyValue('--th')) || 280;
    var GAP = parseFloat(cs.getPropertyValue('--gap')) || 16;
    // The .rotor is oversized and tilted +18°, so its layout box is larger than the visible
    // frame. One marquee half must span the rotor's full WIDTH and the stacked rows must span
    // its full HEIGHT — otherwise the tilt swings blank corners/bands into view at the edges.
    var rotorW = rotor.clientWidth || 1400;
    var rotorH = rotor.clientHeight || 1000;

    var made = 0;
    function addRow(cells, r){
      var row = document.createElement('div');
      row.className = 'row' + (r % 2 ? ' rev' : '');
      var lane = document.createElement('div'); lane.className = 'lane';
      lane.style.setProperty('--dur', (durBase + (r % 3) * 13) + 's');
      lane.style.animationDelay = -(r * 9) + 's';

      // Width of one pass of this row's cells; repeat the sequence enough times that a single
      // marquee half (rendered twice below) overflows the rotor, so -50% never reveals a gap.
      var natural = 0;
      for (var n = 0; n < cells.length; n++) natural += TH * cells[n][1] + GAP;
      var reps = Math.max(1, Math.ceil((rotorW * 1.3) / natural));

      // Render the half TWICE for a seamless -50% loop. The badge rides along on every copy
      // (same label), so a drifting cell is always identifiable wherever it surfaces.
      for (var rep = 0; rep < 2; rep++){
        for (var k = 0; k < reps; k++){
          for (var i = 0; i < cells.length; i++){
            var code = cells[i][0], ar = cells[i][1];
            var card = document.createElement('div'); card.className = 'card';
            card.style.aspectRatio = ar + ' / 1';
            card.style.height = TH + 'px';
            var img = document.createElement('img');
            img.src = assetBase + code + '.webp';
            img.srcset = assetBase + code + '.webp 1x, ' + assetBase + code + '@2x.webp 2x';
            img.alt = ''; img.decoding = 'async';
            // Only the genuine LCP tile(s) load at high priority; every other tile is low
            // priority so nothing competes with the hero for the first bytes off the wire.
            // NB: not loading="lazy" — the +18° tilt rotates edge cards into view that the
            // lazy IntersectionObserver scores as off-screen, leaving them permanently blank.
            // The set is small/bounded, so eager+low loads them all without racing the hero.
            if (heroSet[code] && rep === 0 && k === 0){ img.fetchPriority='high'; }
            else { img.fetchPriority='low'; }
            img.loading = 'eager';
            card.appendChild(img);
            lane.appendChild(card);
            if (rep === 0 && k === 0) made++;
          }
        }
      }
      row.appendChild(lane);
      track.appendChild(row);
    }

    // Lay the rows top to bottom, cycling back through the set if needed, until they cover the
    // rotor height plus a row of over-scan for the tilt. Repeated rows re-use the same codes
    // (and badges) — same image, same label — but pick up a different drift phase via the index.
    var idx = 0, covered = 0, guard = rows.length * 8;
    while (covered < rotorH + TH && idx < guard){
      addRow(rows[idx % rows.length], idx);
      covered += TH + GAP;
      idx++;
    }
  }

  // Deferred LCP readout, identical behaviour to the original build (toggle "p").
  function perfPanel(){
    var el = document.getElementById('perf'); if (!el) return;
    try{
      new PerformanceObserver(function(list){
        var es = list.getEntries(); var last = es[es.length-1];
        var t = (last.renderTime || last.loadTime || last.startTime);
        el.textContent = 'LCP: ' + Math.round(t) + ' ms\nel: ' +
          (last.element ? last.element.tagName.toLowerCase()+(last.element.className?'.'+String(last.element.className).split(' ')[0]:'') : '?');
      }).observe({type:'largest-contentful-paint', buffered:true});
    }catch(e){ el.textContent='LCP: n/a'; }
    addEventListener('keydown', function(e){ if(e.key==='p') el.style.display = (el.style.display==='none'?'block':'none'); });
  }

  window.Mosaic = { build: build, buildColumns: buildColumns, buildFixed: buildFixed, perfPanel: perfPanel, ALL: ALL };
})();
