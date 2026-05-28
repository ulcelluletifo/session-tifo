/* =====================================================================
   gas-shim.js — Session Tifo PWA
   Réimplémente l'API "google.script.run" de Google Apps Script
   en appels fetch() vers ton API JSON (doPost dans Apps Script).
   => Le HTML existant fonctionne sans modification.
   ===================================================================== */
(function () {
  "use strict";

  function getApiUrl() {
    return (window.TIFO_API_URL || "").trim();
  }

  // Appel réel vers l'API Apps Script.
  // Content-Type text/plain => "simple request" => PAS de pré-vol CORS (OPTIONS),
  // ce qui est indispensable car Apps Script ne gère pas le préflight.
  function callApi(fn, args) {
    var url = getApiUrl();
    if (!url || url.indexOf("COLLE_") === 0 || url.indexOf("PASTE_") === 0) {
      return Promise.reject(new Error(
        "API non configurée. Édite config.js et colle l'URL /exec de ton script."
      ));
    }
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fn: fn, args: args }),
      redirect: "follow"
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (txt) {
        var data;
        try { data = JSON.parse(txt); }
        catch (e) { throw new Error("Réponse invalide du serveur."); }
        if (data && data.__error) throw new Error(data.__error);
        return data ? data.result : undefined;
      });
  }

  // Construit un "runner" chaînable identique à google.script.run :
  //   google.script.run.withSuccessHandler(cb).withFailureHandler(fb).maFonction(args)
  function makeRunner() {
    var ctx = { ok: null, fail: null, uo: undefined };
    var proxy = new Proxy({}, {
      get: function (_t, prop) {
        if (prop === "withSuccessHandler") return function (f) { ctx.ok = f; return proxy; };
        if (prop === "withFailureHandler") return function (f) { ctx.fail = f; return proxy; };
        if (prop === "withUserObject")     return function (o) { ctx.uo = o; return proxy; };
        if (typeof prop !== "string")      return undefined;
        // Toute autre propriété = appel d'une fonction serveur
        return function () {
          var args = Array.prototype.slice.call(arguments);
          callApi(prop, args).then(
            function (res) { if (ctx.ok)   ctx.ok(res, ctx.uo); },
            function (err) {
              if (ctx.fail) ctx.fail(err, ctx.uo);
              else console.error("[Session Tifo] échec", prop, err);
            }
          );
          return undefined; // google.script.run ne renvoie rien d'utilisable
        };
      }
    });
    return proxy;
  }

  // Objet google.script complet (run renvoie un runner neuf à chaque accès)
  var scriptObj = {
    get run() { return makeRunner(); },
    host: {
      close: function () {},
      setHeight: function () {},
      setWidth: function () {},
      origin: "",
      editor: { focus: function () {} }
    },
    url: {
      getLocation: function (cb) {
        cb({ parameter: parseQuery(), hash: location.hash.replace(/^#/, "") });
      }
    },
    history: { push: function () {}, replace: function () {}, setChangeHandler: function () {} }
  };

  function parseQuery() {
    var p = {}, q = location.search.replace(/^\?/, "");
    if (!q) return p;
    q.split("&").forEach(function (pair) {
      var kv = pair.split("=");
      p[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    });
    return p;
  }

  if (!window.google) window.google = { script: scriptObj };
  else window.google.script = scriptObj;

  // ---- Enregistrement du Service Worker (offline + installation) ----
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (e) {
        console.warn("[Session Tifo] Service Worker non enregistré :", e);
      });
    });
  }
})();
