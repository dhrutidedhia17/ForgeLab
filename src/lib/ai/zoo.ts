import { GoogleGenAI } from "@google/genai";
import type { Model3DResult, ResearchResult, Model3DView, Model3DSceneData } from "@/types/pipeline";
import { saveFile } from "@/lib/files";

const ZOO_API_KEY = process.env.ZOO_API_KEY;
const ZOO_API_BASE = "https://api.zoo.dev";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TRIPO_API_KEY = process.env.TRIPO_API_KEY;
const TRIPO_API_BASE = "https://api.tripo3d.ai/v2/openapi";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ────────────────────────────────────────────────────────
// Tripo3D: text → GLB 3D model (free 300 credits/month)
// ────────────────────────────────────────────────────────
async function generateModelWithTripo(
  buildId: string,
  research: ResearchResult,
  prompt: string
): Promise<Model3DResult | null> {
  if (!TRIPO_API_KEY) return null;

  try {
    const materials = research.materials.map((m) => m.name).join(", ");
    const tripoPrompt = `${prompt}. Materials: ${materials}. Realistic proportions, high detail.`;

    // 1. Create task
    const createRes = await fetch(`${TRIPO_API_BASE}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TRIPO_API_KEY}`,
      },
      body: JSON.stringify({
        type: "text_to_model",
        prompt: tripoPrompt,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Tripo create error ${createRes.status}: ${errText}`);
    }

    const createData = await createRes.json();
    const taskId = createData.data?.task_id;
    if (!taskId) throw new Error("No task_id returned from Tripo");

    console.log(`[Tripo] Task created: ${taskId}`);

    // 2. Poll for completion (typical: 30-90 seconds)
    let modelUrl: string | null = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      await sleep(5000); // poll every 5s

      const pollRes = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${TRIPO_API_KEY}` },
      });

      if (!pollRes.ok) throw new Error(`Tripo poll error: ${pollRes.status}`);

      const pollData = await pollRes.json();
      const status = pollData.data?.status;
      const progress = pollData.data?.progress || 0;
      console.log(`[Tripo] Status: ${status}, progress: ${progress}%`);

      if (status === "success") {
        modelUrl = pollData.data?.output?.model;
        break;
      }
      if (status === "failed" || status === "banned" || status === "cancelled") {
        throw new Error(`Tripo task ${status}`);
      }
    }

    if (!modelUrl) throw new Error("Tripo task timed out");

    // 3. Download GLB
    const glbRes = await fetch(modelUrl);
    if (!glbRes.ok) throw new Error(`GLB download error: ${glbRes.status}`);
    const glbBuffer = Buffer.from(await glbRes.arrayBuffer());
    const filePath = await saveFile(buildId, "model.glb", glbBuffer);

    console.log(`[Tripo] GLB saved: ${filePath} (${(glbBuffer.length / 1024).toFixed(0)} KB)`);

    return {
      filePath,
      fileName: "model.glb",
      format: "glb",
      views: [],
    };
  } catch (error) {
    console.error("[Tripo] Error:", error);
    return null;
  }
}

