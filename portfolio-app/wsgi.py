"""WSGI entry point for production hosting (Render, Railway, PythonAnywhere, etc.).

Usage on the host:  gunicorn wsgi:app   (Linux)  or  waitress-serve --host=0.0.0.0 --port=$PORT wsgi:app
The application reads PORT, PORTFOLIO_SECRET_KEY and PORTFOLIO_HTTPS from the environment.
"""
import os
from app import app

if __name__ == "__main__":
    # Fallback for platforms that run `python wsgi.py` directly.
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
