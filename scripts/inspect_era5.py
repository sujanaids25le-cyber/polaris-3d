
import xarray as xr
from pathlib import Path

FILES = [
    Path("data/raw/era5/era5_202607.nc"),
    Path("data/raw/era5/era5_202608.nc"),
]

for file_path in FILES:
    print("=" * 60)
    print(f"File: {file_path}")
    print("=" * 60)

    if not file_path.exists():
        print(f"  NOT FOUND: {file_path}")
        continue

    ds = xr.open_dataset(file_path)

    print("\n--- DATASET ---")
    print(ds)

    print("\n--- VARIABLES ---")
    for name, variable in ds.data_vars.items():
        print(f"{name}:")
        print(f"  dimensions: {variable.dims}")
        print(f"  shape:      {variable.shape}")
        print(f"  dtype:      {variable.dtype}")
        print(f"  units:      {variable.attrs.get('units', '?')}")

    print("\n--- COORDINATES ---")
    for name, coord in ds.coords.items():
        print(f"{name}: shape={coord.shape}", end="")
        try:
            print(f"  range: {coord.values.min()} to {coord.values.max()}")
        except Exception:
            print()

    # Quick integrity check: does the data actually contain real (non-NaN,
    # non-constant) values, and does the time dimension have the expected
    # number of steps? This is the main thing to verify after a connection
    # hiccup during download.
    print("\n--- INTEGRITY CHECK ---")
    for var in ds.data_vars:
        da = ds[var]
        n_nan = int(da.isnull().sum().values)
        n_total = da.size
        print(f"  {var}: {n_nan}/{n_total} NaN ({100*n_nan/n_total:.2f}%), "
              f"min={float(da.min()):.3f}, max={float(da.max()):.3f}")

    ds.close()
    print()