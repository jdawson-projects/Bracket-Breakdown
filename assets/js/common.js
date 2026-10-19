// Shared helpers for every page: data loading, colors, brackets, navbar and footer.
// (This replaces the Flask routes/Jinja templates so the site can run on GitHub Pages.)

const BB = (() => {
  const NYC_MEDIAN = 76607;          // NYC median household income used in the original project
  const TOP_CODE = 250001;           // Census top-codes incomes as "250,000+"
  const NO_DATA_COLOR = "rgb(184,200,216)";

  // Same color scale as the original map, with the gaps at exact boundaries fixed.
  const SCALE = [
    { min: 250000, color: "rgb(0,50,0)",      label: "$250,000+" },
    { min: 200000, color: "rgb(0,100,0)",     label: "$200,000 – $250,000" },
    { min: 150000, color: "rgb(0,150,0)",     label: "$150,000 – $200,000" },
    { min: 120000, color: "rgb(0,200,0)",     label: "$120,000 – $150,000" },
    { min: 90000,  color: "rgb(100,250,100)", label: "$90,000 – $120,000" },
    { min: 70000,  color: "rgb(210,180,140)", label: "$70,000 – $90,000" },
    { min: 50000,  color: "rgb(240,100,100)", label: "$50,000 – $70,000" },
    { min: 40000,  color: "rgb(200,0,0)",     label: "$40,000 – $50,000" },
    { min: 30000,  color: "rgb(140,0,0)",     label: "$30,000 – $40,000" },
    { min: 20000,  color: "rgb(80,0,0)",      label: "$20,000 – $30,000" },
  ];

  // Same national household-income cutoffs as the original get_percentile().
  // "key" matches the keys in the Tax Foundation JSON files.
  const BRACKETS = [
    { min: 216056, key: "Between 6% & 10%",  label: "Top 6–10%" },
    { min: 133451, key: "Between 11% & 25%", label: "Top 11–25%" },
    { min: 74202,  key: "Between 26% & 50%", label: "Top 26–50%" },
    { min: 0,      key: "Bottom 50%",        label: "Bottom 50%" },
  ];

  const LABELS = {
    "Top 1%": "Top 1%",
    "Between 2% & 5%": "Top 2–5%",
    "Between 6% & 10%": "Top 6–10%",
    "Between 11% & 25%": "Top 11–25%",
    "Between 26% & 50%": "Top 26–50%",
    "Bottom 50%": "Bottom 50%",
  };

  const cache = {};
  function getJSON(path) {
    if (!cache[path]) {
      cache[path] = fetch(path).then((r) => {
        if (!r.ok) throw new Error(`Couldn't load ${path} (${r.status})`);
        return r.json();
      });
    }
    return cache[path];
  }

  const incomes = () => getJSON("assets/data/incomes.json").then((d) => d["New York City"]);
  const taxesPaid = () => getJSON("assets/data/taxes-paid.json");
  const agiShares = () => getJSON("assets/data/agi-shares.json");

  function loadMap(container) {
    return fetch("assets/nyc-zipcodes.svg")
      .then((r) => r.text())
      .then((text) => {
        container.innerHTML = text;
        return container.querySelector("svg");
      });
  }

  const hasData = (v) => typeof v === "number" && v > 0;
  const isTopCoded = (v) => v >= TOP_CODE;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const money = (v) => (isTopCoded(v) ? "$250,000+" : "$" + fmt(v));

  function color(v) {
    if (!hasData(v)) return NO_DATA_COLOR;
    for (const s of SCALE) if (v >= s.min) return s.color;
    return "rgb(0,0,0)";
  }

  function bracket(v) {
    for (const b of BRACKETS) if (v >= b.min) return b;
    return BRACKETS[BRACKETS.length - 1];
  }

  function borough(zip) {
    const p = zip.slice(0, 3);
    if (p === "100" || p === "101" || p === "102") return "Manhattan";
    if (p === "103") return "Staten Island";
    if (p === "104") return "Bronx";
    if (p === "112") return "Brooklyn";
    if (["110", "111", "113", "114", "116"].includes(p)) return "Queens";
    return "";
  }

  const zipUrl = (zip) => `zip.html?zipcode=${encodeURIComponent(zip)}`;

  function renderNav(active) {
    const el = document.getElementById("site-nav");
    if (!el) return;
    el.innerHTML = `
<nav class="navbar navbar-expand-lg bg-body-tertiary">
  <div class="container-fluid">
    <a class="navbar-brand" href="index.html">Bracket Breakdown</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item"><a class="nav-link ${active === "map" ? "active" : ""}" href="index.html">Map</a></li>
        <li class="nav-item"><a class="nav-link ${active === "about" ? "active" : ""}" href="about.html">About</a></li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle ${active === "zip" ? "active" : ""}" href="#" role="button"
             data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">Zip-codes</a>
          <ul class="dropdown-menu zip-menu">
            <li class="search-row">
              <input type="text" id="zipSearch" class="form-control form-control-sm" inputmode="numeric"
                     placeholder="Search zip code…" aria-label="Search zip code">
            </li>
            <li class="dropdown-item text-muted small" id="zipLoading">Loading…</li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>`;

    const menu = el.querySelector(".zip-menu");
    const input = el.querySelector("#zipSearch");

    incomes().then((data) => {
      el.querySelector("#zipLoading").remove();
      const frag = document.createDocumentFragment();
      Object.keys(data).sort().forEach((zip) => {
        const li = document.createElement("li");
        li.className = "dropdown-item zip-item";
        const b = borough(zip);
        li.innerHTML = `<a href="${zipUrl(zip)}">${zip}${b ? ` <small>${b}</small>` : ""}</a>`;
        frag.appendChild(li);
      });
      menu.appendChild(frag);
    });

    input.addEventListener("input", () => {
      const filter = input.value.trim().toLowerCase();
      menu.querySelectorAll(".zip-item").forEach((item) => {
        item.style.display = item.textContent.toLowerCase().includes(filter) ? "" : "none";
      });
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const first = [...menu.querySelectorAll(".zip-item")].find((i) => i.style.display !== "none");
      if (first) window.location.href = first.querySelector("a").getAttribute("href");
    });
    // Focus the search box when the dropdown opens
    el.querySelector(".dropdown").addEventListener("shown.bs.dropdown", () => input.focus());
  }

  function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.innerHTML = `
<footer class="site-footer">
  <p>This investigation examined wealth inequality in New York City by comparing the median household income in each zip code.
  Historical and national data is given about the tax percentiles that the median income earner in each zip code falls into.
  This data shows how wealth inequality has increased since 1980.</p>
  <p>Data from <a href="https://taxfoundation.org/data/all/federal/latest-federal-income-tax-data-2024/">the Tax Foundation</a>.</p>
  <p class="project-note">This is a school project I built a couple of years ago (originally a Python/Flask app).
  I later used AI to make it work as a static site on GitHub Pages and to make a few slight improvements.
  <a href="https://github.com/jdawson-projects/Bracket-Breakdown">View the code on GitHub</a>.</p>
</footer>`;
  }

  // Simple shared tooltip that follows the pointer inside a positioned container
  function makeTooltip(container) {
    const tip = document.createElement("div");
    tip.className = "tooltip-box";
    tip.setAttribute("role", "status");
    container.appendChild(tip);
    return {
      show(html, evt) {
        tip.innerHTML = html;
        tip.classList.add("show");
        const box = container.getBoundingClientRect();
        let x = evt.clientX - box.left + 14;
        let y = evt.clientY - box.top + 14;
        const w = tip.offsetWidth, h = tip.offsetHeight;
        if (x + w > box.width) x = evt.clientX - box.left - w - 14;
        if (y + h > box.height) y = evt.clientY - box.top - h - 14;
        tip.style.left = Math.max(0, x) + "px";
        tip.style.top = Math.max(0, y) + "px";
      },
      hide() { tip.classList.remove("show"); },
    };
  }

  function showError(target, err) {
    console.error(err);
    target.innerHTML = `<div class="card-box empty-state">Something went wrong loading the data. Please refresh the page.</div>`;
  }

  return {
    NYC_MEDIAN, SCALE, BRACKETS, LABELS, NO_DATA_COLOR,
    incomes, taxesPaid, agiShares, loadMap,
    hasData, isTopCoded, fmt, money, color, bracket, borough, zipUrl,
    renderNav, renderFooter, makeTooltip, showError,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  BB.renderNav(document.body.dataset.page);
  BB.renderFooter();
});
