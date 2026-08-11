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
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  } catch (e) {}
})();
