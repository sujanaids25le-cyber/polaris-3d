
import glob
import os
import xarray as xr
import matplotlib.pyplot as plt

CURRENTS_DIR = "data/copernicus/currents"
TEMPERATURE_DIR = "data/copernicus/temperature"
OUT_DIR = "data/processed"
PLOT_DIR = os.path.join(OUT_DIR, "sanity_plots")


def load_single_file(folder: str) -> xr.Dataset:
    files = sorted(glob.glob(os.path.join(folder, "*.nc")))
    if not files:
        raise FileNotFoundError(f"No .nc files found in {folder}")
    if len(files) > 1:
        print(f"  Note: found {len(files)} files in {folder}, using the first: {files[0]}")
    return xr.open_dataset(files[0])


def drop_depth(ds: xr.Dataset) -> xr.Dataset:
    """Remove the singleton depth dimension. We only ever requested surface
    (0.49m), so depth always has length 1 — safe to squeeze and drop."""
    if "depth" in ds.dims:
        if ds.sizes["depth"] != 1:
            raise ValueError(
                f"Expected a single depth level, got {ds.sizes['depth']}. "
                "Don't blindly squeeze — check which depth(s) are present."
            )
        ds = ds.squeeze("depth", drop=True)
    return ds


def report_missing(ds: xr.Dataset, var: str):
    da = ds[var]
    total = da.size
    n_missing = int(da.isnull().sum().values)
    pct = 100 * n_missing / total
    print(f"  {var}: {n_missing:,} / {total:,} missing ({pct:.2f}%)")


def report_stats(ds: xr.Dataset, var: str):
    da = ds[var]
    print(f"  {var}: min={float(da.min()):.4f}  max={float(da.max()):.4f}  "
          f"mean={float(da.mean()):.4f}  units={da.attrs.get('units', '?')}")


def sanity_plot(ds: xr.Dataset, var: str, out_path: str):
    da = ds[var].isel(time=0)
    plt.figure(figsize=(8, 5))
    da.plot(cmap="viridis")
    plt.title(f"{var} — {str(ds.time.values[0])[:10]}")
    plt.savefig(out_path, dpi=100, bbox_inches="tight")
    plt.close()
    print(f"  Saved plot: {out_path}")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(PLOT_DIR, exist_ok=True)

    print("=" * 60)
    print("CURRENTS")
    print("=" * 60)
    ds_cur = load_single_file(CURRENTS_DIR)
    ds_cur = drop_depth(ds_cur)
    print(f"Shape after depth drop: uo={ds_cur['uo'].shape}, vo={ds_cur['vo'].shape}")

    print("\nMissing values:")
    for var in ["uo", "vo"]:
        report_missing(ds_cur, var)

    print("\nStatistics:")
    for var in ["uo", "vo"]:
        report_stats(ds_cur, var)

    print("\nSanity plots:")
    for var in ["uo", "vo"]:
        sanity_plot(ds_cur, var, os.path.join(PLOT_DIR, f"{var}_sanity.png"))

    cur_out = os.path.join(OUT_DIR, "currents_clean.nc")
    ds_cur.to_netcdf(cur_out)
    print(f"\nSaved: {cur_out}")

    print("\n" + "=" * 60)
    print("TEMPERATURE")
    print("=" * 60)
    ds_temp = load_single_file(TEMPERATURE_DIR)
    ds_temp = drop_depth(ds_temp)
    print(f"Shape after depth drop: thetao={ds_temp['thetao'].shape}")

    print("\nMissing values:")
    report_missing(ds_temp, "thetao")

    print("\nStatistics:")
    report_stats(ds_temp, "thetao")

    print("\nSanity plot:")
    sanity_plot(ds_temp, "thetao", os.path.join(PLOT_DIR, "thetao_sanity.png"))

    temp_out = os.path.join(OUT_DIR, "temperature_clean.nc")
    ds_temp.to_netcdf(temp_out)
    print(f"\nSaved: {temp_out}")

    print("\nDone. No regridding or merging performed — that's the next stage.")


if __name__ == "__main__":
    main()