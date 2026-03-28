import { GoogleGenAI } from "@google/genai";
import type { BlueprintResult, ResearchResult } from "@/types/pipeline";
import { generateMockBlueprintSVG } from "@/lib/mock/data";
import { saveFile } from "@/lib/files";

const DRAFTAID_API_KEY = process.env.DRAFTAID_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function generateBlueprint(
  buildId: string,
  research: ResearchResult,
  _modelPath?: string,
  category: string = "Other"
): Promise<{ result: BlueprintResult; isMock: boolean }> {
  // Try DraftAid API first
  if (DRAFTAID_API_KEY && _modelPath) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const modelFile = path.join(process.cwd(), "public", _modelPath);

      if (fs.existsSync(modelFile)) {
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(modelFile);
        formData.append(
          "file",
          new Blob([fileBuffer], { type: "application/step" }),
          "model.step"
        );

        const response = await fetch("https://api.draftaid.io/v1/drawings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${DRAFTAID_API_KEY}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.arrayBuffer();
          const filePath = await saveFile(
            buildId,
            "blueprint.pdf",
            Buffer.from(data)
          );
          return {
            result: { filePath, fileName: "blueprint.pdf", format: "pdf" },
            isMock: false,
          };
        }
      }
    } catch (error) {
      console.error("DraftAid API error:", error);
    }
  }

  // Fallback: Use Gemini to generate a detailed SVG blueprint
  if (GEMINI_API_KEY) {
    try {
      const svg = await generateBlueprintWithGemini(research, category);
      const filePath = await saveFile(buildId, "blueprint.svg", svg);
      return {
        result: { filePath, fileName: "blueprint.svg", format: "svg", svgContent: svg },
        isMock: false,
      };
    } catch (error) {
      console.error("Gemini blueprint error:", error);
    }
  }

  // Last resort: static mock
  const svg = generateMockBlueprintSVG(research.title);
  const filePath = await saveFile(buildId, "blueprint.svg", svg);
  return {
    result: { filePath, fileName: "blueprint.svg", format: "svg", svgContent: svg },
    isMock: true,
  };
}

