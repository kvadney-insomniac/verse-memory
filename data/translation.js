/* Which translation the shipped data/passages.js is actually in.
 *
 * Generated alongside the passages by tools/fetch_passages.mjs — do not hand-
 * edit, beyond the one hand-recorded value noted below. It exists as a file of
 * its own for a reason that looks arbitrary until it bites: **data/passages.js
 * has to stay a single JSON array literal**, because tools/gen_keywords.py
 * reads it by slicing between the first "[" and the last "]" and handing the
 * slice to json.loads. A second `export const` in that file lands inside the
 * slice, and the keyword generator dies on it — so the record of what the
 * passages are cannot live beside the passages, and lives here instead.
 *
 * What reads it: src/views/footer.js prints `notice` under every signed-in
 * screen, so the footer says something true of this build rather than a
 * hard-coded sentence about a text this build may not contain; and
 * test/passages.test.mjs applies Crossway's storage caps only when `id` is
 * "esv", since those are Crossway's terms and not a rule about scripture in
 * general.
 *
 * `notice` is duplicated from the matching entry in data/translations.js rather
 * than imported from it, which is the deliberate choice: this file is a record
 * of what was fetched and what was shown at the time it was fetched, and a
 * record that silently rewrites itself when the table beside it is edited is
 * not a record. The two are asserted equal in test/passages.test.mjs, so the
 * copy cannot drift unnoticed.
 */

export const translation = {
  id: "esv",
  name: "English Standard Version",
  notice:
    "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), " +
    "© 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.",
  publicDomain: false,
  /* Hand-recorded, and the only value here that was not written by the tool:
   * the shipped ESV set predates this file, so the timestamp is when
   * data/passages.js was last written rather than when this line was. Every
   * later run stamps the real fetch time. */
  generatedAt: "2026-08-24T19:29:45Z",
};
