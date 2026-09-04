(() => {
  "use strict";

  const ACCESS_KEY = "dragon.ra.access.v1";
  const EXPECTED_HASH = "c062ad8e2947d98fe8aedbc106933d9f10960b0e44026eee5d10f019c6fc781a";
  const isProtected = document.documentElement.hasAttribute("data-ra-protected");

  let isUnlocked = false;
  try {
    isUnlocked = sessionStorage.getItem(ACCESS_KEY) === "liberado";
  } catch (error) {
    isUnlocked = false;
  }

  if (isProtected && !isUnlocked) {
    window.location.replace("../index.html?laboratorio=senha#laboratorio-ra");
    return;
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function ready() {
    const form = document.getElementById("ra-access-form");
    const input = document.getElementById("ra-password");
    const message = document.getElementById("ra-access-message");

    if (form && input && message) {
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const button = form.querySelector("button[type='submit']");
        button.disabled = true;
        message.textContent = "Verificando…";

        try {
          const matches = await sha256(input.value) === EXPECTED_HASH;
          if (!matches) {
            input.value = "";
            input.setAttribute("aria-invalid", "true");
            message.textContent = "Senha incorreta. Confira maiúsculas e minúsculas.";
            input.focus();
            return;
          }

          input.removeAttribute("aria-invalid");
          sessionStorage.setItem(ACCESS_KEY, "liberado");
          message.textContent = "Acesso liberado.";
          window.location.assign(form.dataset.destination || "laboratorio-ra/");
        } catch (error) {
          message.textContent = "Este navegador não conseguiu validar a senha.";
        } finally {
          button.disabled = false;
        }
      });

      if (new URLSearchParams(window.location.search).get("laboratorio") === "senha") {
        input.focus({ preventScroll: true });
        document.getElementById("laboratorio-ra")?.scrollIntoView({ block: "center" });
      }
    }

    document.querySelectorAll("[data-ra-lock]").forEach(button => {
      button.addEventListener("click", () => {
        sessionStorage.removeItem(ACCESS_KEY);
        window.location.replace("../index.html#laboratorio-ra");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
