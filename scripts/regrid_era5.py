
import xarray as xr
import numpy as np
from scipy.interpolate import RegularGridInterpolator
from pathlib import Path


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

ERA5_FILES = [
    Path("data/raw/era5/era5_202607.nc"),
    Path("data/raw/era5/era5_202608.nc"),
]

GRID_FILE = Path("data/processed/nsidc_grid_latlon.nc")

OUTPUT_DIR = Path("data/processed")

VARIABLES = ["u10", "v10", "t2m", "msl"]


# ------------------------------------------------------------
# REGRID ONE VARIABLE
# ------------------------------------------------------------

def regrid_variable(da, lat_source, lon_source, lat_target, lon_target):

    if lat_source[0] > lat_source[-1]:
        lat_source = lat_source[::-1]
        da = da.isel(latitude=slice(None, None, -1))

    if lon_source[0] > lon_source[-1]:
        lon_source = lon_source[::-1]
        da = da.isel(longitude=slice(None, None, -1))

    points = np.column_stack(
        [
            lat_target.ravel(),
            lon_target.ravel(),
        ]
    )

    output = []

    for i in range(da.sizes["valid_time"]):

        print(
            f"    timestep {i + 1}/{da.sizes['valid_time']}"
        )

        values = da.isel(valid_time=i).values

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


# ------------------------------------------------------------
# PROCESS ONE ERA5 FILE
# ------------------------------------------------------------

def process_file(era5_path, grid):

    print("=" * 60)
    print(f"PROCESSING: {era5_path.name}")
    print("=" * 60)

    if not era5_path.exists():
        raise FileNotFoundError(
            f"ERA5 file not found: {era5_path}"
        )

    ds = xr.open_dataset(era5_path)

    lat_target = grid["latitude"].values
    lon_target = grid["longitude"].values

    lat_source = ds["latitude"].values
    lon_source = ds["longitude"].values

    print(f"\nERA5 time steps: {ds.sizes['valid_time']}")
    print(f"Target grid: {lat_target.shape}")

    output_variables = {}

    for var in VARIABLES:

        print(f"\nRegridding {var}...")

        result = regrid_variable(
            ds[var],
            lat_source.copy(),
            lon_source.copy(),
            lat_target,
            lon_target,
        )

        output_variables[var] = xr.DataArray(
            result,
            dims=("valid_time", "y", "x"),
            coords={
                "valid_time": ds["valid_time"].values,
                "y": grid["y"].values,
                "x": grid["x"].values,
            },
            name=var,
            attrs=ds[var].attrs,
        )

        n_nan = int(np.isnan(result).sum())
        total = result.size

        print(
            f"  Shape: {result.shape}"
        )

        print(
            f"  Missing: {n_nan:,}/{total:,} "
            f"({100 * n_nan / total:.2f}%)"
        )

        print(
            f"  Min: {np.nanmin(result):.3f}"
            f"  Max: {np.nanmax(result):.3f}"
            f"  Mean: {np.nanmean(result):.3f}"
        )

    output_ds = xr.Dataset(output_variables)

    output_ds.attrs["source"] = "ERA5"
    output_ds.attrs["regridded_to"] = (
        "NSIDC G02202 V6 25 km South Polar Stereographic grid"
    )
    output_ds.attrs["crs"] = "EPSG:3412"

    output_path = (
        OUTPUT_DIR / f"era5_on_nsidc_{era5_path.stem[-6:]}.nc"
    )

    output_ds.to_netcdf(output_path)

    print(f"\nSaved: {output_path}")

    ds.close()


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    print("=" * 60)
    print("ERA5 → NSIDC 25 KM GRID")
    print("=" * 60)

    if not GRID_FILE.exists():
        raise FileNotFoundError(
            f"NSIDC grid file not found: {GRID_FILE}"
        )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print("\nLoading NSIDC target grid...")

    grid = xr.open_dataset(GRID_FILE)

    print(
        f"Target grid shape: "
        f"{grid['latitude'].shape}"
    )

    for era5_file in ERA5_FILES:
        process_file(era5_file, grid)

    grid.close()

    print("\n" + "=" * 60)
    print("ERA5 REGRIDDING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()