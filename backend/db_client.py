import subprocess
import json
import os
import shutil

_DB_CONFIG = None

def get_db_env():
    global _DB_CONFIG
    if _DB_CONFIG is not None:
        return _DB_CONFIG
        
    url = os.environ.get("DATABASE_URL")
    if not url:
        # Read from .env
        env_vars = {}
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        env_vars[key.strip()] = val.strip()
        url = env_vars.get("DATABASE_URL")
                    
    if not url:
        raise Exception("DATABASE_URL not found in environment or .env")
        
    # Locate psql executable
    psql_bin = shutil.which("psql")
    if not psql_bin:
        win_psql = r"C:\Program Files\PostgreSQL\18\bin\psql.exe"
        if os.path.exists(win_psql):
            psql_bin = win_psql
        else:
            psql_bin = "psql"
    
    _DB_CONFIG = {
        "psql_bin": psql_bin,
        "url": url,
        "env": os.environ.copy()
    }
    return _DB_CONFIG

def execute_query(query: str, fetch=True):
    """Executes a query using psql. If fetch=True, expects a JSON result."""
    db_config = get_db_env()
    
    clean_query = query.strip().rstrip(';')
    if fetch:
        q_upper = clean_query.upper()
        if q_upper.startswith("INSERT") or q_upper.startswith("UPDATE") or q_upper.startswith("DELETE"):
            wrapped_query = f"WITH t AS ({clean_query}) SELECT row_to_json(t) FROM t;"
        else:
            wrapped_query = f"SELECT row_to_json(t) FROM ({clean_query}) t;"
    else:
        wrapped_query = clean_query
        
    cmd = [
        db_config.get("psql_bin", "psql"),
        "-X",
        "-d", db_config["url"],
        "-t", # tuples only (no headers)
        "-A", # unaligned output
        "-c", wrapped_query
    ]
    
    try:
        result = subprocess.run(cmd, env=db_config["env"], capture_output=True, text=True, check=True)
        if not fetch:
            return True
            
        lines = result.stdout.strip().split("\n")
        parsed = []
        for line in lines:
            if line:
                try:
                    parsed.append(json.loads(line))
                except Exception as e:
                    pass
        return parsed
    except subprocess.CalledProcessError as e:
        print(f"Database error: {e.stderr}")
        raise Exception(f"Database query failed: {e.stderr}")


