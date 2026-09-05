
import xarray as xr
import numpy as np
from scipy.interpolate import RegularGridInterpolator
from pathlib import Path

CURRENTS_FILE = Path("data/processed/currents_clean.nc")
TEMPERATURE_FILE = Path("data/processed/temperature_clean.nc")
GRID_FILE = Path("data/processed/nsidc_grid_latlon.nc")
OUTPUT_FILE = Path("data/processed/copernicus_on_nsidc.nc")


def regrid_variable(da, lat_source, lon_source, lat_target, lon_target):
    """Same logic as era5_to_nsidc.py's regrid_variable: handle descending
    coordinates, then interpolate each timestep onto the target grid."""

    if lat_source[0] > lat_source[-1]:
        lat_source = lat_source[::-1]
        da = da.isel(latitude=slice(None, None, -1))

    if lon_source[0] > lon_source[-1]:
        lon_source = lon_source[::-1]
        da = da.isel(longitude=slice(None, None, -1))

    points = np.column_stack([lat_target.ravel(), lon_target.ravel()])

    output = []
    n_time = da.sizes["time"]
    for i in range(n_time):
        print(f"    timestep {i + 1}/{n_time}")
        values = da.isel(time=i).values

        interpolator = RegularGridInterpolator(
            (lat_source, lon_source),
            values,
            method="linear",
            bounds_error=False,
            fill_value=np.nan,
        )

        result = interpolator(points)
        result = result.reshape(lat_target.shape)
        output.append(result)

    return np.stack(output, axis=0)


def regrid_dataset(ds, variables, grid):
    lat_target = grid["latitude"].values
    lon_target = grid["longitude"].values
    lat_source = ds["latitude"].values
    lon_source = ds["longitude"].values

    print(f"Time steps: {ds.sizes['time']}")
    print(f"Target grid: {lat_target.shape}")

    output_vars = {}
    for var in variables:
        print(f"\nRegridding {var}...")
        result = regrid_variable(ds[var], lat_source.copy(), lon_source.copy(), lat_target, lon_target)

        output_vars[var] = xr.DataArray(
            result,
            dims=("time", "y", "x"),
            coords={"time": ds["time"].values, "y": grid["y"].values, "x": grid["x"].values},
            name=var,
            attrs=ds[var].attrs,
        )

        n_nan = int(np.isnan(result).sum())
        total = result.size
        print(f"  Shape: {result.shape}")
        print(f"  Missing: {n_nan:,}/{total:,} ({100 * n_nan / total:.2f}%)")
        print(f"  Min: {np.nanmin(result):.3f}  Max: {np.nanmax(result):.3f}  Mean: {np.nanmean(result):.3f}")

    return output_vars


def main():
    print("=" * 60)
    print("COPERNICUS → NSIDC 25 KM GRID")
    print("=" * 60)

    if not GRID_FILE.exists():
        raise FileNotFoundError(f"NSIDC grid file not found: {GRID_FILE}")
    if not CURRENTS_FILE.exists():
        raise FileNotFoundError(f"Currents file not found: {CURRENTS_FILE}")
    if not TEMPERATURE_FILE.exists():
        raise FileNotFoundError(f"Temperature file not found: {TEMPERATURE_FILE}")

    grid = xr.open_dataset(GRID_FILE)
    print(f"Target grid shape: {grid['latitude'].shape}")

    print("\n" + "=" * 60)
    print("CURRENTS (uo, vo)")
    print("=" * 60)
    ds_cur = xr.open_dataset(CURRENTS_FILE)
    cur_vars = regrid_dataset(ds_cur, ["uo", "vo"], grid)
    ds_cur.close()

    print("\n" + "=" * 60)
    print("TEMPERATURE (thetao)")
    print("=" * 60)
    ds_temp = xr.open_dataset(TEMPERATURE_FILE)
    temp_vars = regrid_dataset(ds_temp, ["thetao"], grid)
    ds_temp.close()

    # Combine into one output dataset. Sanity check: currents and
    # temperature should share the same time coordinate — verify before
    # merging blindly.
    if not np.array_equal(ds_cur["time"].values if False else cur_vars["uo"].time.values,
                           temp_vars["thetao"].time.values):
        raise ValueError("Currents and temperature time coordinates don't match — check inputs before merging.")

    all_vars = {**cur_vars, **temp_vars}
    output_ds = xr.Dataset(all_vars)
    output_ds.attrs["source"] = "Copernicus Marine (GLOBAL_ANALYSISFORECAST_PHY_001_024)"
    output_ds.attrs["regridded_to"] = "NSIDC G02202 V6 25 km South Polar Stereographic grid"
    output_ds.attrs["crs"] = "EPSG:3412"

    output_ds.to_netcdf(OUTPUT_FILE)
    print(f"\nSaved: {OUTPUT_FILE}")

    grid.close()

    print("\n" + "=" * 60)
    print("COPERNICUS REGRIDDING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()