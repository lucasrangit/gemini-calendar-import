# TODO

## Backend Changes (`src/Code.js`)
- [ ] **Simplify Gemini schema**: Update the `systemInstruction` prompt to return a single `date` field instead of separate `startDate`/`endDate` fields.
- [ ] **Adjust event generation**: Refactor `createCalendarEvents()` to parse `ev.date` for both event start/end times.
- [ ] **Generate clickable Google Calendar links**:
  - [ ] Implement Base64 encoding: `Utilities.base64Encode(rawEventId + " " + calendarId)` (after stripping `@google.com`).
  - [ ] Include the computed `url` for both main events and booking reminder events in the returned response.

## Frontend Interface (`src/Index.html`)
- [ ] Create consistent card layouts (`.card`) and text typography (`.section-header`) for both "Common Event Details" and "Date & Time Occurrences".
- [ ] Set text inputs, textareas, and select elements to `width: 100%` within cards.
- [ ] Adjust `addOccurrenceRow` to use a `grid-3` layout (`Date`, `Start Time`, `End Time`) and accept only a single date value.
- [ ] Remove start/end date selectors in favor of a single `Date` field.
- [ ] **Map preview**:
  - [ ] Add an embedded Google Map iframe below the Location text field.
  - [ ] Implement dynamic map updates pointing to `https://maps.google.com/maps?q={address}&output=embed` with a wide zoom (`z=13`) that updates as the user types.
- [ ] Update the success message screen to render created events as clickable hyperlinks using their respective returned calendar event URLs.

