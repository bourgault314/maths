import { readFile, writeFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, css, banks, app] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("reasoning-banks.js", root), "utf8"),
  readFile(new URL("app.js", root), "utf8")
]);

const autonomous = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="reasoning-banks.js"></script>', `<script>\n${banks.replaceAll("</script", "<\\/script")}\n</script>`)
  .replace('<script src="app.js"></script>', `<script>\n${app.replaceAll("</script", "<\\/script")}\n</script>`);

await writeFile(new URL("raisonnement-mathsgo-autonome.html", root), autonomous, "utf8");
