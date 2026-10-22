from flask import Blueprint, render_template, request, abort, send_from_directory, current_app
import re, time
from .db import get_db
from .utils import json_load, public_media_path, sanitize_profile
bp=Blueprint("public",__name__)
KINDS=["club","activity","project","publication","certificate","crest","gallery","skill","career","category","block"]
CONTACT_RECENT={}
MAX_PER_IP=5
WINDOW=3600
@bp.route("/contact",methods=["POST"])
def contact():
    """Server-side contact handler: validates, blocks simple spam, stores the message."""
    ip=request.remote_addr or "unknown"; now=time.time()
    recent=[t for t in CONTACT_RECENT.get(ip,[]) if now-t<WINDOW]
    CONTACT_RECENT[ip]=recent
    if len(recent)>=MAX_PER_IP:
        return {"ok":False,"error":"Too many messages from this connection. Please try again later."},429
    form=request.form
    name=(form.get("name") or "").strip(); email=(form.get("email") or "").strip(); body=(form.get("message") or "").strip()
    honeypot=(form.get("website_hp") or "").strip()
    try: elapsed=now-float(form.get("ts") or 0)
    except ValueError: elapsed=0
    error=None
    if honeypot or elapsed<3: error="Message not accepted."
    elif not (1<=len(name)<=120): error="Please provide your name (1-120 characters)."
    elif not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+",email): error="Please provide a valid email address."
    elif not (1<=len(body)<=3000): error="Please write a message (1-3000 characters)."
    if error:
        return {"ok":False,"error":error},400
    db=get_db()
    db.execute("INSERT INTO messages(name,email,body) VALUES(?,?,?)",(name,email,body)); db.commit()
    recent.append(now); CONTACT_RECENT[ip]=recent
    return {"ok":True,"message":"Thank you. Your message has been received."}
def get_items(kind, published=True):
    sql="SELECT * FROM content WHERE kind=?"; args=[kind]
    if published: sql+=" AND status='published'"
    sql+=" ORDER BY sort_order ASC,id DESC"
    return [dict(r, data=json_load(r["data"])) for r in get_db().execute(sql,args).fetchall()]
def profile_data():
    row=get_db().execute("SELECT data FROM profile WHERE id=1").fetchone()
    data=json_load(row[0] if row else "{}")
    return sanitize_profile(data)
@bp.app_context_processor
def inject_globals():
    return {"profile":profile_data(),"get_items":get_items,"current_lang":request.args.get("lang", "en")}
@bp.route("/")
def home():
    lang=request.args.get("lang","en")
    data={k:get_items(k) for k in ["club","activity","project","publication","certificate","crest","gallery","skill","career","category","block"]}
    clubs_by_id={str(club["id"]):club["title"] for club in data["club"]}
    for event in data["gallery"]:
        club_id=str(event["data"].get("club_id",""))
        event["data"]["gallery_category"]=clubs_by_id.get(club_id,"Events")
    data["gallery_categories"]=list(dict.fromkeys(event["data"]["gallery_category"] for event in data["gallery"]))
    # Distinct clubs are counted from records, not joined activity rows.
    data["counts"]={"clubs":len(data["club"]),"meetings":sum(1 for x in data["activity"] if x["data"].get("type")=="Meeting"),"events":len(data["activity"]),"projects":len(data["project"]),"publications":len(data["publication"]),"certificates":len(data["certificate"]),"crests":len(data["crest"])}
    return render_template("home.html", data=data, lang=lang)
@bp.route("/clubs/<slug>")
def club_detail(slug):
    club=next((x for x in get_items("club") if x["slug"]==slug),None)
    if not club: abort(404)
    activities=[x for x in get_items("activity") if str(x["data"].get("club_id",""))==str(club["id"])]
    crests=[x for x in get_items("crest") if str(x["data"].get("club_id",""))==str(club["id"])]
    return render_template("detail.html", item=club, related=activities, crests=crests, heading="Club")
@bp.route("/media/<filename>")
def media(filename): return public_media_path(filename)
@bp.route("/cv")
def cv():
    p=profile_data(); fn=p.get("cv_filename")
    if not fn: abort(404)
    return send_from_directory(current_app.config["MEDIA_DIR"],fn,as_attachment=True,download_name="Saifur-Rahman-CV.pdf")
@bp.route("/health")
def health(): return {"status":"ok"}
