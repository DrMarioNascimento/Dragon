/* MOSAICO — FIRESTORE E AUTH POR REST
 * ============================================================================
 * Os bots NÃO usam o SDK do Firebase. Usam a API REST, e há um motivo medido:
 *
 * cada instância do Firestore abre streams próprios (escuta e escrita), e o
 * navegador limita conexões por domínio. Com um `initializeApp` por bot, o
 * terceiro TRAVOU — leitura e escrita paradas, sem erro nenhum, porque a
 * conexão nunca abriu. Não é regra negando: é fila de socket cheia.
 *
 * REST resolve porque cada ação é uma requisição solta que nasce e morre.
 * Bot não precisa de tempo real: precisa AGIR. Quem escuta a sala é uma única
 * instância do SDK, do lado da página.
 *
 * De brinde, isto roda igual no Node — o mesmo módulo serve para dirigir uma
 * mesa sem navegador nenhum.
 * ==========================================================================*/
(function (raiz) {
  "use strict";

  /* ── valores do Firestore ──────────────────────────────────────────────
     A REST não aceita JSON cru: todo campo é tipado. Estas duas funções são
     a tradução, e só cobrem o que a mesa usa. */
  function paraFS(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") {
      return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    }
    if (typeof v === "string") return { stringValue: v };
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(paraFS) } };
    if (typeof v === "object") {
      var f = {};
      Object.keys(v).forEach(function (k) { f[k] = paraFS(v[k]); });
      return { mapValue: { fields: f } };
    }
    return { stringValue: String(v) };
  }
  function deFS(v) {
    if (!v || typeof v !== "object") return v;
    if ("nullValue" in v) return null;
    if ("booleanValue" in v) return v.booleanValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return Number(v.doubleValue);
    if ("stringValue" in v) return v.stringValue;
    if ("timestampValue" in v) return v.timestampValue;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(deFS);
    if ("mapValue" in v) return campos(v.mapValue.fields || {});
    return null;
  }
  function campos(f) {
    var o = {};
    Object.keys(f || {}).forEach(function (k) { o[k] = deFS(f[k]); });
    return o;
  }

  /* ── endereços ────────────────────────────────────────────────────────── */
  function bases(cfg, emulador) {
    return emulador
      ? {
          fs: "http://127.0.0.1:8180/v1",
          auth: "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1",
        }
      : {
          fs: "https://firestore.googleapis.com/v1",
          auth: "https://identitytoolkit.googleapis.com/v1",
        };
  }
  function docPath(cfg, caminho) {
    return "/projects/" + cfg.projectId + "/databases/(default)/documents/" + caminho;
  }

  /* ── autenticação anônima ─────────────────────────────────────────────── */
  async function entrarAnonimo(cfg, emulador) {
    var b = bases(cfg, emulador);
    var r = await fetch(b.auth + "/accounts:signUp?key=" + encodeURIComponent(cfg.apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnSecureToken: true }),
    });
    var j = await r.json();
    if (!r.ok) throw new Error("auth: " + (j.error && j.error.message));
    return { uid: j.localId, token: j.idToken };
  }

  /* ── documentos ───────────────────────────────────────────────────────── */
  async function ler(cfg, emulador, sessao, caminho) {
    var b = bases(cfg, emulador);
    var r = await fetch(b.fs + docPath(cfg, caminho), {
      headers: { Authorization: "Bearer " + sessao.token },
    });
    if (r.status === 404) return null;
    var j = await r.json();
    if (!r.ok) throw new Error("ler " + caminho + ": " + (j.error && j.error.message));
    return campos(j.fields || {});
  }

  /* PATCH sem updateMask cria ou SUBSTITUI o documento — é o `set` do SDK.
     Com updateMask ele mexe só nos campos listados, que é o `update`, e é o
     que as regras conferem em `affectedKeys`. */
  async function gravar(cfg, emulador, sessao, caminho, dados, apenas) {
    var b = bases(cfg, emulador);
    var url = b.fs + docPath(cfg, caminho);
    if (apenas && apenas.length) {
      url += "?" + apenas.map(function (k) {
        return "updateMask.fieldPaths=" + encodeURIComponent(k);
      }).join("&");
    }
    var campos2 = {};
    Object.keys(dados).forEach(function (k) { campos2[k] = paraFS(dados[k]); });
    var r = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + sessao.token },
      body: JSON.stringify({ fields: campos2 }),
    });
    var j = await r.json();
    if (!r.ok) {
      var e = new Error((j.error && j.error.message) || ("HTTP " + r.status));
      e.negado = r.status === 403;
      throw e;
    }
    return campos(j.fields || {});
  }

  raiz.LabREST = { entrarAnonimo: entrarAnonimo, ler: ler, gravar: gravar, paraFS: paraFS, deFS: deFS };
})(typeof window !== "undefined" ? window : globalThis);
