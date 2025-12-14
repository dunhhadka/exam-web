import os
from typing import Optional, Literal


def _safe_filename(value: str) -> str:
    # Keep it simple: allow alnum, dash, underscore, dot. Replace others with '_'.
    out = []
    for ch in value:
        if ch.isalnum() or ch in ("-", "_", "."):
            out.append(ch)
        else:
            out.append("_")
    return "".join(out).strip("_") or "unknown"


def save_evidence_image(
    *,
    frame_data: dict,
    incident_type: str,
    room_id: str,
    candidate_id: str,
    timestamp_ms: int,
    base_dir: Optional[str] = None,
    prefer: Optional[Literal["camera", "screen"]] = None,
) -> Optional[str]:
    """Persist one evidence image to disk and return its file path.

    Returns:
        A path string suitable for storing in DB (relative to current working directory
        when possible), otherwise None.
    """

    if not frame_data:
        return None

    # Choose which frame to save.
    if prefer is None:
        # Default heuristic: screen incidents usually start with 'B'. Others: camera first.
        prefer = "screen" if str(incident_type).startswith("B") else "camera"

    preferred = frame_data.get(prefer)
    fallback = frame_data.get("camera" if prefer == "screen" else "screen")

    frame = preferred if preferred and preferred.get("image") is not None else fallback
    if not frame or frame.get("image") is None:
        return None

    image_rgb = frame.get("image")

    # Resolve output directory
    if base_dir is None:
        base_dir = os.getenv("EVIDENCE_DIR") or os.path.join(os.getcwd(), "evidence_images")

    room_part = _safe_filename(str(room_id))
    cand_part = _safe_filename(str(candidate_id))
    inc_part = _safe_filename(str(incident_type))

    out_dir = os.path.join(base_dir, room_part, cand_part)
    os.makedirs(out_dir, exist_ok=True)

    filename = f"{inc_part}_{int(timestamp_ms)}.jpg"
    out_path = os.path.join(out_dir, filename)

    # Write as JPEG
    try:
        import cv2

        # cv2 expects BGR
        img_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
        ok = cv2.imwrite(out_path, img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        return os.path.relpath(out_path, os.getcwd()) if ok else None
    except Exception:
        # Fallback: PIL
        try:
            from PIL import Image

            Image.fromarray(image_rgb).save(out_path, format="JPEG", quality=85, optimize=True)
            return os.path.relpath(out_path, os.getcwd())
        except Exception:
            return None
