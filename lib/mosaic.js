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

  window.Mosaic = { build: build, perfPanel: perfPanel, ALL: ALL };
})();
