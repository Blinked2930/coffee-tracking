# Test & Guardrails (test-gaurd.md)

## 1. Authentication Guards
- **Restricted Access:** Only the 8 predefined users can access the app.
- **PIN Verification:** Ensure PIN is validated correctly against the database.
- **Session Management:** Maintain active session for a reasonable duration to minimize re-logins (low-friction goal).

## 2. Input Validation (Guardrails)
- **Main Action:** Ensure multiple rapid taps on the "+1 Kafe" button are debounced or handled gracefully to prevent duplicate accidental entries.
- **Optional Details:** Location strings and notes should have reasonable character limits to prevent abuse or UI breaking.
- **Images:** Any uploaded photos must be compressed client-side before uploading to Supabase Storage to save bandwidth and storage.

## 3. Testing Strategy
- **Unit Testing:** 
  - Test helper functions (e.g., date formatting for the feed, leaderboard ranking logic).
- **Component Testing:**
  - Verify the state toggles (emoji buttons) correctly update the coffee type before submission.
- **End-to-End (E2E) Testing (Cypress / Playwright):**
  - **Login Flow:** Verify a user can log in with a valid PIN and is rejected with an invalid one.
  - **Log Kafe Flow:** Verify tapping "+1 Kafe" successfully adds an entry to the database and appears on the Feed.

## 4. PWA Verification
- Ensure PWA criteria are met (Lighthouse PWA audit).
- Verify the Web App Manifest is correctly formatted and loads icons properly when saved to the home screen.