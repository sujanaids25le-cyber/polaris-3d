# POLARIS

This module handles the environmental data pipeline for POLARIS:

**Data Collection → Preprocessing → EDA → Feature Engineering → Sea-Ice Prediction → Prediction Output**

The system uses **full Antarctic coverage** and is not restricted to a single region such as the Weddell Sea.

---

## 1. Pipeline Overview

```text
NSIDC Sea Ice ─────┐
Copernicus Ocean ──┼──► Preprocessing ─► Alignment ─► EDA
ERA5 Weather ──────┘                         │
                                            ▼
                                  Feature Engineering
                                            │
                                            ▼
                                     Model Evaluation
                                            │
                                            ▼
                                   Sea-Ice Prediction
                                            │
                                            ▼
                                      Final Output
```

All datasets are aligned to the NSIDC 25 km South Polar Stereographic grid (EPSG:3412) with 332 × 316 cells.

Data period: 21 July 2026 → 19 August 2026 (30 calendar days)

---

## 2. Data Sources

| Source                   | Data Used                                                      | Resolution      |
| ------------------------ | -------------------------------------------------------------- | --------------- |
| NOAA/NSIDC CDR G02202 V6 | Sea-ice concentration (`cdr_seaice_conc`)                      | 25 km, daily    |
| Copernicus Marine        | Ocean currents (`uo`, `vo`) and temperature (`thetao`)         | 0.083°, daily   |
| ERA5                     | Wind (`u10`, `v10`), air temperature (`t2m`), pressure (`msl`) | 0.25°, 6-hourly |

**NSIDC**

28 of 30 daily files were available. 9–10 August 2026 were unavailable from the source and returned HTTP 404. The missing dates were preserved as missing values rather than interpolated.

**Copernicus Marine**

Surface ocean data at approximately 0.49 m depth. 30/30 days available.

**ERA5**

Original data is 6-hourly. Converted to daily values. Daily maximum wind speed was also derived.

---

## 3. Preprocessing

**Missing Data**

Missing values were investigated and documented.

* Approximately 21% of the NSIDC grid is NaN because sea-ice concentration is undefined over land.
* The two unavailable NSIDC dates were retained as missing.
* Additional missing values in Copernicus and ERA5 are mainly due to land masks and coverage boundaries.

**Spatial Alignment**

Copernicus and ERA5 were regridded onto the NSIDC 25 km polar stereographic grid so that all variables share the same spatial grid.

**Temporal Alignment**

* ERA5: 6-hourly → daily
* All sources aligned to a common daily timeline.
* Temperature converted from Kelvin → °C.
* Pressure converted from Pa → hPa.
* Unnecessary surface/depth dimensions removed.

**Main Output**

`data/processed/polaris_aligned.nc`

This contains the aligned environmental dataset for the complete 30-day period.

---

## 4. Exploratory Data Analysis

EDA outputs are stored in:

`data/processed/eda/`

The analysis includes:

* Spatial distributions
* Temporal trends
* Variable distributions
* Missing-data analysis
* Correlation analysis
* Physical sanity checks

**Main Correlations**

| Variable                     | Correlation with Sea Ice |
| ---------------------------- | ------------------------ |
| `thetao` — ocean temperature | -0.747                   |
| `v10` — north/south wind     | -0.590                   |
| `u10` — east/west wind       | -0.484                   |
| `vo` — north/south current   | -0.438                   |
| `t2m` — air temperature      | -0.217                   |
| `msl` — pressure             | -0.087                   |
| `uo` — east/west current     | -0.053                   |
| `wind_speed_max`             | -0.034                   |

Ocean temperature showed the strongest relationship with sea-ice concentration, which is physically consistent with warmer water being associated with lower sea-ice concentration.

---

## 5. Feature Engineering

Output:

`data/processed/features.parquet`

The feature dataset contains one row per grid cell × day.

**Features**

* `seaice_lag1`
* `thetao`
* `uo`, `vo`
* `u10`, `v10`
* `t2m`
* `msl`
* `wind_speed`
* `wind_dir_deg`
* `day_of_year`
* `days_since_start`
* `x`, `y`

**Target**

`target_seaice_t_plus1`

This represents the next-day sea-ice concentration used in the current prediction experiment.

Rows with missing target values or missing sea-ice input values were removed. Missing environmental features were handled using training-set statistics during model training.

---

## 6. Sea-Ice Prediction

The current implementation evaluates next-day sea-ice prediction.

**Models Tested**

*Persistence baseline*

Tomorrow's sea ice = latest available sea-ice concentration

*Random Forest*

A Random Forest model was trained using the environmental, temporal, and spatial features.

A delta-target version of the Random Forest was also tested.

**Evaluation**

A chronological split was used to avoid temporal leakage.

* Training: 20 days
* Testing: 6 days
* Forecast horizon: next day

**Results**

*Absolute Target*

| Method        | MAE    | RMSE   | R²     |
| ------------- | ------ | ------ | ------ |
| Persistence   | 0.0079 | 0.0300 | 0.9951 |
| Random Forest | 0.0112 | 0.0318 | 0.9945 |

