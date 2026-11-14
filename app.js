const MISSION_DATA = {
  objectives: [
    {
      id: "leo",
      name: "Earth Climate Observatory",
      desc: "Low Earth Orbit (LEO) monitoring of greenhouse gases and ocean temperatures.",
      budget: 350,
      requiredDeltaV: 9.4,
      distanceAU: 0.01,
      radiation: "Low",
      durationDays: 180,
      targetColor: "#38bdf8"
    },
    {
      id: "lunar",
      name: "Lunar South Pole Orbiter",
      desc: "Map water-ice deposits in permanently shadowed craters for Artemis.",
      budget: 550,
      requiredDeltaV: 13.2,
      distanceAU: 0.0026,
      radiation: "Moderate",
      durationDays: 240,
      targetColor: "#cbd5e1"
    },
    {
      id: "mars",
      name: "Mars Atmospheric & Surface Probe",
      desc: "Analyze Martian dust storms, subsurface water, and landing zones.",
      budget: 850,
      requiredDeltaV: 16.5,
      distanceAU: 1.5,
      radiation: "High",
      durationDays: 420,
      targetColor: "#f97316"
    },
    {
      id: "europa",
      name: "Europa Cryo-Plume Flyby",
      desc: "Deep space mission sampling water plumes erupting from Jupiter's icy moon.",
      budget: 1200,
      requiredDeltaV: 21.0,
      distanceAU: 5.2,
      radiation: "Extreme",
      durationDays: 720,
      targetColor: "#a855f7"
    }
  ],
  rockets: [
    { id: "light", name: "Small-Lift Vector", desc: "Cost-effective launcher for LEO payloads.", cost: 70, maxMass: 800, deltaV: 10.5 },
    { id: "medium", name: "Medium-Lift Falcon", desc: "Workhorse vehicle for Lunar and Earth orbits.", cost: 140, maxMass: 2200, deltaV: 14.5 },
    { id: "heavy", name: "Heavy-Lift Vulcan", desc: "High-energy launcher for Mars missions.", cost: 260, maxMass: 4500, deltaV: 18.0 },
    { id: "super", name: "Super-Heavy SLS", desc: "Deep-space flagship launch system.", cost: 420, maxMass: 8000, deltaV: 23.0 }
  ],
  power: [
    { id: "solar_std", name: "Standard Solar Arrays", desc: "Efficient near Earth/Moon; weak in deep space.", cost: 45, mass: 180, watts: 900, deepSpacePenalty: true },
    { id: "solar_mega", name: "Deployable Mega-Wings", desc: "Large photovoltaic wings for Mars distance.", cost: 110, mass: 420, watts: 2200, deepSpacePenalty: true },
    { id: "rtg", name: "Nuclear MMRTG", desc: "Plutonium power source unaffected by sunlight distance.", cost: 240, mass: 350, watts: 1400, deepSpacePenalty: false }
  ],
  comms: [
    { id: "sband", name: "S-Band Omnidirectional", desc: "Low bandwidth; suitable only for Earth/Lunar orbit.", cost: 30, mass: 60, watts: 120, maxAU: 0.05, bandwidth: 20 },
    { id: "xband", name: "X-Band High-Gain Dish", desc: "Steerable dish for interplanetary Mars telemetry.", cost: 85, mass: 160, watts: 320, maxAU: 2.0, bandwidth: 60 },
    { id: "dsn_ka", name: "Ka-Band + Optical Laser", desc: "Deep Space Network high-rate laser downlink.", cost: 160, mass: 260, watts: 520, maxAU: 10.0, bandwidth: 120 }
  ],
  payloads: [
    { id: "cam", name: "Multispectral Imager", desc: "High-res planetary surface mapping.", cost: 60, mass: 140, watts: 220, science: 30, dataRate: 25 },
    { id: "spec", name: "Mass Spectrometer", desc: "Identifies atmospheric & plume molecules.", cost: 95, mass: 190, watts: 310, science: 45, dataRate: 20 },
    { id: "radar", name: "Subsurface Ice Radar", desc: "Penetrates crust to detect liquid/ice water.", cost: 130, mass: 320, watts: 480, science: 60, dataRate: 35 },
    { id: "mag", name: "Magnetometer Boom", desc: "Measures planetary magnetic fields & solar wind.", cost: 40, mass: 75, watts: 90, science: 25, dataRate: 10 }
  ]
};

let state = {
  objective: MISSION_DATA.objectives[0],
  rocket: MISSION_DATA.rockets[0],
  power: MISSION_DATA.power[0],
  comms: MISSION_DATA.comms[0],
  payloads: [MISSION_DATA.payloads[0]],
  simRunning: false,
  animId: null
};

