"""Small photo-only FastAPI wrapper around the copied WasteWise model."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, File, HTTPException, UploadFile

from classifier import model_available, predict
from translator import translate

logger = logging.getLogger(__name__)
MAX_IMAGE_BYTES = 10 * 1024 * 1024


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Warm the real model before the HTTP server starts accepting photos.
    available = model_available()
    logger.info("WasteWise model available at startup: %s", available)
    yield


app = FastAPI(title="LoopSaathi image classification", lifespan=lifespan)


@app.get("/health")
def health():
    available = model_available()
    return {"status": "ok" if available else "degraded", "modelAvailable": available}


@app.post("/classify")
async def classify(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image file")
    content = await image.read(MAX_IMAGE_BYTES + 1)
    if not content or len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be between 1 byte and 10 MB")
    try:
        label, confidence = predict(content)
        return translate(label, confidence)
    except Exception:
        logger.exception("Photo inference failed; manual classification required")
        return translate(None, 0.0)
    finally:
        await image.close()
