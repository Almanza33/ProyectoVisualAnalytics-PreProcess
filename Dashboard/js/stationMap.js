// Visualization 5: Station Map with Nearby Industries

export function createStationMap(containerId, data, filters) {
  const { estaciones, industrias } = data;
  const { station, radioCercania } = filters;

  // Clear existing map
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // Get selected station
  const estacionSeleccionada = estaciones.find((d) => d.station_id === station);

  if (!estacionSeleccionada) {
    container.innerHTML =
      '<p style="text-align: center; padding: 50px;">Estación no encontrada.</p>';
    return;
  }

  // Haversine distance function
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Calculate distances
  const industriasConDistancia = industrias.map((d) => ({
    ...d,
    distancia: haversineDistance(
      estacionSeleccionada.latitude,
      estacionSeleccionada.longitude,
      d.latitude,
      d.longitude
    ),
  }));

  industriasConDistancia.forEach((d) => {
    d.cercana = d.distancia <= radioCercania;
  });

  // Initialize Leaflet map centered on selected station
  const map = L.map(containerId, {
    center: [estacionSeleccionada.latitude, estacionSeleccionada.longitude],
    zoom: 11,
    minZoom: 9,
    maxZoom: 15,
  });

  // Add tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  // Create marker cluster groups for industries
  const distantCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function (cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div style="background-color: #FF6B35; opacity: 0.8;"><span>${count}</span></div>`,
        className: "marker-cluster marker-cluster-medium",
        iconSize: L.point(40, 40),
      });
    },
  });

  const nearbyCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function (cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div style="background-color: #00D084; opacity: 0.8;"><span>${count}</span></div>`,
        className: "marker-cluster marker-cluster-medium",
        iconSize: L.point(40, 40),
      });
    },
  });

  // Add distant industries (orange triangles - larger and more visible)
  industriasConDistancia
    .filter((d) => !d.cercana)
    .forEach((d) => {
      const squareIcon = L.divIcon({
        html: `<svg width="24" height="24" viewBox="0 0 24 24">
                     <path d="M3,3 L21,3 L12,21 Z" 
                           fill="#FF6B35" 
                           stroke="#000000" 
                           stroke-width="1.5"
                           opacity="0.9"/>
                   </svg>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([d.latitude, d.longitude], {
        icon: squareIcon,
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
            <b>Distancia:</b> ${d.distancia.toFixed(2)} km
        `);

      distantCluster.addLayer(marker);
    });

  // Add nearby industries (green triangles - larger and more visible)
  industriasConDistancia
    .filter((d) => d.cercana)
    .forEach((d) => {
      const squareIcon = L.divIcon({
        html: `<svg width="24" height="24" viewBox="0 0 24 24">
                     <path d="M3,3 L21,3 L12,21 Z" 
                           fill="#00D084" 
                           stroke="#000000" 
                           stroke-width="1.5"
                           opacity="0.95"/>
                   </svg>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([d.latitude, d.longitude], {
        icon: squareIcon,
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
            <b>Distancia:</b> ${d.distancia.toFixed(2)} km
        `);

      nearbyCluster.addLayer(marker);
    });

  // Add cluster groups to map
  map.addLayer(distantCluster);
  map.addLayer(nearbyCluster);

  // Note: Station marker will be added LAST (after legend) to ensure it's on top

  // Add legend
  const legend = L.control({ position: "topright" });

  legend.onAdd = function (map) {
    const div = L.DomUtil.create("div", "legend");

    const cercanas = industriasConDistancia.filter((d) => d.cercana).length;
    const lejanas = industriasConDistancia.filter((d) => !d.cercana).length;

    div.innerHTML = `
            <div style="margin: 5px 0;">
                <svg width="20" height="20" style="vertical-align: middle;">
                    <circle cx="10" cy="10" r="8" fill="#3498db" stroke="white" stroke-width="2"/>
                </svg>
                <span style="font-size: 11px;"> Estación ${station}</span>
            </div>
            <div style="margin: 5px 0;">
                <svg width="18" height="18" style="vertical-align: middle;">
                    <path d="M9,2 L16,15 L2,15 Z" fill="#00D084" stroke="#000" stroke-width="1.2"/>
                </svg>
                <span style="font-size: 11px;"> Cercana ≤${radioCercania}km (${cercanas})</span>
            </div>
            <div style="margin: 5px 0;">
                <svg width="18" height="18" style="vertical-align: middle;">
                    <path d="M9,2 L16,15 L2,15 Z" fill="#FF6B35" stroke="#000" stroke-width="1.2"/>
                </svg>
                <span style="font-size: 11px;"> Lejana >${radioCercania}km (${lejanas})</span>
            </div>
        `;

    return div;
  };

  legend.addTo(map);

  // Add title
  const title = L.control({ position: "topleft" });
  title.onAdd = function (map) {
    const div = L.DomUtil.create("div", "title");
    div.innerHTML = `Mapa de Estación ${station} e Industrias`;
    return div;
  };
  title.addTo(map);

  // Add selected station (special marker) - rendered LAST to be on top of everything
  const finalStationIcon = L.divIcon({
    html: `<svg width="30" height="30" viewBox="0 0 30 30">
                 <circle cx="15" cy="15" r="12" fill="#3498db" stroke="white" stroke-width="3"/>
                 <text x="15" y="20" text-anchor="middle" fill="white" font-weight="bold" font-size="14">${station}</text>
               </svg>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  const finalStationMarker = L.marker(
    [estacionSeleccionada.latitude, estacionSeleccionada.longitude],
    { icon: finalStationIcon, zIndexOffset: 1000 }
  ).addTo(map);

  finalStationMarker.bindPopup(`
        <b>Estación ${estacionSeleccionada.station_id}</b><br/>
        ${estacionSeleccionada.state}
    `);

  // Invalidate size to ensure proper rendering
  setTimeout(() => map.invalidateSize(), 100);

  return map;
}
