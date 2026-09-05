import xarray as xr
from pathlib import Path

# Find the first downloaded NetCDF file
data_dir = Path("data/raw/sea_ice")
files = sorted(data_dir.glob("*.nc"))

if not files:
    raise FileNotFoundError("No NetCDF files found in data/raw/sea_ice")

file_path = files[0]

print("=" * 60)
print("NSIDC SEA-ICE FILE INSPECTION")
print("=" * 60)

print(f"\nFile: {file_path.name}")

# Open dataset
ds = xr.open_dataset(file_path)

print("\n--- DATASET ---")
print(ds)

print("\n--- VARIABLES ---")
for name, variable in ds.data_vars.items():
    print(f"{name}:")
    print(f"  dimensions: {variable.dims}")
    print(f"  shape:      {variable.shape}")
    print(f"  dtype:      {variable.dtype}")

print("\n--- COORDINATES ---")
for name, coord in ds.coords.items():
    print(f"{name}:")
    print(f"  dimensions: {coord.dims}")
    print(f"  shape:      {coord.shape}")

print("\n--- GLOBAL ATTRIBUTES ---")
for key, value in ds.attrs.items():
    print(f"{key}: {value}")

ds.close()