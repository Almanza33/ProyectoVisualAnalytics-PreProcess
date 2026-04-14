# Air Quality and Industries Dashboard

An end-to-end data pipeline and interactive dashboard that explores the relationship between industrial activity and air quality across Colombia. The project covers the full data lifecycle: ingestion and profiling of a raw >1 GB government dataset, ETL and geospatial cleaning in Python, and a modular D3.js dashboard served as a static site.

## How to Use

### Option 1: Simple Local Server

1. Open a terminal in the `Dashboard` folder
2. Run a local HTTP server:

**With Python 3:**

```bash
python -m http.server 8000
```

**With Node.js (http-server):**

```bash
npx http-server -p 8000
```

**With PHP:**

```bash
php -S localhost:8000

```

3. Open `http://localhost:8000/` in your browser

## Features

This project is divided into two main components. The first component corresponds to the data pre-processing necessary in order to generate the visualizations. The second component corresponds to the dashboard itself.

### Data processing layer

All preprocessing is contained in [preprocess.ipynb](preprocess.ipynb) and is organized into three stages.

#### Stage 1 — Air quality monitoring stations

Loaded and profiled the official network of air quality monitoring stations. Cleaned coordinates, standardized station identifiers, and computed per-station pollutant averages (PM10, PM2.5, O3, SO2) that feed the heatmap and integrated map visualizations.

#### Stage 2 — Industrial emission permits

Profiled a government dataset of ~544 emission permits across 65 municipalities and 3 departments. Key steps:

- **Data quality assessment**: identified and documented null rates, constant columns, and categorical cardinality across all fields.
- **Geolocation correction**: detected and manually corrected erroneous latitude/longitude entries that placed facilities outside Colombia.
- **Categorical standardization**: unified inconsistent labels in `TipoFuenteEmision` and `TipoCombustible` columns that varied by permit status.
- **Geospatial proximity analysis**: computed pairwise distances between all industries and monitoring stations; flagged each industry as _near_ (≤5 km) or _far_ (>5 km) from the nearest station. This heuristic drives the color-coding in the integrated and station maps.

Output: `industrias_completo.csv` and `industrias_procesadas.csv`.

#### Stage 3 — Air pollution time series (>1 GB source)

The raw pollution dataset exceeded 1 GB. The preprocessing pipeline:

- **Selective loading**: dropped constant columns (`unit_measurement`, `variable_type`) at read time to reduce memory footprint.
- **Sample-first profiling**: profiled a representative sample before committing to full-dataset transformations.
- **Outlier removal**: identified and removed physically impossible sensor readings (e.g., values of 9999).
- **Variable classification**: separated 15 raw sensor channels into three tiers — primary pollutants (PM10, PM2.5, O3, NO2, SO2, CO), meteorological context variables (temperature, humidity, wind speed/direction, precipitation), and low-priority channels omitted from the dashboard.
- **Temporal aggregation**: produced both daily and hourly aggregations per station, enabling the temporal evolution and hourly pattern visualizations.

Output datasets:

| File                                     | Description                                     |
| ---------------------------------------- | ----------------------------------------------- |
| `contaminacion_limpia.csv`               | Full cleaned hourly readings                    |
| `contaminacion_diaria.csv`               | Daily aggregates across all stations            |
| `contaminacion_diaria_por_estacion.csv`  | Daily aggregates split by station               |
| `contaminacion_horaria_por_estacion.csv` | Hourly averages by station (for pattern charts) |
| `estaciones_con_promedios.csv`           | Stations enriched with pollutant averages       |
| `heatmap_estaciones_contaminantes.csv`   | Pivot table for the concentration heatmap       |

**Stack**: Python · pandas · NumPy · geopy · Jupyter Notebook

### Dashboard

All visualizations are built with D3.js and rendered in a modular, filter-driven architecture.

#### High-Level Visualizations

1. **Integrated Map**: Displays measuring stations (circles) and industries (triangles) on an interactive map.

- Stations colored according to the selected pollutant level

- Industries colored according to their status (Sanctioning, Monitoring and Control, In Process)

- Filterable by: Status, Fuel Type, Emission Source Type, Basin

2. **Concentration Heatmap**: Displays average pollutant concentrations per station.

- Not affected by filters

- Shows PM10, PM2.5, O3, SO2 for all stations

#### Low Level Visualizations (Per Station)

3. **Temporal Evolution**: Line graph showing the daily evolution of pollutants.

- Filterable by: Station, Pollutants, Period

4. **Hourly Patterns**: Shows pollution patterns by hour of the day.

- Filterable by: Station, Pollutants, Period

5. **Station Map**: Map centered on a specific station showing nearby industries.

- Nearby industries (≤5km) in green

- Distant industries (>5km) in orange

- The map automatically centers when the selected station changes

## Project Structure

```

Dashboard/
├── index.html # Dashboard homepage
├── styles.css # Dashboard styles
├── js/
│ ├── app.js # Main application controller
│ ├── filters.js # Filter management system
│ ├── integratedMap.js # Visualization 1: Integrated map
│ ├── heatmap.js # Visualization 2: Station heatmap
│ ├── temporalEvolution.js # Visualization 3: Temporal evolution
│ ├── hourlyPatterns.js # Visualization 4: Hourly patterns
│ └── stationMap.js # Visualization 5: Station map
└── README.md # This file

```

## Code Structure

The dashboard uses a modular architecture:

- **app.js**: Coordinates data loading and visualization rendering
- **filters.js**: Manages filter status and notifies changes
- **Visualization Modules**: Each visualization is an independent module that can be rendered with different filters
