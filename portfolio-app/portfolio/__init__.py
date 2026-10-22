from flask import Flask
from pathlib import Path
from config import Config
from .db import init_app as init_db
from .routes import bp
from .admin import admin_bp

def create_app(test_config=None):
    project_dir = Path(__file__).resolve().parent.parent
    app = Flask(
        __name__,
        instance_path=str(project_dir / "instance"),
        static_folder=str(project_dir / "static"),
        template_folder=str(project_dir / "templates"),
        instance_relative_config=True,
    )
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    @app.url_defaults
    def add_static_asset_version(endpoint, values):
        if endpoint == "static":
            values.setdefault("v", "19")

    Path(app.config["MEDIA_DIR"]).mkdir(parents=True, exist_ok=True)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    init_db(app)
    app.register_blueprint(bp)
    app.register_blueprint(admin_bp)
    from .security import csrf
    csrf.init_app(app)
    from .db import get_db
    with app.app_context():
        # Create only missing schema objects; existing records are preserved.
        from .db import init_schema
        init_schema(get_db())
    return app
