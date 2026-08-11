(function () {
  try {
    var html = document.documentElement;
    var vv = window.visualViewport;
    var w = Math.min(
      window.innerWidth || Infinity,
      html.clientWidth || Infinity,
      vv && vv.width ? vv.width : Infinity
    );
    var h = Math.min(
      window.innerHeight || Infinity,
      html.clientHeight || Infinity,
      vv && vv.height ? vv.height : Infinity
    );
    if (!(w > 0 && w < Infinity)) w = window.innerWidth || 0;
    if (!(h > 0 && h < Infinity)) h = window.innerHeight || 0;

    html.style.setProperty('--layout-vw', w + 'px');
    html.style.setProperty('--layout-vh', h + 'px');

    /* Safari bottom chrome — map paints under it; FABs sit above */
    if (vv && vv.height) {
      var layoutH = Math.max(window.innerHeight || 0, html.clientHeight || 0);
      var chromeTop = Math.max(0, vv.offsetTop || 0);
      var chromeBottom = Math.max(0, layoutH - chromeTop - vv.height);
      html.style.setProperty('--browser-chrome-top', Math.round(chromeTop) + 'px');
      html.style.setProperty('--browser-chrome-bottom', Math.round(chromeBottom) + 'px');
    }

    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var noHover = window.matchMedia('(hover: none)').matches;
    var touch = coarse && noHover;
    var minSide = Math.min(w, h);
    var maxSide = Math.max(w, h);
    var mobile =
      (minSide <= 480 && touch) ||
      (w <= 639 && touch) ||
      (touch && minSide <= 520 && maxSide <= 980);
    var ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (mobile) {
      html.classList.add('layout-mobile', 'layout-bootstrapped');
      html.classList.remove('layout-desktop', 'compact-laptop');
      html.dataset.mapChrome = 'comfortable';
      if (ios) html.classList.add('layout-ios');
      if (/Android/i.test(navigator.userAgent)) html.classList.add('layout-android');

      /* Match Redux default / persisted tab so map uses 100lvh on first paint */
      var tab = null;
      try {
        tab = localStorage.getItem('barslogistics_active_tab');
      } catch (e) {}
      if (!tab || tab === 'map') html.classList.add('app-tab-map');
    }

    var angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    angle = ((Math.round(angle) % 360) + 360) % 360;
    html.dataset.orientationAngle = String(angle);
    if (angle === 90 || angle === 270) {
      html.classList.add('layout-landscape');
      if (angle === 270) html.classList.add('layout-landscape-inverted');
    } else {
      html.classList.add('layout-portrait');
      if (angle === 180) html.classList.add('layout-portrait-inverted');
    }
  } catch (e) {}

  try {
    var t = localStorage.getItem('barslogistics_theme') || 'dark';
    if (t !== 'light' && t !== 'dark') t = 'dark';
    var html = document.documentElement;
    html.setAttribute('data-theme', t);
    html.classList.toggle('dark', t === 'dark');
    html.style.colorScheme = t;

    var color = t === 'light' ? '#ffffff' : '#0f172a';
    var statusBar = t === 'light' ? 'default' : 'black-translucent';
    var isAndroid = /Android/i.test(navigator.userAgent);

    function setMeta(name, content, media) {
      var sel = 'meta[name="' + name + '"]';
      if (media) sel += '[media="' + media + '"]';
      else sel += ':not([media])';
      var m = document.querySelector(sel);
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', name);
        if (media) m.setAttribute('media', media);
        document.head.appendChild(m);
      }
      m.setAttribute('content', content);
    }

    /* Chrome Android: recreate theme-color so the toolbar actually repaints */
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (n) {
      n.parentNode && n.parentNode.removeChild(n);
    });
    setMeta('theme-color', color);
    if (isAndroid) {
      setMeta('theme-color', color, '(prefers-color-scheme: light)');
      setMeta('theme-color', color, '(prefers-color-scheme: dark)');
    }
    setMeta('color-scheme', t);
    setMeta('apple-mobile-web-app-status-bar-style', statusBar);
  } catch (e) {}
})();
