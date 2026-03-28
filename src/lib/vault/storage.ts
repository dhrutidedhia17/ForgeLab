import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { VaultEntry, VaultIndex } from "@/types/vault";
import type { ResearchResult, StepResult } from "@/types/pipeline";
import { getVaultDir } from "@/lib/files";

function getIndexPath(): string {
  return path.join(getVaultDir(), "index.json");
}

function readIndex(): VaultIndex {
  const indexPath = getIndexPath();
  if (!fs.existsSync(indexPath)) {
    return { builds: [] };
  }
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw) as VaultIndex;
}

function writeIndex(index: VaultIndex) {
  const indexPath = getIndexPath();
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function saveVaultEntry(
  buildId: string,
  prompt: string,
  category: string,
  research: ResearchResult,
  results: Record<string, StepResult>
) {
  const vaultDir = getVaultDir();
  const index = readIndex();

  const materials = research.materials.map((m) => m.name);
  const tags = [
    category.toLowerCase(),
    ...materials.slice(0, 5).map((m) => slugify(m)),
  ];

  // Find related builds by shared materials/tags
  const relatedBuilds: { id: string; title: string }[] = [];
  for (const existing of index.builds) {
    const sharedMaterials = existing.materials.filter((m) =>
      materials.some((nm) => nm.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(nm.toLowerCase()))
    );
    const sharedTags = existing.tags.filter((t) => tags.includes(t));
    if (sharedMaterials.length > 0 || sharedTags.length > 1) {
      relatedBuilds.push({ id: existing.id, title: existing.title });
    }
  }

  // Build output paths
  const vendorResult = results.vendors;
  const model3dResult = results.model3d;
  const blueprintResult = results.blueprint;
  const imageResult = results.image;
  const videoResult = results.video;
  const musicResult = results.music;

  const outputs: VaultEntry["outputs"] = {
    guide: research.rawGuide,
  };

  if (vendorResult?.status === "complete" && vendorResult.result) {
    outputs.vendors = JSON.stringify(vendorResult.result);
  }
  if (model3dResult?.status === "complete" && model3dResult.result) {
    outputs.model3d = (model3dResult.result as { filePath: string }).filePath;
  }
  if (blueprintResult?.status === "complete" && blueprintResult.result) {
    outputs.blueprint = (blueprintResult.result as { filePath: string }).filePath;
  }
  if (imageResult?.status === "complete" && imageResult.result) {
    outputs.image = (imageResult.result as { filePath: string }).filePath;
  }
  if (videoResult?.status === "complete" && videoResult.result) {
    const vr = videoResult.result as { clips: { filePath: string }[] };
    outputs.video = vr.clips.map((c) => c.filePath);
  }
  if (musicResult?.status === "complete" && musicResult.result) {
    outputs.music = (musicResult.result as { filePath: string }).filePath;
  }

  const hasErrors = Object.values(results).some((r) => r.status === "error");
  const entry: VaultEntry = {
    id: buildId,
    title: research.title,
    prompt,
    category,
    createdAt: new Date().toISOString(),
    status: hasErrors ? "partial" : "complete",
    tags,
    materials,
    outputs,
    relatedBuilds,
  };

  // Generate markdown file with frontmatter and wikilinks
  const relatedLinks = relatedBuilds
    .map((r) => `- [[${r.id}|${r.title}]]`)
    .join("\n");

  const materialsTable = research.materials
    .map((m) => `| ${m.name} | ${m.quantity} | ${m.specification} |`)
    .join("\n");

  const stepsMarkdown = research.steps
    .map((s) => `${s.stepNumber}. **${s.title}**: ${s.description}`)
    .join("\n");

  const markdown = `---
title: "${research.title}"
date: "${entry.createdAt}"
category: "${category}"
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
materials: [${materials.map((m) => `"${m}"`).join(", ")}]
difficulty: "${research.difficulty}"
estimatedTime: "${research.estimatedTime}"
status: "${entry.status}"
---

# ${research.title}

${research.overview}

**Difficulty:** ${research.difficulty} | **Estimated Time:** ${research.estimatedTime}

## Materials

| Material | Quantity | Specification |
|----------|----------|---------------|
${materialsTable}

## Tools Required

${research.tools.map((t) => `- ${t}`).join("\n")}

## Build Steps

${stepsMarkdown}

## Safety Notes

${research.safetyNotes.map((n) => `- ${n}`).join("\n")}

## Output Files

${outputs.image ? `- Product Image: [View](${outputs.image})` : ""}
${outputs.blueprint ? `- Blueprint: [View](${outputs.blueprint})` : ""}
${outputs.model3d ? `- 3D Model: [Download](${outputs.model3d})` : ""}
${outputs.music ? `- Background Music: [Listen](${outputs.music})` : ""}
${outputs.video && outputs.video.length > 0 ? `- Tutorial Videos: ${outputs.video.map((v, i) => `[Clip ${i + 1}](${v})`).join(", ")}` : ""}

${relatedBuilds.length > 0 ? `## Related Builds\n\n${relatedLinks}` : ""}
`;

  // Write markdown file
  const mdPath = path.join(vaultDir, `${buildId}.md`);
  fs.writeFileSync(mdPath, markdown);

  // Update bidirectional links in related builds
  for (const related of relatedBuilds) {
    const relatedMdPath = path.join(vaultDir, `${related.id}.md`);
    if (fs.existsSync(relatedMdPath)) {
      let relatedContent = fs.readFileSync(relatedMdPath, "utf-8");
      const backlink = `- [[${buildId}|${research.title}]]`;
      if (!relatedContent.includes(`[[${buildId}`)) {
        if (relatedContent.includes("## Related Builds")) {
          relatedContent = relatedContent.replace(
            "## Related Builds\n",
            `## Related Builds\n\n${backlink}\n`
          );
        } else {
          relatedContent += `\n## Related Builds\n\n${backlink}\n`;
        }
        fs.writeFileSync(relatedMdPath, relatedContent);
      }
    }

    // Update related entry in index
    const relatedIdx = index.builds.findIndex((b) => b.id === related.id);
    if (relatedIdx >= 0) {
      const alreadyLinked = index.builds[relatedIdx].relatedBuilds.some(
        (r) => r.id === buildId
      );
      if (!alreadyLinked) {
        index.builds[relatedIdx].relatedBuilds.push({
          id: buildId,
          title: research.title,
        });
      }
    }
  }

  // Add to index
  index.builds.unshift(entry);
  writeIndex(index);

  return entry;
}

export async function listVaultEntries(): Promise<VaultEntry[]> {
  const index = readIndex();
  return index.builds;
}

export async function getVaultEntry(
  id: string
): Promise<{ entry: VaultEntry; markdown: string } | null> {
  const index = readIndex();
  const entry = index.builds.find((b) => b.id === id);
  if (!entry) return null;

  const mdPath = path.join(getVaultDir(), `${id}.md`);
  let markdown = "";
  if (fs.existsSync(mdPath)) {
    const raw = fs.readFileSync(mdPath, "utf-8");
    const { content } = matter(raw);
    markdown = content;
  }

  return { entry, markdown };
}
