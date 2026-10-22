import json, time, sqlite3, os, re
from functools import wraps
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, abort, current_app, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from .db import get_db
from .utils import json_load, slugify, save_upload, safe_url, sanitize_profile
admin_bp=Blueprint("admin",__name__,url_prefix="/studio")
KINDS={"profile":"Profile","career":"Career & education","skill":"Skills","club":"Clubs","activity":"Activities","project":"Projects","publication":"Publications","category":"Project categories","certificate":"Certificates","crest":"Crests","gallery":"Gallery / albums","block":"Page builder blocks"}
ATTEMPTS={}
def admin_required(fn):
 @wraps(fn)
 def wrapped(*a,**kw):
  if not session.get("admin_id"): return redirect(url_for("admin.login",next=request.path))
  return fn(*a,**kw)
 return wrapped
def row_item(row):
 d=dict(row); d["data"]=json_load(d.get("data")); return d
@admin_bp.route("",methods=["GET"])
def index():
 db=get_db(); n=db.execute("SELECT COUNT(*) FROM admins").fetchone()[0]
 if not n: return redirect(url_for("admin.setup"))
 if not session.get("admin_id"): return redirect(url_for("admin.login"))
 return redirect(url_for("admin.dashboard"))
@admin_bp.route("/setup",methods=["GET","POST"])
def setup():
 db=get_db()
 if db.execute("SELECT COUNT(*) FROM admins").fetchone()[0]: return redirect(url_for("admin.login"))
 if request.method=="POST":
  email=request.form.get("email"," ").strip().lower(); password=request.form.get("password",""); confirm=request.form.get("confirm","")
  if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+",email) or len(password)<12 or password!=confirm: flash("Use a valid email and a matching password of at least 12 characters.","error")
  else:
   db.execute("INSERT INTO admins(email,password_hash) VALUES(?,?)",(email,generate_password_hash(password))); db.commit(); flash("Admin account created. Please sign in.","success"); return redirect(url_for("admin.login"))
 return render_template("admin/setup.html")
@admin_bp.route("/login",methods=["GET","POST"])
def login():
 if session.get("admin_id"): return redirect(url_for("admin.dashboard"))
 ip=request.remote_addr or "unknown"; now=time.time()
 for k in [k for k,v in ATTEMPTS.items() if not v or now-max(v)>600]: del ATTEMPTS[k]
 if len(ATTEMPTS)>10000: ATTEMPTS.clear()
 history=[t for t in ATTEMPTS.get(ip,[]) if now-t<600]; ATTEMPTS[ip]=history
 if request.method=="POST":
  if len(history)>=5: flash("Too many login attempts. Wait 10 minutes and try again.","error")
  else:
   history.append(now); ATTEMPTS[ip]=history
   email=request.form.get("email"," ").strip().lower(); password=request.form.get("password","")
   row=get_db().execute("SELECT * FROM admins WHERE email=?",(email,)).fetchone()
   if row and check_password_hash(row["password_hash"],password):
    ATTEMPTS[ip]=[]; session.clear(); session["admin_id"]=row["id"]; session["admin_email"]=row["email"]; session.permanent=True
    return redirect(url_for("admin.dashboard"))
   flash("Email or password is incorrect.","error")
 return render_template("admin/login.html")
@admin_bp.route("/logout",methods=["POST"])
@admin_required
def logout(): session.clear(); flash("You have signed out.","success"); return redirect(url_for("admin.login"))
@admin_bp.route("/dashboard")
@admin_required
def dashboard():
 db=get_db(); counts={k:db.execute("SELECT COUNT(*) FROM content WHERE kind=? AND status='published'",(k,)).fetchone()[0] for k in KINDS if k!="profile"}
 return render_template("admin/dashboard.html", kinds=KINDS, counts=counts)