// Render Option Cards
function renderOptions() {
  renderSingleGroup("objective-list", MISSION_DATA.objectives, "objective", (o) => [
    `Budget: $${o.budget}M`, `Δv Req: ${o.requiredDeltaV} km/s`, `Dist: ${o.distanceAU} AU`
  ]);
  renderSingleGroup("rocket-list", MISSION_DATA.rockets, "rocket", (r) => [
    `Cost: $${r.cost}M`, `Max: ${r.maxMass} kg`, `Δv: ${r.deltaV} km/s`
  ]);
  renderSingleGroup("power-list", MISSION_DATA.power, "power", (p) => [
    `Cost: $${p.cost}M`, `${p.mass} kg`, `+${p.watts} W`
  ]);
  renderSingleGroup("comms-list", MISSION_DATA.comms, "comms", (c) => [
    `Cost: $${c.cost}M`, `-${c.watts} W`, `Range: ${c.maxAU} AU`
  ]);

  const payloadContainer = document.getElementById("payload-list");
  payloadContainer.innerHTML = "";
  MISSION_DATA.payloads.forEach((item) => {
    const isSelected = state.payloads.some((p) => p.id === item.id);
    const card = document.createElement("div");
    card.className = `option-card ${isSelected ? "selected" : ""}`;
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="specs">
        <span class="spec-tag">$${item.cost}M</span>
        <span class="spec-tag">${item.mass} kg</span>
        <span class="spec-tag">-${item.watts} W</span>
        <span class="spec-tag">+${item.science} Sci</span>
      </div>
    `;
    card.onclick = () => {
      if (state.simRunning) return;
      if (isSelected) {
        state.payloads = state.payloads.filter((p) => p.id !== item.id);
      } else {
        state.payloads.push(item);
      }
      updateAll();
    };
    payloadContainer.appendChild(card);
  });
}

function renderSingleGroup(containerId, items, stateKey, tagFn) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  items.forEach((item) => {
    const isSelected = state[stateKey].id === item.id;
    const card = document.createElement("div");
    card.className = `option-card ${isSelected ? "selected" : ""}`;
    const tags = tagFn(item).map((t) => `<span class="spec-tag">${t}</span>`).join("");
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="specs">${tags}</div>
    `;
    card.onclick = () => {
      if (state.simRunning) return;
      state[stateKey] = item;
      updateAll();
    };
    container.appendChild(card);
  });
}

// Compute Engineering Totals & Trade-Offs
function calculateMetrics() {
  const payloadCost = state.payloads.reduce((sum, p) => sum + p.cost, 0);
  const payloadMass = state.payloads.reduce((sum, p) => sum + p.mass, 0);
  const payloadWatts = state.payloads.reduce((sum, p) => sum + p.watts, 0);
  const totalScience = state.payloads.reduce((sum, p) => sum + p.science, 0);
  const totalDataRate = state.payloads.reduce((sum, p) => sum + p.dataRate, 0);

  const totalCost = state.rocket.cost + state.power.cost + state.comms.cost + payloadCost;
  const spacecraftMass = state.power.mass + state.comms.mass + payloadMass;

  // Solar power drops with inverse square of distance beyond 1 AU
  let generatedWatts = state.power.watts;
  if (state.power.deepSpacePenalty && state.objective.distanceAU > 1) {
    generatedWatts = Math.round(state.power.watts / (state.objective.distanceAU * 1.4));
  }
  const consumedWatts = state.comms.watts + payloadWatts + 150; // 150W avionics baseline
  const netWatts = generatedWatts - consumedWatts;

  return {
    totalCost,
    budget: state.objective.budget,
    spacecraftMass,
    maxMass: state.rocket.maxMass,
    generatedWatts,
    consumedWatts,
    netWatts,
    totalScience,
    totalDataRate
  };
}

function updateAll() {
  renderOptions();
  const m = calculateMetrics();

  document.getElementById("stat-budget").textContent = `$${m.totalCost}M / $${m.budget}M`;
  document.getElementById("stat-mass").textContent = `${m.spacecraftMass.toLocaleString()} / ${m.maxMass.toLocaleString()} kg`;
  document.getElementById("stat-power").textContent = `${m.netWatts >= 0 ? "+" : ""}${m.netWatts} W`;
  document.getElementById("stat-science").textContent = `${m.totalScience} pts`;

  const checks = [
    {
      pass: m.totalCost <= m.budget,
      text: m.totalCost <= m.budget
        ? `Budget OK ($${m.budget - m.totalCost}M reserve remaining)`
        : `Over Budget by $${m.totalCost - m.budget}M`
    },
    {
      pass: m.spacecraftMass <= m.maxMass,
      text: m.spacecraftMass <= m.maxMass
        ? `Launch Mass OK (${m.maxMass - m.spacecraftMass} kg margin)`
        : `Exceeds Rocket Payload Limit by ${m.spacecraftMass - m.maxMass} kg`
    },
    {
      pass: state.rocket.deltaV >= state.objective.requiredDeltaV,
      text: state.rocket.deltaV >= state.objective.requiredDeltaV
        ? `Trajectory Δv OK (${state.rocket.deltaV} km/s >= ${state.objective.requiredDeltaV} km/s)`
        : `Insufficient Δv: Need ${state.objective.requiredDeltaV} km/s for ${state.objective.name}`
    },
    {
      pass: m.netWatts >= 0,
      text: m.netWatts >= 0
        ? `Power Balance Positive (+${m.netWatts} W surplus at destination)`
        : `Power Deficit (${m.netWatts} W) — Solar efficiency drops at ${state.objective.distanceAU} AU`
    },
    {
      pass: state.comms.maxAU >= state.objective.distanceAU,
      text: state.comms.maxAU >= state.objective.distanceAU
        ? `Comms Range OK (${state.comms.name} reaches ${state.objective.distanceAU} AU)`
        : `Signal Lost: ${state.comms.name} max range is ${state.comms.maxAU} AU`
    },
    {
      pass: state.payloads.length > 0,
      text: state.payloads.length > 0
        ? `${state.payloads.length} Scientific Instrument(s) Ready`
        : `Select at least 1 Scientific Payload`
    }
  ];

  const list = document.getElementById("validation-list");
  list.innerHTML = checks
    .map((c) => `<li class="${c.pass ? "ok" : "err"}">${c.pass ? "✔" : "✖"} ${c.text}</li>`)
    .join("");

  const allPassed = checks.every((c) => c.pass);
  document.getElementById("launch-btn").disabled = !allPassed || state.simRunning;

  drawStaticPreview();
}

// Orbital Canvas Animation
const canvas = document.getElementById("orbitCanvas");
const ctx = canvas.getContext("2d");

