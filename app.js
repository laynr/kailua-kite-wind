const LAT = 21.3938;
const LON = -157.7396;
const TIMEZONE = "Pacific/Honolulu";
const STORAGE_KEY = "kailua-kite-filters-v1";
const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const elements = {
  minSpeed: document.getElementById("min-speed"),
  maxSpeed: document.getElementById("max-speed"),
  directionOptions: document.getElementById("direction-options"),
  apply: document.getElementById("apply-filters"),
  reset: document.getElementById("reset-filters"),
  summary: document.getElementById("summary"),
  forecast: document.getElementById("forecast"),
  hourTemplate: document.getElementById("hour-template"),
};

let state = {
  filters: {
    minSpeed: 14,
    maxSpeed: 28,
    directions: [...DIRECTIONS],
  },
  rawHours: [],
};

function toDirectionLabel(deg) {
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return DIRECTIONS[index];
}

function loadFilters() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const safeMin = Number(parsed.minSpeed);
    const safeMax = Number(parsed.maxSpeed);
    const safeDirs = Array.isArray(parsed.directions)
      ? parsed.directions.filter((d) => DIRECTIONS.includes(d))
      : [];

    if (Number.isFinite(safeMin)) state.filters.minSpeed = safeMin;
    if (Number.isFinite(safeMax)) state.filters.maxSpeed = safeMax;
    if (safeDirs.length) state.filters.directions = safeDirs;
  } catch {
    // Ignore malformed storage data.
  }
}

function saveFilters() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.filters));
}

function renderDirectionControls() {
  elements.directionOptions.innerHTML = "";

  DIRECTIONS.forEach((dir) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "direction-chip";
    btn.textContent = dir;
    btn.setAttribute("aria-pressed", String(state.filters.directions.includes(dir)));

    if (state.filters.directions.includes(dir)) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      if (state.filters.directions.includes(dir)) {
        state.filters.directions = state.filters.directions.filter((d) => d !== dir);
      } else {
        state.filters.directions = [...state.filters.directions, dir];
      }

      if (state.filters.directions.length === 0) {
        state.filters.directions = [...DIRECTIONS];
      }

      renderDirectionControls();
    });

    elements.directionOptions.appendChild(btn);
  });
}

function parseHourData(hourly) {
  const now = new Date();
  const nowTime = now.getTime();

  return hourly.time
    .map((epochSeconds, i) => {
      const dt = new Date(epochSeconds * 1000);
      return {
        time: dt,
        speedKn: hourly.wind_speed_10m[i],
        directionDeg: hourly.wind_direction_10m[i],
      };
    })
    .filter((h) => h.time.getTime() >= nowTime)
    .slice(0, 24 * 7);
}

function scoreHours(hours) {
  const { minSpeed, maxSpeed, directions } = state.filters;

  return hours.map((h) => {
    const dirLabel = toDirectionLabel(h.directionDeg);
    const speedMatch = h.speedKn >= minSpeed && h.speedKn <= maxSpeed;
    const dirMatch = directions.includes(dirLabel);
    return {
      ...h,
      dirLabel,
      isMatch: speedMatch && dirMatch,
    };
  });
}

function groupByDay(hours) {
  return hours.reduce((acc, h) => {
    const key = h.time.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: TIMEZONE,
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {});
}

function topDayKeys(grouped) {
  const scored = Object.entries(grouped).map(([key, hours]) => {
    const matches = hours.filter((h) => h.isMatch);
    const avg = matches.length
      ? matches.reduce((sum, h) => sum + h.speedKn, 0) / matches.length
      : 0;
    return { key, matchCount: matches.length, avgSpeed: avg };
  });

  scored.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return b.avgSpeed - a.avgSpeed;
  });

  const bestCount = scored.length > 1 ? 2 : 1;
  return scored.slice(0, bestCount).filter((d) => d.matchCount > 0).map((d) => d.key);
}

function renderSummary(scored) {
  const total = scored.length;
  const hits = scored.filter((h) => h.isMatch).length;
  const firstGood = scored.find((h) => h.isMatch);

  elements.summary.innerHTML = `
    <div>
      <strong>${hits}</strong> of <strong>${total}</strong> forecast hours match your kite range.
    </div>
    <div>
      ${firstGood
        ? `Next good window: <strong>${firstGood.time.toLocaleString("en-US", {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
            timeZone: TIMEZONE,
          })}</strong>`
        : "No matching windows in the next 7 days with current filters."}
    </div>
  `;
}

