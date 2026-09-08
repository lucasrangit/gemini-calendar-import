const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
const GEMINI_ENDPOINT = PropertiesService.getScriptProperties().getProperty('GEMINI_ENDPOINT');

/**
 * Calls the Gemini API with the given prompt and system instruction.
 *
 * @param {Object|string} prompt - User content part (with inlineData) or text to send to Gemini.
 * @param {string} [systemInstruction] - System instructions to guide model behavior.
 * @return {Object} { success: boolean, text?: string, errorType?: string, message?: string }
 */
function generateContent(prompt, systemInstruction) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in Script Properties.");
    }
    if (!GEMINI_ENDPOINT) {
      throw new Error("GEMINI_ENDPOINT is not set in Script Properties.");
    }

    var apiUrl = `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`;

    var payload = {
    contents: [
        {
          role: "user",
          parts: [typeof prompt === "string" ? { text: prompt } : prompt]
        }
      ],
      "generationConfig": {
        "responseMimeType": "application/json"
      }
    };

    if (systemInstruction) {
      payload["systemInstruction"] = {
        "parts": [
          {
            "text": systemInstruction
          }
        ]
      };
    }

    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    var response = UrlFetchApp.fetch(apiUrl, options);
    var responseText = response.getContentText();
    var status = response.getResponseCode();

    if (status !== 200) {
      return {
        success: false,
        errorType: 'GEMINI_API_ERROR',
        message: 'Gemini API returned error code ' + status + ': ' + responseText
      };
    }

    var resultJson = JSON.parse(responseText);
    if (!resultJson.candidates || resultJson.candidates.length === 0) {
      return {
        success: false,
        errorType: 'GEMINI_API_ERROR',
        message: 'No response candidate received from Gemini.'
      };
    }

    var candidateText = resultJson.candidates[0].content.parts[0].text;
    return {
      success: true,
      text: candidateText
    };

  } catch (e) {
    return {
      success: false,
      errorType: 'SYSTEM_ERROR',
      message: e.toString()
    };
  }
}
