import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedTypes = new Set(["guide", "note", "project", "research", "subpage"]);

const args = process.argv.slice(2);

function printHelp() {
  console.log("Usage: bun run new-note <type> <slug>");
  console.log("");
  console.log("Types: guide | note | project | research | subpage");
  console.log("Slug: [a-z0-9-_]");
  console.log("Output: content/<type>/<slug>.md (subpage -> content/subpage/<slug>.md)");
  console.log("");
  console.log("Examples:");
  console.log("  bun run new-note guide rustdesk");
  console.log("  bun run new-note note zsh-tips");
  console.log("  bun run new-note project rvl-notes");
  console.log("  bun run new-note subpage rustdesk-install");
}

if (args.includes("-h") || args.includes("--help")) {
  printHelp();
  process.exit(0);
}

const [type, slug] = args;

if (!type || !slug) {
  console.error("Usage: bun run new-note <type> <slug>");
  console.error("Use --help for details.");
  process.exit(1);
}

if (!allowedTypes.has(type)) {
  console.error(`Invalid type: ${type}`);
  console.error("Allowed types: guide | note | project | research | subpage");
  console.error("Use --help for details.");
  process.exit(1);
}

if (!/^[a-z0-9-_]+$/.test(slug)) {
  console.error(`Invalid slug: ${slug}`);
  console.error("Slug must match: [a-z0-9-_]");
  console.error("Use --help for details.");
  process.exit(1);
}

const root = process.cwd();
const contentDir = path.join(root, "content");

async function walk(dir: string, files: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

let markdownFiles: string[] = [];
try {
  markdownFiles = await walk(contentDir);
} catch (error) {
  console.error(`[new-note] Failed to scan content: ${String(error)}`);
  process.exit(1);
}

const conflicts = markdownFiles.filter(
  (filePath) => path.basename(filePath, ".md") === slug
);

if (conflicts.length > 0) {
  console.error("[new-note] Slug conflict found:");
  for (const conflictPath of conflicts) {
    console.error(path.relative(root, conflictPath));
  }
  process.exit(1);
}

const targetDir = path.join(contentDir, type);
const targetPath = path.join(targetDir, `${slug}.md`);

await mkdir(targetDir, { recursive: true });

const frontmatter: string[] = ["---", `title: ${slug}`, "summary:"];
if (type !== "subpage") {
  frontmatter.push(`category: ${type}`);
}
frontmatter.push("tags: []");
if (type === "subpage") {
  frontmatter.push("status: subpage");
}
frontmatter.push("---", "", `# ${slug}`, "");

await writeFile(targetPath, `${frontmatter.join("\n")}\n`);
