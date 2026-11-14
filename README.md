# Jasmine's portfolio

Plain HTML, CSS and JavaScript with no build step. Preview by opening
`index.html`. Portfolio content is in `js/content.js`.

## Content

- The portrait appears in the hero while `settings.heroPhoto` is `true`;
  otherwise it appears in About. Keep the image at `assets/photo/profile.jpg`.
- Featured certificates appear on the home page with images from
  `assets/certificates/`. Use lowercase, no-space filenames and set the
  matching `file` value in `js/content.js`.
- The home page shows confirmed information only. For owner review, add
  `?confirm=1` to the page URL to reveal `[confirm]` fields.
- Keep uncertain facts marked with `[confirm]` in the content file. Do not
  publish credential IDs, signatures, QR codes or unredacted documents.
- Graphite Violet is the default theme. The theme button switches between the
  selected dark theme and Ivory Light; `settings.darkTheme` selects Graphite
  Violet or Midnight.

## Privacy

The email address is assembled in the browser from two content fields. The
contact form opens the visitor's email app; it does not send data to a service.
Everything in this folder is public when hosted. Keep originals and private
documents outside the site folder.
