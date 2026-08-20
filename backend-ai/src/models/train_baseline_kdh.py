"""Reproducible baseline following kdg1385's A_31 / T_O_31 training setup.

The script intentionally keeps the original product grouping:

* A_31: PRODUCT_CODE == A_31
* T_O_31: PRODUCT_CODE in {T_31, O_31}

The original model drops PRODUCT_CODE and LINE from the model input, removes
all-null and zero-variance columns, selects top-k features inside each fold,
and trains LightGBM and CatBoost soft-voting ensembles.  This implementation
keeps that contract while fitting data-dependent preprocessing on each fold
to prevent validation information from leaking into training.

Run from the backend-ai directory:

    python -m src.models.train_baseline_kdh

Use ``--quick`` for a small smoke run.  It is not a comparable benchmark.
"""

from __future__ import annotations

import argparse
import json
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import optuna
import pandas as pd
from catboost import CatBoostClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import OrdinalEncoder


warnings.filterwarnings("ignore")
optuna.logging.set_verbosity(optuna.logging.WARNING)

SEED = 42
N_CLASSES = 3
DROP_COLUMNS = ["PRODUCT_ID", "Y_Class", "Y_Quality", "PRODUCT_CODE", "LINE"]


@dataclass(frozen=True)
class GroupConfig:
    name: str
    product_codes: tuple[str, ...]
    lgbm_trials: int
    cat_trials: int
    top_k_min: int
    class_weight_max: float


GROUP_CONFIGS = (
    GroupConfig(
        name="A_31",
        product_codes=("A_31",),
        lgbm_trials=20,
        cat_trials=20,
        top_k_min=50,
        class_weight_max=10.0,
    ),
    GroupConfig(
        name="T_O_31",
        product_codes=("T_31", "O_31"),
        lgbm_trials=30,
        cat_trials=30,
        top_k_min=30,
        class_weight_max=15.0,
    ),
)


class FoldPreprocessor:
    """Preprocessor matching kdg1385's feature contract.

    PRODUCT_CODE and LINE are removed before this class is used.  TIMESTAMP
    remains, as it did in the reference code, and is ordinal encoded when it
    is an object column.  The encoder and dropped-column decisions are fitted
    only on the fold's training rows.
    """

    def __init__(self) -> None:
        self.input_columns: list[str] = []
        self.object_columns: list[str] = []
        self.all_nan_columns: list[str] = []
        self.zero_variance_columns: list[str] = []
        self.feature_columns: list[str] = []
        self.encoder: OrdinalEncoder | None = None

    def fit(self, frame: pd.DataFrame) -> "FoldPreprocessor":
        self.input_columns = list(frame.columns)
        work = frame.copy()
        self.object_columns = work.select_dtypes(
            include=["object", "category"]
        ).columns.tolist()

        if self.object_columns:
            self.encoder = OrdinalEncoder(
                handle_unknown="use_encoded_value",
                unknown_value=-1,
            )
            object_values = work[self.object_columns].fillna("__MISSING__").astype(str)
            self.encoder.fit(object_values)

        work = self._convert(work)
        self.all_nan_columns = work.columns[work.isna().all()].tolist()
        work = work.drop(columns=self.all_nan_columns, errors="ignore")

        numeric_columns = work.select_dtypes(include=[np.number]).columns
        std = work[numeric_columns].std()
        self.zero_variance_columns = std[std.fillna(0).eq(0)].index.tolist()
        self.feature_columns = [
            column
            for column in work.columns
            if column not in self.zero_variance_columns
        ]
        if not self.feature_columns:
            raise ValueError("No usable features remain after preprocessing.")
        return self

    def transform(self, frame: pd.DataFrame) -> pd.DataFrame:
        if not self.input_columns:
            raise RuntimeError("FoldPreprocessor must be fitted before transform().")
        work = frame.reindex(columns=self.input_columns).copy()
        work = self._convert(work)
        work = work.drop(columns=self.all_nan_columns, errors="ignore")
        work = work.drop(columns=self.zero_variance_columns, errors="ignore")
        return work.reindex(columns=self.feature_columns)

    def _convert(self, frame: pd.DataFrame) -> pd.DataFrame:
        work = frame.copy()
        if self.object_columns:
            if self.encoder is None:
                raise RuntimeError("Object columns exist but encoder is missing.")
            object_values = work[self.object_columns].fillna("__MISSING__").astype(str)
            work[self.object_columns] = self.encoder.transform(object_values)

        for column in work.columns:
            if column not in self.object_columns:
                work[column] = pd.to_numeric(work[column], errors="coerce")
        return work


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Run a small smoke test instead of the comparable benchmark.",
    )
    parser.add_argument("--n-splits", type=int, default=5)
    parser.add_argument("--lgbm-trials", type=int, default=None)
    parser.add_argument("--cat-trials", type=int, default=None)
    parser.add_argument("--threshold-trials", type=int, default=100)
    parser.add_argument("--output-dir", type=Path, default=None)
    return parser


