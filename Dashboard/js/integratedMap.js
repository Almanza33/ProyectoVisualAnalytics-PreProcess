// Visualization 1: Integrated Map (Stations + Industries)

export function createIntegratedMap(containerId, data, filters) {
  const { estaciones, industrias } = data;
  const { estado, tipoCombustible, tipoFuenteEmision, cuenca, contaminante } =
    filters;

  // Clear existing map
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // Filter industries based on filters
  let filteredIndustrias = industrias;
  if (estado)
    filteredIndustrias = filteredIndustrias.filter((d) => d.Estado === estado);
  if (tipoCombustible)
    filteredIndustrias = filteredIndustrias.filter(
      (d) => d.TipoCombustible === tipoCombustible
    );
  if (tipoFuenteEmision)
    filteredIndustrias = filteredIndustrias.filter(
      (d) => d.TipoFuenteEmision === tipoFuenteEmision
    );
  if (cuenca)
    filteredIndustrias = filteredIndustrias.filter((d) => d.Cuenca === cuenca);

  // Initialize Leaflet map
  const map = L.map(containerId).setView([5.0, -74.0], 9);

  // Add tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  // Color scale for stations
  const contaminantValues = estaciones
    .map((d) => d[contaminante])
    .filter((v) => v != null && !isNaN(v));

  const colorScale = d3
    .scaleSequential(d3.interpolateYlOrRd)
    .domain([d3.min(contaminantValues), d3.max(contaminantValues)]);

  // Color map for industries by Estado
  const colorMapEstado = {
    Sancionatorio: "#e74c3c",
    "Seguimiento y Control": "#27ae60",
    "En Trámite": "#2c3e50",
  };

  // Create marker cluster group for industries
  const industriesCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function (cluster) {
      const count = cluster.getChildCount();
      let size = "small";
      if (count > 50) size = "large";
      else if (count > 20) size = "medium";

      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${size}`,
        iconSize: L.point(40, 40),
      });
    },
  });

  // Add industries (triangles) to cluster group
  filteredIndustrias.forEach((d) => {
    const triangleIcon = L.divIcon({
      html: `<svg width="20" height="20" viewBox="0 0 20 20">
                     <polygon points="10,18 18,2 2,2" 
                              fill="${colorMapEstado[d.Estado] || "#95a5a6"}" 
                              stroke="#000000" 
                              stroke-width="1.2"
                              opacity="0.8"/>
                   </svg>`,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([d.latitude, d.longitude], {
      icon: triangleIcon,
      zIndexOffset: -1000, // Place industries below stations
    });

    marker.bindPopup(`
            <b>${d.IDExpediente}</b><br/>
            <b>Estado:</b> ${d.Estado}<br/>
            <b>Regional:</b> ${d.Regional}<br/>
            <b>Departamento:</b> ${d.Departamento}<br/>
            <b>Municipio:</b> ${d.Municipio}<br/>
            <b>Tipo Combustible:</b> ${d.TipoCombustible}<br/>
            <b>Tipo Fuente Emisión:</b> ${d.TipoFuenteEmision}<br/>
            <b>Cuenca:</b> ${d.Cuenca}<br/>
            <b>Estación cercana 1:</b> ${d.estacion_cercana_1} (${d.distancia_cercana_1} km)<br/>
            <b>Estación cercana 2:</b> ${d.estacion_cercana_2} (${d.distancia_cercana_2} km)
        `);

    industriesCluster.addLayer(marker);
  });

  // Add cluster group to map
  map.addLayer(industriesCluster);

  // Add stations (circles with color by pollutant level)
  estaciones.forEach((d) => {
    const value = d[contaminante];
    if (value == null || isNaN(value)) return;

    const color = colorScale(value);

    // Create a custom DivIcon for stations to ensure proper z-index
    const stationIcon = L.divIcon({
      html: `<svg width="20" height="20" viewBox="0 0 20 20">
               <circle cx="10" cy="10" r="8" 
                       fill="${color}" 
                       stroke="#000" 
                       stroke-width="2" 
                       opacity="1"/>
             </svg>`,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const stationMarker = L.marker([d.latitude, d.longitude], {
      icon: stationIcon,
      zIndexOffset: 1000, // Ensure stations are above industries
    }).addTo(map);

    const circleMarker = stationMarker;

    const pollutants = ["PM10", "PM2", "O3", "So2"]
      .filter((p) => d[p] != null && !isNaN(d[p]))
      .map((p) => `<b>${p}:</b> ${d[p].toFixed(2)}`)
      .join("<br/>");

    circleMarker.bindPopup(`
            <b>Estación ${d.station_id}</b><br/>
            ${d.state}<br/>
            <br/>
            <b>Contaminantes:</b><br/>
            ${pollutants || "N/A"}
        `);
  });

  // Add legend
  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function (map) {
    const div = L.DomUtil.create("div", "legend");

    const minVal = d3.min(contaminantValues).toFixed(0);
    const maxVal = d3.max(contaminantValues).toFixed(0);

    div.innerHTML = `
            <div style="margin-bottom: 10px;">
                <b>${contaminante} (Estaciones)</b><br/>
                <div style="background: linear-gradient(to right, ${colorScale(
                  d3.min(contaminantValues)
                )}, ${colorScale(d3.max(contaminantValues))}); 
                            height: 15px; width: 150px; margin: 5px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 10px;">
                    <span>${minVal}</span>
                    <span>${maxVal}</span>
                </div>
            </div>
            <div>
                <b>Estado Industrias:</b><br/>
                <div style="margin: 5px 0;">
                    <svg width="15" height="15" style="vertical-align: middle;">
                        <path d="M7.5,2 L13,13 L2,13 Z" fill="#e74c3c" stroke="white"/>
                    </svg>
                    <span style="font-size: 11px;"> Sancionatorio</span>
                </div>
                <div style="margin: 5px 0;">
                    <svg width="15" height="15" style="vertical-align: middle;">
                        <path d="M7.5,2 L13,13 L2,13 Z" fill="#27ae60" stroke="white"/>
                    </svg>
                    <span style="font-size: 11px;"> Seguimiento y Control</span>
                </div>
                <div style="margin: 5px 0;">
                    <svg width="15" height="15" style="vertical-align: middle;">
                        <path d="M7.5,2 L13,13 L2,13 Z" fill="#2c3e50" stroke="white"/>
                    </svg>
                    <span style="font-size: 11px;"> En Trámite</span>
                </div>
            </div>
        `;

    return div;
  };

  legend.addTo(map);

  // Add title
  const title = L.control({ position: "topleft" });
  title.onAdd = function (map) {
    const div = L.DomUtil.create("div", "title");
    div.innerHTML = `Mapa Integrado: Estaciones (${contaminante}) + Industrias`;
    return div;
  };
  title.addTo(map);

  // Invalidate size to ensure proper rendering
  setTimeout(() => map.invalidateSize(), 100);

  return map;
}
