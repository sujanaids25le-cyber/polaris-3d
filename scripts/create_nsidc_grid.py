import xarray as xr
import numpy as np
from pathlib import Path
from pyproj import Transformer

SEA_ICE_DIR = Path("data/raw/sea_ice")
OUT_FILE = Path("data/processed/nsidc_grid_latlon.nc")

files = sorted(SEA_ICE_DIR.glob("*.nc"))

if not files:
    raise FileNotFoundError("No NSIDC NetCDF files found.")

file_path = files[0]

print("=" * 60)
print("CREATE NSIDC LAT/LON GRID")
print("=" * 60)
print(f"Using: {file_path.name}")

ds = xr.open_dataset(file_path)

# Use the actual coordinates stored in the NSIDC file
x = ds["x"].values
y = ds["y"].values

print("\nActual NSIDC grid:")
print(f"  x: {len(x)} values")
print(f"  y: {len(y)} values")
print(f"  x range: {x.min()} to {x.max()}")
print(f"  y range: {y.min()} to {y.max()}")

# Create 2D coordinate arrays
xx, yy = np.meshgrid(x, y)

print(f"  2D grid shape: {xx.shape}")

# Convert EPSG:3412 -> EPSG:4326
# always_xy=True means input = x,y and output = longitude,latitude
transformer = Transformer.from_crs(
    "EPSG:3412",
    "EPSG:4326",
    always_xy=True
)

lon, lat = transformer.transform(xx, yy)

print("\nConverted coordinates:")
print(f"  latitude shape: {lat.shape}")
print(f"  longitude shape: {lon.shape}")
print(f"  latitude range: {lat.min():.4f} to {lat.max():.4f}")
print(f"  longitude range: {lon.min():.4f} to {lon.max():.4f}")

# Basic sanity checks
if lat.shape != (len(y), len(x)):
    raise ValueError("Latitude grid shape does not match NSIDC grid.")

if lon.shape != (len(y), len(x)):
    raise ValueError("Longitude grid shape does not match NSIDC grid.")

if not np.isfinite(lat).all() or not np.isfinite(lon).all():
    raise ValueError("Latitude/longitude grid contains invalid values.")

print("\nSanity check:")
cy = len(y) // 2
cx = len(x) // 2

print(
    f"  Grid centre: "
    f"x={x[cx]:.0f}, y={y[cy]:.0f} "
    f"-> lat={lat[cy, cx]:.2f}, lon={lon[cy, cx]:.2f}"
)

# Save the coordinate grid
grid = xr.Dataset(
    {
        "latitude": (("y", "x"), lat),
        "longitude": (("y", "x"), lon),
    },
    coords={
        "x": x,
        "y": y,
    },
    attrs={
        "crs": "EPSG:3412",
        "description": "NSIDC Antarctic 25 km grid with geographic coordinates",
    },
)

OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
grid.to_netcdf(OUT_FILE)

ds.close()

print(f"\nSaved: {OUT_FILE}")
print("Done.")