
// foodDetectionService.js
//
// SPACEBYTE - FOOD DETECTION SERVICE
//
// PURPOSE:
// 1. Analyze food images using OpenAI's vision model.
// 2. Identify foods that are clearly visible in a photograph.
// 3. Compare detected foods against optional target foods.
// 4. Return detection results and a confidence score.
// 5. Handle API errors without crashing the backend.
//
// This service was rewritten in JavaScript from the
// Platemate project's detect_ingredients() Python function.
//
// SETUP:
// 1. Create an OpenAI API key.
// 2. Add the key to backend/.env:
//
//    OPENAI_API_KEY=your-key-here
//
// 3. Make sure .env is listed in backend/.gitignore.
// 4. NEVER commit your API key to GitHub.
//
// REQUIREMENTS:
// Node.js 18 or newer is recommended because this file
// uses the built-in fetch function.


// ==========================================
//          OPENAI API CONFIGURATION
// ==========================================

// OpenAI Chat Completions API endpoint.
// This endpoint receives the image and food detection prompt.
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Select the OpenAI vision model.
//
// The model can be configured through the environment variable
// OPENAI_VISION_MODEL.
//
// If no model is specified, gpt-4o is used as the default.
const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o";


// ==========================================
//          HELPER: FAILED RESULT
// ==========================================

// Create a standard response when food detection fails.
//
// This prevents the application from incorrectly reporting
// that food was detected when the analysis was unsuccessful.
//
// Parameters:
// message - A description of why detection failed.
//
// Returns:
// An object containing an empty detection list,
// a false match value, zero confidence, and an error message.
function failure(message) {
  return {
    detected: [],
    match: false,
    confidence: 0,
    message
  };
}


// ==========================================
//          DETECT FOOD IN A PHOTO
// ==========================================

