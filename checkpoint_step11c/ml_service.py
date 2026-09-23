"""
Machine Learning Service for Smart Campus Complaint Categorization & Priority Scoring.

Loads trained TF-IDF + Logistic Regression pipelines (Step 8C active candidate, Step 8B fallback),
caches them in memory for sub-5ms inference, and provides safe, fail-safe predictions.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import joblib

from app.core.config import settings

logger = logging.getLogger(__name__)


class ComplaintMLService:
    _instance: Optional["ComplaintMLService"] = None

    def __init__(self):
        self._category_models: Dict[str, Any] = {}
        self._priority_models: Dict[str, Any] = {}
        self._models_dir = self._resolve_models_dir()
        self._initialized = False

    @classmethod
    def get_instance(cls) -> "ComplaintMLService":
        if cls._instance is None:
            cls._instance = ComplaintMLService()
            cls._instance.load_models()
        return cls._instance

    def _resolve_models_dir(self) -> Path:
        """
        Locates the ml/models directory independent of current working directory.
        Calculates canonical path relative to project root derived from this file's location.
        """
        # Project root: backend/app/services/ml_service.py -> parents[3]
        project_root = Path(__file__).resolve().parents[3]

        configured_dir = getattr(settings, "ML_MODELS_DIR", "ml/models")
        if configured_dir:
            p_conf = Path(configured_dir)
            # 1. Absolute path explicitly configured and valid
            if p_conf.is_absolute() and p_conf.is_dir():
                return p_conf.resolve()

            # 2. Configured path relative to project root
            p_proj = project_root / p_conf
            if p_proj.is_dir():
                return p_proj.resolve()

            # 3. Configured path relative to current working directory
            if p_conf.is_dir():
                return p_conf.resolve()

        # 4. Canonical project root ml/models
        canonical = project_root / "ml" / "models"
        if canonical.is_dir():
            return canonical.resolve()

        # 5. Fallback relative to backend or parent
        p_parent = Path("..") / "ml" / "models"
        if p_parent.is_dir():
            return p_parent.resolve()

        p_cwd = Path("ml") / "models"
        if p_cwd.is_dir():
            return p_cwd.resolve()

        return canonical

    def load_models(self) -> None:
        """Loads and caches both Step 8C (active) and Step 8B (fallback) models into memory."""
        try:
            logger.info("Initializing ComplaintMLService from %s", self._models_dir)

            # Load Step 8C models
            cat_8c_path = self._models_dir / "category_model_step8c.joblib"
            prio_8c_path = self._models_dir / "priority_model_step8c.joblib"

            if cat_8c_path.exists():
                self._category_models["step8c"] = joblib.load(cat_8c_path)
                logger.info("Loaded Step 8C category model.")

            if prio_8c_path.exists():
                self._priority_models["step8c"] = joblib.load(prio_8c_path)
                logger.info("Loaded Step 8C priority model.")

            # Load Step 8B fallback models
            cat_8b_path = self._models_dir / "category_model.joblib"
            prio_8b_path = self._models_dir / "priority_model.joblib"

            if cat_8b_path.exists():
                self._category_models["step8b"] = joblib.load(cat_8b_path)
                logger.info("Loaded Step 8B category model (fallback).")

            if prio_8b_path.exists():
                self._priority_models["step8b"] = joblib.load(prio_8b_path)
                logger.info("Loaded Step 8B priority model (fallback).")

            self._initialized = True
        except Exception as exc:
            logger.error("Failed to load ML models: %s", exc, exc_info=True)
            self._initialized = False

    def is_ready(self) -> bool:
        return bool(self._category_models or self._priority_models)

    def _get_active_models(
        self,
        category_version: Optional[str] = None,
        priority_version: Optional[str] = None,
    ) -> Tuple[Optional[Any], str, Optional[Any], str]:
        cat_ver = category_version or settings.CATEGORY_MODEL_VERSION
        prio_ver = priority_version or settings.PRIORITY_MODEL_VERSION

        # Resolve category model with fallback
        cat_model = self._category_models.get(cat_ver)
        active_cat_ver = cat_ver
        if cat_model is None and "step8c" in self._category_models:
            cat_model = self._category_models["step8c"]
            active_cat_ver = "step8c"
        elif cat_model is None and "step8b" in self._category_models:
            cat_model = self._category_models["step8b"]
            active_cat_ver = "step8b"

        # Resolve priority model with fallback
        prio_model = self._priority_models.get(prio_ver)
        active_prio_ver = prio_ver
        if prio_model is None and "step8c" in self._priority_models:
            prio_model = self._priority_models["step8c"]
            active_prio_ver = "step8c"
        elif prio_model is None and "step8b" in self._priority_models:
            prio_model = self._priority_models["step8b"]
            active_prio_ver = "step8b"

        return cat_model, active_cat_ver, prio_model, active_prio_ver

    def predict(
        self,
        text: str,
        threshold: Optional[float] = None,
        category_version: Optional[str] = None,
        priority_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Predicts category and priority for a complaint text.
        Guaranteed to not raise an unhandled exception or crash the caller.
        """
        clean_text = (text or "").strip()
        conf_threshold = threshold if threshold is not None else settings.ML_CONFIDENCE_THRESHOLD

        # Default safe response in case of empty input or model unavailability
        default_res = {
            "predicted_category": "Other",
            "category_confidence": 0.0,
            "is_low_confidence": True,
            "predicted_priority": "Medium",
            "priority_confidence": 0.0,
            "model_version": "none",
            "active": False,
        }

        if not clean_text:
            return default_res

        cat_model, cat_ver, prio_model, prio_ver = self._get_active_models(
            category_version=category_version,
            priority_version=priority_version,
        )

        if cat_model is None and prio_model is None:
            logger.warning("No ML models available for complaint prediction.")
            return default_res

        try:
            # Predict category
            cat_pred = "Other"
            cat_conf = 0.0
            if cat_model is not None:
                cat_pred = str(cat_model.predict([clean_text])[0])
                if hasattr(cat_model, "predict_proba"):
                    probs = cat_model.predict_proba([clean_text])[0]
                    classes = list(cat_model.classes_)
                    if cat_pred in classes:
                        cat_conf = float(probs[classes.index(cat_pred)])

            # Predict priority
            prio_pred = "Medium"
            prio_conf = 0.0
            if prio_model is not None:
                prio_pred = str(prio_model.predict([clean_text])[0])
                if hasattr(prio_model, "predict_proba"):
                    probs = prio_model.predict_proba([clean_text])[0]
                    classes = list(prio_model.classes_)
                    if prio_pred in classes:
                        prio_conf = float(probs[classes.index(prio_pred)])

            is_low_confidence = cat_conf < conf_threshold

            return {
                "predicted_category": cat_pred,
                "category_confidence": round(cat_conf, 4),
                "is_low_confidence": is_low_confidence,
                "predicted_priority": prio_pred,
                "priority_confidence": round(prio_conf, 4),
                "model_version": cat_ver,
                "active": True,
            }
        except Exception as exc:
            logger.error("Error during ML complaint inference: %s", exc, exc_info=True)
            return default_res


# Global convenience helper
ml_service = ComplaintMLService.get_instance()
