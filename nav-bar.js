// Family Hub - zajednicka navigacija za prelazak izmedju aplikacija.
// Ubaci <script src="nav-bar.js?v=20260821"></script> pred kraj <body> u svaku app stranicu.
// Na telefonu (uzi ekran): traka na dnu. Na kompjuteru (siri ekran, >=768px): bocna traka sa lijeve strane.
// Boje se automatski prilagodjavaju pozadini stranice (tamna ili svijetla tema).
// Kad se doda nova aplikacija: izmijeni APPS niz ispod (jedno mjesto za sve stranice).
// NAV_VER: podigni ovaj broj/datum pri svakom deployu. Dodaje se kao ?v= na linkove
// izmedju stranica, sto tjera browser da uvijek povuce svjezu verziju umjesto stare
// keširane (npr. Opera je znala da posluzi zastarjelu stranicu bez ovoga).
(function () {
  var NAV_VER = "20260821";
  var ICONS = {
    droplets:
      '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>' +
      '<path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
    cart:
      '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>' +
      '<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    calendar:
      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>' +
      '<line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' +
      '<line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>' +
      '<line x1="8" y1="18" x2="8" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/>',
    chefHat:
      '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.042V20a1 1 0 0 0 1 1Z"/>' +
      '<path d="M6 17h12"/>',
    logOut:
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
      '<polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    cloudBackup:
      '<path d="M12 13v8"/><path d="M8 17l4 4 4-4"/>' +
      '<path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>'
  };
  function svgIcon(pathData) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" width="20" height="20">' + pathData + '</svg>';
  }
  var APPS = [
    { label: "Kupovina", icon: svgIcon(ICONS.cart),     file: "shopping-list.html",  enabled: true },
    { label: "Recepti",  icon: svgIcon(ICONS.chefHat),  file: "recepti.html",        enabled: true },
    { label: "Raspored", icon: svgIcon(ICONS.calendar), file: "raspored.html",       enabled: true },
    { label: "Voda",     icon: svgIcon(ICONS.droplets), file: "potrosnja-vode.html", enabled: true }
  ];
  // Backup je odvojen od glavnih tabova (nije "peti ravnopravan tab") - na telefonu živi
  // gore pored dugmeta za odjavu, na računaru u bočnoj traci odmah iznad Odjave. Ionako je
  // to sporedna/administrativna radnja, a ne nešto što se koristi svakodnevno kao ostale.
  var BACKUP_APP = { label: "Backup", icon: svgIcon(ICONS.cloudBackup), file: "backup.html", enabled: true };

  var currentFile = (location.pathname.split("/").pop() || "index.html");

  // --- Prepoznavanje tamne/svijetle teme na osnovu stvarne pozadine stranice ---
  function luminance(rgbStr) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgbStr || "");
    if (!m) return 255;
    var r = +m[1], g = +m[2], b = +m[3];
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  function isTransparent(rgbStr) {
    return !rgbStr || rgbStr === "transparent" || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(rgbStr);
  }
  var bodyBg = getComputedStyle(document.body).backgroundColor;
  if (isTransparent(bodyBg)) bodyBg = getComputedStyle(document.documentElement).backgroundColor;
  var isDark = luminance(bodyBg) < 128;

  var theme = isDark
    ? { bg: "#1c1c1c", border: "#333333", text: "#9a9a96", active: "#2383e2",
        activeBg: "#232323", shadow: "rgba(0,0,0,0.35)", soonBg: "#3a3a3a", soonText: "#cfcfcf",
        headerText: "#e8e8e6" }
    : { bg: "#FAF8F4", border: "#E6E1D8", text: "#8A8578", active: "#007991",
        activeBg: "#DEE9E3", shadow: "rgba(15,34,43,0.10)", soonBg: "#D6D1C6", soonText: "#ffffff",
        headerText: "#0F222B" };

  function tabsHtml(mode, list) {
    // mode: "bottom" (icon over label, stacked) or "side" (icon beside label, row)
    list = list || APPS;
    return list.map(function (app) {
      var active = app.enabled && app.file === currentFile;
      var cls = "fh-tab fh-tab-" + mode + (active ? " active" : "") + (app.enabled ? "" : " disabled");
      var href = app.enabled ? (app.file + "?v=" + NAV_VER) : "javascript:void(0)";
      var extraAttrs = app.enabled ? "" : ' aria-disabled="true" tabindex="-1"';
      return (
        '<a class="' + cls + '" href="' + href + '"' + extraAttrs + '>' +
          '<span class="fh-icon">' + app.icon + '</span>' +
          '<span class="fh-label">' + app.label + '</span>' +
          (app.enabled ? "" : '<span class="fh-soon">uskoro</span>') +
        '</a>'
      );
    }).join("");
  }

  // Zapamcena uloga iz proslog logina (localStorage) - da odmah iscrtamo pravu
  // verziju trake, bez treptaja svih tabova dok se uloga tek ucita iz baze.
  var cachedRole = null;
  try { cachedRole = localStorage.getItem("fhRole"); } catch (e) {}
  // Kad uloga JOS NIJE poznata (prvi login na novom uredjaju, ili je obrisan keš browsera),
  // traka se ranije iscrtavala PUNA - pa je dijete na trenutak vidjelo sve tabove i dugme
  // Backup, sve dok stranica ne procita ulogu iz baze. Od sad se u tom slucaju crta
  // najmanja (najbezbjednija) verzija - samo Raspored - a fhApplyRole je odmah dopuni
  // cim se uloga sazna. Sirenje trake ne otkriva nista, suzavanje bi bilo prekasno.
  var ulogaPoznata = (cachedRole === "parent" || cachedRole === "child");
  var pocetnaUloga = ulogaPoznata ? cachedRole : "child";
  function appsForRole(role) {
    return role === "child"
      ? APPS.filter(function (app) { return app.file === "raspored.html"; })
      : APPS;
  }
  // Backup nije dostupan djeci (isto pravilo kao za ostale roditeljske tabove).
  function showBackupForRole(role) { return role !== "child"; }
  var backupDisplay0 = showBackupForRole(pocetnaUloga) ? "" : "display:none;";

  var topBar = document.createElement("div");
  topBar.id = "fhNavTop";
  topBar.innerHTML =
    // Naslov je ujedno i povratak na početnu stranu. Do sada iz zajedničke trake nije
    // postojao nijedan način da se vrati na početnu - jedino preko dugmeta "nazad" u
    // browseru ili odjavom.
    '<a class="fh-top-title" href="index.html?v=' + NAV_VER + '" aria-label="Početna strana">Family Hub</a>' +
    '<div class="fh-top-actions">' +
      '<a class="fh-top-backup' + (BACKUP_APP.file === currentFile ? ' active' : '') + '" id="fhTopBackupLink" href="' + BACKUP_APP.file + '?v=' + NAV_VER + '" aria-label="Backup" style="' + backupDisplay0 + '">' + BACKUP_APP.icon + '</a>' +
      '<button class="fh-top-logout" id="fhLogoutBtnTop" aria-label="Odjava">' + svgIcon(ICONS.logOut) + '</button>' +
    '</div>';

  var bottomBar = document.createElement("div");
  bottomBar.id = "fhNavBottom";
  bottomBar.innerHTML = tabsHtml("bottom", appsForRole(pocetnaUloga));

  var sideBar = document.createElement("div");
  sideBar.id = "fhNavSide";
  sideBar.innerHTML =
    '<a class="fh-side-header" href="index.html?v=' + NAV_VER + '" aria-label="Početna strana"><img class="fh-side-logo" src="icons/sidebar-logo.png" alt="Family Hub" /><span class="fh-side-title">Family Hub</span></a>' +
    '<div class="fh-side-tabs">' + tabsHtml("side", appsForRole(pocetnaUloga)) + '</div>' +
    '<div class="fh-side-secondary" id="fhSideSecondary" style="' + backupDisplay0 + '">' + tabsHtml("side", [BACKUP_APP]) + '</div>' +
    '<button class="fh-logout-btn" id="fhLogoutBtn">' +
      '<span class="fh-icon">' + svgIcon(ICONS.logOut) + '</span>' +
      '<span class="fh-label">Odjava</span>' +
    '</button>';

  var style = document.createElement("style");
  style.textContent =
    /* Forsira svijetlu temu za nativne form kontrole (select liste, date picker) na SVIM
       stranicama - sprječava da telefoni sa tamnim režimom prikažu crnu/nevidljivu padajuću
       listu ili datumsko polje preko inače svijetlog dizajna aplikacije. */
    ':root{color-scheme:light;}' +
    /* shared tab look */
    '.fh-tab{display:flex;text-decoration:none;color:' + theme.text + ';border-radius:10px;position:relative;}' +
    '.fh-tab.active{color:' + theme.active + ';background:' + theme.activeBg + ';}' +
    '.fh-tab.disabled{color:' + theme.border + ';cursor:default;}' +
    '.fh-icon{display:inline-flex;align-items:center;justify-content:center;line-height:1;}' +
    '.fh-icon svg{display:block;}' +
    '.fh-label{font-weight:600;}' +

    /* top bar (mobile default) - naslov + odjava */
    '#fhNavTop{position:fixed;left:0;right:0;top:0;z-index:9999;display:flex;align-items:center;justify-content:space-between;' +
    'background:' + theme.bg + ';border-bottom:1px solid ' + theme.border + ';' +
    'padding:calc(14px + env(safe-area-inset-top)) 16px 14px;' +
    'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
    '.fh-top-title{font-size:16px;font-weight:700;color:' + theme.headerText + ';text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}' +
    '.fh-top-actions{display:flex;align-items:center;gap:4px;}' +
    '.fh-top-logout, .fh-top-backup{background:none;border:none;color:' + theme.text + ';cursor:pointer;padding:6px;' +
      'border-radius:8px;display:flex;align-items:center;justify-content:center;text-decoration:none;}' +
    '.fh-top-backup.active{color:' + theme.active + ';background:' + theme.activeBg + ';}' +

    /* bottom bar (mobile default) */
    '#fhNavBottom{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;' +
    'background:' + theme.bg + ';border-top:1px solid ' + theme.border + ';' +
    'padding:6px 4px calc(6px + env(safe-area-inset-bottom));' +
    'box-shadow:0 -2px 10px ' + theme.shadow + ';' +
    'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
    '.fh-tab-bottom{flex:1;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;}' +
    '.fh-tab-bottom .fh-label{font-size:11px;}' +
    '.fh-tab-bottom .fh-soon{position:absolute;top:0;right:6px;font-size:8px;font-weight:700;' +
    'background:' + theme.soonBg + ';color:' + theme.soonText + ';padding:1px 4px;border-radius:6px;}' +
    'body{padding-top:52px !important;padding-bottom:64px !important;}' +

    /* side bar (desktop) - hidden by default, shown at >=768px */
    '#fhNavSide{display:none;}' +
    '@media (min-width:768px){' +
      'body{padding-top:0 !important;padding-bottom:0 !important;padding-left:220px !important;}' +
      '#fhNavTop{display:none !important;}' +
      '#fhNavBottom{display:none !important;}' +
      '#fhNavSide{display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;width:220px;' +
        'z-index:9999;background:' + theme.bg + ';border-right:1px solid ' + theme.border + ';' +
        'padding:20px 14px;box-sizing:border-box;' +
        'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
      '.fh-side-header{display:flex;align-items:center;gap:10px;margin-bottom:26px;padding:0 6px;text-decoration:none;cursor:pointer;}' +
      '.fh-side-logo{width:48px;height:48px;display:block;border-radius:12px;}' +
      '.fh-side-title{font-size:16px;font-weight:700;color:' + theme.headerText + ';}' +
      '.fh-side-tabs{display:flex;flex-direction:column;gap:4px;}' +
      '.fh-tab-side{flex-direction:row;align-items:center;gap:10px;padding:10px 12px;}' +
      '.fh-tab-side .fh-label{font-size:14px;}' +
      '.fh-tab-side .fh-soon{margin-left:auto;font-size:9px;font-weight:700;' +
        'background:' + theme.soonBg + ';color:' + theme.soonText + ';padding:2px 6px;border-radius:6px;}' +
      '.fh-side-secondary{margin-top:auto;display:flex;flex-direction:column;gap:4px;' +
        'padding-top:12px;margin-bottom:4px;border-top:1px solid ' + theme.border + ';}' +
      '.fh-logout-btn{display:flex;align-items:center;gap:10px;padding:10px 12px;' +
        'border:none;background:transparent;color:' + theme.text + ';border-radius:10px;cursor:pointer;' +
        'font-family:inherit;font-size:14px;text-align:left;}' +
      '.fh-logout-btn:hover{background:' + theme.activeBg + ';}' +
      '.fh-logout-btn .fh-label{font-weight:600;}' +
    '}';

  document.head.appendChild(style);
  document.body.appendChild(topBar);
  document.body.appendChild(bottomBar);
  document.body.appendChild(sideBar);

  // --- Tacno mjerenje visine gornje/donje trake, umjesto nagadjanja u px. ---
  // Sprjecava da traka (koja moze biti visa na telefonima sa "notch"-om ili
  // zbog fonta) prekrije sadrzaj stranice ispod nje (npr. logo vodovoda).
  var mobileQuery = window.matchMedia("(min-width:768px)");
  function syncBodyOffsets() {
    if (mobileQuery.matches) {
      document.body.style.setProperty("padding-top", "0px", "important");
      document.body.style.setProperty("padding-bottom", "0px", "important");
    } else {
      document.body.style.setProperty("padding-top", topBar.offsetHeight + "px", "important");
      document.body.style.setProperty("padding-bottom", bottomBar.offsetHeight + "px", "important");
    }
  }
  syncBodyOffsets();
  window.addEventListener("resize", syncBodyOffsets);
  window.addEventListener("orientationchange", syncBodyOffsets);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncBodyOffsets); // fontovi se ucitaju kasnije i mogu blago promijeniti visinu
  }

  function doLogout() {
    try { localStorage.removeItem("fhRole"); } catch (e) {}
    if (typeof window.fhLogout === "function") {
      window.fhLogout();
    }
  }
  ["fhLogoutBtn", "fhLogoutBtnTop"].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", doLogout);
  });

  // --- Ogranicen prikaz za djecu: samo "Raspored" tab, ostalo sakriveno. ---
  // Stranice pozivaju ovo posto saznaju ulogu ulogovanog korisnika (users/{uid} u bazi).
  // Sve dok se ne pozove, prikazuju se svi tabovi (podrazumijevano ponasanje za roditelje).
  var ulogaPrimljena = false;

  function primijeniUlogu(role) {
    var visibleApps = appsForRole(role);
    bottomBar.innerHTML = tabsHtml("bottom", visibleApps);
    var tabsEl = sideBar.querySelector(".fh-side-tabs");
    if (tabsEl) tabsEl.innerHTML = tabsHtml("side", visibleApps);

    var showBackup = showBackupForRole(role);
    var topBackupEl = document.getElementById("fhTopBackupLink");
    if (topBackupEl) topBackupEl.style.display = showBackup ? "" : "none";
    var sideSecondaryEl = document.getElementById("fhSideSecondary");
    if (sideSecondaryEl) sideSecondaryEl.style.display = showBackup ? "" : "none";
  }

  window.fhApplyRole = function (role) {
    ulogaPrimljena = true;
    try { localStorage.setItem("fhRole", role); } catch (e) {}
    primijeniUlogu(role);
  };

  // Sigurnosna mreza: ako stranica iz nekog razloga nikad ne javi ulogu (npr. upit u bazu
  // padne zbog nestanka interneta), poslije 6 sekundi vracamo punu traku - da roditelj ne
  // ostane zaglavljen na jednom tabu. Namjerno NE pamtimo tu ulogu u browseru, jer je to
  // samo pretpostavka, a ne procitan podatak iz baze.
  if (!ulogaPoznata) {
    setTimeout(function () {
      if (!ulogaPrimljena) primijeniUlogu("parent");
    }, 6000);
  }
})();

