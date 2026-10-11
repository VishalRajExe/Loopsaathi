"""WasteWise label order and the local LoopSaathi stream translation."""

# Source: D:\Loopsathi\githubrepos\wt23-wastewise-main\AI\classifier_tensor_flow\tensorflow_pretrained_model_20classes_v02.ipynb
# Verified against val_ds.class_names output in that notebook.
# Its image_dataset_from_directory sorts folder names alphabetically.
CLASS_NAMES = (
    "aluminum_foil", "apples", "banana_peels", "cardboard", "condoms",
    "diapers", "food_waste", "glass_bottle", "old_books", "oranges",
    "pans", "pizza_box", "plastic_bags", "plastic_packaging", "plastic_toys",
    "smartphone", "tampons", "tea_bags", "tetrapack", "toothbrush",
)

# Source: D:\Loopsathi\githubrepos\wt23-wastewise-main\WD\next-js-app\src\components\ShowResult.js
# Types 1/3/6 -> DRY, 2 -> WET, 4 -> SANITARY, 5 -> E_WASTE.
# This is a local prototype routing adaptation, not the original Berlin bin advice.
STREAM_BY_LABEL = {
    "aluminum_foil": "DRY", "apples": "WET", "banana_peels": "WET",
    "cardboard": "DRY", "condoms": "SANITARY", "diapers": "SANITARY",
    "food_waste": "WET", "glass_bottle": "DRY", "old_books": "DRY",
    "oranges": "WET", "pans": "DRY", "pizza_box": "DRY",
    "plastic_bags": "DRY", "plastic_packaging": "DRY", "plastic_toys": "DRY",
    "smartphone": "E_WASTE", "tampons": "SANITARY", "tea_bags": "WET",
    "tetrapack": "DRY", "toothbrush": "DRY",
}


def translate(label: str | None, confidence: float) -> dict:
    """Conservative suggestion; unknown/low confidence always requires review."""
    stream = STREAM_BY_LABEL.get(label)
    return {
        "label": label if stream else None,
        "confidence": confidence if stream else 0.0,
        "stream": stream,
        "needsReview": stream is None or confidence < 0.6,
    }
