const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json({ limit: "10mb" }));

app.use(cors());

// Health check
app.get("/", (req, res) => {
  res.send("🧠 Alt Text AI Server Running");
});

// ---

// ## 🔥 MAIN ENDPOINT

app.post("/generate-alt-text", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    // 1. Download image
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(imageResponse.data, "binary");

    // 2. Convert to base64 (correct way)
    const base64Image = imageBuffer.toString("base64");

    // 3. Send to Ollama
    const ollamaResponse = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llava:latest",
        prompt: `
        You are an accessibility system generating HTML alt text.

        CRITICAL RULES:
        - Output ONLY the alt text string
        - No explanations
        - No storytelling
        - No extra context
        - No adjectives unless necessary for identification
        - Max 15–20 words
        - Focus only on: who + what + where (if needed)
        - If uncertain, be general (person, woman, outdoor scene, etc.)

        BAD EXAMPLE:
        "A young woman stands in front of a stadium looking to her left..."

        GOOD EXAMPLE:
        "Young woman standing outdoors in front of a stadium"

        Return only the alt text.
        `,
        images: [base64Image],
        stream: false,
      },
    );

    // 4. Extract response
    const altText = ollamaResponse.data.response.trim();

    return res.json({
      altText,
    });
  } catch (error) {
    console.error("FULL ERROR:");
    console.error(error);

    if (error.response) {
      console.error("STATUS:", error.response.status);
      console.error("DATA:", error.response.data);
    }
    return res.status(500).json({
      error: "Failed to generate alt text",
    });
  }
});

// ---

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
