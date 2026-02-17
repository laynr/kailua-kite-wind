# Kailua Kite Wind

Static GitHub Pages app for kite surfers showing 7-day, hour-by-hour wind forecast (speed + direction) for Kailua Beach Park.

## Live site

https://laynr.github.io/kailua-kite-wind/

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

This site is published from the `main` branch root (`/`) in GitHub Pages.

Steps:

1. Push changes to `main`.
2. In GitHub: `Settings -> Pages`, ensure source is **Deploy from a branch** with `main` and `/ (root)`.

## Notes

- Forecast is from Open-Meteo model data and may differ from local sensor stations.
- Coordinates used for Kailua Beach Park: `21.3938, -157.7396`.
