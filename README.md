# Bracket Breakdown

**Live site:** https://jdawson-projects.github.io/Bracket-Breakdown/

An interactive data-journalism site about income inequality in New York City. The home page maps the median household income of every NYC zip code. Click a zip code to see which national income bracket its median household falls into, and how that bracket's share of US income compares with its share of federal income taxes paid — in 2021 and over time since 1980.

> **About this project:** This is a school project I built a couple of years ago. It was originally a Python/Flask app. I later used AI to make it work as a static site on GitHub Pages and to make a few slight improvements.

## What's in the repo

| Path | What it is |
|---|---|
| `index.html` | Map page — median household income by zip code |
| `zip.html?zipcode=10001` | Zip-code page — national and historical context for that zip's bracket |
| `about.html` | Background, data pipeline and prototypes |
| `assets/` | Styles, JavaScript, the map SVG, charts and the JSON data |
| `Data Journalism Project/` | The original Flask version of the project, unchanged except for a fix to `format_data.py` |

## Changes in the GitHub Pages version

- Rebuilt the Flask routes and Jinja templates as plain HTML + JavaScript so the site runs on GitHub Pages (no server needed).
- Map: hover tooltips with each zip's income and bracket, click-through to the zip page, and legend hover to highlight an income range.
- Searchable, scrollable zip-code menu (press Enter to jump to the first match).
- Redrew the historical line chart with correct year labels (the original showed 2010 twice), a hover readout and a data table.
- Fixed the zip-code count text (the green group is zip codes **above $90,000**, not $70,000), gaps in the color scale at exact boundaries, and zip codes with no published income.
- Responsive layout for phones, compressed prototype images, and updated links.

## Data

- Tax shares and income (AGI) shares by percentile, 1980–2021: [Tax Foundation](https://taxfoundation.org/data/all/federal/latest-federal-income-tax-data-2024/).
- Median household income by NYC zip code: `assets/data/incomes.json`.

## Running locally

The static site needs a local web server (browsers block `fetch` from `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

The original Flask version: `cd "Data Journalism Project" && pip install flask && python server.py`.
