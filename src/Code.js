/**
 * Serves the Web App UI.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Berlin Events Calendar Importer')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Fetch the user's calendars to display in the UI dropdown.
 */
function getUserCalendars() {
  try {
    var calendars = CalendarApp.getAllCalendars();
    var list = [];
    for (var i = 0; i < calendars.length; i++) {
      try {
        list.push({
          id: calendars[i].getId(),
          name: calendars[i].getName(),
          isPrimary: calendars[i].isMyPrimaryCalendar()
        });
      } catch (err) {
        // Skip calendars that cannot be read or are system-restricted
      }
    }
    return { success: true, calendars: list };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Parses event details from text or a URL using the Gemini API.
 */
function parseEventText(textOrUrl) {
  try {
    var textToParse = textOrUrl.trim();
    var isUrl = false;

    // 1. Fetch URL contents if a URL is provided
    if (textToParse.toLowerCase().startsWith('http://') || textToParse.toLowerCase().startsWith('https://')) {
      isUrl = true;
      try {
        var response = UrlFetchApp.fetch(textToParse, {
          muteHttpExceptions: true,
          followRedirects: true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        var code = response.getResponseCode();
        if (code !== 200) {
          return {
            success: false,
            errorType: 'URL_FETCH_FAILED',
            message: 'Failed to access the website. Server returned HTTP status ' + code + '. Please copy-paste the text of the page instead.'
          };
        }

        var html = response.getContentText();
        textToParse = cleanHtml(html);

        if (textToParse.length < 50) {
          return {
            success: false,
            errorType: 'URL_FETCH_FAILED',
            message: 'The website returned little or no readable text. It might be protected by bot blocks or requires login. Please copy-paste the text of the page instead.'
          };
        }
      } catch (fetchError) {
        return {
          success: false,
          errorType: 'URL_FETCH_FAILED',
          message: 'Error accessing the website: ' + fetchError.toString() + '. Please copy-paste the text of the page instead.'
        };
      }
    }

    // 2. Call Gemini API via GeminiService
    var systemInstruction =
      "You are a highly efficient administrative assistant specialized in parsing event information from text and formatting them for Google Calendar. " +
      "Translate all extracted details into English if the source is in another language (e.g. German).\n\n" +
      "RULES:\n" +
      "1. Date & Time: Always assume and label times in Berlin local time (Europe/Berlin, CET/CEST) unless otherwise stated.\n" +
      "2. Time Formats: Output dates as 'YYYY-MM-DD' and times as 24-hour format 'HH:MM' (without seconds precision).\n" +
      "3. Default Times: If no times are specified, set date. For time fields, default missing start times to '12:00' and end times to '13:00', and record this under assumptions.\n" +
      "4. Multiple Consecutive Days: If the event spans multiple consecutive days (e.g. a workshop from June 2 to June 4), output a separate event object in the 'events' array for each day (e.g. one for June 2, one for June 3, one for June 4). IMPORTANT: Each occurrence's description must contain the FULL event details and URLs; do not truncate, abbreviate, or write 'same as day 1'.\n" +
      "5. Recurring Events: If the event repeats (e.g. every Tuesday), output the next 5 occurrences, calculating the dates starting from the current date (Wednesday, July 15, 2026). If the repeating event specifies an end date, do not output occurrences past that end date. Ensure each repeating occurrence contains the identical, full description.\n" +
      "6. Registration & Booking: Extract any registration opening times ('registrationOpenDateTime' in format YYYY-MM-DDTHH:MM), registration links, or requirements. This will be used to create booking reminders.\n" +
      "7. No Event Found: If the text contains no calendar event details, return a JSON containing an 'error' field detailing what was missing.\n\n" +
      "Return ONLY a valid JSON object matching the following structure:\n" +
      "{\n" +
      "  \"events\": [\n" +
      "    {\n" +
      "      \"title\": \"Event Title\",\n" +
      "      \"description\": \"Detailed comprehensive description including all links and URLs, fully populated for every occurrence\",\n" +
      "      \"location\": \"Full Address or Link\",\n" +
      "      \"date\": \"YYYY-MM-DD\",\n" +
      "      \"startTime\": \"HH:MM\",\n" +
      "      \"endTime\": \"HH:MM\",\n" +
      "      \"timezone\": \"Europe/Berlin\"\n" +
      "    }\n" +
      "  ],\n" +
      "  \"registrationOpenDateTime\": \"YYYY-MM-DDTHH:MM\" (or null),\n" +
      "  \"registrationLink\": \"URL\" (or null),\n" +
      "  \"registrationRequirements\": \"Brief requirements details\" (or null),\n" +
      "  \"missingFields\": [\"list of missing information\"],\n" +
      "  \"assumptions\": [\"list of assumptions made (e.g. defaulted end time to 1 hour after start)\"]\n" +
      "}";

    var prompt = "Extract event details from the text below. Note that today's date is Wednesday, July 15, 2026.\n\nContent:\n" + textToParse;

    var result = generateContent(prompt, systemInstruction);
    if (!result.success) {
      return result;
    }

    var parsedData = JSON.parse(result.text.trim());

    if (parsedData.error) {
      return {
        success: false,
        errorType: 'NO_EVENT_FOUND',
        message: parsedData.error
      };
    }

    return {
      success: true,
      data: parsedData,
      rawInputUsed: isUrl ? "URL content successfully fetched." : "Pasted text."
    };

  } catch (e) {
    return {
      success: false,
      errorType: 'SYSTEM_ERROR',
      message: e.toString()
    };
  }
}

/**
 * Strips HTML tags and script elements, returning clean, condensed text.
 */
function cleanHtml(html) {
  var cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  cleaned = cleaned.replace(/&nbsp;/gi, ' ')
                   .replace(/&lt;/gi, '<')
                   .replace(/&gt;/gi, '>')
                   .replace(/&amp;/gi, '&')
                   .replace(/&quot;/gi, '"')
                   .replace(/&#39;/gi, "'");
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Truncate text to avoid payload limit issues (e.g. maximum 60,000 characters)
  if (cleaned.length > 60000) {
    cleaned = cleaned.substring(0, 60000) + "... [truncated due to length]";
  }
  return cleaned;
}

/**
 * Generates a clickable Google Calendar event URL using Base64 eid encoding.
 */
function getCalendarEventUrl(rawEventId, rawCalendarId) {
  if (!rawEventId) return '';
  var cleanEventId = rawEventId.replace(/@google\.com$/g, '');
  var cleanCalId = (rawCalendarId || '').replace(/@google\.com$/g, '');
  var encoded = Utilities.base64Encode(cleanEventId + ' ' + cleanCalId);
  return 'https://calendar.google.com/calendar/event?eid=' + encoded;
}

/**
 * Creates Google Calendar events based on the user-verified UI data.
 */
function createCalendarEvents(payload) {
  var createdEvents = [];
  var diagnosticInfo = {
    targetCalendarId: payload.calendarId,
    apiParameters: [],
    errors: []
  };

  try {
    var calendarId = payload.calendarId;
    var calendar = CalendarApp.getCalendarById(calendarId);

    if (!calendar) {
      throw new Error("Calendar not found with ID: " + calendarId + ". Make sure you have authorized access and it exists.");
    }

    var eventsToCreate = payload.events;

    for (var i = 0; i < eventsToCreate.length; i++) {
      var ev = eventsToCreate[i];

      // Parse dates and times in local context
      var sTime = (ev.startTime || '12:00').trim();
      if (sTime.length === 5) sTime += ':00';

      var eTime = (ev.endTime || '13:00').trim();
      if (eTime.length === 5) eTime += ':00';

      var eventDate = ev.date || ev.startDate || new Date().toISOString().split('T')[0];

      var startStr = eventDate + 'T' + sTime;
      var endStr = eventDate + 'T' + eTime;

      var startVar = new Date(startStr);
      var endVar = new Date(endStr);

      if (isNaN(startVar.getTime()) || isNaN(endVar.getTime())) {
        throw new Error("Invalid start/end date time formatting: " + startStr + " or " + endStr);
      }

      var options = {
        description: ev.description,
        location: ev.location
      };

      diagnosticInfo.apiParameters.push({
        type: 'MAIN_EVENT',
        title: ev.title,
        start: startStr,
        end: endStr,
        options: options
      });

      var newEvent = calendar.createEvent(ev.title, startVar, endVar, options);
      var eventUrl = getCalendarEventUrl(newEvent.getId(), calendarId);

      createdEvents.push({
        id: newEvent.getId(),
        title: ev.title,
        date: eventDate,
        startTime: (ev.startTime || '12:00').substring(0, 5),
        endTime: (ev.endTime || '13:00').substring(0, 5),
        url: eventUrl
      });
    }

    // Create Booking/Registration reminder if applicable
    if (payload.registrationOpenDateTime) {
      var regTimeStr = payload.registrationOpenDateTime;
      if (regTimeStr.length === 16) regTimeStr += ':00';
      var regTime = new Date(regTimeStr);

      if (!isNaN(regTime.getTime())) {
        var regEndTime = new Date(regTime.getTime() + 15 * 60 * 1000); // 15 mins long

        var dateLabel = "";
        if (eventsToCreate.length > 0) {
          var firstDate = new Date(eventsToCreate[0].date || eventsToCreate[0].startDate);
          var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          if (!isNaN(firstDate.getTime())) {
            dateLabel = " (" + months[firstDate.getMonth()] + " " + firstDate.getDate() + ")";
          }
        }

        var regTitle = "BOOKING: " + eventsToCreate[0].title + dateLabel;
        var regDesc = "Task to book the event.\n\nLink: " + (payload.registrationLink || "Not specified") +
                       "\nRequirements: " + (payload.registrationRequirements || "None");

        var regOptions = {
          description: regDesc
        };

        diagnosticInfo.apiParameters.push({
          type: 'BOOKING_REMINDER',
          title: regTitle,
          start: regTimeStr,
          end: regEndTime.toISOString(),
          options: regOptions
        });

        var regEvent = calendar.createEvent(regTitle, regTime, regEndTime, regOptions);

        // Remove default notifications and add custom 5-minute notification
        regEvent.removeAllReminders();
        regEvent.addPopupReminder(5);

        var regUrl = getCalendarEventUrl(regEvent.getId(), calendarId);

        createdEvents.push({
          id: regEvent.getId(),
          title: regTitle,
          date: regTimeStr.split('T')[0],
          startTime: (regTimeStr.split('T')[1] || '').substring(0, 5),
          url: regUrl,
          isBooking: true
        });
      }
    }

    // Verification: check if the created event IDs can be retrieved
    var verified = true;
    for (var j = 0; j < createdEvents.length; j++) {
      try {
        var fetched = calendar.getEventById(createdEvents[j].id);
        if (!fetched) {
          verified = false;
        }
      } catch (e) {
        verified = false;
      }
    }

    return {
      success: true,
      verified: verified,
      createdCount: eventsToCreate.length,
      bookingCreated: !!payload.registrationOpenDateTime,
      events: createdEvents
    };

  } catch (e) {
    diagnosticInfo.errors.push(e.toString());
    return {
      success: false,
      errorType: 'CALENDAR_WRITE_FAILED',
      message: e.toString(),
      diagnosticInfo: diagnosticInfo
    };
  }
}