@admin_bp.route("/profile",methods=["GET","POST"])
@admin_required
def profile_edit():
 db=get_db(); row=db.execute("SELECT data FROM profile WHERE id=1").fetchone(); data=json_load(row[0])
 if request.method=="POST":
  keys=["name","tagline","role","company","degree","university","about","email","phone","website","linkedin","github","welcome_text","guide_dialogue","theme","location_label","location_address","map_url","map_lat","map_lng","contact_intro"]
  for k in keys: data[k]=request.form.get(k,"").strip()
  for key in ("email","phone"):
   value=data.get(key,"")
   if value and value!=sanitize_profile(dict(data))[key]: flash("Enter a valid public "+key+" address.","error")
  data=sanitize_profile(data)
  if data.get("theme") not in ("light","dark"): data["theme"]="light"
  for coord in ("map_lat","map_lng"):
   v=(data.get(coord) or "").strip()
   if v and not re.fullmatch(r"-?\d{1,3}(\.\d{1,6})?",v): data[coord]=""
  map_url=(data.get("map_url") or "").strip()
  if map_url and not (map_url.startswith("https://www.openstreetmap.org/") or map_url.startswith("https://www.openstreetmap.org/export/embed.html")):
   data["map_url"]=""
  if data.get("map_url") and not (data.get("map_lat") and data.get("map_lng")) and "bbox=" not in data["map_url"]:
   data["map_url"]=""
  photo=request.files.get("photo"); cv=request.files.get("cv")
  for upload,field,pdf in [(photo,"photo_filename",False),(cv,"cv_filename",True)]:
   if upload and upload.filename:
    try:
     saved=save_upload(upload,allow_pdf=pdf)
     db.execute("INSERT INTO media(filename,original_name,mime,is_private) VALUES(?,?,?,?)",(saved["filename"],saved["original_name"],saved["mime"],1 if field=="cv_filename" else 0))
     data[field]=saved["filename"]
    except ValueError as e: flash(str(e),"error")
  db.execute("UPDATE profile SET data=? WHERE id=1",(json.dumps(data,ensure_ascii=False),)); db.commit(); flash("Profile saved.","success"); return redirect(url_for("admin.profile_edit"))
 return render_template("admin/profile.html",data=data)
def _collect_content_form(item, kind, form, files):
 """Validate and collect content form fields. Returns (title, slug, status, sort_order, data, uploaded) or None on failure."""
 title=form.get("title","").strip(); slug=slugify(form.get("slug") or title); status=form.get("status","draft")
 if status not in ("draft","published","hidden"): status="draft"
 if not title: flash("Title is required.","error"); return None
 try: sort_order=int(form.get("sort_order",0) or 0)
 except ValueError:
  flash("Sort order must be a whole number.","error"); return None
 data=dict(item["data"])
 data.update({k[2:]:v.strip() for k,v in form.items() if k.startswith("f_")})
 if data.get("club_id") and not data["club_id"].isdigit(): data["club_id"]=""
 for field in ("website","github","demo","doi","paper_url","code_url","verification_url","video_url","external_url","linkedin","location_url"):
  if field in data: data[field]=safe_url(data[field])
 upload=files.get("image"); uploaded=None
 if upload and upload.filename:
  try:
   uploaded=save_upload(upload,allow_pdf=(kind in ("certificate","publication")))
   data["image_filename"]=uploaded["filename"]
  except ValueError as e: flash(str(e),"error"); return None
 return (title,slug,status,sort_order,data,uploaded)
@admin_bp.route("/<kind>")
@admin_required
def list_content(kind):
 if kind not in KINDS or kind=="profile": abort(404)
 rows=[row_item(r) for r in get_db().execute("SELECT * FROM content WHERE kind=? ORDER BY sort_order,id DESC",(kind,)).fetchall()]
 return render_template("admin/list.html",kind=kind,label=KINDS[kind],items=rows)
@admin_bp.route("/<kind>/new",methods=["GET","POST"])
@admin_bp.route("/<kind>/<int:item_id>/edit",methods=["GET","POST"])
@admin_required
def edit_content(kind,item_id=None):
 if kind not in KINDS or kind=="profile": abort(404)
 db=get_db(); row=db.execute("SELECT * FROM content WHERE id=? AND kind=?",(item_id,kind)).fetchone() if item_id else None
 if item_id and not row: abort(404)
 item=row_item(row) if row else {"title":"","slug":"","data":{},"status":"draft","sort_order":0}
 if request.method=="POST":
  collected=_collect_content_form(item,kind,request.form,request.files)
  if collected:
   title,slug,status,sort_order,data,uploaded=collected
   try:
    if row:
     content_id=item_id
     db.execute("UPDATE content SET title=?,slug=?,data=?,status=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",(title,slug,json.dumps(data,ensure_ascii=False),status,sort_order,item_id))
    else:
     cursor=db.execute("INSERT INTO content(kind,title,slug,data,status,sort_order) VALUES(?,?,?,?,?,?)",(kind,title,slug,json.dumps(data,ensure_ascii=False),status,sort_order))
     content_id=cursor.lastrowid
    if uploaded:
     db.execute("INSERT INTO media(filename,original_name,mime,is_private,content_id) VALUES(?,?,?,0,?)",(uploaded["filename"],uploaded["original_name"],uploaded["mime"],content_id))
    db.commit(); flash("Saved successfully.","success"); return redirect(url_for("admin.list_content",kind=kind))
   except sqlite3.IntegrityError:
    db.rollback()
    flash("That slug is already used in this section. Choose another.","error")
 return render_template("admin/edit.html",kind=kind,label=KINDS[kind],item=item)
