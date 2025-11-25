// Visualization 3: Temporal Evolution

export function createTemporalEvolution(containerId, data, filters) {
  const { station, pollutants, period } = filters;

  // Clear existing content
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // Define period ranges
  const periodos = {
    "2024-S1": { year: 2024, minMonth: 1, maxMonth: 6 },
    "2025-S1": { year: 2025, minMonth: 1, maxMonth: 6 },
  };

  const periodo = periodos[period];

  // Filter data
  let filteredData = data.filter(
    (d) =>
      d.station === station &&
      pollutants.includes(d.variable) &&
      d.year === periodo.year &&
      d.month >= periodo.minMonth &&
      d.month <= periodo.maxMonth
  );

  // Parse dates
  filteredData.forEach((d) => {
    d.date = new Date(d.year, d.month - 1, d.day);
  });

  if (filteredData.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 50px;">No hay datos disponibles para los filtros seleccionados.</p>';
    return;
  }

  // Dimensions
  const margin = { top: 60, right: 150, bottom: 60, left: 70 };
  const width = 900 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Scales
  const x = d3
    .scaleTime()
    .domain(d3.extent(filteredData, (d) => d.date))
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(filteredData, (d) => d.avg_value)])
    .range([height, 0])
    .nice();

  // Color scale
  const color = d3.scaleOrdinal().domain(pollutants).range(d3.schemeCategory10);

  // Line generator with defined function to break lines for non-consecutive days
  const line = d3
    .line()
    .defined((d, i, data) => {
      // A point is defined if there's a consecutive day after it (or it's the last point)
      if (i === data.length - 1) return true; // Last point is always defined

      // Check if next day is consecutive (difference of 1 day)
      const nextDate = data[i + 1].date;
      const currentDate = d.date;
      const dayDiff = Math.abs(
        (nextDate - currentDate) / (1000 * 60 * 60 * 24)
      );
      return dayDiff <= 1.5; // Allow up to 1.5 days to account for potential time differences
    })
    .x((d) => x(d.date))
    .y((d) => y(d.avg_value))
    .curve(d3.curveMonotoneX);

  // Create SVG
  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ])
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Group data by variable
  const dataByVariable = d3.group(filteredData, (d) => d.variable);

  // Draw lines
  dataByVariable.forEach((values, variable) => {
    g.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color(variable))
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add circles for data points
    g.selectAll(`.circle-${variable}`)
      .data(values)
      .join("circle")
      .attr("class", `circle-${variable}`)
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.avg_value))
      .attr("r", 3)
      .attr("fill", color(variable));
  });

  // Add invisible vertical band overlay for hover interactions
  const uniqueDates = [
    ...new Set(filteredData.map((d) => d.date.getTime())),
  ].sort();
  const bandWidth = width / uniqueDates.length;

  g.selectAll(".hover-band")
    .data(uniqueDates)
    .join("rect")
    .attr("class", "hover-band")
    .attr("x", (d) => x(new Date(d)) - bandWidth / 2)
    .attr("y", 0)
    .attr("width", bandWidth)
    .attr("height", height)
    .attr("fill", "transparent")
    .attr("pointer-events", "all")
    .on("mouseover", function (event, dateTime) {
      const date = new Date(dateTime);
      const dataAtDate = filteredData.filter(
        (d) => d.date.getTime() === dateTime
      );

      // Highlight all circles at this date
      g.selectAll("circle").attr("r", (d) =>
        d.date.getTime() === dateTime ? 5 : 3
      );

      // Show tooltip with all pollutants
      const tooltipContent = `
        <strong>Fecha: ${d3.timeFormat("%Y-%m-%d")(date)}</strong><br/>
        ${dataAtDate
          .map(
            (d) =>
              `<span style="color: ${color(d.variable)}">●</span> ${
                d.variable
              }: ${d.avg_value.toFixed(2)}`
          )
          .join("<br/>")}
      `;
      showTooltip(event, tooltipContent);
    })
    .on("mousemove", function (event) {
      moveTooltip(event);
    })
    .on("mouseout", function () {
      // Reset all circles
      g.selectAll("circle").attr("r", 3);
      hideTooltip();
    });

  // X axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(6))
    .selectAll("text")
    .style("font-size", "11px");

  // Y axis
  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "11px");

  // Axis labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("Fecha");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("Concentración promedio diaria");

  // Title
  svg
    .append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(`Evolución Temporal - Estación ${station} (${period})`);

  // Legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width + margin.left + 10}, ${margin.top})`);

  pollutants.forEach((variable, i) => {
    const legendRow = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow
      .append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", color(variable))
      .attr("stroke-width", 2);

    legendRow
      .append("text")
      .attr("x", 25)
      .attr("y", 4)
      .style("font-size", "11px")
      .text(variable);
  });
}

// Tooltip helper functions
function showTooltip(event, html) {
  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("display", "none");
  }
  tooltip
    .html(html)
    .style("display", "block")
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY - 10 + "px");
}

function moveTooltip(event) {
  d3.select("body")
    .select(".tooltip")
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY - 10 + "px");
}

function hideTooltip() {
  d3.select("body").select(".tooltip").style("display", "none");
}
