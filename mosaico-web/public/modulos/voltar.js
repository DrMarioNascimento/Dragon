/* Botão de volta quando a tarefa abre em tela cheia (iPhone). */
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get("from") !== "1") return;
  function go() {
    if (document.getElementById("mosaico-voltar")) return;
    var a = document.createElement("a");
    a.id = "mosaico-voltar";
    a.href = "/noite";
    a.textContent = "MOSAICO";
    a.setAttribute("aria-label", "Voltar ao MOSAICO");
    a.style.cssText =
      "position:fixed;right:max(12px,env(safe-area-inset-right));" +
      "top:max(10px,env(safe-area-inset-top));z-index:99998;" +
      "min-height:44px;padding:12px 16px;border-radius:999px;" +
      "border:1px solid rgba(240,174,89,.45);background:rgba(5,7,12,.82);" +
      "color:#f0ae59;font:700 11px/1 Inter,system-ui,sans-serif;" +
      "letter-spacing:.18em;text-decoration:none;text-transform:uppercase;" +
      "-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)";
    document.body.appendChild(a);
  }
  if (document.body) go();
  else document.addEventListener("DOMContentLoaded", go);
})();