def load_data(root: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    train_path = root / "dataset" / "train.csv"
    test_path = root / "dataset" / "test.csv"
    train = pd.read_csv(train_path)
    test = pd.read_csv(test_path)

    required_train = {"PRODUCT_ID", "Y_Class", "Y_Quality", "PRODUCT_CODE"}
    required_test = {"PRODUCT_ID", "PRODUCT_CODE"}
    missing_train = required_train.difference(train.columns)
    missing_test = required_test.difference(test.columns)
    if missing_train or missing_test:
        raise ValueError(
            f"Missing columns. train={sorted(missing_train)}, "
            f"test={sorted(missing_test)}"
        )
    return train, test


def raw_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Build the raw model frame using kdg1385's input-column contract."""
    return frame.drop(columns=DROP_COLUMNS, errors="ignore").copy()


def group_rows(
    frame: pd.DataFrame,
    config: GroupConfig,
) -> tuple[pd.DataFrame, pd.Series, np.ndarray]:
    mask = frame["PRODUCT_CODE"].isin(config.product_codes)
    subset = frame.loc[mask].copy()
    if subset.empty:
        raise ValueError(f"No rows found for group {config.name}.")
    indices = subset.index.to_numpy()
    y = subset["Y_Class"].astype(int) if "Y_Class" in subset else None
    if y is None:
        raise ValueError("Training frame does not contain Y_Class.")
    return raw_features(subset), y.reset_index(drop=True), indices


def make_folds(y: pd.Series, n_splits: int) -> list[tuple[np.ndarray, np.ndarray]]:
    if y.value_counts().min() < n_splits:
        raise ValueError(
            f"Each class needs at least {n_splits} rows for stratified CV: "
            f"{y.value_counts().to_dict()}"
        )
    splitter = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=SEED)
    return list(splitter.split(np.zeros(len(y)), y))


def class_weight_dict(weight0: float, weight2: float) -> dict[int, float]:
    return {0: float(weight0), 1: 1.0, 2: float(weight2)}


def make_lgbm(
    params: dict[str, Any],
    class_weights: dict[int, float],
) -> LGBMClassifier:
    return LGBMClassifier(
        **params,
        random_state=SEED,
        class_weight=class_weights,
        verbose=-1,
        n_jobs=-1,
    )


def make_catboost(
    params: dict[str, Any],
    class_weights: list[float],
) -> CatBoostClassifier:
    return CatBoostClassifier(
        **params,
        random_seed=SEED,
        class_weights=class_weights,
        verbose=0,
        allow_writing_files=False,
        thread_count=-1,
    )


def make_base_model(
    model_type: str,
    class_weights: dict[int, float] | list[float],
) -> Any:
    if model_type == "lgbm":
        return make_lgbm({}, class_weights)  # type: ignore[arg-type]
    return CatBoostClassifier(
        iterations=50,
        random_seed=SEED,
        class_weights=class_weights,
        verbose=0,
        allow_writing_files=False,
        thread_count=-1,
    )


def top_features(
    model_type: str,
    x_train: pd.DataFrame,
    y_train: pd.Series,
    top_k: int,
    class_weights: dict[int, float] | list[float],
) -> list[str]:
    base_model = make_base_model(model_type, class_weights)
    base_model.fit(x_train, y_train)
    importances = np.asarray(base_model.feature_importances_)
    order = np.argsort(importances)[::-1]
    selected = order[: min(top_k, len(order))]
    return x_train.columns[selected].tolist()


def align_probabilities(model: Any, probabilities: np.ndarray) -> np.ndarray:
    aligned = np.zeros((len(probabilities), N_CLASSES), dtype=float)
    for column, class_value in enumerate(model.classes_):
        class_index = int(class_value)
        if 0 <= class_index < N_CLASSES:
            aligned[:, class_index] = probabilities[:, column]
    return aligned


