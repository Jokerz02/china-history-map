# Interactive Historical Map of China

A locally-hostable interactive map of Chinese dynasties from the Shang period to the end of the Qing, with surrounding nations.

Inspired by and referencing the detail level of open-source projects such as [Jiangshan Map (江山时序)](https://github.com/DeanChensj/jiangshan-map) and [china-history-map](https://github.com/pessimistcamellia/china-history-map).

## Features
- Timeline slider (1600 BCE – 1912 CE)
- Main Chinese empire in **gold**, other Chinese states in **light blue**, surrounding nations in **red**
- Hover tooltips showing territory names
- Dark theme
- Non-overlapping schematic boundaries

## How to run locally
1. Clone this repository.
2. Open `index.html` in any modern browser.

Or:
```bash
cd china-history-map
python -m http.server 8000
```

## Notes
- Borders are cleaned schematic approximations for educational visualization, informed by academic historical GIS (CHGIS / Hartwell) via the open-source reference projects.
- For the highest accuracy and full features (cities, events, prefecture-level detail), use the original projects linked above.

This is a self-contained local version you can freely modify.
