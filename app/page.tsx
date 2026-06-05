import { readFile } from "node:fs/promises";
import path from "node:path";
export default async function Home() {
  const htmlPath = path.join(process.cwd(), "index.html");
  const legacyHtml = await readFile(htmlPath, "utf-8");

  return (
    <main style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <iframe
        srcDoc={legacyHtml}
        title="ACE Academy Legacy App"
        style={{ border: "none", height: "100%", width: "100%" }}
      />
    </main>
  );
}
