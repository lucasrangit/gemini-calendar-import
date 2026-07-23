/**
 * Local scratch script to test the Gemini event parsing logic.
 * Run this from the root directory:
 *   export GEMINI_API_KEY="your-api-key"
 *   node scratch/test_parser.js
 */

const fs = require('fs');

async function testParser() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is not set.");
    console.log("Usage: GEMINI_API_KEY='AIzaSy...' node scratch/test_parser.js");
    process.exit(1);
  }

  const sampleEventText = `
    Join us for the Berlin Rust Meetup!
    When: Tuesday, August 18, 2026 from 19:00 to 21:30.
    Where: Co-Working Space, 123 Friedrichstraße, 10117 Berlin.
    
    Registration opens next Monday (August 10, 2026) at 09:00 AM local time.
    Ticket link: https://meetup.com/berlin-rust/events/12345
    Tickets are free but RSVP is mandatory due to limited space.
  `;

  console.log("--- Sample Event Text ---");
  console.log(sampleEventText.trim());
  console.log("-------------------------\n");

  console.log("Sending parse request to Gemini API (gemini-2.5-flash)...");

  const systemInstruction = 
    "You are a highly efficient administrative assistant specialized in parsing event information from text and formatting them for Google Calendar. " +
    "Translate all extracted details into English if the source is in another language (e.g. German).\n\n" +
    "RULES:\n" +
    "1. Date & Time: Always assume and label times in Berlin local time (Europe/Berlin, CET/CEST) unless otherwise stated.\n" +
    "2. Time Formats: Output dates as 'YYYY-MM-DD' and times as 24-hour format 'HH:MM:SS'.\n" +
    "3. Default Times: If no times are specified, set startDate and endDate. For time fields, default missing start times to '12:00:00' and end times to '13:00:00', and record this under assumptions.\n" +
    "4. Multiple Consecutive Days: If the event spans multiple consecutive days (e.g. a workshop from June 2 to June 4), output a separate event object in the 'events' array for each day (e.g. one for June 2, one for June 3, one for June 4). IMPORTANT: Each occurrence's description must contain the FULL event details and URLs; do not truncate, abbreviate, or write 'same as day 1'.\n" +
    "5. Recurring Events: If the event repeats (e.g. every Tuesday), output the next 5 occurrences, calculating the dates starting from the current date (Wednesday, July 15, 2026). If the repeating event specifies an end date, do not output occurrences past that end date. Ensure each repeating occurrence contains the identical, full description.\n" +
    "6. Registration & Booking: Extract any registration opening times ('registrationOpenDateTime' in format YYYY-MM-DDTHH:MM:SS), registration links, or requirements. This will be used to create booking reminders.\n" +
    "7. No Event Found: If the text contains no calendar event details, return a JSON containing an 'error' field detailing what was missing.\n\n" +
    "Return ONLY a valid JSON object matching the following structure:\n" +
    "{\n" +
    "  \"events\": [\n" +
    "    {\n" +
    "      \"title\": \"Event Title\",\n" +
    "      \"description\": \"Detailed comprehensive description including all links and URLs, fully populated for every occurrence\",\n" +
    "      \"location\": \"Full Address or Link\",\n" +
    "      \"startDate\": \"YYYY-MM-DD\",\n" +
    "      \"startTime\": \"HH:MM:SS\",\n" +
    "      \"endDate\": \"YYYY-MM-DD\",\n" +
    "      \"endTime\": \"HH:MM:SS\",\n" +
    "      \"timezone\": \"Europe/Berlin\"\n" +
    "    }\n" +
    "  ],\n" +
    "  \"registrationOpenDateTime\": \"YYYY-MM-DDTHH:MM:SS\" (or null),\n" +
    "  \"registrationLink\": \"URL\" (or null),\n" +
    "  \"registrationRequirements\": \"Brief requirements details\" (or null),\n" +
    "  \"missingFields\": [\"list of missing information\"],\n" +
    "  \"assumptions\": [\"list of assumptions made (e.g. defaulted end time to 1 hour after start)\"]\n" +
    "}";

  const payload = {
    contents: [
      {
        parts: [
          {
            text: "Extract event details from the text below. Note that today's date is Wednesday, July 15, 2026.\n\nContent:\n" + sampleEventText
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: systemInstruction
        }
      ]
    },
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error(`Gemini API Error (HTTP ${response.status}):`, responseText);
      process.exit(1);
    }

    const resultJson = JSON.parse(responseText);
    const parsedText = resultJson.candidates[0].content.parts[0].text;
    console.log("--- Extracted JSON Response ---");
    console.log(JSON.stringify(JSON.parse(parsedText), null, 2));
    console.log("--------------------------------");
    console.log("\nSuccess! The parser extracted details matching the required schema.");

  } catch (error) {
    console.error("System error calling Gemini API:", error);
  }
}

testParser();
