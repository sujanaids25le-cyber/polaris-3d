
import xarray as xr
from pathlib import Path

FILES_TO_CHECK = [
    ("CURRENTS", Path("data/copernicus/currents")),
    ("TEMPERATURE", Path("data/copernicus/temperature")),
]

for label, folder in FILES_TO_CHECK:
    print("=" * 60)
    print(f"{label} — folder: {folder}")
    print("=" * 60)

    if not folder.exists():
        print(f"  Folder does not exist yet: {folder}")
        continue

    files = sorted(folder.glob("*.nc"))
    if not files:
        print(f"  No .nc files found in {folder}")
        continue

    file_path = files[0]
    print(f"\nFile: {file_path.name}\n")

    ds = xr.open_dataset(file_path)

    print("--- DATASET ---")
    print(ds)

    print("\n--- VARIABLES ---")
    for name, variable in ds.data_vars.items():
        print(f"{name}:")
        print(f"  dimensions: {variable.dims}")
        print(f"  shape:      {variable.shape}")
        print(f"  dtype:      {variable.dtype}")
        if hasattr(variable, "units"):
            print(f"  units:      {variable.attrs.get('units')}")

    print("\n--- COORDINATES ---")
    for name, coord in ds.coords.items():
        print(f"{name}:")
        print(f"  dimensions: {coord.dims}")
        print(f"  shape:      {coord.shape}")
        try:
            print(f"  range:      {coord.values.min()} to {coord.values.max()}")
        except Exception:
            pass

    print("\n--- KEY GLOBAL ATTRIBUTES ---")
    for key in ["Conventions", "title", "source", "institution", "geospatial_lat_min",
                "geospatial_lat_max", "geospatial_lon_min", "geospatial_lon_max"]:
        if key in ds.attrs:
            print(f"{key}: {ds.attrs[key]}")

    ds.close()
    print()