def suggest_model_trial(
    trial: optuna.Trial,
    model_type: str,
    config: GroupConfig,
    max_features: int,
) -> tuple[dict[str, Any], dict[int, float] | list[float], int]:
    min_top_k = min(config.top_k_min, max_features)
    top_k = trial.suggest_int("top_k", min_top_k, max_features)
    weight0 = trial.suggest_float("weight0", 1.0, config.class_weight_max)
    weight2 = trial.suggest_float("weight2", 1.0, config.class_weight_max)

    if model_type == "lgbm":
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 50, 150),
            "max_depth": trial.suggest_int("max_depth", 3, 7),
            "learning_rate": trial.suggest_float(
                "learning_rate", 0.01, 0.1, log=True
            ),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float(
                "colsample_bytree", 0.6, 1.0
            ),
        }
        weights: dict[int, float] | list[float] = class_weight_dict(weight0, weight2)
    else:
        params = {
            "iterations": trial.suggest_int("iterations", 50, 150),
            "depth": trial.suggest_int("depth", 3, 7),
            "learning_rate": trial.suggest_float(
                "learning_rate", 0.01, 0.1, log=True
            ),
        }
        weights = [float(weight0), 1.0, float(weight2)]
    return params, weights, top_k


def fit_predict_fold(
    model_type: str,
    raw_x: pd.DataFrame,
    y: pd.Series,
    train_idx: np.ndarray,
    val_idx: np.ndarray,
    params: dict[str, Any],
    class_weights: dict[int, float] | list[float],
    top_k: int,
) -> np.ndarray:
    preprocessor = FoldPreprocessor().fit(raw_x.iloc[train_idx])
    x_train = preprocessor.transform(raw_x.iloc[train_idx])
    x_val = preprocessor.transform(raw_x.iloc[val_idx])
    selected = top_features(
        model_type,
        x_train,
        y.iloc[train_idx],
        top_k,
        class_weights,
    )

    if model_type == "lgbm":
        model = make_lgbm(params, class_weights)  # type: ignore[arg-type]
    else:
        model = make_catboost(params, class_weights)  # type: ignore[arg-type]
    model.fit(x_train[selected], y.iloc[train_idx])
    return align_probabilities(model, model.predict_proba(x_val[selected]))


def tune_model(
    model_type: str,
    raw_x: pd.DataFrame,
    y: pd.Series,
    folds: list[tuple[np.ndarray, np.ndarray]],
    config: GroupConfig,
    max_features: int,
    n_trials: int,
) -> dict[str, Any]:
    def objective(trial: optuna.Trial) -> float:
        params, weights, top_k = suggest_model_trial(
            trial, model_type, config, max_features
        )
        oof = np.zeros((len(y), N_CLASSES), dtype=float)
        for train_idx, val_idx in folds:
            oof[val_idx] = fit_predict_fold(
                model_type,
                raw_x,
                y,
                train_idx,
                val_idx,
                params,
                weights,
                top_k,
            )
        return float(f1_score(y, np.argmax(oof, axis=1), average="macro"))

    study = optuna.create_study(
        direction="maximize",
        sampler=optuna.samplers.TPESampler(seed=SEED),
    )
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
    best = dict(study.best_params)
    best["value"] = float(study.best_value)
    return best


def unpack_best(
    model_type: str,
    best: dict[str, Any],
) -> tuple[dict[str, Any], dict[int, float] | list[float], int]:
    params = dict(best)
    top_k = int(params.pop("top_k"))
    params.pop("value", None)
    weight0 = float(params.pop("weight0"))
    weight2 = float(params.pop("weight2"))
    if model_type == "lgbm":
        weights: dict[int, float] | list[float] = class_weight_dict(weight0, weight2)
    else:
        weights = [weight0, 1.0, weight2]
    return params, weights, top_k


def fit_oof(
    model_type: str,
    raw_x: pd.DataFrame,
    y: pd.Series,
    folds: list[tuple[np.ndarray, np.ndarray]],
    params: dict[str, Any],
    weights: dict[int, float] | list[float],
    top_k: int,
) -> tuple[np.ndarray, np.ndarray]:
    probabilities = np.zeros((len(y), N_CLASSES), dtype=float)
    fold_ids = np.zeros(len(y), dtype=int)
    for fold_id, (train_idx, val_idx) in enumerate(folds):
        fold_ids[val_idx] = fold_id
        probabilities[val_idx] = fit_predict_fold(
            model_type,
            raw_x,
            y,
            train_idx,
            val_idx,
            params,
            weights,
            top_k,
        )
    return probabilities, fold_ids