function renderForecast(scored) {
  const grouped = groupByDay(scored);
  const bestDays = new Set(topDayKeys(grouped));
  elements.forecast.innerHTML = "";

  Object.entries(grouped).forEach(([day, hours]) => {
    const dayMatches = hours.filter((h) => h.isMatch);
    const dayCard = document.createElement("article");
    dayCard.className = "day-card";

    if (bestDays.has(day)) {
      dayCard.classList.add("best-day");
    }

    const header = document.createElement("header");
    header.className = "day-header";
    header.innerHTML = `
      <div>
        <div class="day-title">${day}</div>
        <div class="day-meta">${dayMatches.length} matching hour${dayMatches.length === 1 ? "" : "s"}</div>
      </div>
      ${bestDays.has(day) ? '<span class="best-chip">Best Day</span>' : ""}
    `;

    const hourGrid = document.createElement("div");
    hourGrid.className = "day-hours";

    hours.forEach((h) => {
      const node = elements.hourTemplate.content.firstElementChild.cloneNode(true);
      if (h.isMatch) node.classList.add("match");

      const strongestMatch = dayMatches.length
        ? dayMatches.reduce((top, current) => (current.speedKn > top.speedKn ? current : top), dayMatches[0])
        : null;

      if (h.isMatch && strongestMatch && strongestMatch.time.getTime() === h.time.getTime()) {
        node.classList.add("best-hour");
      }

      node.querySelector(".hour-time").textContent = h.time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: TIMEZONE,
      });
      node.querySelector(".speed").textContent = `${Math.round(h.speedKn)} kn`;
      node.querySelector(".dir").textContent = `${Math.round(h.directionDeg)}° ${h.dirLabel}`;
      node.querySelector(".hour-tag").textContent = node.classList.contains("best-hour")
        ? "Best hour"
        : h.isMatch
          ? "Good kite wind"
          : "";

      hourGrid.appendChild(node);
    });

    dayCard.append(header, hourGrid);
    elements.forecast.appendChild(dayCard);
  });
}

function applyFiltersFromInputs() {
  const min = Number(elements.minSpeed.value);
  const max = Number(elements.maxSpeed.value);
  state.filters.minSpeed = Number.isFinite(min) ? min : 0;
  state.filters.maxSpeed = Number.isFinite(max) ? max : 70;

  if (state.filters.minSpeed > state.filters.maxSpeed) {
    const t = state.filters.minSpeed;
    state.filters.minSpeed = state.filters.maxSpeed;
    state.filters.maxSpeed = t;
    elements.minSpeed.value = String(state.filters.minSpeed);
    elements.maxSpeed.value = String(state.filters.maxSpeed);
  }

  saveFilters();
  const scored = scoreHours(state.rawHours);
  renderSummary(scored);
  renderForecast(scored);
}

async function fetchForecast() {
  elements.summary.textContent = "Loading 7-day wind forecast...";
  elements.forecast.innerHTML = "";

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LON),
    timezone: TIMEZONE,
    timeformat: "unixtime",
    forecast_days: "7",
    hourly: "wind_speed_10m,wind_direction_10m",
    wind_speed_unit: "kn",
  }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);

  const data = await res.json();
  if (!data.hourly?.time?.length) throw new Error("No hourly data returned");

  state.rawHours = parseHourData(data.hourly);

  const scored = scoreHours(state.rawHours);
  renderSummary(scored);
  renderForecast(scored);
}

function bindEvents() {
  elements.apply.addEventListener("click", applyFiltersFromInputs);
  elements.reset.addEventListener("click", () => {
    state.filters = {
      minSpeed: 0,
      maxSpeed: 70,
      directions: [...DIRECTIONS],
    };
    elements.minSpeed.value = "0";
    elements.maxSpeed.value = "70";
    renderDirectionControls();
    saveFilters();
    const scored = scoreHours(state.rawHours);
    renderSummary(scored);
    renderForecast(scored);
  });
}

async function init() {
  loadFilters();
  elements.minSpeed.value = String(state.filters.minSpeed);
  elements.maxSpeed.value = String(state.filters.maxSpeed);
  renderDirectionControls();
  bindEvents();

  try {
    await fetchForecast();
  } catch (error) {
    elements.summary.innerHTML = `<span class="error">Unable to load wind forecast: ${error.message}</span>`;
  }
}

init();