// ==== FH_UI: zajednicki "select" i "date" popup widgeti u stilu aplikacije ====
// Zasto postoji: na Android telefonima nativni <select> otvara OS-ov (cesto taman) popup preko
// inace svijetle aplikacije, a prazan <input type="date"> na telefonu ne prikazuje ni kalendar
// ikonicu ni "dd.mm.gggg." tekst kao na PC-u, pa polje izgleda prazno i nejasno da je tu datum.
// "color-scheme: light" (vidi gore) to samo djelimicno popravlja - zavisi od verzije Android
// Chrome-a. Zato FH_UI pravi SOPSTVENI izgled (dugme + popup kartica u bojama aplikacije), dok
// "ispod" i dalje drzi pravi native <select>/<input type="date"> (sakriven), tako da sav postojeci
// kod koji cita element.value i slusa "change" dogadjaj radi bez ikakvih izmjena. Stranice samo
// pozovu FH_UI.enhanceSelect(selectEl) / FH_UI.enhanceDate(inputEl) posto naprave element (jednom),
// i FH_UI.refreshSelect(selectEl) / FH_UI.refreshDate(inputEl) ako kasnije negdje direktno postave
// .value bez native "change" dogadjaja (npr. da sinhronizuju prikaz sa vec izabranom vrijednoscu).
(function () {
  var MONTH_NAMES = ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"];
  var DOW_NAMES = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

  function chevronIcon() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  }
  function navIcon(dir) {
    var pts = dir < 0 ? "15 18 9 12 15 6" : "9 18 15 12 9 6";
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="' + pts + '"/></svg>';
  }
  function calIcon() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  }
  function clockSmallIcon() {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';
  }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  var style = document.createElement("style");
  style.textContent =
    /* Rezervni ("fallback") izgled polja - ako stranica ne definise sopstveni border/pozadinu za
       ovaj widget (kao sto se desilo sa "napomena važi do" poljem), makar izgleda kao ostala
       polja umjesto da bude bez okvira. Stranicin CSS (npr. .day-select, .period-select) i dalje
       ima prednost jer je konkretniji (dvije klase) i automatski nadjačava ovo. */
    '.fh-csel,.fh-cdate,.fh-ctime{position:relative;display:inline-flex;box-sizing:border-box;' +
      'border:1px solid #E6E1D8;border-radius:9px;padding:8px 10px;background:#FAF8F4;' +
      'font-size:14px;color:#0F222B;}' +
    '.fh-csel-native,.fh-cdate-native,.fh-ctime-native{display:none !important;}' +
    /* Selektori dole namjerno ponavljaju roditeljsku klasu (npr. ".fh-csel .fh-csel-btn" umjesto
       samo ".fh-csel-btn") da bi specificnost bila dovoljno visoka - stranice cesto imaju opsta
       pravila tipa ".add-row button {...}" (boja/pozadina za SVE dugmice u toj sekciji) koja bi
       inace "pregazila" izgled ovih widget-dugmica jer je "klasa+tag" specificnije od "sama klasa". */
    '.fh-csel .fh-csel-btn,.fh-cdate .fh-cdate-btn{all:unset;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;cursor:pointer;box-sizing:border-box;}' +
    '.fh-csel .fh-csel-btn svg,.fh-cdate .fh-cdate-btn svg{flex:0 0 auto;opacity:.55;}' +
    '.fh-csel .fh-csel-btn .fh-csel-label,.fh-cdate .fh-cdate-btn .fh-cdate-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.fh-cdate-label.placeholder{color:#A8A296;font-weight:500;}' +

    '.fh-csel-popup{position:absolute;top:calc(100% + 6px);left:0;min-width:100%;width:max-content;max-width:240px;' +
      'max-height:280px;overflow-y:auto;background:#fff;border:1px solid #E6E1D8;border-radius:12px;' +
      'box-shadow:0 10px 30px -8px rgba(15,34,43,0.28);padding:6px;z-index:400;display:none;' +
      'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
    '.fh-csel-popup.open{display:block;}' +
    '.fh-csel-opt{padding:9px 12px;border-radius:8px;font-size:14px;font-weight:600;color:#0F222B;cursor:pointer;white-space:nowrap;}' +
    '.fh-csel-opt:hover{background:#F0EDE5;}' +
    '.fh-csel-opt.sel{background:#DEE9E3;color:#007991;}' +

    '.fh-cdate-popup{position:absolute;top:calc(100% + 6px);left:0;width:264px;max-width:88vw;background:#fff;' +
      'border:1px solid #E6E1D8;border-radius:14px;box-shadow:0 10px 30px -8px rgba(15,34,43,0.28);padding:10px;' +
      'z-index:400;display:none;font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;' +
      'max-height:calc(100vh - 24px);overflow-y:auto;box-sizing:border-box;}' +
    '.fh-cdate-popup.open{display:block;}' +
    '.fh-cdate-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}' +
    '.fh-cdate-cal-title{font-weight:700;font-size:13.5px;color:#0F222B;}' +
    '.fh-cdate-popup .fh-cdate-cal-nav{background:none;border:none;cursor:pointer;color:#657278;padding:4px;display:flex;' +
      'align-items:center;justify-content:center;border-radius:6px;}' +
    '.fh-cdate-popup .fh-cdate-cal-nav:hover{background:#F0EDE5;}' +
    '.fh-cdate-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}' +
    '.fh-cdate-dow{font-size:10.5px;font-weight:700;color:#8A8578;text-align:center;padding:4px 0;}' +
    '.fh-cdate-day{font-size:13px;font-weight:600;color:#0F222B;text-align:center;padding:7px 0;border-radius:8px;cursor:pointer;}' +
    '.fh-cdate-day:hover{background:#F0EDE5;}' +
    '.fh-cdate-day.today{box-shadow:inset 0 0 0 1.5px #007991;}' +
    '.fh-cdate-day.sel{background:#007991;color:#fff;}' +
    '.fh-cdate-day.other{color:#D6D1C6;}' +
    '.fh-cdate-foot{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #F0EDE5;}' +
    '.fh-cdate-popup .fh-cdate-clear,.fh-cdate-popup .fh-cdate-today{background:none;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;padding:4px 2px;}' +
    '.fh-cdate-popup .fh-cdate-clear{color:#B0524A;}' +
    '.fh-cdate-popup .fh-cdate-today{color:#007991;}' +

    '.fh-ctime .fh-ctime-btn{all:unset;display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;cursor:pointer;box-sizing:border-box;}' +
    '.fh-ctime .fh-ctime-btn svg{flex:0 0 auto;opacity:.55;}' +
    '.fh-ctime-label.placeholder{color:#A8A296;font-weight:500;}' +
    '.fh-ctime-popup{position:absolute;top:calc(100% + 6px);left:0;width:172px;max-width:88vw;background:#fff;' +
      'border:1px solid #E6E1D8;border-radius:14px;box-shadow:0 10px 30px -8px rgba(15,34,43,0.28);padding:10px;' +
      'z-index:400;display:none;font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
    '.fh-ctime-popup.open{display:block;}' +
    '.fh-ctime-cols{display:flex;gap:4px;}' +
    '.fh-ctime-col{flex:1;max-height:170px;overflow-y:auto;scroll-snap-type:y proximity;}' +
    '.fh-ctime-col-sep{display:flex;align-items:flex-start;justify-content:center;padding-top:6px;font-weight:700;color:#8A8578;}' +
    '.fh-ctime-opt{padding:6px 0;text-align:center;font-size:13.5px;font-weight:600;color:#0F222B;border-radius:7px;cursor:pointer;scroll-snap-align:center;}' +
    '.fh-ctime-opt:hover{background:#F0EDE5;}' +
    '.fh-ctime-opt.sel{background:#007991;color:#fff;}' +
    '.fh-ctime-foot{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #F0EDE5;}' +
    '.fh-ctime-popup .fh-ctime-clear{background:none;border:none;color:#B0524A;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;padding:4px 2px;}' +
    '.fh-ctime-popup .fh-ctime-done{background:#007991;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}' +
    '.fh-ctime-popup .fh-ctime-done:hover{background:#00636F;}';
  document.head.appendChild(style);

  function closeAllPopups() {
    document.querySelectorAll(".fh-csel-popup.open, .fh-cdate-popup.open, .fh-ctime-popup.open").forEach(function (p) {
      p.classList.remove("open");
    });
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".fh-csel, .fh-cdate, .fh-ctime")) closeAllPopups();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllPopups();
  });

  // Pomjeri popup unutar vidljive sirine ekrana ako bi normalno "izletio" preko lijeve/desne ivice
  // (isti razlog zbog kojeg je "Cijena" ranije izlazila preko ivice modala na uzim telefonima).
  function adjustPopupPosition(popup, wrap) {
    popup.style.left = "0";
    popup.style.top = "calc(100% + 6px)";
    popup.style.bottom = "";
    var wrapRect = wrap.getBoundingClientRect();
    var popRect = popup.getBoundingClientRect();
    var overflowRight = popRect.right - (window.innerWidth - 8);
    if (overflowRight > 0) {
      var newLeft = -overflowRight;
      if (wrapRect.left + newLeft < 8) newLeft = 8 - wrapRect.left;
      popup.style.left = newLeft + "px";
    }
    // Ako popup ispod dugmeta ne staje na ekran (npr. polje je nisko u modalu), otvori ga
    // na gore umjesto na dole - inace zadnji red kalendara/liste ostane van vidljivog dijela.
    popRect = popup.getBoundingClientRect();
    var overflowBottom = popRect.bottom - (window.innerHeight - 8);
    if (overflowBottom > 0) {
      var spaceAbove = wrapRect.top;
      var spaceBelow = window.innerHeight - wrapRect.bottom;
      if (spaceAbove > spaceBelow) {
        popup.style.top = "auto";
        popup.style.bottom = "calc(100% + 6px)";
      }
    }
  }

  function enhanceSelect(selectEl) {
    if (!selectEl || selectEl.dataset.fhEnhanced === "1") return;
    selectEl.dataset.fhEnhanced = "1";

    var wrap = document.createElement("span");
    wrap.className = "fh-csel " + selectEl.className;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fh-csel-btn";
    btn.innerHTML = '<span class="fh-csel-label"></span>' + chevronIcon();
    var popup = document.createElement("div");
    popup.className = "fh-csel-popup";

    selectEl.parentNode.insertBefore(wrap, selectEl);
    wrap.appendChild(btn);
    wrap.appendChild(popup);
    wrap.appendChild(selectEl);
    selectEl.classList.add("fh-csel-native");

    function updateLabel() {
      var opt = selectEl.options[selectEl.selectedIndex];
      btn.querySelector(".fh-csel-label").textContent = opt ? opt.textContent : "";
    }
    function buildOptions() {
      popup.innerHTML = "";
      Array.prototype.forEach.call(selectEl.options, function (opt) {
        var row = document.createElement("div");
        row.className = "fh-csel-opt" + (opt.value === selectEl.value ? " sel" : "");
        row.textContent = opt.textContent;
        row.addEventListener("click", function (e) {
          e.stopPropagation();
          selectEl.value = opt.value;
          selectEl.dispatchEvent(new Event("change", { bubbles: true }));
          updateLabel();
          popup.classList.remove("open");
        });
        popup.appendChild(row);
      });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = popup.classList.contains("open");
      closeAllPopups();
      if (!isOpen) {
        buildOptions();
        popup.classList.add("open");
        adjustPopupPosition(popup, wrap);
      }
    });

    selectEl._fhRefresh = updateLabel;
    updateLabel();
  }
  function refreshSelect(selectEl) {
    if (selectEl && selectEl._fhRefresh) selectEl._fhRefresh();
  }

  function enhanceDate(inputEl) {
    if (!inputEl || inputEl.dataset.fhEnhanced === "1") return;
    inputEl.dataset.fhEnhanced = "1";

    var wrap = document.createElement("span");
    wrap.className = "fh-cdate " + inputEl.className;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fh-cdate-btn";
    btn.innerHTML = '<span class="fh-cdate-label"></span>' + calIcon();
    var popup = document.createElement("div");
    popup.className = "fh-cdate-popup";

    inputEl.parentNode.insertBefore(wrap, inputEl);
    wrap.appendChild(btn);
    wrap.appendChild(popup);
    wrap.appendChild(inputEl);
    inputEl.classList.add("fh-cdate-native");

    var viewYear, viewMonth;

    function fmt2(n) { return n < 10 ? "0" + n : "" + n; }
    function parseVal() {
      var v = inputEl.value;
      if (!v) return null;
      var p = v.split("-");
      if (p.length !== 3) return null;
      return { y: +p[0], m: +p[1] - 1, d: +p[2] };
    }
    function updateLabel() {
      var v = parseVal();
      var labelEl = btn.querySelector(".fh-cdate-label");
      if (v) {
        labelEl.textContent = fmt2(v.d) + "." + fmt2(v.m + 1) + "." + v.y + ".";
        labelEl.classList.remove("placeholder");
      } else {
        labelEl.textContent = "Odaberi datum";
        labelEl.classList.add("placeholder");
      }
    }
    function setValue(y, m, d) {
      inputEl.value = y + "-" + fmt2(m + 1) + "-" + fmt2(d);
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      updateLabel();
    }
    function buildCalendar() {
      var today = new Date();
      var sel = parseVal();
      var startDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      var daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

      var html = '<div class="fh-cdate-cal-head">' +
        '<button type="button" class="fh-cdate-cal-nav" data-nav="-1">' + navIcon(-1) + '</button>' +
        '<span class="fh-cdate-cal-title">' + MONTH_NAMES[viewMonth] + " " + viewYear + '.</span>' +
        '<button type="button" class="fh-cdate-cal-nav" data-nav="1">' + navIcon(1) + '</button>' +
        '</div><div class="fh-cdate-grid">';
      DOW_NAMES.forEach(function (dn) { html += '<div class="fh-cdate-dow">' + dn + '</div>'; });
      for (var i = 0; i < startDow; i++) html += '<div class="fh-cdate-day other">' + (daysInPrevMonth - startDow + i + 1) + '</div>';
      for (var d = 1; d <= daysInMonth; d++) {
        var isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
        var isSel = sel && sel.y === viewYear && sel.m === viewMonth && sel.d === d;
        html += '<div class="fh-cdate-day' + (isToday ? " today" : "") + (isSel ? " sel" : "") + '" data-day="' + d + '">' + d + '</div>';
      }
      var trailing = (7 - ((startDow + daysInMonth) % 7)) % 7;
      for (var t = 1; t <= trailing; t++) html += '<div class="fh-cdate-day other">' + t + '</div>';
      html += '</div><div class="fh-cdate-foot">' +
        '<button type="button" class="fh-cdate-clear">Ukloni datum</button>' +
        '<button type="button" class="fh-cdate-today">Danas</button>' +
        '</div>';
      popup.innerHTML = html;

      Array.prototype.forEach.call(popup.querySelectorAll("[data-nav]"), function (b) {
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          viewMonth += +b.dataset.nav;
          if (viewMonth < 0) { viewMonth = 11; viewYear--; }
          if (viewMonth > 11) { viewMonth = 0; viewYear++; }
          buildCalendar();
        });
      });
      Array.prototype.forEach.call(popup.querySelectorAll(".fh-cdate-day:not(.other)"), function (dayEl) {
        dayEl.addEventListener("click", function (e) {
          e.stopPropagation();
          setValue(viewYear, viewMonth, +dayEl.dataset.day);
          popup.classList.remove("open");
        });
      });
      popup.querySelector(".fh-cdate-clear").addEventListener("click", function (e) {
        e.stopPropagation();
        inputEl.value = "";
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        updateLabel();
        popup.classList.remove("open");
      });
      popup.querySelector(".fh-cdate-today").addEventListener("click", function (e) {
        e.stopPropagation();
        var t = new Date();
        viewYear = t.getFullYear(); viewMonth = t.getMonth();
        buildCalendar();
      });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = popup.classList.contains("open");
      closeAllPopups();
      if (!isOpen) {
        var sel = parseVal();
        var t = new Date();
        viewYear = sel ? sel.y : t.getFullYear();
        viewMonth = sel ? sel.m : t.getMonth();
        buildCalendar();
        popup.classList.add("open");
        adjustPopupPosition(popup, wrap);
      }
    });

    inputEl._fhRefresh = updateLabel;
    updateLabel();
  }
  function refreshDate(inputEl) {
    if (inputEl && inputEl._fhRefresh) inputEl._fhRefresh();
  }

  // Isti razlog kao za enhanceDate: <input type="time"> na telefonu, kad je prazan, ne pokazuje
  // ni ikonicu ni nagovjestaj da tu treba vrijeme - samo prazna kutija (izgleda kao nepoznato
  // polje). Widget prikazuje jasan placeholder (npr. "Od"/"Do", iz title atributa) i otvara
  // sopstveni birač sata/minuta u dvije klizajuće kolone.
  function enhanceTime(inputEl) {
    if (!inputEl || inputEl.dataset.fhEnhanced === "1") return;
    inputEl.dataset.fhEnhanced = "1";

    var wrap = document.createElement("span");
    wrap.className = "fh-ctime " + inputEl.className;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fh-ctime-btn";
    btn.innerHTML = '<span class="fh-ctime-label"></span>' + clockSmallIcon();
    var popup = document.createElement("div");
    popup.className = "fh-ctime-popup";

    inputEl.parentNode.insertBefore(wrap, inputEl);
    wrap.appendChild(btn);
    wrap.appendChild(popup);
    wrap.appendChild(inputEl);
    inputEl.classList.add("fh-ctime-native");

    var curH = null, curM = null;

    function updateLabel() {
      var v = inputEl.value;
      var labelEl = btn.querySelector(".fh-ctime-label");
      if (v) {
        labelEl.textContent = v;
        labelEl.classList.remove("placeholder");
      } else {
        labelEl.textContent = inputEl.title || "Odaberi vrijeme";
        labelEl.classList.add("placeholder");
      }
    }
    function commit() {
      inputEl.value = curH + ":" + curM;
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      updateLabel();
      renderCols();
    }
    function renderCols() {
      var hoursHtml = "";
      for (var h = 0; h < 24; h++) {
        var hv = pad2(h);
        hoursHtml += '<div class="fh-ctime-opt' + (hv === curH ? " sel" : "") + '" data-h="' + hv + '">' + hv + '</div>';
      }
      var minsHtml = "";
      for (var m = 0; m < 60; m++) {
        var mv = pad2(m);
        minsHtml += '<div class="fh-ctime-opt' + (mv === curM ? " sel" : "") + '" data-m="' + mv + '">' + mv + '</div>';
      }
      popup.innerHTML =
        '<div class="fh-ctime-cols">' +
          '<div class="fh-ctime-col" data-col="h">' + hoursHtml + '</div>' +
          '<div class="fh-ctime-col-sep">:</div>' +
          '<div class="fh-ctime-col" data-col="m">' + minsHtml + '</div>' +
        '</div>' +
        '<div class="fh-ctime-foot">' +
          '<button type="button" class="fh-ctime-clear">Ukloni</button>' +
          '<button type="button" class="fh-ctime-done">Gotovo</button>' +
        '</div>';

      Array.prototype.forEach.call(popup.querySelectorAll("[data-h]"), function (el) {
        el.addEventListener("click", function (e) {
          e.stopPropagation();
          curH = el.dataset.h;
          if (curM === null) curM = "00";
          commit();
        });
      });
      Array.prototype.forEach.call(popup.querySelectorAll("[data-m]"), function (el) {
        el.addEventListener("click", function (e) {
          e.stopPropagation();
          curM = el.dataset.m;
          if (curH === null) curH = "00";
          commit();
        });
      });
      popup.querySelector(".fh-ctime-clear").addEventListener("click", function (e) {
        e.stopPropagation();
        curH = null; curM = null;
        inputEl.value = "";
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        updateLabel();
        renderCols();
      });
      popup.querySelector(".fh-ctime-done").addEventListener("click", function (e) {
        e.stopPropagation();
        popup.classList.remove("open");
      });
    }
    function scrollToSelected() {
      var selH = popup.querySelector('.fh-ctime-col[data-col="h"] .sel');
      var selM = popup.querySelector('.fh-ctime-col[data-col="m"] .sel');
      if (selH) selH.scrollIntoView({ block: "center" });
      if (selM) selM.scrollIntoView({ block: "center" });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = popup.classList.contains("open");
      closeAllPopups();
      if (!isOpen) {
        var v = inputEl.value;
        if (v) { var p = v.split(":"); curH = p[0]; curM = p[1]; }
        else { curH = null; curM = null; }
        renderCols();
        popup.classList.add("open");
        adjustPopupPosition(popup, wrap);
        scrollToSelected();
      }
    });

    inputEl._fhRefresh = updateLabel;
    updateLabel();
  }
  function refreshTime(inputEl) {
    if (inputEl && inputEl._fhRefresh) inputEl._fhRefresh();
  }

  window.FH_UI = {
    enhanceSelect: enhanceSelect,
    refreshSelect: refreshSelect,
    enhanceDate: enhanceDate,
    refreshDate: refreshDate,
    enhanceTime: enhanceTime,
    refreshTime: refreshTime
  };
})();
