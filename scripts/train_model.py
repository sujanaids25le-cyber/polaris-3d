"""
POLARIS — Sea-Ice Prediction Model (First Baseline)

Trains and evaluates a first baseline model for next-day sea-ice
concentration, using the grid-cell x day feature table.

Input:
    data/processed/features.parquet

Output:
    data/processed/model/model_metrics.csv
    data/processed/model/spatial_error_map.png
    data/processed/model/predictions_sample.csv

Design choices (stated explicitly, not hidden in code):
    - Chronological split: train on the earliest N% of days, test on the
      most recent days. NEVER a random row split — a random split would
      let the model see, e.g., 21 July from one grid cell in training and
      22 July from the SAME cell in test, which leaks strong spatial
      autocorrelation across the train/test boundary and would make the
      model look far better than it actually is at forecasting forward
      in time.
    - Persistence baseline: predicting tomorrow = today's ice
      (target ~= seaice_lag1). Sea ice changes slowly day-to-day, so this
      is a deceptively strong baseline — any real model needs to beat it
      to be worth using.
    - Model: Random Forest (scikit-learn) rather than XGBoost, to avoid
      an extra dependency for a first baseline. Swapping to XGBoost later
      is a small change if you want to compare.
    - x, y coordinates are included as features. This is NOT leakage —
      train and test share the same physical grid cells, just different
      days — but it does mean the model can learn a per-location
      baseline. Worth knowing, not necessarily wrong.
    - Missing ocean/weather feature values are imputed using the median
      computed from the TRAINING set only, then applied to both train and
      test. Computing the median from the full dataset (including test)
      would leak test-set information into the imputation and bias the
      evaluation optimistically.
"""

import time
import gc
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

INPUT_FILE = Path("data/processed/features.parquet")
OUTPUT_DIR = Path("data/processed/model")

# Fraction of unique days (chronologically) used for training.
TRAIN_FRACTION = 0.8

FEATURE_COLS = [
    "seaice_lag1", "thetao", "uo", "vo",
    "u10", "v10", "t2m", "msl",
    "wind_speed", "wind_dir_deg",
    "day_of_year", "days_since_start",
    "x", "y",
]
TARGET_COL = "target_seaice_t_plus1"
MISSING_FLAG_COLS = ["ocean_data_missing", "weather_data_missing"]


def chronological_split(df: pd.DataFrame):
    unique_days = np.sort(df["time"].unique())
    n_train_days = int(len(unique_days) * TRAIN_FRACTION)

    train_days = unique_days[:n_train_days]
    test_days = unique_days[n_train_days:]

    train_df = df[df["time"].isin(train_days)].copy()
    test_df = df[df["time"].isin(test_days)].copy()

    # --- Leakage check 1: dates must not overlap, and every train date
    # must be strictly earlier than every test date. ---
    overlap = set(train_days) & set(test_days)
    if overlap:
        raise ValueError(f"Date overlap between train/test: {overlap}")
    if train_days.max() >= test_days.min():
        raise ValueError(
            f"Train max date ({train_days.max()}) is not before "
            f"test min date ({test_days.min()}) — split is not chronological."
        )

    print(f"Train: {len(train_days)} days, {train_days.min()} -> {train_days.max()} "
          f"({len(train_df):,} rows)")
    print(f"Test:  {len(test_days)} days, {test_days.min()} -> {test_days.max()} "
          f"({len(test_df):,} rows)")

    return train_df, test_df


def impute_missing(train_df, test_df, cols):
    """Fit imputer on TRAIN only, apply to both — avoids leaking test-set
    statistics into the training process."""
    imputer = SimpleImputer(strategy="median")
    imputer.fit(train_df[cols])

    train_df = train_df.copy()
    test_df = test_df.copy()
    train_df[cols] = imputer.transform(train_df[cols])
    test_df[cols] = imputer.transform(test_df[cols])

    return train_df, test_df, imputer


