# Wheely Good Tutoring

A static website for a free, student-run peer tutoring club. It is built with plain
HTML, CSS, and vanilla JavaScript — no framework, no bundler, and no build step. The
files you see in this folder are exactly what gets served. You edit them, test locally,
and deploy them as-is.

Pages: Home (`index.html`), About (`about.html`), Schedule & Subjects (`schedule.html`),
Sign Up (`signup.html`), News (`news.html`), FAQ & Contact (`faq.html`), plus a `404.html`.
Shared header, footer, and navigation are injected by `js/layout.js`; the dark-mode toggle
lives in `js/theme.js`; subject and announcement lists are rendered from JSON by
`js/render.js`.

All links and asset references use **relative paths** (no leading `/`) so the site works
both at a domain root and under a GitHub Pages project subpath.

## Editing the content data

Most day-to-day content lives in two JSON files in `data/`. Edit them in any text editor
and keep the JSON valid (matching brackets, commas between items, double quotes around all
keys and string values). Both files are an array `[ ... ]` of objects.

### `data/announcements.json`

Each announcement is an object with these fields:

| Field    | Type    | Notes                                                                 |
|----------|---------|-----------------------------------------------------------------------|
| `date`   | string  | The announcement date in `YYYY-MM-DD` format (e.g. `2024-09-11`).     |
| `title`  | string  | Short headline shown as the announcement heading.                     |
| `body`   | string  | The announcement text. Plain text only (rendered as text, not HTML).  |
| `pinned` | boolean | `true` or `false`. Pinned announcements are highlighted/prioritized.  |

Example entry:

```json
{
  "date": "2024-09-11",
  "title": "Wheely Good Tutoring is open for the year!",
  "body": "Our free peer tutoring club is back every Wednesday. No appointment required.",
  "pinned": true
}
```

The Home page shows the 3 latest announcements (`#announcements-latest`); the News page
shows all of them (`#announcements-list`).

### `data/subjects.json`

Each subject is an object with these fields:

| Field      | Type            | Notes                                                                         |
|------------|-----------------|-------------------------------------------------------------------------------|
| `name`     | string          | The subject name (e.g. `Algebra I & II`).                                     |
| `category` | string          | The grouping it belongs to (e.g. `Math`, `Science`, `English`).               |
| `levels`   | array (optional)| Optional list of level strings (e.g. `["Honors", "College Prep"]`). Omit if none. |

Example with levels:

```json
{
  "name": "Chemistry",
  "category": "Science",
  "levels": ["AP", "College Prep"]
}
```

Example without levels (the `levels` field is simply left out):

```json
{
  "name": "Physics",
  "category": "Science"
}
```

The Home page shows the first 6 subjects (`#subjects-preview`); the Schedule page shows all
subjects (`#subjects-grid`) with a live search box (`#subject-search`).

## Testing locally

The pages load their data with `fetch()` against the JSON files in `data/`. Browsers block
`fetch()` when a page is opened directly from disk via a `file://` URL (that counts as a
cross-origin / opaque request), so **opening `index.html` by double-clicking it will leave
the subjects and announcements empty and show console errors.** You must serve the folder
over HTTP instead.

Start a simple local server from the project folder:

```bash
# from the project root. On macOS use python3 (python may not exist).
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser and click through the pages. Stop the
server with `Ctrl+C` when you are done.

While testing, confirm: the shared header/footer appear, the active nav link is marked,
the dark-mode toggle flips and persists across reload and navigation, subjects and
announcements render, the schedule search filters live, and the FAQ accordion works.

## Replacing the Google Form placeholders

The Sign Up page (`signup.html`) embeds two Google Forms — one for students requesting a
tutor and one for students who want to tutor. Both currently use the literal placeholder
`FORM_ID_PLACEHOLDER`, so the embedded forms will show a Google error until the real IDs
are added. The placeholder for each form appears **twice**: once in the `<iframe src="...">`
and once in the "Open form in a new tab" link `href`. Replace **all four** occurrences.

In `signup.html`:

1. **Student form** (under "I want a tutor"): replace `FORM_ID_PLACEHOLDER` with the real
   student-request form ID in both the iframe `src` and the new-tab link.
2. **Tutor form** (under "I want to tutor"): replace `FORM_ID_PLACEHOLDER` with the real
   tutor-signup form ID in both the iframe `src` and the new-tab link.

The form ID is the long string in a Google Form's share/embed URL, i.e. the part after
`/forms/d/e/` and before `/viewform` in a link like
`https://docs.google.com/forms/d/e/REAL_ID_HERE/viewform`. After replacing, also delete the
`TODO` notes on the page so visitors do not see them.

## Deploying to GitHub Pages

This project is set up to deploy as a GitHub Pages site. Because every link uses relative
paths (no leading `/`), the site works correctly even when served from a project subpath
like `/REPO-NAME/`.

To publish (do this yourself when you are ready):

1. Create a GitHub repository and push this folder to it.
2. In the repository, go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **`main`** and folder **`/ (root)`**, then save.
5. Your site will be published at `https://USERNAME.github.io/REPO-NAME/`.

> Note: This README only documents the process. Setting up this project did **not** create a
> GitHub repository or deploy anything — that step is left for you to do when you choose.

## Content TODOs for the founders

A few items still need real information before the site is launch-ready. Each has a
`TODO(founders)` marker in the source for easy searching:

- **Confirm the Wednesday time and room** — `schedule.html` currently reads
  "Wednesdays, 3:30–4:30 PM — Room TODO". Update once the room is booked.
- **Replace the club email** — `wheelygoodtutoring@example.com` is a placeholder. Update it
  in `js/layout.js` (`CLUB_EMAIL`) and in `faq.html`.
- **Replace both Google Form IDs** — swap `FORM_ID_PLACEHOLDER` in `signup.html` for the
  real student and tutor form IDs (see the section above).
- **Add the sponsor acknowledgment** — `about.html` has a placeholder sponsor section; fill
  it in once Mr. Pyburn confirms.
- **Review and edit the FAQ answers** — the answers in `faq.html` are placeholder copy;
  revise them to match how the club actually runs.
