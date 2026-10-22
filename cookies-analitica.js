/*!
 * cookies-analitica.js — kit común de consentimiento + analítica (checklist-web-20, puntos 3 y 19).
 * Sin dependencias. Cumple Ley 1581 de 2012 (Colombia): NO carga ninguna herramienta de medición
 * hasta que la persona acepta. Usa Google Consent Mode v2.
 *
 * Uso (al final del <body> o en el <head> con defer):
 *   <script src="/cookies-analitica.js" defer
 *     data-ga4="G-XXXXXXXXXX"        (opcional) Google Analytics 4
 *     data-clarity="abcdefghij"      (opcional) Microsoft Clarity
 *     data-pixel="123456789012345"   (opcional) Meta Pixel
 *     data-politica="/cookies"       página de política de cookies
 *     data-color="#FE6706"           color del botón principal (el texto se elige solo para contraste)
 *     data-lang="es"></script>       es | en
 *
 * Eventos que mide solo (si hay consentimiento): clic_whatsapp, clic_cta (elementos con [data-cta]),
 * clic_telefono, envio_formulario.
 * Reabrir el panel: cualquier elemento con [data-cookies-config] o window.configurarCookies().
 */
(function () {
  "use strict";
  var s = document.currentScript || document.querySelector("script[data-politica],script[src*='cookies-analitica']");
  var d = (s && s.dataset) || {};
  var valido = function (v) { return v && !/COMPLETAR|X{4,}/i.test(v) ? v : ""; };
  var cfg = {
    ga4: valido(d.ga4), clarity: valido(d.clarity), pixel: valido(d.pixel),
    politica: d.politica || "/cookies", color: d.color || "#111111", lang: d.lang === "en" ? "en" : "es"
  };
  var KEY = "consentimiento-cookies-v1";
  var T = {
    es: {
      titulo: "Usamos cookies", texto: "Usamos cookies propias y de terceros para medir las visitas y mejorar la página. Puedes aceptarlas, rechazarlas o elegir cuáles.",
      mas: "Política de cookies", aceptar: "Aceptar", rechazar: "Rechazar", configurar: "Configurar", guardar: "Guardar",
      nec: "Necesarias", necT: "Hacen funcionar la página. Siempre activas.",
      ana: "Medición", anaT: "Nos dicen cuántas personas visitan y qué páginas usan (Google Analytics, Microsoft Clarity).",
      pub: "Publicidad", pubT: "Miden la efectividad de nuestros anuncios en redes (Meta).", dialogo: "Preferencias de cookies"
    },
    en: {
      titulo: "We use cookies", texto: "We use our own and third-party cookies to measure visits and improve this site. You can accept, reject or choose which ones.",
      mas: "Cookie policy", aceptar: "Accept", rechazar: "Reject", configurar: "Settings", guardar: "Save",
      nec: "Necessary", necT: "Required for the site to work. Always on.",
      ana: "Analytics", anaT: "Tell us how many people visit and which pages they use (Google Analytics, Microsoft Clarity).",
      pub: "Advertising", pubT: "Measure how our social media ads perform (Meta).", dialogo: "Cookie preferences"
    }
  }[cfg.lang];

  var memoria = null;
  function leer() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); return v || memoria; } catch (e) { return memoria; }
  }
  function guardar(ana, pub) {
    memoria = { analitica: !!ana, publicidad: !!pub, fecha: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(memoria)); } catch (e) { /* modo privado: queda en memoria */ }
    aplicar(memoria);
  }

  // --- Google Consent Mode v2: todo denegado por defecto ---
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", wait_for_update: 500 });

  function cargar(src, id) {
    if (document.getElementById(id)) return;
    var el = document.createElement("script"); el.async = true; el.src = src; el.id = id;
    document.head.appendChild(el);
  }
  var cargado = { ga4: false, clarity: false, pixel: false };
  function aplicar(c) {
    if (!c) return;
    window.gtag("consent", "update", {
      analytics_storage: c.analitica ? "granted" : "denied",
      ad_storage: c.publicidad ? "granted" : "denied", ad_user_data: c.publicidad ? "granted" : "denied", ad_personalization: c.publicidad ? "granted" : "denied"
    });
    if (c.analitica && cfg.ga4 && !cargado.ga4) {
      cargado.ga4 = true;
      cargar("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4), "ca-ga4");
      window.gtag("js", new Date()); window.gtag("config", cfg.ga4);
    }
    if (c.analitica && cfg.clarity && !cargado.clarity) {
      cargado.clarity = true;
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      cargar("https://www.clarity.ms/tag/" + encodeURIComponent(cfg.clarity), "ca-clarity");
      window.clarity("consent");
    }
    if (c.publicidad && cfg.pixel && !cargado.pixel) {
      cargado.pixel = true;
      var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
      if (!window._fbq) window._fbq = f; f.push = f; f.loaded = true; f.version = "2.0"; f.queue = [];
      cargar("https://connect.facebook.net/en_US/fbevents.js", "ca-pixel");
      window.fbq("init", cfg.pixel); window.fbq("track", "PageView");
    }
    if (!c.publicidad && window.fbq) window.fbq("consent", "revoke");
  }

  // --- Medición de acciones clave ---
  function evento(nombre, params) {
    var c = leer();
    if (c && c.analitica && cfg.ga4) window.gtag("event", nombre, params || {});
    if (c && c.publicidad && window.fbq && nombre === "clic_whatsapp") window.fbq("track", "Contact");
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a,button,[data-cta]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var etiqueta = (a.getAttribute("data-cta") || a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 80);
    if (/wa\.me|whatsapp/i.test(href)) evento("clic_whatsapp", { ubicacion: etiqueta });
    else if (/^tel:/i.test(href)) evento("clic_telefono", { ubicacion: etiqueta });
    if (a.hasAttribute("data-cta")) evento("clic_cta", { cta: etiqueta });
    if (a.hasAttribute("data-cookies-config")) { e.preventDefault(); abrir(true); }
  }, true);
  document.addEventListener("submit", function (e) {
    var f = e.target; evento("envio_formulario", { formulario: f.getAttribute("name") || f.id || location.pathname });
  }, true);

  // --- Interfaz ---
  function textoSobre(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return "#fff";
    var n = parseInt(m[1], 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    var L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? "#ffffff" : "#111111";
  }
  var css = "" +
    "#ca-banner{position:fixed;z-index:2147483000;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));max-width:560px;margin:0 auto;" +
    "background:#141414;color:#f5f5f5;border:1px solid #2c2c2c;border-radius:16px;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.35);font:15px/1.5 inherit;font-family:inherit}" +
    "#ca-banner h2{margin:0 0 6px;font-size:17px;line-height:1.3;color:#fff;font-family:inherit}" +
    "#ca-banner p{margin:0 0 14px;color:#dcdcdc;font-size:15px}" +
    "#ca-banner a{color:#fff;text-decoration:underline;text-underline-offset:2px}" +
    "#ca-banner .ca-acc{display:flex;flex-wrap:wrap;gap:8px}" +
    "#ca-banner button{min-height:44px;padding:10px 18px;border-radius:999px;font:600 15px/1 inherit;font-family:inherit;cursor:pointer;border:1px solid #5a5a5a;background:transparent;color:#fff}" +
    "#ca-banner button.ca-pri{background:" + cfg.color + ";border-color:" + cfg.color + ";color:" + textoSobre(cfg.color) + "}" +
    "#ca-banner button:focus-visible{outline:3px solid #fff;outline-offset:2px}" +
    "#ca-banner .ca-op{display:none;margin:4px 0 14px;border-top:1px solid #2c2c2c}" +
    "#ca-banner.ca-abierto .ca-op{display:block}" +
    "#ca-banner label{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #2c2c2c;cursor:pointer}" +
    "#ca-banner label b{display:block;color:#fff}#ca-banner label small{color:#c8c8c8;font-size:13px}" +
    "#ca-banner input{width:20px;height:20px;margin-top:2px;flex:none;accent-color:" + cfg.color + "}" +
    "@media (max-width:480px){#ca-banner button{flex:1 1 auto}}";

  var banner = null;
  function crear() {
    if (banner) return banner;
    // Hoja construida (CSSOM): funciona aunque la CSP prohíba estilos en línea.
    try {
      var hoja = new CSSStyleSheet(); hoja.replaceSync(css);
      document.adoptedStyleSheets = document.adoptedStyleSheets.concat(hoja);
    } catch (e) {
      var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    }
    banner = document.createElement("div");
    banner.id = "ca-banner"; banner.setAttribute("role", "dialog"); banner.setAttribute("aria-label", T.dialogo); banner.setAttribute("aria-live", "polite");
    banner.innerHTML =
      "<h2>" + T.titulo + "</h2><p>" + T.texto + " <a href='" + cfg.politica + "'>" + T.mas + "</a>.</p>" +
      "<div class='ca-op'>" +
      "<label><input type='checkbox' checked disabled><span><b>" + T.nec + "</b><small>" + T.necT + "</small></span></label>" +
      "<label><input type='checkbox' id='ca-ana'><span><b>" + T.ana + "</b><small>" + T.anaT + "</small></span></label>" +
      (cfg.pixel ? "<label><input type='checkbox' id='ca-pub'><span><b>" + T.pub + "</b><small>" + T.pubT + "</small></span></label>" : "") +
      "</div><div class='ca-acc'>" +
      "<button type='button' class='ca-pri' data-a='si'>" + T.aceptar + "</button>" +
      "<button type='button' data-a='no'>" + T.rechazar + "</button>" +
      "<button type='button' data-a='cfg'>" + T.configurar + "</button></div>";
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "si") { guardar(true, true); cerrar(); }
      else if (a === "no") { guardar(false, false); cerrar(); }
      else if (a === "cfg") {
        if (banner.classList.contains("ca-abierto")) {
          var pub = banner.querySelector("#ca-pub");
          guardar(banner.querySelector("#ca-ana").checked, pub ? pub.checked : false); cerrar();
        } else { banner.classList.add("ca-abierto"); b.textContent = T.guardar; }
      }
    });
    document.body.appendChild(banner);
    return banner;
  }
  function cerrar() { if (banner) { banner.remove(); banner = null; } }
  function abrir(config) {
    crear();
    var c = leer();
    if (c) { banner.querySelector("#ca-ana").checked = c.analitica; var p = banner.querySelector("#ca-pub"); if (p) p.checked = c.publicidad; }
    if (config) {
      banner.classList.add("ca-abierto"); banner.querySelector("[data-a=cfg]").textContent = T.guardar;
      banner.querySelector("#ca-ana").focus({ preventScroll: true });
    }
  }
  window.configurarCookies = function () { abrir(true); };

  function iniciar() {
    var c = leer();
    if (c) aplicar(c); else abrir(false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