// Analyze an image to identify visible food items.
//
// Parameters:
//
// imageUrl:
// The image being analyzed.
//
// It can be provided as:
// - A Base64 data URL, such as data:image/jpeg;base64,...
// - A publicly accessible HTTPS image URL.
//
// targets:
// An optional array of food names to search for.
//
// Example:
// ["apple", "mac and cheese"]
//
// If no targets are provided, the model looks for any visible food.
//
// Returns:
// An object containing detected foods, match status,
// confidence score, and a friendly response message.
async function detectFood(imageUrl, targets = []) {

  // ----------------------------------------
  // 1. GET OPENAI API KEY
  // ----------------------------------------

  // Read the OpenAI API key from the backend environment.
  //
  // Keeping the key in .env prevents it from being
  // exposed directly in the frontend application.
  const apiKey = process.env.OPENAI_API_KEY;

  // Check whether the API key is configured.
  //
  // If the key is missing, return a failure response
  // instead of attempting to contact OpenAI.
  if (!apiKey) {
    return failure("Food detection is not set up yet (missing API key).");
  }


  // ----------------------------------------
  // 2. VALIDATE IMAGE INPUT
  // ----------------------------------------

  // Make sure an image was provided and that the image
  // reference is a string.
  //
  // If the image is missing or invalid, return a failure response.
  if (!imageUrl || typeof imageUrl !== "string") {
    return failure("No image was provided.");
  }


  // ----------------------------------------
  // 3. PREPARE FOOD DETECTION TARGETS
  // ----------------------------------------

  // Convert the target food array into a comma-separated string.
  //
  // Example:
  // ["apple", "banana"] becomes "apple, banana".
  //
  // If no target foods are provided, search for any visible food.
  const targetText =
    targets.length > 0 ? targets.join(", ") : "any food";


  // ----------------------------------------
  // 4. CREATE THE IMAGE ANALYSIS PROMPT
  // ----------------------------------------

  // Tell the vision model what information to extract
  // from the submitted food photograph.
  //
  // The instructions ask the model to:
  // - Identify clearly visible foods.
  // - Focus on the requested target foods.
  // - Avoid guessing about foods that cannot be identified.
  // - Return the results in JSON format.
  //
  // The requested JSON fields are:
  // detected   - Array containing detected food names.
  // match      - Whether a target food was found.
  // confidence - Confidence score between 0 and 1.
  // message    - Short response describing the result.
  const prompt =
    `Look at this photo and list the foods you can clearly see. ` +
    `Focus on: ${targetText}. ` +
    `Only list food that is clearly visible. Do not guess. ` +
    `Reply with JSON using these keys: ` +
    `detected (array of strings), ` +
    `match (true if a target food is clearly visible, otherwise false), ` +
    `confidence (number from 0 to 1), ` +
    `message (one short friendly sentence).`;


  // ----------------------------------------
  // 5. SEND IMAGE TO OPENAI
  // ----------------------------------------

  // Use try/catch to handle problems that may occur
  // while communicating with the OpenAI API.
  try {

    // Send an HTTP POST request to OpenAI.
    const response = await fetch(OPENAI_URL, {

      // POST sends the image and instructions for analysis.
      method: "POST",

      // Request headers identify the content type
      // and authenticate the API request.
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },

      // Convert the request information into JSON.
      body: JSON.stringify({

        // Specify which vision model should analyze the image.
        model: MODEL,

        // Request a JSON object instead of an ordinary text response.
        response_format: { type: "json_object" },

        // Provide the instructions and image to the model.
        messages: [

          // System message establishes the model's task.
          {
            role: "system",
            content: "You identify foods in photos. Reply with JSON only."
          },

          // User message contains the detection instructions
          // and the actual image to be analyzed.
          {
            role: "user",
            content: [

              // Send the food detection instructions.
              { type: "text", text: prompt },

              // Send the image as a URL or Base64 data URL.
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ]
      })
    });


    // ----------------------------------------
    // 6. CHECK OPENAI RESPONSE
    // ----------------------------------------

    // Check whether the API request was successful.
    //
    // If OpenAI returns an unsuccessful HTTP status,
    // throw an error so the catch block can handle it.
    if (!response.ok) {
      throw new Error(`OpenAI returned status ${response.status}`);
    }


    // ----------------------------------------
    // 7. READ AND PARSE MODEL RESPONSE
    // ----------------------------------------

    // Convert the API response into a JavaScript object.
    const data = await response.json();

    // Extract the model's response text.
    //
    // Optional chaining (?.) prevents an error if
    // one of the expected response properties is missing.
    const raw = data.choices?.[0]?.message?.content;

    // Convert the model's JSON text into a JavaScript object.
    const parsed = JSON.parse(raw);


    // ----------------------------------------
    // 8. RETURN FOOD DETECTION RESULTS
    // ----------------------------------------

    // Return a consistent response structure.
    //
    // Array.isArray ensures detected is always an array.
    //
    // The strict comparison ensures match is true only
    // when the model returns the Boolean value true.
    //
    // Number converts confidence into a number.
    // The fallback returns zero if the value is invalid.
    //
    // The message fallback provides a default response
    // if the model does not return a message.
    return {
      detected: Array.isArray(parsed.detected) ? parsed.detected : [],
      match: parsed.match === true,
      confidence: Number(parsed.confidence) || 0,
      message: parsed.message || "Detection finished."
    };

  } catch (error) {

    // ----------------------------------------
    // 9. HANDLE FOOD DETECTION ERRORS
    // ----------------------------------------

    // Log the error in the backend terminal.
    // This helps developers troubleshoot API problems.
    console.error("Food detection failed:", error.message);

    // Return a friendly failure response to the application.
    // This avoids exposing internal error details to the frontend.
    return failure("Could not analyze the photo. Please try again.");

  }

}


// ==========================================
//              EXPORT SERVICE
// ==========================================

// Export detectFood so other backend files can import
// and use the food image detection functionality.
module.exports = {
  detectFood
};