function buildBlueprintPrompt(research: ResearchResult, category: string): string {
  const materials = research.materials
    .map((m) => `${m.name}: ${m.quantity}, ${m.specification}`)
    .join("\n  ");

  const steps = research.steps
    .map((s) => `${s.stepNumber}. ${s.title}`)
    .join("\n  ");

  // Extract any size/measurement info from the research
  const allText = `${research.title} ${research.overview} ${research.rawGuide} ${research.materials.map(m => m.specification).join(" ")}`;

  // Detect standard sizes mentioned
  const sizeMatch = allText.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL)\b/i);
  const detectedSize = sizeMatch ? sizeMatch[1].toUpperCase() : "M";

  // Detect custom measurements
  const bustMatch = allText.match(/bust[:\s]*(\d+)\s*cm/i);
  const waistMatch = allText.match(/waist[:\s]*(\d+)\s*cm/i);
  const hipsMatch = allText.match(/hips?[:\s]*(\d+)\s*cm/i);
  const shoulderMatch = allText.match(/shoulder[:\s]*(\d+)\s*cm/i);
  const lengthMatch = allText.match(/(?:body\s*)?length[:\s]*(\d+)\s*cm/i);
  const armMatch = allText.match(/arm\s*(?:length)?[:\s]*(\d+)\s*cm/i);

  // Standard size charts (in cm)
  const sizeChart: Record<string, { bust: number; waist: number; hips: number; shoulder: number; bodyLength: number; armLength: number; sleeveWidth: number }> = {
    "XXS": { bust: 76, waist: 58, hips: 82, shoulder: 36, bodyLength: 56, armLength: 54, sleeveWidth: 13 },
    "XS":  { bust: 80, waist: 62, hips: 86, shoulder: 37, bodyLength: 57, armLength: 55, sleeveWidth: 13.5 },
    "S":   { bust: 84, waist: 66, hips: 90, shoulder: 38, bodyLength: 58, armLength: 56, sleeveWidth: 14 },
    "M":   { bust: 88, waist: 70, hips: 94, shoulder: 39.5, bodyLength: 60, armLength: 57.5, sleeveWidth: 15 },
    "L":   { bust: 94, waist: 76, hips: 100, shoulder: 41, bodyLength: 62, armLength: 59, sleeveWidth: 16 },
    "XL":  { bust: 100, waist: 82, hips: 106, shoulder: 43, bodyLength: 64, armLength: 60.5, sleeveWidth: 17 },
    "XXL": { bust: 108, waist: 90, hips: 114, shoulder: 45, bodyLength: 66, armLength: 62, sleeveWidth: 18 },
    "2XL": { bust: 108, waist: 90, hips: 114, shoulder: 45, bodyLength: 66, armLength: 62, sleeveWidth: 18 },
    "3XL": { bust: 116, waist: 98, hips: 122, shoulder: 47, bodyLength: 68, armLength: 63, sleeveWidth: 19 },
  };

  const baseMeasurements = sizeChart[detectedSize] || sizeChart["M"];

  // Override with custom measurements if provided
  const measurements = {
    bust: bustMatch ? parseInt(bustMatch[1]) : baseMeasurements.bust,
    waist: waistMatch ? parseInt(waistMatch[1]) : baseMeasurements.waist,
    hips: hipsMatch ? parseInt(hipsMatch[1]) : baseMeasurements.hips,
    shoulder: shoulderMatch ? parseInt(shoulderMatch[1]) : baseMeasurements.shoulder,
    bodyLength: lengthMatch ? parseInt(lengthMatch[1]) : baseMeasurements.bodyLength,
    armLength: armMatch ? parseInt(armMatch[1]) : baseMeasurements.armLength,
    sleeveWidth: baseMeasurements.sleeveWidth,
  };

  // Calculate pattern-specific measurements
  const halfBust = (measurements.bust / 2).toFixed(1);
  const halfWaist = (measurements.waist / 2).toFixed(1);
  const halfHips = (measurements.hips / 2).toFixed(1);
  const frontWidth = (measurements.bust / 4 + 1).toFixed(1); // +1cm ease
  const backWidth = (measurements.bust / 4 + 1).toFixed(1);
  const frontLength = measurements.bodyLength;
  const halfShoulder = (measurements.shoulder / 2).toFixed(1);
  const armholeDepth = (measurements.bust / 4 - 3).toFixed(1);
  const sleeveLength = measurements.armLength;

  const lowerCat = category.toLowerCase();

  // CLOTHING — Sewing Pattern with REAL dimensions
  if (lowerCat === "clothing" || lowerCat.includes("cloth") || lowerCat.includes("garment") || lowerCat.includes("fashion")) {
    return `You are a professional pattern maker with 20 years experience. Generate a SEWING PATTERN as SVG for: "${research.title}"

SIZE: ${detectedSize} (${bustMatch || waistMatch || hipsMatch ? "CUSTOM" : "standard"} measurements)
BODY MEASUREMENTS:
  Bust: ${measurements.bust} cm (half: ${halfBust} cm)
  Waist: ${measurements.waist} cm (half: ${halfWaist} cm)
  Hips: ${measurements.hips} cm (half: ${halfHips} cm)
  Shoulder width: ${measurements.shoulder} cm (half: ${halfShoulder} cm)
  Body length: ${frontLength} cm
  Arm length: ${sleeveLength} cm
  Armhole depth: ${armholeDepth} cm

PATTERN PIECE DIMENSIONS (include 1.5cm seam allowance):
  Front Bodice: width ${frontWidth}cm × length ${frontLength}cm
  Back Bodice: width ${backWidth}cm × length ${frontLength}cm
  Sleeve: length ${sleeveLength}cm × cap width ${measurements.sleeveWidth}cm

Materials: ${materials}

CRITICAL SVG LAYOUT — MUST follow these rules:
- viewBox="0 0 1400 1000", width="1400", height="1000"
- The SVG MUST have width="1400" and height="1000" attributes on the <svg> element
- Background: #faf8f0 (cream)

ZONE LAYOUT (STRICTLY follow these pixel coordinates):
  ZONE A (x:30-450, y:30-580): FRONT BODICE piece
  ZONE B (x:480-900, y:30-580): BACK BODICE piece
  ZONE C (x:930-1200, y:30-420): SLEEVE piece
  ZONE D (x:30-350, y:620-920): COLLAR / FACING piece (if applicable)
  ZONE E (x:380-650, y:620-920): CUFF / POCKET piece (if applicable)
  ZONE F (x:680-950, y:620-870): ADDITIONAL piece (waistband, etc.)
  ZONE G (x:1000-1380, y:700-980): TITLE BLOCK

PATTERN PIECE RULES:
1. Draw each piece as a <path> with SMOOTH CURVES (C/Q bezier) — NOT rectangles
2. FRONT BODICE: curved neckline, sloped shoulders, curved armholes, darted waist.
   - Label "FRONT BODICE" below piece
   - Show: Width ${frontWidth}cm, Length ${frontLength}cm
   - Write "Cut 2" or "Cut 1 on fold"
3. BACK BODICE: higher neckline, center back line
   - Label "BACK BODICE" below piece
   - Show: Width ${backWidth}cm, Length ${frontLength}cm
4. SLEEVE: bell-shaped cap curve, tapered sides
   - Label "SLEEVE" below
   - Show: Length ${sleeveLength}cm, Cap width ${measurements.sleeveWidth}cm

DIMENSION LINES (RED #E8593C, font-size="11", font-family="monospace"):
- Draw horizontal RED double-arrow lines with measurements in CENTIMETERS
- Show width at top, length at side for EACH piece
- Include armhole depth, neckline width on front/back pieces
- ALL measurements must be REAL numbers from the specs above

MARKINGS ON EACH PIECE:
- Cutting line: stroke="#2a1f14" stroke-width="2.5"
- Seam allowance: dashed (#999, dasharray="8,5") 1.5cm INSIDE cutting line
- Grain line: vertical double-arrow centered in piece, label "GRAIN"
- Notch marks: small triangles at shoulder, side seam, sleeve cap points
- Fold line: dot-dash (#666, dasharray="12,4,4,4") with "FOLD" label

LABELS (font-family="monospace", fill="#2a1f14"):
- Piece name: font-size="15" font-weight="bold"
- "Cut X": font-size="12"
- Measurements: font-size="11" fill="#E8593C"

TITLE BLOCK (Zone G, bordered rect):
- "FORGELAB PATTERN" header bold
- Product: "${research.title}"
- Size: ${detectedSize}
- Bust: ${measurements.bust}cm | Waist: ${measurements.waist}cm | Hips: ${measurements.hips}cm
- Seam Allowance: 1.5 cm included
- Scale: Not to scale (dimensions labeled)

Return ONLY raw SVG starting with <svg ending with </svg>. No markdown, no explanation.`;
  }

  // ELECTRONICS
  if (lowerCat === "electronics" || lowerCat.includes("circuit") || lowerCat.includes("device")) {
    return `Generate a detailed TECHNICAL SCHEMATIC / ENGINEERING BLUEPRINT as a complete, valid SVG document for: "${research.title}"

Product details:
  Difficulty: ${research.difficulty}
  Materials:
  ${materials}
  Assembly steps:
  ${steps}

ELECTRONICS BLUEPRINT REQUIREMENTS:
1. Use viewBox="0 0 1400 1000" with width="1400" height="1000"
2. The SVG MUST have width="1400" and height="1000" attributes on the <svg> element
3. Light gray background (#f5f5f0)
4. Include FOUR views:
   - TOP VIEW (main, large, x:30-620 y:30-500): PCB layout showing component placement
   - SIDE VIEW (x:650-1000, y:30-500): Cross-section showing component heights
   - BOTTOM VIEW (x:30-500, y:540-860): Trace routing / solder side
   - SCHEMATIC (x:530-1000, y:540-860): Simplified circuit diagram with standard symbols
5. Draw actual electronic components:
   - ICs as labeled rectangles with pin numbers
   - Capacitors as parallel lines ||
   - Resistors as zigzag lines
   - LEDs as triangle + lines
   - Connectors as labeled rectangular ports
   - Traces as thin lines connecting components
6. Add RED dimension lines (#E8593C) with REAL measurements in mm
7. Include a BILL OF MATERIALS table (x:1030-1380, y:30-500) listing all components
8. Title block (x:1030-1380, y:540-980) with "FORGELAB SCHEMATIC", product title, scale, revision
9. Use stroke="#1a1a18" stroke-width="1.5" for main lines
10. Component labels in font-family="monospace" size 9-11
11. Make it look like a REAL engineering document

Return ONLY the raw SVG markup starting with <svg and ending with </svg>. No markdown fences, no explanation.`;
  }

  // DEFAULT — Furniture / General Engineering Drawing
  return `You are a professional CAD drafter. Generate a clean ENGINEERING BLUEPRINT as SVG for: "${research.title}"

Materials: ${materials}
Steps: ${steps}

CRITICAL LAYOUT — use these EXACT zones to prevent overlap:
- viewBox="0 0 1400 1000", width="1400", height="1000"
- The SVG MUST have width="1400" and height="1000" attributes on the <svg> element
- Background: #f5f5f0

ZONE LAYOUT:
  ZONE A (x:40-580, y:40-520): FRONT VIEW — largest, most detailed view
  ZONE B (x:620-980, y:40-520): SIDE VIEW — profile, same height as front
  ZONE C (x:40-580, y:560-850): TOP VIEW — plan view from above
  ZONE D (x:620-980, y:560-850): ISOMETRIC VIEW — 30° perspective showing 3D form
  ZONE E (x:1020-1380, y:40-450): BILL OF MATERIALS table
  ZONE F (x:1020-1380, y:500-980): TITLE BLOCK + NOTES

DRAWING RULES:
1. Use <path>, <line>, <rect>, <circle> to draw the ACTUAL product shape — NOT placeholders
2. Object lines: stroke="#1a1a18" stroke-width="2"
3. Hidden edges: stroke="#1a1a18" stroke-width="1" stroke-dasharray="8,4"
4. Center lines: stroke="#888" stroke-width="0.5" stroke-dasharray="15,3,3,3"
5. Dimension lines in RED (#E8593C) stroke-width="0.8":
   - Small arrow triangles at each end
   - Measurement text centered above the line, font-size="11"
   - Show ALL key dimensions with REAL measurements in mm/cm
   - Include overall width, height, depth + 4-6 component dimensions
6. Each view gets a centered label: "FRONT VIEW", "SIDE VIEW", etc. font-size="13" font-weight="bold"
7. Keep ALL text and lines INSIDE assigned zones

BILL OF MATERIALS (Zone E):
- Table with columns: #, Part, Qty, Material, Dimensions
- List 4-8 main components with their REAL dimensions
- Use alternating row shading (#f0f0e8 / white)

TITLE BLOCK (Zone F):
- "FORGELAB BLUEPRINT" header in bold
- Product: "${research.title}"
- Scale: 1:10 | Units: mm
- Sheet 1 of 1

STYLE: Clean, precise, minimal — like a real AutoCAD drawing. Generous white space. No clutter.

Return ONLY raw SVG starting with <svg ending with </svg>. No markdown, no explanation.`;
}

async function generateBlueprintWithGemini(
  research: ResearchResult,
  category: string
): Promise<string> {
  const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
  const prompt = buildBlueprintPrompt(research, category);

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a professional technical illustrator. Generate ONLY valid SVG markup — no text before <svg> or after </svg>. Use smooth bezier curves for organic shapes. Keep the layout clean with generous spacing between elements. Never overlap text labels. All text must use font-family='monospace'. Ensure every element stays within its assigned zone coordinates.",
    },
  });

  let svg = response.text || "";

  // Clean up — remove any markdown fences
  svg = svg
    .replace(/```svg\s*/g, "")
    .replace(/```xml\s*/g, "")
    .replace(/```html\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  // Ensure it starts with <svg
  const svgStart = svg.indexOf("<svg");
  if (svgStart > 0) {
    svg = svg.substring(svgStart);
  }

  // Ensure it ends with </svg>
  const svgEnd = svg.lastIndexOf("</svg>");
  if (svgEnd > 0) {
    svg = svg.substring(0, svgEnd + 6);
  }

  if (!svg.startsWith("<svg")) {
    throw new Error("Generated content is not valid SVG");
  }

  return svg;
}
