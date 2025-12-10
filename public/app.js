const REFRESH_INTERVAL_MS = 30_000;

async function fetchLatest() {
  const res = await fetch("/api/latest");
  return res.json();
}

async function fetchHistory() {
  const res = await fetch("/api/history");
  return res.json();
}

function safetyBadge(status) {
  // 🔹 Make sure this ALWAYS returns a STRING of HTML, not a DOM element
  const cls =
    status === "Safe"
      ? "badge-safe"
      : status === "Caution"
      ? "badge-caution"
      : "badge-unsafe";

  return `<span class="badge ${cls}">${status}</span>`;
}

function computeSafetyStatus(iceThickness, surfaceTemp) {
  if (iceThickness >= 30 && surfaceTemp <= -2) {
    return "Safe";
  } else if (iceThickness >= 25 && surfaceTemp <= 0) {
    return "Caution";
  } else {
    return "Unsafe";
  }
}

function renderCards(latest) {
  const mapping = [
    { id: "card-dows", key: "DowsLake", label: "Dow's Lake" },
    { id: "card-fifth", key: "FifthAvenue", label: "Fifth Avenue" },
    { id: "card-nac", key: "NAC", label: "NAC" },
  ];

  mapping.forEach(({ id, key, label }) => {
    const data = latest[key];
    const el = document.getElementById(id);

    if (!data) {
      el.innerHTML = `<h2>${label}</h2><p>No data yet...</p>`;
      return;
    }

    // ✅ Compute safety status on the client, ignore whatever came from Cosmos
    const status = computeSafetyStatus(
      Number(data.avgIceThicknessCm),
      Number(data.avgSurfaceTempC)
    );

    el.innerHTML = `
      <h2>${label}</h2>
      <p>Ice thickness: ${Number(data.avgIceThicknessCm).toFixed(1)} cm</p>
      <p>Surface temp: ${Number(data.avgSurfaceTempC).toFixed(1)} °C</p>
      <p>External temp: ${Number(data.avgExternalTempC).toFixed(1)} °C</p>
      <p>Snow: ${Number(data.maxSnowAccumulationCm).toFixed(1)} cm</p>
      <p>Status: ${safetyBadge(status)}</p>
      <small>Window end: ${new Date(data.windowEnd).toLocaleTimeString()}</small>
    `;
  });
}

let iceChart;

function initIceChart(history) {
  const ctx = document.getElementById("iceThicknessChart").getContext("2d");

  const labels = history.map(h => new Date(h.windowEnd).toLocaleTimeString());
  const dows = history.filter(h => h.location === "DowsLake").map(h => h.avgIceThicknessCm);
  const fifth = history.filter(h => h.location === "FifthAvenue").map(h => h.avgIceThicknessCm);
  const nac = history.filter(h => h.location === "NAC").map(h => h.avgIceThicknessCm);

  if (iceChart) {
    iceChart.destroy();
  }

  iceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Dow's Lake", data: dows },
        { label: "Fifth Avenue", data: fifth },
        { label: "NAC", data: nac }
      ]
    }
  });
}

async function refresh() {
  try {
    const [latest, history] = await Promise.all([
      fetchLatest(),
      fetchHistory()
    ]);
    renderCards(latest);
    initIceChart(history);
  } catch (e) {
    console.error("Refresh failed", e);
  }
}

refresh();
setInterval(refresh, REFRESH_INTERVAL_MS);
