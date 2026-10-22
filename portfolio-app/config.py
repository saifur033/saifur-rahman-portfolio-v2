from pathlib import Path
import os
import secrets
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
# Optional override for hosts with a persistent disk (e.g. Render: /data).
# Everything stateful (database, secret key, uploads) lives in this one tree.
DATA_DIR = Path(os.environ.get("PORTFOLIO_DATA_DIR", "")) if os.environ.get("PORTFOLIO_DATA_DIR") else BASE_DIR / "instance"
INSTANCE_DIR = DATA_DIR
MEDIA_DIR = DATA_DIR / "media"
DB_PATH = DATA_DIR / "portfolio.sqlite3"

def _load_secret_key():
    """Prefer the environment variable; otherwise persist a random key so
    admin sessions survive application restarts. The key file lives outside
    version control (instance/ is gitignored) and is never exposed to users."""
    env = os.environ.get("PORTFOLIO_SECRET_KEY")
    if env:
        return env
    key_file = INSTANCE_DIR / "secret_key"
    try:
        INSTANCE_DIR.mkdir(parents=True, exist_ok=True)
        if key_file.exists():
            value = key_file.read_text().strip()
            if value:
                return value
        value = secrets.token_hex(32)
        key_file.write_text(value)
        try:
            os.chmod(key_file, 0o600)
        except OSError:
            pass
        return value
    except OSError:
        return secrets.token_hex(32)

class Config:
    SECRET_KEY = _load_secret_key()
    DATABASE = str(DB_PATH)
    MEDIA_DIR = str(MEDIA_DIR)
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("PORTFOLIO_HTTPS", "0") == "1"
    WTF_CSRF_TIME_LIMIT = 3600
