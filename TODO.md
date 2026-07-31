# TODO

## Backend Changes (`src/Code.js`)
- [x] **Simplify Gemini schema**: Update the `systemInstruction` prompt to return a single `date` field instead of separate `startDate`/`endDate` fields.
- [x] **Adjust event generation**: Refactor `createCalendarEvents()` to parse `ev.date` for both event start/end times.
- [x] **Generate clickable Google Calendar links**:
  - [x] Implement Base64 encoding: `Utilities.base64Encode(rawEventId + " " + calendarId)` (after stripping `@google.com`).
  - [x] Include the computed `url` for both main events and booking reminder events in the returned response.
- [ ] Keep the original URL if provided in the event details.
- [ ] use time based caching of http fetch

## Frontend Interface (`src/Index.html`)
- [x] Create consistent card layouts (`.card`) and text typography (`.section-header`) for both "Common Event Details" and "Date & Time Occurrences".
- [x] Set text inputs, textareas, and select elements to `width: 100%` within cards.
- [x] Adjust `addOccurrenceRow` to use a `grid-3` layout (`Date`, `Start Time`, `End Time`) and accept only a single date value.
- [x] Remove start/end date selectors in favor of a single `Date` field.
- [x] **Map preview**:
  - [x] Add an embedded Google Map iframe below the Location text field.
  - [x] Implement dynamic map updates pointing to `https://maps.google.com/maps?q={address}&output=embed` with a wide zoom (`z=13`) that updates as the user types.
- [x] Update the success message screen to render created events as clickable hyperlinks using their respective returned calendar event URLs.
- [ ] feat: instead of "remove" occurrence, use a toggle so it can be added back
- [ ] feat: for recurring events a single calendar view to make it easy to toggle which days to import
- [ ] remove "occurrences" from UI, not needed
- [ ] layout of occurrences is poor, lots of wasted space and poor alignment
