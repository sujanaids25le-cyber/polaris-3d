# %%
import xarray as xr
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


# %%
# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

INPUT_FILE = Path("data/processed/polaris_aligned.nc")
OUTPUT_DIR = Path("data/processed/eda")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

if not INPUT_FILE.exists():
    raise FileNotFoundError(f"Dataset not found: {INPUT_FILE}")

print("=" * 60)
print("POLARIS — EXPLORATORY DATA ANALYSIS")
print("=" * 60)


# %%
# ------------------------------------------------------------
# LOAD DATASET
# ------------------------------------------------------------

print("\nLoading final aligned dataset...")

ds = xr.open_dataset(INPUT_FILE)

print(ds)

print("\nDimensions:")
for name, size in ds.sizes.items():
    print(f"  {name}: {size}")

print("\nVariables:")
for name in ds.data_vars:
    print(f"  {name}: {ds[name].dims}")


# %%
# ------------------------------------------------------------
# VARIABLE STATISTICS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("VARIABLE STATISTICS")
print("=" * 60)

variables = [
    "cdr_seaice_conc",
    "uo",
    "vo",
    "thetao",
    "u10",
    "v10",
    "t2m",
    "msl",
    "wind_speed_max",
]

stats = []

for var in variables:

    if var not in ds:
        print(f"\nSkipping {var} — not found.")
        continue

    da = ds[var]

    stats.append(
        {
            "variable": var,
            "min": float(da.min(skipna=True)),
            "max": float(da.max(skipna=True)),
            "mean": float(da.mean(skipna=True)),
            "std": float(da.std(skipna=True)),
            "missing_percent": float(
                da.isnull().sum() / da.size * 100
            ),
        }
    )

    print(f"\n{var}")
    print(f"  Min:     {stats[-1]['min']:.4f}")
    print(f"  Max:     {stats[-1]['max']:.4f}")
    print(f"  Mean:    {stats[-1]['mean']:.4f}")
    print(f"  Std:     {stats[-1]['std']:.4f}")
    print(f"  Missing: {stats[-1]['missing_percent']:.2f}%")


stats_df = pd.DataFrame(stats)

stats_df.to_csv(
    OUTPUT_DIR / "variable_statistics.csv",
    index=False,
)

print("\nSaved: variable_statistics.csv")


# %%
# ------------------------------------------------------------
# MISSING DATA ANALYSIS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("MISSING DATA ANALYSIS")
print("=" * 60)

missing_summary = []

for var in variables:

    if var not in ds:
        continue

    da = ds[var]

    total = da.size
    missing = int(da.isnull().sum())

    missing_summary.append(
        {
            "variable": var,
            "missing_cells": missing,
            "total_cells": total,
            "missing_percent": 100 * missing / total,
        }
    )

    print(
        f"{var}: "
        f"{missing:,}/{total:,} "
        f"({100 * missing / total:.2f}%)"
    )


missing_df = pd.DataFrame(missing_summary)

missing_df.to_csv(
    OUTPUT_DIR / "missing_data_summary.csv",
    index=False,
)

print("\nSaved: missing_data_summary.csv")


# %%
# ------------------------------------------------------------
# MISSING DATA BY DAY
# ------------------------------------------------------------

print("\nCalculating missing data by day...")

daily_missing = {}

for var in variables:

    if var not in ds:
        continue

    daily_missing[var] = (
        ds[var]
        .isnull()
        .mean(dim=["y", "x"])
        .values
        * 100
    )


daily_missing_df = pd.DataFrame(
    daily_missing,
    index=pd.to_datetime(ds.time.values),
)

print(daily_missing_df)

daily_missing_df.to_csv(
    OUTPUT_DIR / "daily_missing_percent.csv"
)


# %%
# ------------------------------------------------------------
# PLOT — MISSING DATA BY DAY
# ------------------------------------------------------------

plt.figure(figsize=(12, 6))

for var in daily_missing_df.columns:

    plt.plot(
        daily_missing_df.index,
        daily_missing_df[var],
        label=var,
    )