*Delta Target*

| Method        | MAE    | RMSE   | R²     |
| ------------- | ------ | ------ | ------ |
| Persistence   | 0.0079 | 0.0300 | 0.9951 |
| Random Forest | 0.0113 | 0.0321 | 0.9944 |

Persistence performed better than both Random Forest approaches.

**Ice-Edge Evaluation**

| Zone                | Persistence MAE | RF MAE |
| ------------------- | --------------- | ------ |
| Ice edge            | 0.0564          | 0.0639 |
| Interior/open ocean | 0.0028          | 0.0058 |

Persistence remained the better-performing method.

**Final Method**

Persistence was selected for the current prediction output because it performed better than the tested Random Forest models on the available evaluation data.

---

## 7. Final Prediction Output

The final prediction uses the persistence method to generate the next-day sea-ice concentration from the latest available observation.

Outputs:

`data/processed/predictions/`

**Files**

*`prediction_latest.nc`*

Gridded NetCDF containing:

* Predicted sea-ice concentration
* Latitude
* Longitude
* Prediction date
* Based-on date
* Prediction method

*`prediction_latest.csv`*

Flat table containing the prediction and its spatial/temporal information.

*`prediction_latest.geojson`*

GIS-friendly representation of valid prediction grid cells.

The NetCDF is the primary gridded output, while CSV and GeoJSON provide convenient formats for downstream use.

---

## 8. Validation

The final prediction-generation script performs 9 automated validation checks, including:

* Prediction range [0,1]
* Missing-data reporting
* Duplicate grid-cell detection
* Correct prediction date
* Latitude/longitude validation
* Expected grid-cell count
* GeoJSON feature count
* NetCDF/CSV consistency
* GeoJSON/CSV consistency

All 9 checks passed on the real dataset.

The validation system was also tested with deliberately corrupted data to confirm that failures can be detected.

---

## 9. How to Run

Run the pipeline in this order:

```text
scripts/download_sea_ice.py
scripts/inspect_sea_ice.py
scripts/inspect_ocean_data.py
scripts/load_clean_ocean.py
scripts/download_era5.py
scripts/inspect_era5.py
scripts/create_nsidc_grid.py
scripts/regrid_era5.py
scripts/copernicus_to_nsidc.py
scripts/era5_daily_aggregate.py
scripts/final_merge.py
scripts/eda.py
scripts/feature_engineering.py
scripts/train_model.py
scripts/generate_predictions.py
```

**Main Dependencies**

* xarray
* netCDF4
* numpy
* pandas
* matplotlib
* pyproj
* scipy
* scikit-learn
* cdsapi
* pyarrow

---

## 10. Project Structure

```text
POLARIS/

├── data/
│   ├── copernicus/
│   │   ├── currents/
│   │   │   └── cmems_mod_glo_phy-cur_anfc_0.083d...
│   │   └── temperature/
│   │       └── cmems_mod_glo_phy-thetao_anfc_0.083...
│   │
│   ├── processed/
│   │   ├── eda/
│   │   ├── model/
│   │   ├── predictions/
│   │   ├── sanity_plots/
│   │   ├── copernicus_on_nsidc.nc
│   │   ├── currents_clean.nc
│   │   ├── era5_daily.nc
│   │   ├── era5_on_nsidc_202607.nc
│   │   ├── era5_on_nsidc_202608.nc
│   │   ├── features.nc
│   │   ├── features.parquet
│   │   ├── nsidc_grid_latlon.nc
│   │   ├── polaris_aligned.nc
│   │   └── temperature_clean.nc
│   │
│   └── raw/
│       ├── era5/
│       │   ├── era5_202607.nc
│       │   └── era5_202608.nc
│       └── sea_ice/
│
├── scripts/
│   ├── copernicus_to_nsidc.py
│   ├── create_nsidc_grid.py
│   ├── download_era5.py
│   ├── download_sea_ice.py
│   ├── eda.py
│   ├── era5_daily_aggregate.py
│   ├── feature_engineering.py
│   ├── final_merge.py
│   ├── generate_predictions.py
│   ├── inspect_era5.py
│   ├── inspect_ocean_data.py
│   ├── inspect_sea_ice.py
│   ├── load_clean_ocean.py
│   ├── regrid_era5.py
│   └── train_model.py
│
└── README.md
```

---

## 11. Known Limitations

* The current dataset covers 30 calendar days of Antarctic winter.
* Two NSIDC dates were unavailable from the original data source.
* The current model evaluation uses a next-day forecast horizon.
* Random Forest did not outperform persistence on the available evaluation data.
* The current evaluation does not test different seasons.
* Spatial/neighbor features have not yet been added.
* Per-cell prediction uncertainty has not yet been implemented.

These limitations provide clear directions for future model improvement.

---

## 12. Module Output

The completed module provides a clean, spatially aligned prediction dataset containing:

* Predicted sea-ice concentration
* Latitude/longitude
* Prediction date
* Source/based-on date
* Prediction method


