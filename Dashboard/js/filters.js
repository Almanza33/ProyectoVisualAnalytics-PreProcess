// Filter Management System

export class FilterManager {
  constructor() {
    this.highLevelFilters = {
      estado: "",
      tipoCombustible: "",
      tipoFuenteEmision: "",
      cuenca: "",
      contaminante: "PM10",
    };

    this.lowLevelFilters = {
      station: 2,
      pollutants: ["PM10", "PM2", "O3", "So2"],
      period: "2024-S1",
      radioCercania: 5,
    };

    this.listeners = [];
  }

  // Initialize filter dropdowns with data
  initializeFilters(data) {
    const { industrias, estaciones } = data;

    // Populate Estado filter
    const estados = [...new Set(industrias.map((d) => d.Estado))]
      .filter(Boolean)
      .sort();
    this.populateSelect("filter-estado", estados);

    // Set preset value for Estado filter
    document.getElementById("filter-estado").value = "Seguimiento y Control";

    // Populate Tipo Combustible filter
    const combustiblesOriginal = [
      ...new Set(industrias.map((d) => d.TipoCombustible)),
    ]
      .filter(Boolean)
      .filter((v) => v !== "(sin definir)")
      .sort();
    const combustiblesFormatted = combustiblesOriginal.map((v) =>
      this.formatOption(v)
    );
    this.populateSelect(
      "filter-combustible",
      combustiblesFormatted,
      combustiblesOriginal
    );

    // Populate Tipo Fuente Emisión filter
    const fuentesOriginal = [
      ...new Set(industrias.map((d) => d.TipoFuenteEmision)),
    ]
      .filter(Boolean)
      .filter((v) => v !== "(sin definir)")
      .sort();
    const fuentesFormatted = fuentesOriginal.map((v) => this.formatOption(v));
    this.populateSelect("filter-fuente", fuentesFormatted, fuentesOriginal);

    // Populate Cuenca filter
    const cuencasOriginal = [...new Set(industrias.map((d) => d.Cuenca))]
      .filter(Boolean)
      .filter((v) => v !== "(sin definir)")
      .sort();
    const cuencasFormatted = cuencasOriginal.map((v) => this.formatOption(v));
    this.populateSelect("filter-cuenca", cuencasFormatted, cuencasOriginal);

    // Populate Station filter
    const stations = [...new Set(estaciones.map((d) => d.station_id))]
      .filter(Boolean)
      .sort((a, b) => a - b);
    const stationSelect = document.getElementById("filter-station");
    stationSelect.innerHTML = stations
      .map(
        (s) =>
          `<option value="${s}" ${
            s === 2 ? "selected" : ""
          }>Estación ${s}</option>`
      )
      .join("");

    // Set up event listeners
    this.setupEventListeners();
  }

  populateSelect(elementId, options, originalValues) {
    const select = document.getElementById(elementId);
    const currentOptions = select.innerHTML;
    const newOptions = options
      .map((opt, i) => {
        // If originalValues provided, use it for value attribute
        const value = originalValues ? originalValues[i] : opt;
        return `<option value="${value}">${opt}</option>`;
      })
      .join("");
    select.innerHTML = currentOptions + newOptions;
  }

  setupEventListeners() {
    // High-level filters
    document
      .getElementById("apply-high-level-filters")
      .addEventListener("click", () => {
        this.updateHighLevelFilters();
        this.notifyListeners("high-level");
      });

    // Low-level filters
    document
      .getElementById("apply-low-level-filters")
      .addEventListener("click", () => {
        this.updateLowLevelFilters();
        this.notifyListeners("low-level");
      });

    // Station change - auto-update map
    document.getElementById("filter-station").addEventListener("change", () => {
      this.updateLowLevelFilters();
      this.notifyListeners("station-only");
    });
  }

  updateHighLevelFilters() {
    this.highLevelFilters.estado =
      document.getElementById("filter-estado").value;
    this.highLevelFilters.tipoCombustible =
      document.getElementById("filter-combustible").value;
    this.highLevelFilters.tipoFuenteEmision =
      document.getElementById("filter-fuente").value;
    this.highLevelFilters.cuenca =
      document.getElementById("filter-cuenca").value;
    this.highLevelFilters.contaminante = document.getElementById(
      "filter-contaminante-mapa"
    ).value;
  }

  updateLowLevelFilters() {
    this.lowLevelFilters.station = parseInt(
      document.getElementById("filter-station").value
    );
    this.lowLevelFilters.period =
      document.getElementById("filter-period").value;

    // Get selected pollutants from checkboxes
    const checkboxes = document.querySelectorAll(
      '#filter-pollutants input[type="checkbox"]:checked'
    );
    this.lowLevelFilters.pollutants = Array.from(checkboxes).map(
      (cb) => cb.value
    );
  }

  getHighLevelFilters() {
    return { ...this.highLevelFilters };
  }

  getLowLevelFilters() {
    return { ...this.lowLevelFilters };
  }

  // Subscribe to filter changes
  subscribe(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(filterType) {
    this.listeners.forEach((callback) => callback(filterType));
  }

  // Helper to format option text: capitalize first letter, lowercase rest if all caps
  formatOption(text) {
    if (!text) return text;

    // Check if the text is all uppercase (ignoring spaces and special chars)
    const isAllCaps =
      text.replace(/[^a-zA-Z]/g, "").toUpperCase() ===
      text.replace(/[^a-zA-Z]/g, "");

    if (isAllCaps && text.length > 1) {
      // Convert to title case: first letter of each word capitalized
      return text
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return text;
  }
}
