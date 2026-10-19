// Zip-code page (the old /micro/ route): one zip code's income in national and historical context.

(() => {
  const root = document.getElementById("zip-page");
  const zip = (new URLSearchParams(location.search).get("zipcode") || "").trim();

  const footer = `<div id="site-footer"></div>`;

  function emptyState(message) {
    root.innerHTML = `
      <div class="card-box empty-state">
        <p class="headline">${message}</p>
        <p class="hint">Pick a zip code from the <strong>Zip-codes</strong> menu above, or <a href="index.html">go back to the map</a>.</p>
        ${footer}
      </div>`;
    BB.renderFooter();
  }

  Promise.all([BB.incomes(), BB.taxesPaid(), BB.agiShares()])
    .then(([incomes, taxes, shares]) => {
      if (!zip) return emptyState("Choose a zip code to explore.");
      if (!(zip in incomes)) return emptyState(`We don't have data for ${escapeHtml(zip)}.`);

      document.title = `Bracket Breakdown – ${zip}`;
      const income = incomes[zip];
      const borough = BB.borough(zip);
      const place = borough ? `${zip} (${borough})` : zip;

      if (!BB.hasData(income)) {
        return emptyState(`No median household income is published for ${place} — usually because very few households live there.`);
      }

      const b = BB.bracket(income);
      const diff = Math.abs(income - BB.NYC_MEDIAN);
      const topCoded = BB.isTopCoded(income);
      const moreLess = income >= BB.NYC_MEDIAN ? "more" : "less";
      const diffText = topCoded ? `at least $${BB.fmt(diff)}` : `$${BB.fmt(diff)}`;

      const paid = taxes[b.key];
      const earned = shares[b.key];
      const years = Object.keys(paid);
      const first = years[0], last = years[years.length - 1];

      root.innerHTML = `
        <div class="card-box zip-hero">
          <div>
            <p class="hint mb-1"><a href="index.html">← Back to the map</a></p>
            <h1 class="headline">
              With a median household income of ${topCoded ? "over $250,000" : BB.money(income)}, the median household in ${place}
              earns ${diffText} ${moreLess} than New York City's median household income of $${BB.fmt(BB.NYC_MEDIAN)},
              which puts it in the <span class="pill">${b.label}</span> percentile category.
            </h1>
          </div>
          <figure class="locator m-0">
            <div id="locator"></div>
            <figcaption>${zip} on the map</figcaption>
          </figure>
        </div>

        <div class="card-box">
          <h2 class="section-title">This percentile of taxpayers in national context (${last}):</h2>
          <div class="pies">
            <img src="assets/pie-taxes.svg" alt="Pie chart: percent of US income taxes paid by each percentile in ${last}. Top 1% ${taxes["Top 1%"][last]}%, Top 2–5% ${taxes["Between 2% & 5%"][last]}%, Top 6–10% ${taxes["Between 6% & 10%"][last]}%, Top 11–25% ${taxes["Between 11% & 25%"][last]}%, Top 26–50% ${taxes["Between 26% & 50%"][last]}%, Bottom 50% ${taxes["Bottom 50%"][last]}%.">
            <img src="assets/pie-income.svg" alt="Pie chart: percent of US income earned by each percentile in ${last}. Top 1% ${shares["Top 1%"][last]}%, Top 2–5% ${shares["Between 2% & 5%"][last]}%, Top 6–10% ${shares["Between 6% & 10%"][last]}%, Top 11–25% ${shares["Between 11% & 25%"][last]}%, Top 26–50% ${shares["Between 26% & 50%"][last]}%, Bottom 50% ${shares["Bottom 50%"][last]}%.">
          </div>
          <p class="callout">The ${b.label} paid ${paid[last]}% of all US income taxes in ${last} while earning ${earned[last]}% of US income.</p>
          <p class="callout">The top 1% pays nearly half of all income taxes (${taxes["Top 1%"][last]}%) while only earning ${shares["Top 1%"][last]}% of US income.</p>
          <p class="callout">Meanwhile, the bottom 50% only pays ${taxes["Bottom 50%"][last]}% of all income taxes while earning ${shares["Bottom 50%"][last]}% of all income.</p>
        </div>

        <div class="card-box">
          <h2 class="section-title">This percentile in historical context:</h2>
          <div id="chart"></div>
          <p class="callout">In ${first}, the ${b.label} paid ${paid[first]}% of total US income taxes, while in ${last}, the ${b.label} paid ${paid[last]}%.</p>
          <p class="callout">In ${first}, the ${b.label} earned ${earned[first]}% of total US AGI, while in ${last}, the ${b.label} earned ${earned[last]}%.</p>
          <p class="hint">AGI (Adjusted Gross Income) is someone's earnings minus their deductions.</p>
          ${footer}
        </div>`;

      BB.renderFooter();
      drawLocator(income);
      drawChart(document.getElementById("chart"), b.label, years, paid, earned);
    })
    .catch((err) => BB.showError(root, err));

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function drawLocator(income) {
    const el = document.getElementById("locator");
    BB.loadMap(el).then((svg) => {
      svg.setAttribute("aria-label", `Map of New York City with ${zip} highlighted`);
      const p = svg.querySelector(`path[data-zip="${zip}"]`);
      if (!p) { el.closest("figure").remove(); return; }
      p.style.fill = BB.color(income);
      const ring = document.createElementNS("http://www.w3.org/2000/svg", "use");
      ring.setAttribute("href", "#" + p.id);
      ring.setAttribute("class", "highlight");
      svg.appendChild(ring);
    });
  }

  // Line chart: % of US income taxes paid vs % of US income (AGI) earned, 1980–2021.
  // Drawn at the container's real pixel width (and redrawn on resize) so text stays readable on phones and desktops.
  function drawChart(el, label, years, paid, earned) {
    let lastWidth = 0;
    const render = () => {
      const w = Math.round(el.clientWidth);
      if (!w || w === lastWidth) return;
      lastWidth = w;
      renderChart(el, label, years, paid, earned, w);
    };
    render();
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(render, 150); });
  }

  function renderChart(el, label, years, paid, earned, width) {
    const W = Math.max(300, Math.min(width, 900));
    const small = W < 560;
    const H = small ? Math.round(W * 0.8) : Math.round(Math.min(420, W * 0.5));
    const m = { top: 16, right: small ? 14 : 150, bottom: 46, left: 44 };  // phones rely on the legend instead of end labels
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;

    const maxVal = Math.max(...years.map((y) => Math.max(paid[y], earned[y])));
    const yMax = Math.max(10, Math.ceil(maxVal / 10) * 10);
    const x0 = +years[0], x1 = +years[years.length - 1];
    const x = (yr) => m.left + ((+yr - x0) / (x1 - x0)) * iw;
    const y = (v) => m.top + ih - (v / yMax) * ih;

    const series = [
      { name: "% of US income taxes paid", values: paid, color: "var(--taxes)" },
      { name: "% of US income (AGI) earned", values: earned, color: "var(--agi)" },
    ];

    const yTicks = [];
    for (let v = 0; v <= yMax; v += yMax <= 20 ? 5 : 10) yTicks.push(v);
    const xTicks = [];
    for (let yr = Math.ceil(x0 / 10) * 10; yr <= x1; yr += 10) xTicks.push(yr);

    const line = (vals) => years.map((yr, i) => `${i ? "L" : "M"}${x(yr).toFixed(1)},${y(vals[yr]).toFixed(1)}`).join("");

    // End labels, nudged apart if they would overlap
    const lastYr = years[years.length - 1];
    const ends = series.map((s) => ({ s, ly: y(s.values[lastYr]) }));
    ends.sort((a, b) => a.ly - b.ly);
    if (ends.length === 2 && ends[1].ly - ends[0].ly < 30) {
      const mid = (ends[0].ly + ends[1].ly) / 2;
      ends[0].ly = mid - 15; ends[1].ly = mid + 15;
    }

    el.innerHTML = `
      <div class="chart-legend">
        ${series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join("")}
      </div>
      <div class="chart-wrap">
        <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"
             aria-label="Line chart of the percent of US income taxes paid and percent of US income earned by the ${label}, ${years[0]} to ${lastYr}">
          <g class="axis">
            ${yTicks.map((v) => `
              <line class="${v === 0 ? "baseline" : "gridline"}" x1="${m.left}" x2="${m.left + iw}" y1="${y(v)}" y2="${y(v)}"/>
              <text x="${m.left - 8}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`).join("")}
            ${xTicks.map((yr) => `<text x="${x(yr)}" y="${m.top + ih + 18}" text-anchor="middle">${yr}</text>`).join("")}
            <text class="axis-title" x="${m.left + iw / 2}" y="${H - 6}" text-anchor="middle">Year</text>
          </g>
          ${series.map((s) => `<path class="series" d="${line(s.values)}" stroke="${s.color}"/>`).join("")}
          ${(small ? [] : ends).map(({ s, ly }) => `
            <text class="end-label" x="${x(lastYr) + 8}" y="${ly + 4}">
              <tspan x="${x(lastYr) + 8}">${s.values[lastYr]}%</tspan>
              <tspan x="${x(lastYr) + 8}" dy="14" font-weight="400">${s.name.includes("taxes") ? "of taxes paid" : "of income earned"}</tspan>
            </text>`).join("")}
          <g class="hover" style="display:none">
            <line class="crosshair" y1="${m.top}" y2="${m.top + ih}"/>
            ${series.map((s) => `<circle r="4.5" fill="${s.color}" stroke="#fff" stroke-width="2"/>`).join("")}
          </g>
          <rect class="hit" x="${m.left}" y="${m.top}" width="${iw}" height="${ih}" fill="transparent"/>
        </svg>
      </div>
      <details class="data-table">
        <summary>Show the data as a table</summary>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Year</th><th>% of taxes paid</th><th>% of income earned</th></tr></thead>
            <tbody>${years.map((yr) => `<tr><td>${yr}</td><td>${paid[yr]}%</td><td>${earned[yr]}%</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </details>`;

    // Hover crosshair + tooltip
    const wrap = el.querySelector(".chart-wrap");
    const svg = wrap.querySelector("svg");
    const hover = svg.querySelector(".hover");
    const cross = hover.querySelector("line");
    const dots = hover.querySelectorAll("circle");
    const tip = BB.makeTooltip(wrap);

    svg.querySelector(".hit").addEventListener("pointermove", (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      const yr = Math.round(x0 + ((loc.x - m.left) / iw) * (x1 - x0));
      const key = String(Math.min(x1, Math.max(x0, yr)));
      const cx = x(key);
      hover.style.display = "";
      cross.setAttribute("x1", cx); cross.setAttribute("x2", cx);
      series.forEach((s, i) => { dots[i].setAttribute("cx", cx); dots[i].setAttribute("cy", y(s.values[key])); });
      tip.show(`<div class="tt-zip">${key} · ${label}</div>
        ${series.map((s) => `<div class="tt-row"><span class="tt-key" style="background:${s.color}"></span>${s.name}: <strong>${s.values[key]}%</strong></div>`).join("")}`, e);
    });
    svg.querySelector(".hit").addEventListener("pointerleave", () => { hover.style.display = "none"; tip.hide(); });
  }
})();
