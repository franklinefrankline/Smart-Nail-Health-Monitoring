import hashlib
import hmac
import base64
import json
import os
import time

def get_secret_key():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("SECRET_KEY="):
                    return line.split("=", 1)[1].strip()
    return "fallback_secret_key_if_env_missing"

SECRET_KEY = get_secret_key().encode('utf-8')

def get_password_hash(password: str) -> str:
    """Uses scrypt to hash passwords"""
    salt = os.urandom(16)
    key = hashlib.scrypt(password.encode('utf-8'), salt=salt, n=16384, r=8, p=1)
    # store salt and hash together
    return f"{base64.b64encode(salt).decode('utf-8')}${base64.b64encode(key).decode('utf-8')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt_b64, key_b64 = hashed_password.split("$")
        salt = base64.b64decode(salt_b64)
        key = base64.b64decode(key_b64)
        new_key = hashlib.scrypt(plain_password.encode('utf-8'), salt=salt, n=16384, r=8, p=1)
        return hmac.compare_digest(key, new_key)
    except Exception:
        return False

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(data: dict, expires_delta_minutes: int = 60) -> str:
    """Creates a basic HMAC-SHA256 JWT"""
    header = {"alg": "HS256", "typ": "JWT"}
    
    payload = data.copy()
    payload["exp"] = int(time.time()) + (expires_delta_minutes * 60)
    
    header_enc = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_enc = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signature_input = f"{header_enc}.{payload_enc}".encode('utf-8')
    signature = hmac.new(SECRET_KEY, signature_input, hashlib.sha256).digest()
    signature_enc = base64url_encode(signature)
    
    return f"{header_enc}.{payload_enc}.{signature_enc}"

def decode_access_token(token: str) -> dict:
    """Verifies and decodes the JWT"""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_enc, payload_enc, signature_enc = parts
        
        # Verify signature
        signature_input = f"{header_enc}.{payload_enc}".encode('utf-8')
        expected_signature = hmac.new(SECRET_KEY, signature_input, hashlib.sha256).digest()
        
        if not hmac.compare_digest(base64url_decode(signature_enc), expected_signature):
            return None
            
        payload = json.loads(base64url_decode(payload_enc).decode('utf-8'))
        
        # Check expiration
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None