// ────────────────────────────────────────────────────────
// Gemini: multi-angle product image renders (fallback)
// ────────────────────────────────────────────────────────
async function generateMultiAngleViews(
  buildId: string,
  research: ResearchResult,
  prompt: string,
  category: string
): Promise<Model3DView[]> {
  if (!GEMINI_API_KEY) return [];

  const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const materials = research.materials.map((m) => m.name).join(", ");
  const lowerCat = category.toLowerCase();

  const isClothing = lowerCat === "clothing" || lowerCat.includes("cloth") || lowerCat.includes("fashion");

  const viewAngles = isClothing
    ? [
        { angle: "Front View", prompt: `Front view of ${prompt} displayed flat on a clean surface, showing the full front of the garment with all details visible — buttons, collar, pockets, etc. Professional fashion photography, studio lighting, light gray background. Materials: ${materials}. Crisp, detailed, catalog quality.` },
        { angle: "Back View", prompt: `Back view of ${prompt} displayed flat on a clean surface, showing the full back of the garment with seam details, back neckline, any back design elements. Professional fashion photography, studio lighting, light gray background. Materials: ${materials}. Crisp, detailed, catalog quality.` },
        { angle: "Detail Close-up", prompt: `Extreme close-up detail shot of ${prompt} focusing on the most interesting design element — the collar, buttons, fabric texture, stitching, or embellishment. Macro photography, shallow depth of field, studio lighting. Materials: ${materials}. Show the quality of craftsmanship.` },
      ]
    : [
        { angle: "Front View", prompt: `Front view of a completed ${prompt}. Professional studio product photography, clean white/light gray background, perfect lighting showing all front-facing details. Materials: ${materials}. 4K catalog quality, photorealistic.` },
        { angle: "3/4 Angle", prompt: `Three-quarter angle view of a completed ${prompt}, showing depth and dimension. Professional studio product photography, clean background, dramatic lighting highlighting the form and materials. Materials: ${materials}. 4K quality.` },
        { angle: "Detail Close-up", prompt: `Extreme close-up detail shot of ${prompt} focusing on the most interesting feature — joints, texture, mechanism, or craftsmanship detail. Macro photography, shallow depth of field. Materials: ${materials}. Show the quality.` },
      ];

  const views: Model3DView[] = [];

  const viewPromises = viewAngles.map(async (view, i) => {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: [{ role: "user", parts: [{ text: view.prompt }] }],
        config: { responseModalities: ["IMAGE", "TEXT"] },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          const mimeType = part.inlineData.mimeType || "image/png";
          const ext = mimeType.includes("png") ? "png" : "jpg";
          const fileName = `model_view_${i + 1}.${ext}`;
          const filePath = await saveFile(buildId, fileName, imageData);
          return { angle: view.angle, filePath, fileName };
        }
      }
    } catch (error) {
      console.error(`View generation error for ${view.angle}:`, error);
    }
    return null;
  });

  const results = await Promise.allSettled(viewPromises);
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      views.push(result.value);
    }
  }

  return views;
}

