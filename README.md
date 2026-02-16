# Kailua Kite Wind

Static GitHub Pages app for kite surfers showing 7-day, hour-by-hour wind forecast (speed + direction) for Kailua Beach Park.

## Data source

Uses Open-Meteo forecast API (CORS enabled):
- `https://api.open-meteo.com/v1/forecast`
- Hourly fields: `wind_speed_10m`, `wind_direction_10m`
- Wind speed unit: knots

## Features

- 7-day hourly wind forecast for Kailua Beach Park
- Filter by minimum and maximum wind speed (knots)
- Filter by preferred wind directions (N, NE, E, SE, S, SW, W, NW)
- Highlights best matching hours and best days
- Saves filter preferences in browser `localStorage`
- Reset button to show all days/times
- Static files only (`index.html`, `styles.css`, `app.js`) for GitHub Pages

## Run locally

Open `index.html` directly, or serve with a simple static server.

## GitHub Pages publishing

This repo includes `.github/workflows/pages.yml` to deploy automatically on push to `main`.

Steps:

1. Create a new GitHub repo (for example: `kailua-kite-wind`).
2. Push this folder contents to the repo default branch (`main`).
3. In GitHub: `Settings -> Pages`, ensure source is **GitHub Actions**.
4. Push future updates; deployment runs automatically.

## Notes

- Forecast is from Open-Meteo model data and may differ from local sensor stations.
- Coordinates used for Kailua Beach Park: `21.3938, -157.7396`.
