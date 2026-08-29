/* Botão de volta quando a tarefa abre em tela cheia (iPhone). */
(function () {
  var q = new URLSearchParams(location.search);
  var from = q.get("from");
  /* "play" nunca entrava: a guarda so deixava passar from=1 e o ramo do
     /play abaixo era codigo morto. */
  if (from !== "1" && from !== "play") return;
  /* O MOSAICO e publicado sob /Dragon/v2/ no GitHub Pages, e a tarefa mora
     em <base>modulos/<arquivo>.html. Um href absoluto "/noite" saia do site
     inteiro e caia num 404 do dominio — o botao de voltar nao voltava. O
     endereco da propria pagina ja carrega a base: basta cortar o fim. */
  var base = location.pathname.replace(/modulos\/[^/]*$/, "");
  /* E nao "<base>noite": o Pages so tem arquivo na raiz do app, entao pedir
     /Dragon/v2/noite direto na barra de endereco tambem da 404 — quem monta
     essa rota e o roteador, depois que a pagina carrega. Voltamos pela raiz
     e dizemos, na busca, para onde ir. */
  function go() {
    if (document.getElementById("mosaico-voltar")) return;
    var a = document.createElement("a");
    a.id = "mosaico-voltar";
    a.href = base + (from === "play" ? "?ir=play" : "?ir=noite");
    a.textContent = "MOSAICO";
    a.setAttribute("aria-label", "Voltar ao MOSAICO");
    a.style.cssText =
      "position:fixed;right:max(12px,env(safe-area-inset-right));" +
      "top:max(10px,env(safe-area-inset-top));z-index:99998;" +
      "min-height:44px;padding:12px 16px;border-radius:999px;" +
      "border:1px solid rgba(232,194,122,.45);background:rgba(5,7,12,.82);" +
      "color:#e8c27a;font:600 11px/1 Inter,system-ui,sans-serif;" +
      "letter-spacing:.14em;text-decoration:none;text-transform:uppercase;" +
      "-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)";
    document.body.appendChild(a);
  }
  if (document.body) go();
  else document.addEventListener("DOMContentLoaded", go);
})();