// ────────────────────────────────────────────────────────
// Gemini: procedural 3D scene (free, interactive Three.js)
// ────────────────────────────────────────────────────────
async function generateProceduralScene(
  buildId: string,
  research: ResearchResult,
  prompt: string,
  category: string
): Promise<Model3DResult | null> {
  if (!GEMINI_API_KEY) return null;

  const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const materials = research.materials.map((m) => `${m.name} (${m.specification})`).join(", ");
  const lowerCat = category.toLowerCase();

  let categoryGuide = "";
  if (lowerCat.includes("furniture") || lowerCat.includes("house")) {
    categoryGuide = `This is furniture/structural. Use boxes for surfaces, shelves, panels. Use cylinders for legs, dowels, supports. Use realistic wood colors (#8B4513, #A0522D, #D2691E) with metalness=0.05, roughness=0.8. For metal hardware use #888888 with metalness=0.8, roughness=0.3.`;
  } else if (lowerCat.includes("cloth") || lowerCat.includes("fashion")) {
    categoryGuide = `This is clothing/fabric. Use flat boxes and planes for fabric panels. Use cylinders for sleeves and collars. Use soft muted colors matching the garment. Set roughness=0.9, metalness=0.0 for fabric. For buttons use small cylinders with metalness=0.5.`;
  } else if (lowerCat.includes("electron") || lowerCat.includes("appliance")) {
    categoryGuide = `This is electronics/appliance. Use boxes for enclosures and circuit boards. Use cylinders for knobs, ports, and capacitors. Use dark colors (#222222, #333333) with metalness=0.3, roughness=0.4. For screens use planes with color=#1a1a2e, opacity=0.9.`;
  } else if (lowerCat.includes("vehicle")) {
    categoryGuide = `This is a vehicle. Use boxes for body panels, cylinders for wheels and axles. Use metallic colors with metalness=0.6, roughness=0.3.`;
  } else {
    categoryGuide = `Use appropriate shapes and colors for the product. Choose metalness and roughness based on materials.`;
  }

  const scenePrompt = `You are a 3D scene designer. Given a product description, generate a JSON object that defines a 3D scene using geometric primitives. Be creative and detailed — use many shapes to approximate the real product form.

Product: ${prompt}
Materials: ${materials}
Category: ${category}

${categoryGuide}

Output ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "shapes": [
    {
      "type": "box" | "cylinder" | "sphere" | "plane" | "cone" | "torus",
      "position": [x, y, z],
      "size": [width, height, depth],
      "rotation": [rx, ry, rz],
      "color": "#hex",
      "label": "part name",
      "metalness": 0.0-1.0,
      "roughness": 0.0-1.0,
      "opacity": 0.0-1.0
    }
  ],
  "dimensions": { "width": cm, "height": cm, "depth": cm }
}

Rules:
- Use 10-25 shapes to approximate the product's form with good detail
- Position shapes so the bottom sits at y=0 (ground level), centered on x=0, z=0
- Use scale where 1 unit = ~10cm for manageable rendering
- For cylinders: size[0]=diameter, size[1]=height
- For spheres: size[0]=diameter
- Set dimensions to real-world cm measurements of the finished product
- Compose multiple primitives to build complex forms
- rotation values are in radians
- Use varied colors and materials to make it visually rich

Example for "wooden coffee table":
{"shapes":[{"type":"box","position":[0,0.45,0],"size":[1.2,0.05,0.6],"color":"#8B4513","label":"tabletop","metalness":0.05,"roughness":0.8},{"type":"cylinder","position":[-0.5,0.2,-0.2],"size":[0.06,0.4,0.06],"color":"#A0522D","label":"front-left leg","metalness":0.05,"roughness":0.8},{"type":"cylinder","position":[0.5,0.2,-0.2],"size":[0.06,0.4,0.06],"color":"#A0522D","label":"front-right leg","metalness":0.05,"roughness":0.8},{"type":"cylinder","position":[-0.5,0.2,0.2],"size":[0.06,0.4,0.06],"color":"#A0522D","label":"back-left leg","metalness":0.05,"roughness":0.8},{"type":"cylinder","position":[0.5,0.2,0.2],"size":[0.06,0.4,0.06],"color":"#A0522D","label":"back-right leg","metalness":0.05,"roughness":0.8},{"type":"box","position":[0,0.1,0],"size":[1.0,0.03,0.5],"color":"#A0522D","label":"shelf","metalness":0.05,"roughness":0.8}],"dimensions":{"width":120,"height":45,"depth":60}}`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: scenePrompt }] }],
    });

    const text = response.text || "";
    let jsonStr = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const sceneData = JSON.parse(jsonStr) as Model3DSceneData;

    if (!sceneData.shapes || sceneData.shapes.length === 0) return null;

    for (const shape of sceneData.shapes) {
      if (!shape.type || !shape.position || !shape.size || !shape.color) return null;
    }

    const sceneJson = JSON.stringify(sceneData, null, 2);
    const filePath = await saveFile(buildId, "scene.json", sceneJson);

    console.log(`[Procedural 3D] Generated scene with ${sceneData.shapes.length} shapes`);

    return {
      filePath,
      fileName: "scene.json",
      format: "procedural",
      sceneData,
    };
  } catch (error) {
    console.error("Procedural scene generation error:", error);
    return null;
  }
}

