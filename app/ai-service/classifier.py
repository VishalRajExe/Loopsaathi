"""Inference on the copied 20-class TensorFlow SavedModel; no training."""

from io import BytesIO
import logging
from pathlib import Path
from threading import Lock

from translator import CLASS_NAMES

# Source: D:\Loopsathi\githubrepos\wt23-wastewise-main\AI\models\model_20_classes
MODEL_DIR = Path(__file__).resolve().parent / "model_20_classes"
_model = None
_lock = Lock()
logger = logging.getLogger(__name__)


def model_available() -> bool:
    """Actually try loading the model so health reflects usable inference."""
    try:
        _load_model()
        return True
    except Exception as exc:
        logger.warning("WasteWise model unavailable: %s", exc)
        return False


def _load_model():
    global _model
    with _lock:
        if _model is None:
            import tensorflow as tf

            if not (MODEL_DIR / "saved_model.pb").is_file():
                raise FileNotFoundError(f"SavedModel missing: {MODEL_DIR}")
            # Keras 2 saved optimizer slots cannot be revived by TF 2.20's
            # tf.saved_model.load (missing add_slot). The graph loader restores
            # the SAME serving graph and trained variables, skipping that metadata.
            graph = tf.Graph()
            session = tf.compat.v1.Session(graph=graph)
            try:
                with graph.as_default(), session.as_default():
                    meta = tf.compat.v1.saved_model.loader.load(
                        session, [tf.saved_model.SERVING], str(MODEL_DIR)
                    )
                signature = meta.signature_def["serving_default"]
                if len(signature.inputs) != 1 or len(signature.outputs) != 1:
                    raise RuntimeError("Unexpected SavedModel signature")
                input_name = next(iter(signature.inputs.values())).name
                output_name = next(iter(signature.outputs.values())).name
                _model = (session, graph.get_tensor_by_name(input_name),
                          graph.get_tensor_by_name(output_name))
            except Exception:
                session.close()
                raise
    return _model


def predict(image_bytes: bytes) -> tuple[str, float]:
    import numpy as np
    import tensorflow as tf
    from PIL import Image, ImageOps

    Image.MAX_IMAGE_PIXELS = 30_000_000
    # Source: D:\Loopsathi\githubrepos\wt23-wastewise-main\AI\classifier_tensor_flow\tensorflow_pretrained_model_20classes_v02.ipynb
    # 299x299 RGB inputs;
    # training normalize() divides raw pixel values by 255 (not /127.5 - 1).
    with Image.open(BytesIO(image_bytes)) as photo:
        photo = ImageOps.exif_transpose(photo).convert("RGB")
        array = np.asarray(photo.resize((299, 299), Image.Resampling.BILINEAR), dtype=np.float32)
    batch = tf.convert_to_tensor(np.expand_dims(array / 255.0, axis=0))
    session, input_tensor, output_tensor = _load_model()
    scores = session.run(output_tensor, feed_dict={input_tensor: batch.numpy()})
    if scores.shape != (1, len(CLASS_NAMES)) or not np.all(np.isfinite(scores)):
        raise RuntimeError("Invalid model output")
    index = int(np.argmax(scores[0]))
    return CLASS_NAMES[index], float(scores[0, index])