@admin_bp.route("/<kind>/<int:item_id>/delete",methods=["POST"])
@admin_required
def delete_content(kind,item_id):
 if kind not in KINDS or kind=="profile": abort(404)
 db=get_db(); row=db.execute("SELECT id FROM content WHERE id=? AND kind=?",(item_id,kind)).fetchone()
 if row: db.execute("DELETE FROM content WHERE id=?",(item_id,)); db.commit(); flash("Record deleted. Related crest records are preserved.","success")
 return redirect(url_for("admin.list_content",kind=kind))
@admin_bp.route("/media-library")
@admin_required
def media_library():
    """List uploaded media with usage info and visibility state."""
    db=get_db()
    rows=db.execute("SELECT m.*,c.title AS content_title,c.kind AS content_kind FROM media m LEFT JOIN content c ON c.id=m.content_id ORDER BY m.created_at DESC,m.id DESC").fetchall()
    items=[dict(r) for r in rows]
    return render_template("admin/media.html",items=items)
@admin_bp.route("/media/<filename>/delete",methods=["POST"])
@admin_required
def media_delete(filename):
    """Delete a media row and its file. Orphaned files are still deletable."""
    db=get_db(); row=db.execute("SELECT * FROM media WHERE filename=?",(filename,)).fetchone()
    if row:
        path=os.path.join(current_app.config["MEDIA_DIR"],filename)
        if os.path.basename(filename)==filename and os.path.exists(path):
            try: os.remove(path)
            except OSError: pass
        db.execute("DELETE FROM media WHERE filename=?",(filename,)); db.commit()
        flash("Media file deleted.","success")
    return redirect(url_for("admin.media_library"))
@admin_bp.route("/messages")
@admin_required
def messages_inbox():
    rows=get_db().execute("SELECT * FROM messages ORDER BY id DESC").fetchall()
    return render_template("admin/messages.html",messages=rows)
@admin_bp.route("/messages/<int:msg_id>/read",methods=["POST"])
@admin_required
def message_mark_read(msg_id):
    db=get_db(); db.execute("UPDATE messages SET is_read=1 WHERE id=?",(msg_id,)); db.commit()
    return redirect(url_for("admin.messages_inbox"))
@admin_bp.route("/messages/<int:msg_id>/delete",methods=["POST"])
@admin_required
def message_delete(msg_id):
    db=get_db(); db.execute("DELETE FROM messages WHERE id=?",(msg_id,)); db.commit()
    flash("Message deleted.","success")
    return redirect(url_for("admin.messages_inbox"))
@admin_bp.route("/preview/<kind>/<int:item_id>")
@admin_required
def preview(kind,item_id):
 if kind not in KINDS or kind=="profile": abort(404)
 row=get_db().execute("SELECT * FROM content WHERE id=? AND kind=?",(item_id,kind)).fetchone()
 if not row: abort(404)
 item=row_item(row)
 return render_template("detail.html",item=item,related=[],crests=[],heading="Draft preview",preview=True)

@admin_bp.route("/media/<filename>")
@admin_required
def preview_media(filename):
 row=get_db().execute("SELECT * FROM media WHERE filename=?",(filename,)).fetchone()
 if not row: abort(404)
 return send_from_directory(
  current_app.config["MEDIA_DIR"],
  filename,
  as_attachment=(row["mime"]=="application/pdf"),
  download_name=row["original_name"] if row["mime"]=="application/pdf" else None,
 )
# Admin-only uploads use random filenames and private-by-default visibility.
