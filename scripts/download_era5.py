
import cdsapi

OUT_FILE = "data/raw/era5/era5_antarctic_20260721_20260819.nc"

# Same bounding box as Copernicus Marine: N, W, S, E order for CDS 'area'
AREA = [-50, -180, -90, 180]  # North, West, South, East

# ERA5 daily data isn't directly available for these variables at single-level
# resolution — we request hourly and will resample to daily ourselves during
# preprocessing (keeps us in control of how the daily aggregate is computed,
# e.g. mean vs max wind).
DAYS = [f"{d:02d}" for d in range(21, 32)] + [f"{d:02d}" for d in range(1, 20)]
# Note: this spans two months (July 21-31, August 1-19) — request must be
# split by month since CDS requests take one year/month combination at a time.

import os

os.makedirs("data/raw/era5", exist_ok=True)


def build_request(year, month, days):
    return {
        "product_type": ["reanalysis"],
        "variable": [
            "10m_u_component_of_wind",
            "10m_v_component_of_wind",
            "2m_temperature",
            "mean_sea_level_pressure",
        ],
        "year": [str(year)],
        "month": [f"{month:02d}"],
        "day": days,
        "time": [f"{h:02d}:00" for h in range(0, 24, 6)],  # every 6 hours
        "area": AREA,
        "data_format": "netcdf",
    }


def main():
    client = cdsapi.Client()

    requests = [
        (2026, 7, [f"{d:02d}" for d in range(21, 32)], "data/raw/era5/era5_202607.nc"),
        (2026, 8, [f"{d:02d}" for d in range(1, 20)], "data/raw/era5/era5_202608.nc"),
    ]

    for year, month, days, out_path in requests:
        print(f"Requesting ERA5 data for {year}-{month:02d}, days {days[0]}-{days[-1]}...")
        req = build_request(year, month, days)
        client.retrieve("reanalysis-era5-single-levels", req, out_path)
        print(f"  Saved: {out_path}")

    print("\nDone. Two files saved (July, August) — combine them in the next step.")


if __name__ == "__main__":
    main()