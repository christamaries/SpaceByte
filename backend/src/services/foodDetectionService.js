// foodDetectionService.js
//
// Food detection using OpenAI's vision model.
// Rewritten in JavaScript from the Platemate project's
// detect_ingredients() function (Python).
//
// Setup:
// 1. Create an OpenAI API key and put it in backend/.env:
//      OPENAI_API_KEY=your-key-here
// 2. Make sure .env is listed in backend/.gitignore.
//    NEVER commit the key to GitHub.
//
// Requires Node 18 or newer (for the built-in fetch function).

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Change this if the model name stops working.
const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o";


// ==========================================
// HELPER: FAILED RESULT
// ==========================================

// Used whenever detection does not work.
// We report "no match" instead of pretending we found food.
function failure(message) {
  return {
    detected: [],
    match: false,
    confidence: 0,
    message
  };
}


// ==========================================
// DETECT FOOD IN A PHOTO
// ==========================================

// imageUrl: a data URL ("data:image/jpeg;base64,...") or
//           a public https:// link to the image.
// targets:  optional array of food names to look for,
//           like ["apple", "mac and cheese"].
async function detectFood(imageUrl, targets = []) {

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return failure("Food detection is not set up yet (missing API key).");
  }

  if (!imageUrl || typeof imageUrl !== "string") {
    return failure("No image was provided.");
  }

  const targetText =
    targets.length > 0 ? targets.join(", ") : "any food";

  const prompt =
    `Look at this photo and list the foods you can clearly see. ` +
    `Focus on: ${targetText}. ` +
    `Only list food that is clearly visible. Do not guess. ` +
    `Reply with JSON using these keys: ` +
    `detected (array of strings), ` +
    `match (true if a target food is clearly visible, otherwise false), ` +
    `confidence (number from 0 to 1), ` +
    `message (one short friendly sentence).`;

  try {

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You identify foods in photos. Reply with JSON only."
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned status ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    // Turn the model's text reply into an object.
    const parsed = JSON.parse(raw);

    return {
      detected: Array.isArray(parsed.detected) ? parsed.detected : [],
      match: parsed.match === true,
      confidence: Number(parsed.confidence) || 0,
      message: parsed.message || "Detection finished."
    };

  } catch (error) {

    console.error("Food detection failed:", error.message);

    return failure("Could not analyze the photo. Please try again.");

  }

}


// Export the function so other files can use it.
module.exports = {
  detectFood
};
