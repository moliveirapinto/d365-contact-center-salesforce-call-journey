// Fix for "Error loading control" in the Evaluation Details side pane (MscrmControls.OC.OCEvaluationDetailsControl).
// The control's bundle references the Fluent UI v8 platform library (global FluentUIReact) without declaring it,
// so it only works in apps where some other control happened to load Fluent v8 first (e.g. the multisession workspace).
// This script loads Fluent v8 from the same Power Apps CDN the platform uses, then re-registers the control if it already failed.
var D365CC = D365CC || {};
D365CC.EvaluationPaneFix = (function () {
  var PANE_ID = "EvaluationDetailsSidePane";
  var CONTROL_BUNDLE = "cc_MscrmControls.OC.OCEvaluationDetailsControl/bundle.js";
  var FALLBACK_VERSION = "1.4.12422-2608.4";

  function hostWindow() {
    // Form scripts run inside the same-origin ClientApiFrame; the side pane and platform libraries live in its parent.
    try { if (window.parent && window.parent !== window && window.parent.document && window.parent.Xrm && window.parent.Xrm.App) { return window.parent; } } catch (e) { }
    return window;
  }

  function fluentUrl(w) {
    var scripts = w.document.scripts, base = "https://content.powerapps.com/resource/uci-infra-web/", ver = null;
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].src || "";
      var m = s.match(/^(https:\/\/[^\/]+\/resource\/uci-infra-web\/)controlsAssets\/([^\/]+)\/platformlibs\//);
      if (m) { base = m[1]; ver = m[2]; break; }
      var c = s.match(/cdnEndpointCheck\.js\?v=([^&]+)/);
      if (c && !ver) { ver = c[1]; }
      var b = s.match(/^(https:\/\/[^\/]+\/resource\/uci-infra-web\/)/);
      if (b) { base = b[1]; }
    }
    return base + "controlsAssets/" + (ver || FALLBACK_VERSION) + "/platformlibs/fluent/8.29.0/fluent_8_29_0.js";
  }

  function ensureFluent(w) {
    if (w.FluentUIReact) { return Promise.resolve(false); }
    if (w.__d365ccFluentPromise) { return w.__d365ccFluentPromise; }
    w.__d365ccFluentPromise = new Promise(function (resolve) {
      var alias = function () { if (!w.FluentUIReact && w.FluentUIReactv8290) { w.FluentUIReact = w.FluentUIReactv8290; } };
      var inject = function () {
        alias();
        if (w.FluentUIReact) { resolve(true); return; }
        var el = w.document.createElement("script");
        el.src = fluentUrl(w);
        el.onload = function () { alias(); resolve(!!w.FluentUIReact); };
        el.onerror = function () { resolve(false); };
        w.document.head.appendChild(el);
      };
      // The Fluent v8 UMD binds to the React/ReactDOM globals at load time, so wait until the platform has exposed them.
      var tries = 0;
      var wait = w.setInterval(function () {
        tries++;
        if ((w.React && w.ReactDOM) || tries > 120) { w.clearInterval(wait); inject(); }
      }, 100);
    });
    return w.__d365ccFluentPromise;
  }

  function paneFailed(w) {
    try {
      if (!w.Xrm.App.sidePanes.getPane(PANE_ID)) { return false; }
      var host = w.document.querySelector('[id*="' + PANE_ID + '"]') || w.document.body;
      return (host.innerText || "").indexOf("Error loading control") >= 0;
    } catch (e) { return false; }
  }

  function bundleUrl(w) {
    try {
      var e = w.performance.getEntriesByType("resource");
      for (var i = e.length - 1; i >= 0; i--) { if (e[i].name.indexOf(CONTROL_BUNDLE) >= 0) { return e[i].name; } }
    } catch (x) { }
    return w.location.origin + "/webresources/" + CONTROL_BUNDLE;
  }

  function repair(w, formContext) {
    w.__d365ccEvalRepairs = (w.__d365ccEvalRepairs || 0) + 1;
    if (w.__d365ccEvalRepairs > 2) { return; }
    w.fetch(bundleUrl(w), { credentials: "same-origin" }).then(function (r) { return r.text(); }).then(function (src) {
      (0, w.eval)(src);
      var pane = w.Xrm.App.sidePanes.getPane(PANE_ID);
      return (pane ? pane.close() : Promise.resolve()).then(function () {
        var e = formContext.data.entity;
        w.Xrm.Navigation.navigateTo({ pageType: "entityrecord", entityName: e.getEntityName(), entityId: e.getId().replace(/[{}]/g, "") });
      });
    }).catch(function () { });
  }

  return {
    onLoad: function (executionContext) {
      var w = hostWindow();
      var formContext = executionContext && executionContext.getFormContext ? executionContext.getFormContext() : null;
      if (!w || !w.document) { return; }
      ensureFluent(w).then(function () {
        if (!w.FluentUIReact || !formContext) { return; }
        var started = Date.now();
        var timer = w.setInterval(function () {
          if (paneFailed(w)) { w.clearInterval(timer); repair(w, formContext); }
          else if (Date.now() - started > 30000) { w.clearInterval(timer); }
        }, 500);
      });
    }
  };
})();
