import xarray as xr
import numpy as np
import pandas as pd
from pathlib import Path

INPUT_FILE = Path("data/processed/polaris_aligned.nc")
OUTPUT_NC = Path("data/processed/features.nc")
OUTPUT_PARQUET = Path("data/processed/features.parquet")


def build_gridded_features(ds: xr.Dataset) -> xr.Dataset:
    """Build all features while still in (time, y, x) array form —
    easier to reason about and cheaper than doing it after flattening."""

    print("Building lag feature (seaice_lag1)...")
    seaice_lag1 = ds["cdr_seaice_conc"]

    print("Building next-day target...")
    # shift(time=-1) brings tomorrow's value to today's row
    target = ds["cdr_seaice_conc"].shift(time=-1)

    print("Building derived wind features...")
    wind_speed = np.sqrt(ds["u10"] ** 2 + ds["v10"] ** 2)
    # Meteorological convention: direction the wind is coming FROM,
    # measured clockwise from north.
    wind_dir_deg = (np.degrees(np.arctan2(-ds["u10"], -ds["v10"])) + 360) % 360

    print("Building temporal features...")
    day_of_year = xr.DataArray(
        pd.to_datetime(ds.time.values).dayofyear,
        dims="time",
        coords={"time": ds.time},
    )
    days_since_start = xr.DataArray(
        np.arange(ds.sizes["time"]),
        dims="time",
        coords={"time": ds.time},
    )

    features = xr.Dataset(
        {
            "seaice_lag1": seaice_lag1,
            "target_seaice_t_plus1": target,
            "thetao": ds["thetao"],
            "uo": ds["uo"],
            "vo": ds["vo"],
            "u10": ds["u10"],
            "v10": ds["v10"],
            "t2m": ds["t2m"],
            "msl": ds["msl"],
            "wind_speed": wind_speed,
            "wind_dir_deg": wind_dir_deg,
        }
    )
    features["day_of_year"] = day_of_year
    features["days_since_start"] = days_since_start

    return features


def flatten_to_table(features: xr.Dataset) -> pd.DataFrame:
    """Convert the gridded feature set into a flat table: one row per
    (time, y, x) combination — the format needed for sklearn/XGBoost."""

    print("Flattening to a grid-cell x day table...")
    df = features.to_dataframe().reset_index()

    n_before = len(df)
    print(f"  Rows before any filtering: {n_before:,}")

    # Drop rows with no target (last day of the window has no t+1)
    df_no_target = df["target_seaice_t_plus1"].isna().sum()
    df = df.dropna(subset=["target_seaice_t_plus1"])
    print(f"  Dropped {df_no_target:,} rows with missing target (no next day available)")

    # Drop rows where today's ice concentration (the main lag feature)
    # is itself missing — can't predict from a missing input.
    n_missing_lag = df["seaice_lag1"].isna().sum()
    df = df.dropna(subset=["seaice_lag1"])
    print(f"  Dropped {n_missing_lag:,} additional rows with missing seaice_lag1")

    # Flag (but keep) rows with missing ocean/weather features, so the
    # decision to impute or drop is made explicitly later, not here.
    ocean_cols = ["thetao", "uo", "vo"]
    weather_cols = ["u10", "v10", "t2m", "msl", "wind_speed", "wind_dir_deg"]

    df["ocean_data_missing"] = df[ocean_cols].isna().any(axis=1)
    df["weather_data_missing"] = df[weather_cols].isna().any(axis=1)

    print(f"  Rows with any missing ocean feature: {df['ocean_data_missing'].sum():,} "
          f"({100*df['ocean_data_missing'].mean():.1f}%)")
    print(f"  Rows with any missing weather feature: {df['weather_data_missing'].sum():,} "
          f"({100*df['weather_data_missing'].mean():.1f}%)")

    print(f"  Final row count: {len(df):,} (from {n_before:,} raw grid-cell x day combinations)")

    return df


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {INPUT_FILE}")

    print("=" * 60)
    print("POLARIS — FEATURE ENGINEERING")
    print("=" * 60)

    print("\nLoading aligned dataset...")
    ds = xr.open_dataset(INPUT_FILE)
    print(f"  Shape: time={ds.sizes['time']}, y={ds.sizes['y']}, x={ds.sizes['x']}")

    print("\nBuilding gridded features...")
    features = build_gridded_features(ds)

    print(f"\nSaving gridded feature set to {OUTPUT_NC}...")
    features.to_netcdf(OUTPUT_NC)
    print("  Saved.")

    print("\nFlattening to table format...")
    df = flatten_to_table(features)

    print(f"\nSaving flat feature table to {OUTPUT_PARQUET}...")
    df.to_parquet(OUTPUT_PARQUET, index=False)
    print("  Saved.")

    print("\n--- Feature table preview ---")
    print(df.head())
    print("\n--- Column summary ---")
    print(df.dtypes)

    print("\n--- Basic stats on key columns ---")
    for col in ["seaice_lag1", "target_seaice_t_plus1", "wind_speed", "wind_dir_deg"]:
        print(f"  {col}: min={df[col].min():.4f}  max={df[col].max():.4f}  mean={df[col].mean():.4f}")

    ds.close()
    print("\n" + "=" * 60)
    print("FEATURE ENGINEERING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()