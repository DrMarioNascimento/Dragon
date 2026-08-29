/* Serve o repositório como o GitHub Pages serve.

   Conferir em localhost:5173 não reproduz o erro que mais custou a este jogo:
   caminho absoluto que só quebra sob a base /Dragon/v2/. Aqui o v2/ mora onde
   vai morar de verdade, e endereço sem arquivo devolve o 404.html — que é o
   que faz uma rota digitada à mão ainda carregar o app.

     node scripts/publicar-pages.mjs   # primeiro, refaz o v2/
     node scripts/servir-pages.mjs     # depois, confere                */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let rel = url.replace(/^\/+/, "");
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  let caminho = join(RAIZ, rel);
  const dentroDoApp = url.startsWith("/Dragon/v2/");
  if (!existsSync(caminho) || !statSync(caminho).isFile()) {
    if (dentroDoApp) caminho = join(RAIZ, "v2", "404.html");
    else {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("404");
      console.log("404  " + url);
      return;
    }
  }
  const tipo = TIPOS[extname(caminho)] || "application/octet-stream";
  res.writeHead(200, { "content-type": tipo });
  res.end(readFileSync(caminho));
  console.log("200  " + url);
}).listen(8123, "127.0.0.1", () => {
  console.log("Pages simulado em http://127.0.0.1:8123/Dragon/v2/");
});
