
import os
import requests
from datetime import date, timedelta
 
# ---- CONFIG ----
START_DATE = date(2026, 7, 21)
END_DATE   = date(2026, 8, 19)   # latest available file as of check
OUT_DIR = "data/raw/sea_ice"
BASE_URL   = "https://noaadata.apps.nsidc.org/NOAA/G02202_V6/south/daily/{year}/"
FNAME_TMPL = "sic_pss25_{yyyymmdd}_am2_v06r00.nc"
 
os.makedirs(OUT_DIR, exist_ok=True)
 
def daterange(start, end):
    days = (end - start).days
    for n in range(days + 1):
        yield start + timedelta(n)
 
def download_file(dt: date) -> str | None:
    yyyymmdd = dt.strftime("%Y%m%d")
    fname = FNAME_TMPL.format(yyyymmdd=yyyymmdd)
    url = BASE_URL.format(year=dt.year) + fname
    out_path = os.path.join(OUT_DIR, fname)
 
    if os.path.exists(out_path):
        print(f"  already have {fname}, skipping")
        return out_path
 
    resp = requests.get(url, timeout=60)
    if resp.status_code == 200:
        with open(out_path, "wb") as f:
            f.write(resp.content)
        print(f"  downloaded {fname} ({len(resp.content)/1024:.1f} KB)")
        return out_path
    else:
        print(f"  MISSING (status {resp.status_code}): {fname}")
        return None
 
def main():
    print(f"Downloading sea ice concentration files: {START_DATE} to {END_DATE}")
    downloaded = []
    for dt in daterange(START_DATE, END_DATE):
        result = download_file(dt)
        if result:
            downloaded.append(result)
 
    print(f"\nDone. {len(downloaded)} files in {OUT_DIR}")
 
if __name__ == "__main__":
    main()