plt.xlabel("Date")
plt.ylabel("Missing data (%)")
plt.title("POLARIS — Daily Missing Data")
plt.legend()
plt.grid(True)
plt.tight_layout()

plt.savefig(
    OUTPUT_DIR / "missing_data_by_day.png",
    dpi=150,
)

plt.close()


# %%
# ------------------------------------------------------------
# DISTRIBUTIONS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("VARIABLE DISTRIBUTIONS")
print("=" * 60)

distribution_variables = [
    "cdr_seaice_conc",
    "uo",
    "vo",
    "thetao",
    "u10",
    "v10",
    "t2m",
    "msl",
    "wind_speed_max",
]

for var in distribution_variables:

    if var not in ds:
        continue

    print(f"Plotting distribution: {var}")

    values = ds[var].values.flatten()
    values = values[np.isfinite(values)]

    plt.figure(figsize=(9, 5))

    plt.hist(
        values,
        bins=50,
    )

    plt.xlabel(var)
    plt.ylabel("Frequency")
    plt.title(f"Distribution — {var}")
    plt.grid(True)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / f"distribution_{var}.png",
        dpi=150,
    )

    plt.close()


# %%
# ------------------------------------------------------------
# TEMPORAL PATTERNS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("TEMPORAL PATTERNS")
print("=" * 60)

temporal_variables = [
    "cdr_seaice_conc",
    "uo",
    "vo",
    "thetao",
    "u10",
    "v10",
    "t2m",
    "msl",
    "wind_speed_max",
]

temporal_means = {}

for var in temporal_variables:

    if var not in ds:
        continue

    temporal_means[var] = (
        ds[var]
        .mean(dim=["y", "x"], skipna=True)
        .values
    )


temporal_df = pd.DataFrame(
    temporal_means,
    index=pd.to_datetime(ds.time.values),
)

print(temporal_df)

temporal_df.to_csv(
    OUTPUT_DIR / "temporal_means.csv"
)


# %%
# ------------------------------------------------------------
# PLOT — TEMPORAL PATTERNS
# ------------------------------------------------------------

for var in temporal_df.columns:

    plt.figure(figsize=(10, 5))

    plt.plot(
        temporal_df.index,
        temporal_df[var],
        marker="o",
    )

    plt.xlabel("Date")
    plt.ylabel(var)
    plt.title(f"Daily Spatial Mean — {var}")
    plt.grid(True)
    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / f"temporal_{var}.png",
        dpi=150,
    )

    plt.close()


# %%
# ------------------------------------------------------------
# SPATIAL PATTERNS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("SPATIAL PATTERNS")
print("=" * 60)

spatial_variables = [
    "cdr_seaice_conc",
    "uo",
    "vo",
    "thetao",
    "t2m",
    "msl",
    "wind_speed_max",
]

# Use the first available day for spatial inspection.
time_index = 0

print(
    f"Spatial maps use date: "
    f"{pd.Timestamp(ds.time.values[time_index]).date()}"
)

for var in spatial_variables:

    if var not in ds:
        continue

    print(f"Plotting spatial pattern: {var}")

    data = ds[var].isel(time=time_index)

    plt.figure(figsize=(8, 7))

    plt.pcolormesh(
        ds["x"],
        ds["y"],
        data,
        shading="auto",
    )

    plt.xlabel("NSIDC X coordinate (m)")
    plt.ylabel("NSIDC Y coordinate (m)")
    plt.title(
        f"Spatial Pattern — {var}\n"
        f"{pd.Timestamp(ds.time.values[time_index]).date()}"
    )

    plt.colorbar(label=var)

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / f"spatial_{var}.png",
        dpi=150,
    )

    plt.close()


# %%
# ------------------------------------------------------------
# CORRELATION ANALYSIS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("CORRELATION ANALYSIS")
print("=" * 60)

correlation_variables = [
    "cdr_seaice_conc",
    "uo",
    "vo",
    "thetao",
    "u10",
    "v10",
    "t2m",
    "msl",
    "wind_speed_max",
]

