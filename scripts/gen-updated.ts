import { spawnSync } from "node:child_process";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content");
const outputPath = path.join(root, "src", "data", "generated-updated.json");

type UpdatedMap = Record<string, string>;

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

function getGitDate(filePath: string) {
  const result = spawnSync(
    "git",
    ["log", "-1", "--format=%cs", "--", filePath],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    console.warn(`[gen-updated] git date not found for: ${filePath}`);
    return "";
  }
  return result.stdout.trim();
}

const markdownFiles = await walk(contentDir);
const updatedMap: UpdatedMap = {};
const slugToPaths = new Map<string, string[]>();

for (const filePath of markdownFiles) {
  const slug = path.basename(filePath, ".md");
  const list = slugToPaths.get(slug);
  if (list) {
    list.push(filePath);
  } else {
    slugToPaths.set(slug, [filePath]);
  }
  const gitDate = getGitDate(path.relative(root, filePath));
  updatedMap[slug] = gitDate;
}

const duplicates = [...slugToPaths.entries()].filter(([, paths]) => paths.length > 1);
if (duplicates.length > 0) {
  const lines = duplicates.flatMap(([slug, paths]) => [
    `- ${slug}:`,
    ...paths.map((item) => `  - ${item}`),
  ]);
  throw new Error(`[gen-updated] Duplicate slugs found:\n${lines.join("\n")}`);
}

const sorted = Object.fromEntries(
  Object.entries(updatedMap).sort((a, b) => a[0].localeCompare(b[0]))
);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(sorted, null, 2)}\n`);