// ────────────────────────────────────────────────────────
// Main: Tripo (GLB) → Procedural 3D → Zoo.dev → Gemini views
// ────────────────────────────────────────────────────────
export async function generateModel(
  buildId: string,
  research: ResearchResult,
  prompt: string,
  category: string = "Other"
): Promise<{ result: Model3DResult; isMock: boolean }> {

  // ① Tripo3D — generates real interactive GLB models
  const tripoResult = await generateModelWithTripo(buildId, research, prompt);
  if (tripoResult) {
    // Also generate multi-angle views in background for the image carousel
    const views = await generateMultiAngleViews(buildId, research, prompt, category);
    tripoResult.views = views;
    return { result: tripoResult, isMock: false };
  }

  // ② Procedural 3D scene with Gemini (free, interactive Three.js)
  try {
    const [proceduralResult, views] = await Promise.all([
      generateProceduralScene(buildId, research, prompt, category),
      generateMultiAngleViews(buildId, research, prompt, category),
    ]);

    if (proceduralResult) {
      proceduralResult.views = views;
      return { result: proceduralResult, isMock: false };
    }

    if (views.length > 0) {
      return {
        result: {
          filePath: views[0].filePath,
          fileName: views[0].fileName,
          format: "multi-view",
          views,
        },
        isMock: false,
      };
    }
  } catch (error) {
    console.error("Procedural 3D / multi-angle error:", error);
  }

  // ③ Zoo.dev — STEP CAD files (when API key is available)
  if (ZOO_API_KEY) {
    try {
      const dimensions = research.materials
        .filter((m) => m.specification)
        .map((m) => `${m.name}: ${m.specification}`)
        .join("; ");

      const cadPrompt = `${prompt}. Dimensions and specs: ${dimensions}. Create a detailed 3D model with accurate proportions.`;

      const createResponse = await fetch(`${ZOO_API_BASE}/ai/text-to-cad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ZOO_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: cadPrompt,
          output_format: "step",
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Zoo.dev API error: ${createResponse.status}`);
      }

      const createData = await createResponse.json();
      const operationId = createData.id;

      if (!operationId && createData.outputs && createData.status === "completed") {
        const stepData = createData.outputs["source.step"];
        if (stepData) {
          const fileData = Buffer.from(stepData, "base64");
          const filePath = await saveFile(buildId, "model.step", fileData);
          return {
            result: { filePath, fileName: "model.step", format: "STEP" },
            isMock: false,
          };
        }
      }

      if (operationId) {
        let delay = 5000;
        for (let attempt = 0; attempt < 10; attempt++) {
          await sleep(delay);
          const pollResponse = await fetch(
            `${ZOO_API_BASE}/async/operations/${operationId}`,
            { headers: { Authorization: `Bearer ${ZOO_API_KEY}` } }
          );
          if (!pollResponse.ok) throw new Error(`Poll error: ${pollResponse.status}`);
          const pollData = await pollResponse.json();
          if (pollData.status === "completed") {
            const stepData = pollData.outputs?.["source.step"];
            if (stepData) {
              const fileData = Buffer.from(stepData, "base64");
              const filePath = await saveFile(buildId, "model.step", fileData);
              return {
                result: { filePath, fileName: "model.step", format: "STEP" },
                isMock: false,
              };
            }
          }
          if (pollData.status === "failed") throw new Error("Generation failed");
          delay = Math.min(delay * 1.5, 30000);
        }
      }
    } catch (error) {
      console.error("Zoo.dev model error:", error);
    }
  }

  // ③ Gemini multi-angle image views (fallback)
  const views = await generateMultiAngleViews(buildId, research, prompt, category);
  if (views.length > 0) {
    return {
      result: {
        filePath: views[0].filePath,
        fileName: views[0].fileName,
        format: "multi-view",
        views,
      },
      isMock: false,
    };
  }

  // ④ Full mock
  return {
    result: {
      filePath: `/outputs/${buildId}/model.json`,
      fileName: "model.json",
      format: "mock",
      views: [],
    },
    isMock: true,
  };
}