def evaluate(y_true, y_pred, label):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    print(f"  {label}: MAE={mae:.4f}  RMSE={rmse:.4f}  R2={r2:.4f}")
    return {"model": label, "MAE": mae, "RMSE": rmse, "R2": r2}


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Feature table not found: {INPUT_FILE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("POLARIS — SEA-ICE PREDICTION MODEL")
    print("=" * 60)

    print("\nLoading feature table...")
    df = pd.read_parquet(INPUT_FILE)
    print(f"  Rows: {len(df):,}")

    print("\nSplitting chronologically (train/test)...")
    train_df, test_df = chronological_split(df)

    print("\nImputing missing ocean/weather features (median, fit on train only)...")
    impute_cols = ["thetao", "uo", "vo", "u10", "v10", "t2m", "msl", "wind_speed", "wind_dir_deg"]
    train_df, test_df, imputer = impute_missing(train_df, test_df, impute_cols)

    # Sanity check: no NaNs should remain in the feature columns after imputation.
    for name, d in [("train", train_df), ("test", test_df)]:
        n_nan = d[FEATURE_COLS].isna().sum().sum()
        if n_nan > 0:
            raise ValueError(f"{n_nan} NaN values remain in {name} features after imputation — "
                              f"check for a column not covered by the imputer.")
    print("  Confirmed: no NaN remain in feature columns after imputation.")

    X_train = train_df[FEATURE_COLS]
    y_train_absolute = train_df[TARGET_COL]
    X_test = test_df[FEATURE_COLS]
    y_test_absolute = test_df[TARGET_COL]

    # Delta target: instead of asking the model to reproduce tomorrow's
    # absolute concentration from scratch (which mostly just means
    # re-learning "copy today's value", something persistence already
    # does perfectly by construction), we ask it to predict the CHANGE
    # from today to tomorrow. The final prediction is then
    # seaice_lag1 + predicted_delta, reconstructed back to the same
    # absolute scale so it's directly comparable to persistence.
    y_train_delta = train_df[TARGET_COL] - train_df["seaice_lag1"]
    y_test_delta = test_df[TARGET_COL] - test_df["seaice_lag1"]

    print(f"\nDelta target stats (train): min={y_train_delta.min():.4f}  "
          f"max={y_train_delta.max():.4f}  mean={y_train_delta.mean():.6f}  "
          f"std={y_train_delta.std():.4f}")

    # --- Leakage check 2: target should never be one of the input features. ---
    assert TARGET_COL not in FEATURE_COLS, "Target column accidentally included in features!"

    print("\n" + "=" * 60)
    print("PERSISTENCE BASELINE (tomorrow = today)")
    print("=" * 60)
    persistence_pred = test_df["seaice_lag1"].values
    persistence_metrics = evaluate(y_test_absolute, persistence_pred, "Persistence")

    print("\n" + "=" * 60)
    print("RANDOM FOREST MODEL")
    print("=" * 60)

    # Lighter default config than a first draft might reach for. Rather than
    # trusting a runtime estimate from a DIFFERENT machine (which can be very
    # misleading — CPU speed and core count vary a lot), this benchmarks on
    # a small sample of YOUR actual training data, on YOUR actual machine,
    # then extrapolates and asks for confirmation before committing to the
    # full fit.
    N_ESTIMATORS = 50
    MAX_DEPTH = 12
    BENCHMARK_SAMPLE_SIZE = min(100_000, len(X_train))

    print(f"Benchmarking on a {BENCHMARK_SAMPLE_SIZE:,}-row sample of your training "
          f"data (config: n_estimators={N_ESTIMATORS}, max_depth={MAX_DEPTH})...")
    sample_idx = np.random.RandomState(42).choice(len(X_train), BENCHMARK_SAMPLE_SIZE, replace=False)
    X_sample = X_train.iloc[sample_idx]
    y_sample = y_train_delta.iloc[sample_idx]

    bench_model = RandomForestRegressor(
        n_estimators=N_ESTIMATORS, max_depth=MAX_DEPTH, n_jobs=-1, random_state=42
    )
    t0 = time.time()
    bench_model.fit(X_sample, y_sample)
    bench_time = time.time() - t0

    # Free the benchmark model and its sample data before the full fit —
    # no reason for it to sit in memory competing with the real training
    # run on a ~2M-row dataset.
    del bench_model, X_sample, y_sample
    gc.collect()

    scale_factor = len(X_train) / BENCHMARK_SAMPLE_SIZE
    estimated_full_time = bench_time * scale_factor

    print(f"  Benchmark fit time: {bench_time:.1f}s for {BENCHMARK_SAMPLE_SIZE:,} rows")
    print(f"  Full training set: {len(X_train):,} rows ({scale_factor:.1f}x the sample)")
    print(f"  Estimated full-fit time: ~{estimated_full_time:.0f}s (~{estimated_full_time/60:.1f} min)")
    print("  Note: this is a rough linear extrapolation — actual time may vary, "
          "but it should be in the right ballpark on your machine.")

    proceed = input("\n  Proceed with full training? [y/n]: ").strip().lower()
    if proceed != "y":
        print("  Stopping here. Re-run and answer 'y' when ready, or lower "
              "N_ESTIMATORS / MAX_DEPTH in the script for a faster (rougher) model.")
        return

    print("\nTraining Random Forest on the full training set...")
    model = RandomForestRegressor(
        n_estimators=N_ESTIMATORS,
        max_depth=MAX_DEPTH,
        n_jobs=-1,
        random_state=42,
    )
    t0 = time.time()
    model.fit(X_train, y_train_delta)
    print(f"  Actual full-fit time: {time.time()-t0:.1f}s")

    print("Predicting on test set (delta, then reconstructing absolute value)...")
    rf_pred_delta = model.predict(X_test)
    rf_pred_absolute = test_df["seaice_lag1"].values + rf_pred_delta
    # Concentration is physically bounded in [0, 1] — the model doesn't
    # know this, so clip after reconstruction rather than let it silently
    # produce impossible values.
    n_clipped = int(((rf_pred_absolute < 0) | (rf_pred_absolute > 1)).sum())
    if n_clipped > 0:
        print(f"  Note: {n_clipped:,} predictions ({100*n_clipped/len(rf_pred_absolute):.2f}%) "
              f"fell outside [0,1] before clipping.")
    rf_pred_absolute = np.clip(rf_pred_absolute, 0, 1)

    rf_metrics = evaluate(y_test_absolute, rf_pred_absolute, "Random Forest (delta-target)")

    print("\n--- Feature importances ---")
    importances = pd.Series(model.feature_importances_, index=FEATURE_COLS).sort_values(ascending=False)
    print(importances.round(4))

    print("\n--- Comparison ---")
    if rf_metrics["MAE"] < persistence_metrics["MAE"]:
        print("  Random Forest BEATS the persistence baseline on MAE.")
    else:
        print("  WARNING: Random Forest does NOT beat the persistence baseline on MAE. "
              "This can happen with sea ice, since it changes slowly day-to-day — "
              "worth investigating further before treating the model as useful.")

    metrics_df = pd.DataFrame([persistence_metrics, rf_metrics])
    metrics_df.to_csv(OUTPUT_DIR / "model_metrics.csv", index=False)
    importances.to_csv(OUTPUT_DIR / "feature_importances.csv")

    print("\n" + "=" * 60)
    print("SPATIAL ERROR EVALUATION")
    print("=" * 60)
    test_df = test_df.copy()
    test_df["rf_pred"] = rf_pred_absolute
    test_df["abs_error"] = np.abs(test_df["rf_pred"] - test_df[TARGET_COL])

    spatial_error = test_df.groupby(["y", "x"])["abs_error"].mean().reset_index()
    pivot = spatial_error.pivot(index="y", columns="x", values="abs_error")

    plt.figure(figsize=(8, 7))
    plt.pcolormesh(pivot.columns, pivot.index, pivot.values, shading="auto", cmap="viridis")
    plt.colorbar(label="Mean Absolute Error (test period)")
    plt.xlabel("NSIDC X coordinate (m)")
    plt.ylabel("NSIDC Y coordinate (m)")
    plt.title("Spatial Distribution of Prediction Error (Random Forest)")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "spatial_error_map.png", dpi=150)
    plt.close()
    print(f"  Saved spatial error map: {OUTPUT_DIR / 'spatial_error_map.png'}")
    print(f"  Spatial MAE range: {spatial_error['abs_error'].min():.4f} to {spatial_error['abs_error'].max():.4f}")

    sample = test_df[["time", "y", "x", "seaice_lag1", TARGET_COL, "rf_pred", "abs_error"]].sample(
        min(1000, len(test_df)), random_state=42
    )
    sample.to_csv(OUTPUT_DIR / "predictions_sample.csv", index=False)

    print("\n" + "=" * 60)
    print("ICE-EDGE ZONE EVALUATION")
    print("=" * 60)
    print("The spatial error map shows most of the grid is 'trivial' (solid pack ice "
          "near 1.0, or open ocean near 0.0), where both models score well by default. "
          "The interesting comparison is in the ice-edge zone — cells that are neither "
          "fully ice nor fully open water — since that's where real day-to-day dynamics "
          "happen, and where persistence's advantage should be weakest.")

    # Define the ice-edge zone using TODAY's concentration (seaice_lag1), not
    # the target — using the target to define the zone would leak information
    # from the future into how we're choosing which rows to evaluate.
    EDGE_LOW, EDGE_HIGH = 0.1, 0.9
    is_edge = (test_df["seaice_lag1"] > EDGE_LOW) & (test_df["seaice_lag1"] < EDGE_HIGH)
    edge_df = test_df[is_edge]
    interior_df = test_df[~is_edge]

    print(f"\nIce-edge zone definition: seaice_lag1 in ({EDGE_LOW}, {EDGE_HIGH})")
    print(f"  Edge-zone rows: {len(edge_df):,} ({100*len(edge_df)/len(test_df):.1f}% of test set)")
    print(f"  Interior/open-ocean rows: {len(interior_df):,} ({100*len(interior_df)/len(test_df):.1f}%)")

    if len(edge_df) == 0:
        print("  No rows fall in the edge zone — skipping edge-specific comparison.")
    else:
        print("\n--- Ice-edge zone only ---")
        persistence_edge = evaluate(edge_df[TARGET_COL], edge_df["seaice_lag1"], "Persistence (edge)")
        rf_edge = evaluate(edge_df[TARGET_COL], edge_df["rf_pred"], "Random Forest (edge)")

        print("\n--- Interior / open-ocean only (for comparison) ---")
        persistence_interior = evaluate(interior_df[TARGET_COL], interior_df["seaice_lag1"], "Persistence (interior)")
        rf_interior = evaluate(interior_df[TARGET_COL], interior_df["rf_pred"], "Random Forest (interior)")

        print("\n--- Edge-zone comparison ---")
        if rf_edge["MAE"] < persistence_edge["MAE"]:
            improvement = 100 * (persistence_edge["MAE"] - rf_edge["MAE"]) / persistence_edge["MAE"]
            print(f"  Random Forest BEATS persistence in the ice-edge zone "
                  f"({improvement:.1f}% lower MAE).")
        else:
            gap = 100 * (rf_edge["MAE"] - persistence_edge["MAE"]) / persistence_edge["MAE"]
            print(f"  Random Forest still does not beat persistence in the ice-edge zone "
                  f"({gap:.1f}% higher MAE). Persistence remains strong even in the "
                  f"dynamic zone at this short (1-day) horizon.")

        zone_metrics_df = pd.DataFrame([
            {**persistence_edge, "zone": "edge"},
            {**rf_edge, "zone": "edge"},
            {**persistence_interior, "zone": "interior"},
            {**rf_interior, "zone": "interior"},
        ])
        zone_metrics_df.to_csv(OUTPUT_DIR / "zone_metrics.csv", index=False)
        print(f"\n  Saved: {OUTPUT_DIR / 'zone_metrics.csv'}")

    print("\n" + "=" * 60)
    print("MODEL TRAINING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()