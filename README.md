# kourosh-salahi.github.io

Personal site. Plain HTML and CSS, no build step, hosted on GitHub Pages.

## Layout

```
index.html                  Home: experience, projects, hobbies, writing, links
assets/css/site.css         The one stylesheet (colors and type tokens at the top)
assets/js/site.js           Mobile nav, lightbox, contents highlight, theme toggle, hero arm IK
assets/thumbs/              Downscaled thumbnails for the project cards
0/ 1/ 2/ 3/ 4/ 5/           CS 180 project write-ups (each with its own media/)
TreeHacks2026/              RL as SDEs write-up (with media/)
hobbies/fragrances/         Fragrance shelf (add photos to its media/)
hobbies/sculpting/          Sculpting gallery (add photos to its media/)
writing/                    Essay index; one folder per essay
media/                      Headshot and resume PDF
```

## Editing

- Any image with `class="zoom"` opens in a lightbox when clicked.
- Figure grids: `<div class="grid cols-3">` with `<figure>` children. `cols-1` through `cols-7`.
- Each hobby and writing page has a comment at the top of its content explaining how to add an entry.
- To add a project: copy a project folder, edit the header and sections, then add a card on `index.html` under `#projects`.
