import json, re, secrets, os
from urllib.parse import urlparse
from PIL import Image, UnidentifiedImageError
from flask import current_app, abort, send_from_directory
ALLOWED_IMAGES={"JPEG":"image/jpeg","PNG":"image/png","WEBP":"image/webp","GIF":"image/gif"}
def slugify(value):
    value=(value or "item").strip().lower()
    value=re.sub(r"[^a-z0-9]+","-",value).strip("-")
    return value[:80] or "item"
def json_load(value, default=None):
    try: return json.loads(value or "{}")
    except (ValueError,TypeError): return default if default is not None else {}
def safe_url(value):
    if not value: return ""
    p=urlparse(value.strip())
    return value.strip() if p.scheme in ("https","http","mailto","tel") else ""
def sanitize_profile(data):
    """Validate contact fields in a profile dict, blanking unsafe values."""
    email=data.get("email","")
    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+",email): data["email"]=""
    phone=data.get("phone","")
    if phone and not re.fullmatch(r"\+?[0-9() .-]{7,24}",phone): data["phone"]=""
    for key in ("website","linkedin","github"): data[key]=safe_url(data.get(key,""))
    return data
def save_upload(file, allow_pdf=False):
    if not file or not file.filename: return None
    raw=file.stream.read(8*1024*1024+1); file.stream.seek(0)
    if not raw or len(raw)>8*1024*1024: raise ValueError("File is empty or larger than 8 MB.")
    ext=os.path.splitext(file.filename)[1].lower()
    if ext in {".exe",".bat",".cmd",".js",".html",".htm",".svg",".py",".sh",".php"}: raise ValueError("This file type is not allowed.")
    mime=None
    try:
        im=Image.open(file.stream); im.verify(); fmt=im.format
        if fmt not in ALLOWED_IMAGES: raise ValueError("Use a JPEG, PNG, WEBP or GIF image.")
        file.stream.seek(0)
        im=Image.open(file.stream); im.load()
        # Normalize orientation/format and strip unsafe metadata. Preserve readable resolution.
        if im.mode not in ("RGB","RGBA"):
            im=im.convert("RGBA" if "transparency" in im.info else "RGB")
        name=secrets.token_hex(20)+".webp"
        dest=os.path.join(current_app.config["MEDIA_DIR"],name)
        if im.mode=="RGBA": im.save(dest,"WEBP",quality=92,method=6)
        else: im.save(dest,"WEBP",quality=94,method=6)
        return {"filename":name,"mime":"image/webp","original_name":os.path.basename(file.filename)}
    except (UnidentifiedImageError, OSError):
        file.stream.seek(0)
        if allow_pdf and raw.startswith(b"%PDF-"):
            name=secrets.token_hex(20)+".pdf"; dest=os.path.join(current_app.config["MEDIA_DIR"],name)
            with open(dest,"wb") as out: out.write(raw)
            return {"filename":name,"mime":"application/pdf","original_name":os.path.basename(file.filename)}
        raise ValueError("The file content is not a supported image"+(" or valid PDF." if allow_pdf else "."))
def public_media_path(filename):
    from .db import get_db
    row=get_db().execute("SELECT m.*,c.status AS content_status FROM media m LEFT JOIN content c ON c.id=m.content_id WHERE m.filename=?",(filename,)).fetchone()
    if not row or row["is_private"] or (row["content_id"] and row["content_status"]!="published"): abort(404)
    return send_from_directory(current_app.config["MEDIA_DIR"],filename,as_attachment=(row["mime"]=="application/pdf"),download_name=row["original_name"] if row["mime"]=="application/pdf" else None)