# Spatially averaged daily values are used for the
# first correlation analysis.
correlation_df = temporal_df[
    [
        var
        for var in correlation_variables
        if var in temporal_df.columns
    ]
]

correlation_matrix = correlation_df.corr()

print("\nCorrelation matrix:")
print(correlation_matrix.round(3))

correlation_matrix.to_csv(
    OUTPUT_DIR / "correlation_matrix.csv"
)


# %%
# ------------------------------------------------------------
# CORRELATION HEATMAP
# ------------------------------------------------------------

plt.figure(figsize=(10, 8))

plt.imshow(
    correlation_matrix,
    aspect="auto",
)

plt.xticks(
    range(len(correlation_matrix.columns)),
    correlation_matrix.columns,
    rotation=45,
    ha="right",
)

plt.yticks(
    range(len(correlation_matrix.index)),
    correlation_matrix.index,
)

plt.colorbar(label="Correlation")

plt.title(
    "POLARIS — Environmental Variable Correlations"
)

plt.tight_layout()

plt.savefig(
    OUTPUT_DIR / "correlation_matrix.png",
    dpi=150,
)

plt.close()


# %%
# ------------------------------------------------------------
# SEA-ICE CORRELATIONS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("SEA-ICE CORRELATIONS")
print("=" * 60)

if "cdr_seaice_conc" in correlation_matrix:

    sea_ice_corr = (
        correlation_matrix["cdr_seaice_conc"]
        .sort_values(ascending=False)
    )

    print("\nCorrelation with sea-ice concentration:")
    print(sea_ice_corr.round(3))

    sea_ice_corr.to_csv(
        OUTPUT_DIR / "sea_ice_correlations.csv"
    )


# %%
# ------------------------------------------------------------
# PHYSICAL SANITY CHECKS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("PHYSICAL SANITY CHECKS")
print("=" * 60)

checks = {}

if "cdr_seaice_conc" in ds:

    sic = ds["cdr_seaice_conc"]

    checks["sea_ice_below_0"] = int(
        (sic < 0).sum()
    )

    checks["sea_ice_above_1"] = int(
        (sic > 1).sum()
    )

    print(
        f"Sea-ice concentration < 0: "
        f"{checks['sea_ice_below_0']:,}"
    )

    print(
        f"Sea-ice concentration > 1: "
        f"{checks['sea_ice_above_1']:,}"
    )


if "wind_speed_max" in ds:

    wind = ds["wind_speed_max"]

    checks["negative_wind_speed"] = int(
        (wind < 0).sum()
    )

    print(
        f"Negative wind speed values: "
        f"{checks['negative_wind_speed']:,}"
    )


if "thetao" in ds:

    temp = ds["thetao"]

    # FIX: seawater freezes around -1.8°C, so -5°C was too lenient to
    # actually catch physically implausible ocean temperatures. -2°C
    # is a tighter, more meaningful threshold.
    checks["temperature_below_-2"] = int(
        (temp < -2).sum()
    )

    print(
        f"Temperature < -2°C (below approx. seawater freezing point): "
        f"{checks['temperature_below_-2']:,}"
    )


print("\nPhysical sanity checks complete.")


# %%
# ------------------------------------------------------------
# FINAL SUMMARY
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("EDA COMPLETE")
print("=" * 60)

print(f"\nInput: {INPUT_FILE}")
print(f"Output directory: {OUTPUT_DIR}")

print("\nGenerated:")
print("  variable_statistics.csv")
print("  missing_data_summary.csv")
print("  daily_missing_percent.csv")
print("  temporal_means.csv")
print("  correlation_matrix.csv")
print("  sea_ice_correlations.csv")
print("  missing_data_by_day.png")
print("  distribution_*.png")
print("  temporal_*.png")
print("  spatial_*.png")
print("  correlation_matrix.png")

ds.close()

print("\nDataset closed.")
print("Ready for feature engineering.")