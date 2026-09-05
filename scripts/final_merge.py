
import xarray as xr
import numpy as np
from pathlib import Path

SEA_ICE_DIR = Path("data/raw/sea_ice")
COPERNICUS_FILE = Path("data/processed/copernicus_on_nsidc.nc")
ERA5_FILE = Path("data/processed/era5_daily.nc")
OUTPUT_FILE = Path("data/processed/polaris_aligned.nc")

START_DATE = "2026-07-21"
END_DATE = "2026-08-19"


def main():
    print("=" * 60)
    print("POLARIS — FINAL DATA ALIGNMENT")
    print("=" * 60)

    if not SEA_ICE_DIR.exists():
        raise FileNotFoundError(f"Sea-ice directory not found: {SEA_ICE_DIR}")
    if not COPERNICUS_FILE.exists():
        raise FileNotFoundError(f"Copernicus file not found: {COPERNICUS_FILE}")
    if not ERA5_FILE.exists():
        raise FileNotFoundError(f"ERA5 daily file not found: {ERA5_FILE}")

    sea_ice_files = sorted(SEA_ICE_DIR.glob("*.nc"))
    if not sea_ice_files:
        raise FileNotFoundError(f"No NetCDF sea-ice files found in {SEA_ICE_DIR}")
    print(f"\nSea-ice files found: {len(sea_ice_files)}")

    print("\nLoading NSIDC sea-ice data...")
    sea_ice_datasets = [xr.open_dataset(f) for f in sea_ice_files]
    sea_ice = xr.concat(sea_ice_datasets, dim="time").sortby("time")
    print(f"  Time steps: {sea_ice.sizes['time']}")
    print(f"  Time range: {sea_ice.time.values.min()} -> {sea_ice.time.values.max()}")
    print(f"  Grid: {sea_ice.sizes['y']} x {sea_ice.sizes['x']}")

    print("\nLoading Copernicus data...")
    copernicus = xr.open_dataset(COPERNICUS_FILE)
    print(f"  Time steps: {copernicus.sizes['time']}")
    print(f"  Grid: {copernicus.sizes['y']} x {copernicus.sizes['x']}")

    print("\nLoading ERA5 daily data...")
    era5 = xr.open_dataset(ERA5_FILE)
    print(f"  Time steps: {era5.sizes['time']}")
    print(f"  Grid: {era5.sizes['y']} x {era5.sizes['x']}")

    print("\nChecking grid compatibility...")
    for name, ds in [("Copernicus", copernicus), ("ERA5", era5)]:
        if not np.array_equal(sea_ice["x"].values, ds["x"].values):
            raise ValueError(f"{name} x coordinates do not match NSIDC grid.")
        if not np.array_equal(sea_ice["y"].values, ds["y"].values):
            raise ValueError(f"{name} y coordinates do not match NSIDC grid.")
        print(f"  {name}: x/y grid matches NSIDC")

    print("\nCreating shared time index...")
    target_time = xr.date_range(start=START_DATE, end=END_DATE, freq="1D", use_cftime=False)
    print(f"  Expected days: {len(target_time)}")
    print(f"  Range: {target_time[0]} -> {target_time[-1]}")

    # --- FIX: check for missing dates BEFORE reindexing, against each
    # dataset's ORIGINAL native time index. This is the only point at
    # which a gap is visible as a missing timestamp rather than a NaN
    # hidden inside an already-complete time axis. ---
    print("\nMissing-date check (against original data, before reindexing):")
    datasets_by_name = {"NSIDC": sea_ice, "Copernicus": copernicus, "ERA5": era5}
    for name, ds in datasets_by_name.items():
        original_dates = set(ds.time.values)
        missing_dates = [str(t)[:10] for t in target_time.values if t not in original_dates]
        if missing_dates:
            print(f"  {name}: MISSING {len(missing_dates)} date(s): {missing_dates}")
        else:
            print(f"  {name}: complete")

    print("\nAligning datasets to shared dates (reindexing)...")
    sea_ice = sea_ice.reindex(time=target_time)
    copernicus = copernicus.reindex(time=target_time)
    era5 = era5.reindex(time=target_time)
    print("  Done — any gaps found above are now NaN at their timestamps.")

    # Drop the crs reference variable and QA/quality-flag variables before
    # merging. These are small integer-typed variables in the original
    # NSIDC files; once concatenated across time and reindexed (which
    # introduces NaN for the 2 missing days), xarray silently promotes
    # them to float but tries to save them back using their original
    # integer encoding — casting NaN to an integer is undefined behavior
    # and corrupts those cells on write. None of these are needed for
    # modeling (they're metadata/QA, not the actual concentration data),
    # so the safest fix is to drop them rather than fight the encoding.
    vars_to_drop = [
        "crs",
        "cdr_seaice_conc_qa_flag",
        "cdr_seaice_conc_interp_spatial_flag",
        "cdr_seaice_conc_interp_temporal_flag",
    ]
    sea_ice = sea_ice.drop_vars([v for v in vars_to_drop if v in sea_ice.data_vars])

    print("\nCombining datasets...")
    output = xr.merge([sea_ice, copernicus, era5], compat="override")

    output.attrs["project"] = "POLARIS"
    output.attrs["description"] = (
        "Antarctic environmental dataset aligned to the NSIDC 25 km South Polar Stereographic grid"
    )
    output.attrs["time_period"] = f"{START_DATE} to {END_DATE}"
    output.attrs["spatial_grid"] = "NSIDC G02202 V6, 25 km, EPSG:3412"
    output.attrs["missing_data"] = (
        "Original missing values preserved; no interpolation performed. "
        "See printed missing-date check above for which dates/sources had gaps."
    )

    print("\n" + "=" * 60)
    print("FINAL DATASET CHECK")
    print("=" * 60)
    print(output)

    print("\nDimensions:")
    for name, size in output.sizes.items():
        print(f"  {name}: {size}")

    print("\nVariables:")
    for name in output.data_vars:
        print(f"  {name}: {output[name].dims}")

    print("\nMissing-value summary (per variable, % of all cells):")
    for name in output.data_vars:
        da = output[name]
        missing = int(da.isnull().sum().values)
        total = da.size
        print(f"  {name}: {missing:,}/{total:,} ({100 * missing / total:.2f}%)")

    print("\nSaving final aligned dataset...")
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    output.to_netcdf(OUTPUT_FILE)
    print(f"Saved: {OUTPUT_FILE}")

    for ds in sea_ice_datasets:
        ds.close()
    copernicus.close()
    era5.close()

    print("\n" + "=" * 60)
    print("POLARIS ALIGNMENT COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()