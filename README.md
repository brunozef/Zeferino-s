# Zeferino's Precision Finish & Remodeling: website

Static site (HTML, CSS and JavaScript, no build step). Hosted on Vercel.

## Adding a project

Only real photos of finished work go here. Never add placeholder or stock images.

1. Put the photos in a folder inside `images/`, for example `images/palm-city-trim/`.
   Keep the original file names. Use a short description in the name when you can.
2. Run the image optimizer once from the project folder:

       pip install pillow          (only the first time)
       python3 scripts/optimize-images.py

   It creates small and large WebP copies in `opt/`. Your originals are not changed.
3. Open `js/projects.js` and copy one project block. Fill in:
   - `id`: short, lowercase, no spaces (it appears in the web address)
   - `title`, `city`, `state`, `service`, `text`
   - `types`: one or more of the service names listed in `PROJECT_TYPES`
   - `photos`: the list of photos, one line each, with a short description (it is used as ALT text)
   - `cover`: which photo (counting from 0) is the card image
   - `pairs`: optional before and after comparisons (see below)
4. Commit the new photos, the `opt/` files and `js/projects.js`. Vercel publishes it.

A new city is created automatically from the `city` field.

## Before and after

Add a pair in `pairs` using two photos from the same project:

    pairs: [
      { before: 'images/palm-city-trim/01-before.jpg',
        after:  'images/palm-city-trim/08-after.jpg',
        label:  'Living room, before and after',
        view:   'side' }
    ]

- `view: 'side'` shows the two photos next to each other. Use it when the photos were taken from different spots.
- `view: 'slider'` shows a drag slider on top of each other. Use it only when both photos were taken from the same spot and angle.

Projects without matching before and after photos simply show no comparison.

## Files

- `index.html`: layout, styles and page behavior
- `js/projects.js`: all project data (edit this to add work)
- `scripts/optimize-images.py`: creates the WebP copies in `opt/`
- `opt/`: optimized copies used by the site. Regenerate with the script above.
- `api/`, `crm/`: lead intake and the CRM (not part of the gallery)
