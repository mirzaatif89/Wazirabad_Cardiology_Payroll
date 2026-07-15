import { readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { staticPages } from "../src/navigation.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(scriptDir, "..");
const indexPath = join(frontendDir, "index.html");
const indexHtml = await readFile(indexPath, "utf8");
const generatedMarker = "data-generated-page=\"true\"";

function htmlForPage(page) {
  const title = `${page} - Cardiology Hospital Payroll`;

  return indexHtml
    .replace("<title>Cardiology Hospital Payroll</title>", `<title>${title}</title>`)
    .replace(
      "<head>",
      `<head>\n    <meta ${generatedMarker} />`
    )
    .replace(
      "<script src=\"/config.js\"></script>",
      `<script src="/config.js"></script>\n    <script>window.PAYROLL_INITIAL_PAGE = ${JSON.stringify(page)};</script>`
    );
}

const existingHtmlFiles = await readdir(frontendDir);

for (const fileName of existingHtmlFiles) {
  if (fileName === "index.html" || !fileName.endsWith(".html")) {
    continue;
  }

  const filePath = join(frontendDir, fileName);
  const content = await readFile(filePath, "utf8");

  if (content.includes(generatedMarker)) {
    await unlink(filePath);
  }
}

for (const { page, slug } of staticPages) {
  await writeFile(join(frontendDir, `${slug}.html`), htmlForPage(page), "utf8");
}

await writeFile(join(frontendDir, "dashboard.html"), htmlForPage("Dashboard"), "utf8");

console.log(`Synced ${staticPages.length + 1} frontend HTML pages.`);
