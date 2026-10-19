// Home page: color the NYC zip-code map by median household income.

(() => {
  const mapEl = document.getElementById("map");
  const legendEl = document.getElementById("legend");

  // Legend (built from the same scale used to color the map)
  const legendItems = [...BB.SCALE, { color: BB.NO_DATA_COLOR, label: "Data not available", noData: true }];
  legendEl.innerHTML = legendItems
    .map((s, i) => `<li data-i="${i}"><span class="swatch" style="background:${s.color}"></span>${s.label}</li>`)
    .join("");

  Promise.all([BB.incomes(), BB.loadMap(mapEl)])
    .then(([data, svg]) => {
      const paths = [...svg.querySelectorAll("path[data-zip]")];

      paths.forEach((p) => {
        const zip = p.dataset.zip;
        const v = data[zip];
        p.style.fill = BB.color(v);
        if (!BB.hasData(v)) p.classList.add("no-data");
      });

      // Outline drawn on top of the hovered zip so its border isn't hidden by neighbours
      const hl = document.createElementNS("http://www.w3.org/2000/svg", "use");
      hl.setAttribute("class", "highlight");
      hl.style.display = "none";
      svg.appendChild(hl);

      const tip = BB.makeTooltip(mapEl);

      function tooltipHtml(zip) {
        const v = data[zip];
        const b = BB.borough(zip);
        const where = b ? ` <span class="tt-muted">· ${b}</span>` : "";
        if (!BB.hasData(v)) {
          return `<div class="tt-zip">${zip}${where}</div><div class="tt-muted">Median income not available</div>`;
        }
        return `<div class="tt-zip">${zip}${where}</div>
                <div>Median household income: <strong>${BB.money(v)}</strong></div>
                <div class="tt-muted">${BB.bracket(v).label} of US households · click for details</div>`;
      }

      svg.addEventListener("pointermove", (e) => {
        const p = e.target.closest("path[data-zip]");
        if (!p) { tip.hide(); hl.style.display = "none"; return; }
        hl.setAttribute("href", "#" + p.id);
        hl.style.display = "";
        tip.show(tooltipHtml(p.dataset.zip), e);
      });
      svg.addEventListener("pointerleave", () => { tip.hide(); hl.style.display = "none"; });

      svg.addEventListener("click", (e) => {
        const p = e.target.closest("path[data-zip]");
        if (p && p.dataset.zip in data) window.location.href = BB.zipUrl(p.dataset.zip);
      });

      // Hovering a legend row highlights the zip codes in that income range
      legendEl.querySelectorAll("li").forEach((li) => {
        const item = legendItems[+li.dataset.i];
        li.addEventListener("mouseenter", () => {
          svg.classList.add("dimmed");
          paths.forEach((p) => {
            if (BB.color(data[p.dataset.zip]) === item.color) p.classList.add("active");
          });
        });
        li.addEventListener("mouseleave", () => {
          svg.classList.remove("dimmed");
          paths.forEach((p) => p.classList.remove("active"));
        });
      });

      // Recompute the counts in the text from the data
      const vals = Object.values(data).filter(BB.hasData);
      const counts = {
        tan: vals.filter((v) => v >= 70000 && v < 90000).length,
        red: vals.filter((v) => v < 70000).length,
        green: vals.filter((v) => v >= 90000).length,
      };
      document.querySelectorAll("[data-count]").forEach((el) => {
        el.textContent = counts[el.dataset.count];
      });
    })
    .catch((err) => BB.showError(mapEl, err));
})();