def apply_thresholds(probabilities: np.ndarray, thresholds: dict[str, float]) -> np.ndarray:
    predictions = np.ones(len(probabilities), dtype=int)
    predictions[probabilities[:, 0] > thresholds["thr0"]] = 0
    class_two = (predictions == 1) & (probabilities[:, 2] > thresholds["thr2"])
    predictions[class_two] = 2
    return predictions


def tune_thresholds(
    probabilities: np.ndarray,
    y: pd.Series | np.ndarray,
    n_trials: int,
    seed: int,
) -> dict[str, float]:
    y_array = np.asarray(y)

    def objective(trial: optuna.Trial) -> float:
        thresholds = {
            "thr0": trial.suggest_float("thr0", 0.1, 0.9),
            "thr2": trial.suggest_float("thr2", 0.1, 0.9),
        }
        predictions = apply_thresholds(probabilities, thresholds)
        return float(f1_score(y_array, predictions, average="macro"))

    study = optuna.create_study(
        direction="maximize",
        sampler=optuna.samplers.TPESampler(seed=seed),
    )
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
    return {
        "thr0": float(study.best_params["thr0"]),
        "thr2": float(study.best_params["thr2"]),
    }


def cross_fitted_threshold_predictions(
    probabilities: np.ndarray,
    y: pd.Series,
    fold_ids: np.ndarray,
    n_trials: int,
) -> tuple[np.ndarray, list[dict[str, Any]]]:
    predictions = np.zeros(len(y), dtype=int)
    fold_thresholds: list[dict[str, Any]] = []
    for fold_id in sorted(np.unique(fold_ids)):
        validation_mask = fold_ids == fold_id
        calibration_mask = ~validation_mask
        thresholds = tune_thresholds(
            probabilities[calibration_mask],
            y.iloc[np.flatnonzero(calibration_mask)],
            n_trials=n_trials,
            seed=SEED + fold_id + 1,
        )
        predictions[validation_mask] = apply_thresholds(
            probabilities[validation_mask], thresholds
        )
        fold_thresholds.append({"fold": int(fold_id), **thresholds})
    return predictions, fold_thresholds


def metrics(y: pd.Series | np.ndarray, predictions: np.ndarray) -> dict[str, Any]:
    return {
        "macro_f1": float(f1_score(y, predictions, average="macro")),
        "accuracy": float(accuracy_score(y, predictions)),
        "rows": int(len(predictions)),
        "prediction_counts": {
            str(class_id): int((predictions == class_id).sum())
            for class_id in range(N_CLASSES)
        },
    }


def fit_final_model(
    model_type: str,
    raw_x: pd.DataFrame,
    raw_test_x: pd.DataFrame,
    y: pd.Series,
    params: dict[str, Any],
    weights: dict[int, float] | list[float],
    top_k: int,
) -> tuple[Any, FoldPreprocessor, list[str], np.ndarray]:
    preprocessor = FoldPreprocessor().fit(raw_x)
    x_train = preprocessor.transform(raw_x)
    x_test = preprocessor.transform(raw_test_x)
    selected = top_features(model_type, x_train, y, top_k, weights)
    if model_type == "lgbm":
        model = make_lgbm(params, weights)  # type: ignore[arg-type]
    else:
        model = make_catboost(params, weights)  # type: ignore[arg-type]
    model.fit(x_train[selected], y)
    probabilities = align_probabilities(model, model.predict_proba(x_test[selected]))
    return model, preprocessor, selected, probabilities


def serializable(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): serializable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [serializable(item) for item in value]
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, (np.integer, np.floating, np.bool_)):
        return value.item()
    return value


def group_result(
    config: GroupConfig,
    train_indices: np.ndarray,
    y: pd.Series,
    fold_ids: np.ndarray,
    oof_predictions: np.ndarray,
    final_thresholds: dict[str, float] | None,
    legacy_predictions: np.ndarray | None,
    best_lgbm: dict[str, Any],
    best_cat: dict[str, Any],
    threshold_folds: list[dict[str, Any]],
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "group": config.name,
        "product_codes": list(config.product_codes),
        "train_rows": int(len(train_indices)),
        "class_counts": {
            str(key): int(value) for key, value in y.value_counts().sort_index().items()
        },
        "oof_metrics": metrics(y, oof_predictions),
        "best_lgbm": best_lgbm,
        "best_catboost": best_cat,
        "thresholds_for_test": final_thresholds,
        "cross_fitted_thresholds": threshold_folds,
        "fold_counts": {
            str(fold): int((fold_ids == fold).sum())
            for fold in sorted(np.unique(fold_ids))
        },
    }
    if legacy_predictions is not None:
        result["legacy_oof_metrics_same_data_threshold_tuning"] = metrics(
            y, legacy_predictions
        )
    return serializable(result)


