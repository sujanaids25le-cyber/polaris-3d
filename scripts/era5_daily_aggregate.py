import xarray as xr
import numpy as np
from pathlib import Path

FILES = [
    Path("data/processed/era5_on_nsidc_202607.nc"),
    Path("data/processed/era5_on_nsidc_202608.nc"),
]
OUTPUT_FILE = Path("data/processed/era5_daily.nc")


def main():
    for f in FILES:
        if not f.exists():
            raise FileNotFoundError(f"Missing file: {f}")

    print("Loading and combining ERA5 files...")
    datasets = [xr.open_dataset(f) for f in FILES]
    ds = xr.concat(datasets, dim="valid_time")
    ds = ds.sortby("valid_time")
    print(f"Combined time steps: {ds.sizes['valid_time']}")
    print(f"Range: {ds.valid_time.values.min()} to {ds.valid_time.values.max()}")

    # Sanity check: 6-hourly should mean exactly 4 steps per day
    n_days = (ds.valid_time.values.max() - ds.valid_time.values.min()).astype("timedelta64[D]").astype(int) + 1
    expected_steps = n_days * 4
    if ds.sizes["valid_time"] != expected_steps:
        print(f"  WARNING: expected {expected_steps} timesteps for {n_days} days at 6-hourly, "
              f"got {ds.sizes['valid_time']}. Check for gaps before proceeding.")

    # Rename valid_time -> time to match NSIDC/Copernicus convention
    ds = ds.rename({"valid_time": "time"})

    print("\nAggregating to daily means...")
    daily = ds.resample(time="1D").mean()
    print(f"Daily time steps: {daily.sizes['time']}")

    # Also compute daily max wind speed (derived from u10/v10) since peak
    # wind is more relevant to navigation hazard than the daily average.
    print("Computing daily max wind speed...")
    wind_speed = np.sqrt(ds["u10"] ** 2 + ds["v10"] ** 2)
    wind_speed.name = "wind_speed"
    daily_max_wind = wind_speed.resample(time="1D").max()
    daily_max_wind.name = "wind_speed_max"
    daily["wind_speed_max"] = daily_max_wind

    # Unit conversions
    print("Converting units: t2m K->C, msl Pa->hPa...")
    daily["t2m"] = daily["t2m"] - 273.15
    daily["t2m"].attrs["units"] = "degC"
    daily["msl"] = daily["msl"] / 100.0
    daily["msl"].attrs["units"] = "hPa"

    print("\n--- Post-aggregation stats ---")
    for var in ["u10", "v10", "t2m", "msl", "wind_speed_max"]:
        da = daily[var]
        print(f"  {var}: min={float(da.min()):.3f}  max={float(da.max()):.3f}  "
              f"mean={float(da.mean()):.3f}  units={da.attrs.get('units', '?')}")

    daily.attrs["source"] = "ERA5, aggregated from 6-hourly to daily"
    daily.attrs["aggregation"] = "mean (u10, v10, t2m, msl); max (wind_speed_max)"

    daily.to_netcdf(OUTPUT_FILE)
    print(f"\nSaved: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()