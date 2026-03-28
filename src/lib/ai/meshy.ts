import { saveFile } from "@/lib/files";

// Supports both Meshy.ai and Tripo3D (free tier)
const MESHY_API_KEY = process.env.MESHY_API_KEY;
const TRIPO_API_KEY = process.env.TRIPO_API_KEY;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try Tripo3D first (free tier: 300 credits/month), then Meshy as fallback.
 */
export async function generateMeshyModel(
  buildId: string,
  prompt: string,
  category: string
): Promise<{ filePath: string; fileName: string } | null> {
  // Try Tripo3D first (free tier available)
  if (TRIPO_API_KEY) {
    const result = await generateWithTripo(buildId, prompt, category);
    if (result) return result;
  }

  // Fallback to Meshy.ai (paid only)
  if (MESHY_API_KEY) {
    const result = await generateWithMeshy(buildId, prompt, category);
    if (result) return result;
  }

  return null;
}

// ─── Tripo3D Integration (FREE tier: 300 credits/month) ───

async function generateWithTripo(
  buildId: string,
  prompt: string,
  category: string
): Promise<{ filePath: string; fileName: string } | null> {
  const API_BASE = "https://api.tripo3d.ai/v2/openapi";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TRIPO_API_KEY}`,
  };

  try {
    const lowerCat = category.toLowerCase();
    const isClothing =
      lowerCat === "clothing" ||
      lowerCat.includes("cloth") ||
      lowerCat.includes("fashion");

    const enhancedPrompt = isClothing
      ? `${prompt}. Displayed on a mannequin or dress form. Detailed fabric folds, seams, and texture. Clean studio background.`
      : `${prompt}. Detailed, realistic proportions, accurate materials. Clean studio-quality 3D model.`;

    // Step 1: Create task
    const createRes = await fetch(`${API_BASE}/task`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "text_to_model",
        prompt: enhancedPrompt,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Tripo create error:", createRes.status, errText);
      return null;
    }

    const createData = await createRes.json();
    if (createData.code !== 0) {
      console.error("Tripo create error:", createData);
      return null;
    }

    const taskId = createData.data?.task_id;
    if (!taskId) {
      console.error("Tripo: no task_id returned");
      return null;
    }

    console.log(`Tripo task created: ${taskId}`);

    // Step 2: Poll for completion
    let delay = 3000;
    for (let attempt = 0; attempt < 60; attempt++) {
      await sleep(delay);

      const pollRes = await fetch(`${API_BASE}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${TRIPO_API_KEY}` },
      });

      if (!pollRes.ok) {
        console.error("Tripo poll error:", pollRes.status);
        continue;
      }

      const pollData = await pollRes.json();
      const status = pollData.data?.status;
      const progress = pollData.data?.progress || 0;
      console.log(`Tripo task ${taskId}: status=${status}, progress=${progress}%`);

      if (status === "success") {
        // Get the GLB download URL
        const glbUrl =
          pollData.data?.output?.pbr_model ||
          pollData.data?.output?.model;

        if (!glbUrl) {
          console.error("Tripo: no model URL in output");
          return null;
        }

        // Download the GLB
        const glbRes = await fetch(glbUrl);
        if (!glbRes.ok) {
          console.error("Tripo: failed to download GLB:", glbRes.status);
          return null;
        }

        const glbData = Buffer.from(await glbRes.arrayBuffer());
        const filePath = await saveFile(buildId, "model.glb", glbData);
        console.log(`Tripo model saved: ${filePath} (${(glbData.length / 1024).toFixed(0)}KB)`);
        return { filePath, fileName: "model.glb" };
      }

      if (status === "failed" || status === "banned") {
        console.error(`Tripo task ${status}`);
        return null;
      }

      // Backoff: 3s → 4s → 5s → ... max 8s
      delay = Math.min(delay + 1000, 8000);
    }

    console.error("Tripo: polling timeout");
    return null;
  } catch (error) {
    console.error("Tripo error:", error);
    return null;
  }
}

// ─── Meshy.ai Integration (paid) ───

async function generateWithMeshy(
  buildId: string,
  prompt: string,
  category: string
): Promise<{ filePath: string; fileName: string } | null> {
  const MESHY_API_BASE = "https://api.meshy.ai/openapi/v2";

  try {
    const lowerCat = category.toLowerCase();
    const isClothing =
      lowerCat === "clothing" ||
      lowerCat.includes("cloth") ||
      lowerCat.includes("fashion");

    const enhancedPrompt = isClothing
      ? `${prompt}. Displayed on a mannequin or dress form. Detailed fabric folds and texture. Studio lighting, clean background.`
      : `${prompt}. Detailed, realistic proportions. Clean, studio-quality 3D model.`;

    // Step 1: Create task
    const createResponse = await fetch(`${MESHY_API_BASE}/text-to-3d`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MESHY_API_KEY}`,
      },
      body: JSON.stringify({
        mode: "preview",
        prompt: enhancedPrompt,
        art_style: "realistic",
        should_remesh: true,
      }),
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      console.error("Meshy create error:", createResponse.status, errText);
      return null;
    }

    const createData = await createResponse.json();
    const taskId = createData.result;

    if (!taskId) {
      console.error("Meshy: no task ID returned");
      return null;
    }

    console.log(`Meshy task created: ${taskId}`);

    // Step 2: Poll for completion
    let delay = 3000;
    for (let attempt = 0; attempt < 40; attempt++) {
      await sleep(delay);

      const pollResponse = await fetch(
        `${MESHY_API_BASE}/text-to-3d/${taskId}`,
        { headers: { Authorization: `Bearer ${MESHY_API_KEY}` } }
      );

      if (!pollResponse.ok) {
        console.error("Meshy poll error:", pollResponse.status);
        continue;
      }

      const pollData = await pollResponse.json();
      console.log(
        `Meshy task ${taskId}: status=${pollData.status}, progress=${pollData.progress}%`
      );

      if (pollData.status === "SUCCEEDED") {
        const glbUrl = pollData.model_urls?.glb;
        if (!glbUrl) {
          console.error("Meshy: no GLB URL in result");
          return null;
        }

        const glbResponse = await fetch(glbUrl);
        if (!glbResponse.ok) {
          console.error("Meshy: failed to download GLB");
          return null;
        }

        const glbData = Buffer.from(await glbResponse.arrayBuffer());
        const filePath = await saveFile(buildId, "model.glb", glbData);
        console.log(`Meshy model saved: ${filePath}`);
        return { filePath, fileName: "model.glb" };
      }

      if (pollData.status === "FAILED") {
        console.error(
          "Meshy task failed:",
          pollData.task_error?.message || "Unknown error"
        );
        return null;
      }

      delay = Math.min(delay * 1.3, 10000);
    }

    console.error("Meshy: polling timeout");
    return null;
  } catch (error) {
    console.error("Meshy error:", error);
    return null;
  }
}