def main() -> None:
    args = make_parser().parse_args()
    root = project_root()
    output_dir = args.output_dir or (root / "models" / "kdg_baseline")
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.n_splits < 2:
        raise ValueError("--n-splits must be at least 2.")
    if args.threshold_trials < 1:
        raise ValueError("--threshold-trials must be at least 1.")
    if args.quick:
        lgbm_trial_override = 1
        cat_trial_override = 1
        threshold_trials = 5
    else:
        lgbm_trial_override = args.lgbm_trials
        cat_trial_override = args.cat_trials
        threshold_trials = args.threshold_trials

    train, test = load_data(root)
    group_outputs: dict[str, dict[str, Any]] = {}
    global_probabilities = np.zeros((len(train), N_CLASSES), dtype=float)
    global_predictions = np.zeros(len(train), dtype=int)
    global_fold_ids = np.full(len(train), -1, dtype=int)
    test_predictions = np.full(len(test), -1, dtype=int)

    expected_group_counts = {"A_31": 249, "T_O_31": 349}
    actual_group_counts = {
        config.name: int(train["PRODUCT_CODE"].isin(config.product_codes).sum())
        for config in GROUP_CONFIGS
    }
    if actual_group_counts != expected_group_counts:
        raise ValueError(
            "Unexpected baseline group counts. "
            f"expected={expected_group_counts}, actual={actual_group_counts}"
        )

    for config in GROUP_CONFIGS:
        raw_x, y, train_indices = group_rows(train, config)
        test_mask = test["PRODUCT_CODE"].isin(config.product_codes).to_numpy()
        raw_test_x = raw_features(test.loc[test_mask])
        folds = make_folds(y, args.n_splits)
        full_preprocessor = FoldPreprocessor().fit(raw_x)
        max_features = len(full_preprocessor.feature_columns)
        if config.name == "A_31":
            max_features = min(300, max_features)

        lgbm_trials = lgbm_trial_override or config.lgbm_trials
        cat_trials = cat_trial_override or config.cat_trials
        print(
            f"[{config.name}] rows={len(raw_x)}, features={max_features}, "
            f"lgbm_trials={lgbm_trials}, cat_trials={cat_trials}"
        )

        best_lgbm = tune_model(
            "lgbm",
            raw_x,
            y,
            folds,
            config,
            max_features,
            lgbm_trials,
        )
        best_cat = tune_model(
            "catboost",
            raw_x,
            y,
            folds,
            config,
            max_features,
            cat_trials,
        )

        lgbm_params, lgbm_weights, lgbm_top_k = unpack_best("lgbm", best_lgbm)
        cat_params, cat_weights, cat_top_k = unpack_best("catboost", best_cat)
        lgbm_oof, fold_ids = fit_oof(
            "lgbm", raw_x, y, folds, lgbm_params, lgbm_weights, lgbm_top_k
        )
        cat_oof, cat_fold_ids = fit_oof(
            "catboost", raw_x, y, folds, cat_params, cat_weights, cat_top_k
        )
        if not np.array_equal(fold_ids, cat_fold_ids):
            raise RuntimeError("LightGBM and CatBoost fold assignments differ.")

        ensemble_oof = (lgbm_oof + cat_oof) / 2.0
        legacy_thresholds: dict[str, float] | None = None
        legacy_predictions: np.ndarray | None = None
        threshold_folds: list[dict[str, Any]] = []
        if config.name == "T_O_31":
            oof_predictions, threshold_folds = cross_fitted_threshold_predictions(
                ensemble_oof, y, fold_ids, threshold_trials
            )
            legacy_thresholds = tune_thresholds(
                ensemble_oof, y, threshold_trials, seed=SEED + 999
            )
            legacy_predictions = apply_thresholds(ensemble_oof, legacy_thresholds)
        else:
            oof_predictions = np.argmax(ensemble_oof, axis=1)

        final_thresholds = legacy_thresholds
        final_lgbm_model, final_lgbm_preprocessor, final_lgbm_features, test_lgbm = fit_final_model(
            "lgbm",
            raw_x,
            raw_test_x,
            y,
            lgbm_params,
            lgbm_weights,
            lgbm_top_k,
        )
        final_cat_model, final_cat_preprocessor, final_cat_features, test_cat = fit_final_model(
            "catboost",
            raw_x,
            raw_test_x,
            y,
            cat_params,
            cat_weights,
            cat_top_k,
        )

        if not final_lgbm_features or not final_cat_features:
            raise RuntimeError(f"No selected features for {config.name}.")

        ensemble_test = (test_lgbm + test_cat) / 2.0
        if config.name == "T_O_31":
            if final_thresholds is None:
                raise RuntimeError("T_O_31 thresholds were not produced.")
            group_test_predictions = apply_thresholds(ensemble_test, final_thresholds)
        else:
            group_test_predictions = np.argmax(ensemble_test, axis=1)

        test_positions = np.flatnonzero(test_mask)
        if len(test_positions) != len(group_test_predictions):
            raise RuntimeError(f"Test prediction length mismatch for {config.name}.")
        test_predictions[test_positions] = group_test_predictions
        global_probabilities[train_indices] = ensemble_oof
        global_predictions[train_indices] = oof_predictions
        global_fold_ids[train_indices] = fold_ids

        joblib.dump(
            {
                "model": final_lgbm_model,
                "preprocessor": final_lgbm_preprocessor,
                "features": final_lgbm_features,
                "group": config.name,
                "model_type": "lightgbm",
                "thresholds": final_thresholds,
            },
            output_dir / f"{config.name}_lgbm.joblib",
        )
        joblib.dump(
            {
                "model": final_cat_model,
                "preprocessor": final_cat_preprocessor,
                "features": final_cat_features,
                "group": config.name,
                "model_type": "catboost",
                "thresholds": final_thresholds,
            },
            output_dir / f"{config.name}_catboost.joblib",
        )

        group_outputs[config.name] = group_result(
            config=config,
            train_indices=train_indices,
            y=y,
            fold_ids=fold_ids,
            oof_predictions=oof_predictions,
            final_thresholds=final_thresholds,
            legacy_predictions=legacy_predictions,
            best_lgbm=best_lgbm,
            best_cat=best_cat,
            threshold_folds=threshold_folds,
        )

    if (test_predictions < 0).any():
        missing_positions = np.flatnonzero(test_predictions < 0).tolist()
        raise RuntimeError(f"Some test rows were not assigned predictions: {missing_positions}")

    submission_path = root / "dataset" / "submission_kdg_baseline.csv"
    sample_submission_path = root / "dataset" / "sample_submission.csv"
    if sample_submission_path.exists():
        submission = pd.read_csv(sample_submission_path)
        if len(submission) != len(test):
            raise ValueError("sample_submission row count does not match test.csv.")
    else:
        submission = pd.DataFrame({"PRODUCT_ID": test["PRODUCT_ID"]})
    submission["Y_Class"] = test_predictions
    submission.to_csv(submission_path, index=False)

    oof_frame = train[["PRODUCT_ID", "PRODUCT_CODE", "Y_Class"]].copy()
    oof_frame["CV_Fold"] = global_fold_ids
    oof_frame["OOF_Prediction"] = global_predictions
    for class_id in range(N_CLASSES):
        oof_frame[f"OOF_Probability_{class_id}"] = global_probabilities[:, class_id]
    oof_frame.to_csv(output_dir / "oof_predictions.csv", index=False)

    result = {
        "baseline": "kdg1385_style",
        "seed": SEED,
        "n_splits": args.n_splits,
        "train_rows": int(len(train)),
        "test_rows": int(len(test)),
        "group_counts": {
            config.name: int(train["PRODUCT_CODE"].isin(config.product_codes).sum())
            for config in GROUP_CONFIGS
        },
        "overall_oof_metrics": metrics(train["Y_Class"].astype(int), global_predictions),
        "groups": group_outputs,
        "artifacts": {
            "submission": str(submission_path),
            "output_dir": str(output_dir),
        },
    }
    (output_dir / "results.json").write_text(
        json.dumps(serializable(result), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(json.dumps(serializable(result["overall_oof_metrics"]), indent=2))
    print(f"Saved baseline artifacts to {output_dir}")
    print(f"Saved submission to {submission_path}")


if __name__ == "__main__":
    main()
