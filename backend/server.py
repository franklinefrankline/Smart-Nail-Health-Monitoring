import http.server
import socketserver
import socket
import json
import email
from email.parser import BytesParser
import os
import shutil
import smtplib
from email.message import EmailMessage
from urllib.parse import quote
from datetime import datetime
import db_client
import security

PORT = 8000
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_env_value(key, default=""):
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return default
    with open(env_path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                name, value = line.split("=", 1)
                if name.strip() == key:
                    return value.strip()
    return default

def send_password_reset_email(recipient, token):
    smtp_host = get_env_value("SMTP_HOST")
    if not smtp_host:
        raise RuntimeError("Email delivery is not configured. Add SMTP_HOST and SMTP settings to backend/.env.")

    smtp_port = int(get_env_value("SMTP_PORT", "587"))
    smtp_user = get_env_value("SMTP_USER")
    smtp_password = get_env_value("SMTP_PASSWORD")
    sender = get_env_value("SMTP_FROM", smtp_user or "no-reply@smartnail.local")
    base_url = get_env_value("APP_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
    reset_url = f"{base_url}/forgot.html?token={quote(token)}"

    message = EmailMessage()
    message["Subject"] = "Smart Nail password reset"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        "We received a request to reset your Smart Nail password.\n\n"
        f"Open this link within 15 minutes to choose a new password:\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as smtp:
        if get_env_value("SMTP_USE_TLS", "true").lower() == "true":
            smtp.starttls()
        if smtp_user:
            smtp.login(smtp_user, smtp_password)
        smtp.send_message(message)

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    
    def address_string(self):
        # Fast direct IP string without DNS reverse lookup delay
        return str(self.client_address[0])
        
    def __init__(self, *args, **kwargs):
        # Set the directory to serve static files from (the frontend folder)
        super().__init__(*args, directory=os.path.join(os.path.dirname(__file__), '..', 'frontend'), **kwargs)
        
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_cors_headers()
        self.end_headers()
        
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
        
    def get_user_from_token(self):
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split(' ')[1]
        payload = security.decode_access_token(token)
        if not payload:
            return None
        email = payload.get("sub")
        users = db_client.execute_query(f"SELECT id, name, email, role FROM users WHERE email = '{email}' LIMIT 1")
        return users[0] if users else None

    def handle_register(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        email = data.get('email', '').replace("'", "''")
        name = data.get('name', '').replace("'", "''")
        password = data.get('password')
        
        if not email or not password or not name:
            return self.send_json({"detail": "Missing fields"}, 400)
            
        # check if exists
        existing = db_client.execute_query(f"SELECT id FROM users WHERE email='{email}'")
        if existing:
            return self.send_json({"detail": "Email already registered"}, 400)
            
        hashed_pw = security.get_password_hash(password)
        query = f"""
            INSERT INTO users (name, email, password_hash, role) 
            VALUES ('{name}', '{email}', '{hashed_pw}', 'user') 
            RETURNING id, name, email, role;
        """
        result = db_client.execute_query(query)
        self.send_json({"success": True, "message": "Registered successfully", "data": result[0]})
        
    def handle_login(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        email = data.get('email', '').strip()
        clean_email = email.replace("'", "''")
        password = data.get('password', '')
        
        users = db_client.execute_query(f"SELECT * FROM users WHERE LOWER(email)=LOWER('{clean_email}')")
        if not users or not security.verify_password(password, users[0]['password_hash']):
            return self.send_json({"detail": "Invalid email or password"}, 401)
            
        user = users[0]
        token = security.create_access_token({"sub": user['email']})
        
        self.send_json({
            "success": True, 
            "data": {
                "access_token": token,
                "user": {"id": user['id'], "email": user['email'], "name": user['name'], "role": user.get('role', 'user')}
            }
        })

    def handle_forgot_password(self):
        content_length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(content_length).decode('utf-8'))
        email = data.get('email', '').strip().lower()
        if not email:
            return self.send_json({"detail": "Email is required"}, 400)

        safe_email = email.replace("'", "''")
        users = db_client.execute_query(f"SELECT email FROM users WHERE LOWER(email)=LOWER('{safe_email}') LIMIT 1")
        if not users:
            return self.send_json({"success": True, "message": "If an account exists, a reset link will be sent."})

        token = security.create_access_token({"sub": users[0]['email'], "purpose": "password_reset"}, 15)
        send_password_reset_email(users[0]['email'], token)
        self.send_json({"success": True, "message": "Password reset link sent. Check your email."})

    def handle_reset_password(self):
        content_length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(content_length).decode('utf-8'))
        token = data.get('token', '')
        password = data.get('password', '')
        payload = security.decode_access_token(token)
        if not payload or payload.get('purpose') != 'password_reset' or not payload.get('sub'):
            return self.send_json({"detail": "This reset link is invalid or expired."}, 400)
        if len(password) < 8:
            return self.send_json({"detail": "Password must be at least 8 characters."}, 400)

        email = str(payload['sub']).replace("'", "''")
        password_hash = security.get_password_hash(password).replace("'", "''")
        result = db_client.execute_query(
            f"UPDATE users SET password_hash='{password_hash}', updated_at=CURRENT_TIMESTAMP "
            f"WHERE LOWER(email)=LOWER('{email}') RETURNING id"
        )
        if not result:
            return self.send_json({"detail": "This reset link is invalid or expired."}, 400)
        self.send_json({"success": True, "message": "Password updated successfully."})
        
    def handle_analysis(self):
        user = self.get_user_from_token()
        if not user:
            return self.send_json({"detail": "Unauthorized"}, 401)
            
        # Parse multipart form data without cgi
        content_type = self.headers.get('Content-Type')
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        msg = BytesParser().parsebytes(f"Content-Type: {content_type}\r\n\r\n".encode('utf-8') + post_data)
        
        metrics_raw = b"{}"
        file_item = None
        
        if msg.is_multipart():
            for part in msg.get_payload():
                if part.get_param('name', header='content-disposition') == 'metrics':
                    metrics_raw = part.get_payload(decode=True)
                elif part.get_param('name', header='content-disposition') == 'file':
                    file_item = part.get_payload(decode=True)
        
        metrics = json.loads(metrics_raw.decode('utf-8')) if metrics_raw else {}
        
        # Save image
        if file_item:
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_nail.jpg"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, 'wb') as f:
                f.write(file_item)
        else:
            filepath = "no_image.jpg"
            
        # Use frontend metrics or defaults
        brightness = float(metrics.get("brightness", 150))
        contrast = float(metrics.get("contrast", 50))
        color_variation = float(metrics.get("color_variation", 30))
        edge_density = float(metrics.get("edge_density", 5))
        texture = float(metrics.get("texture", 10))
        
        # Simple scoring logic based on metrics
        health_score = 100
        recommendations = []
        
        if brightness < 100:
            health_score -= 15
            recommendations.append("Nail appears dark; ensure good lighting or monitor for discoloration.")
        if contrast < 30:
            health_score -= 10
            recommendations.append("Low contrast detected, possible dullness.")
        if edge_density > 15:
            health_score -= 20
            recommendations.append("High edge density might indicate ridges or pitting.")
            
        risk_level = "Low"
        if health_score < 60:
            risk_level = "High"
            recommendations.append("High risk visual indicators detected. Monitor closely.")
        elif health_score < 80:
            risk_level = "Moderate"
            recommendations.append("Moderate risk visual indicators detected.")
            
        moisture = "Normal"
        if brightness > 200 and contrast > 60:
            moisture = "High"
        elif brightness < 120:
            moisture = "Low"
            
        if not recommendations:
            recommendations.append("Nails appear visually healthy.")
            
        # Save to DB
        rec_json = json.dumps(recommendations).replace("'", "''")
        query = f"""
            INSERT INTO analysis_reports 
            (user_id, image_path, health_score, risk_level, brightness, contrast, color_variation, edge_density, texture_score, moisture_indicator, recommendation)
            VALUES ({user['id']}, '{filepath}', {health_score}, '{risk_level}', {brightness}, {contrast}, {color_variation}, {edge_density}, {texture}, '{moisture}', '{rec_json}')
            RETURNING id;
        """
        res = db_client.execute_query(query)
        report_id = res[0]['id']
        
        self.send_json({
            "success": True,
            "data": {
                "id": report_id,
                "health_score": health_score,
                "risk_level": risk_level,
                "moisture_indicator": moisture,
                "recommendation": "\n".join(recommendations),
                "image_path": filepath
            }
        })
        
    def handle_get_reports(self):
        user = self.get_user_from_token()
        if not user:
            return self.send_json({"detail": "Unauthorized"}, 401)
            
        reports = db_client.execute_query(f"SELECT * FROM analysis_reports WHERE user_id={user['id']} ORDER BY created_at DESC")
        self.send_json({"success": True, "data": reports})

    def handle_admin_stats(self):
        user = self.get_user_from_token()
        if not user or user['role'] != 'admin':
            return self.send_json({"detail": "Forbidden"}, 403)
            
        users_count = db_client.execute_query("SELECT COUNT(*) as count FROM users")[0]['count']
        reports_count = db_client.execute_query("SELECT COUNT(*) as count FROM analysis_reports")[0]['count']
        
        self.send_json({"success": True, "data": {"users": users_count, "reports": reports_count}})

    def handle_admin_users(self):
        user = self.get_user_from_token()
        if not user or user['role'] != 'admin':
            return self.send_json({"detail": "Forbidden"}, 403)
        
        users = db_client.execute_query("SELECT id, name, email, password_hash, role, created_at FROM users ORDER BY id DESC")
        self.send_json({"success": True, "data": users})
        
    def handle_admin_reports(self):
        user = self.get_user_from_token()
        if not user or user['role'] != 'admin':
            return self.send_json({"detail": "Forbidden"}, 403)
            
        reports = db_client.execute_query("""
            SELECT r.*, u.name as user_name 
            FROM analysis_reports r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        """)
        self.send_json({"success": True, "data": reports})

    def handle_get_report(self, report_id):
        user = self.get_user_from_token()
        if not user:
            return self.send_json({"detail": "Unauthorized"}, 401)
            
        reports = db_client.execute_query(f"SELECT * FROM analysis_reports WHERE id={report_id} AND user_id={user['id']}")
        if not reports:
            return self.send_json({"detail": "Report not found"}, 404)
            
        self.send_json({"success": True, "data": reports[0]})

    def handle_download_report(self, report_id):
        user = self.get_user_from_token()
        if not user:
            return self.send_json({"detail": "Unauthorized"}, 401)
            
        reports = db_client.execute_query(f"SELECT * FROM analysis_reports WHERE id={report_id}")
        if not reports or (reports[0]['user_id'] != user['id'] and user.get('role') != 'admin'):
            return self.send_json({"detail": "Report not found"}, 404)
            
        r = reports[0]
        content = f"""SMART NAIL HEALTH MONITORING SYSTEM - REPORT
==================================================
Report ID: {r.get('id')}
Date: {r.get('created_at', 'N/A')}
Patient / User ID: {r.get('user_id')}

RESULTS & METRICS
-----------------
Health Score: {r.get('health_score')}/100
Risk Level: {r.get('risk_level')}
Moisture Indicator: {r.get('moisture_indicator', 'Normal')}

RECOMMENDATIONS & CLINICAL NOTES
--------------------------------
{r.get('recommendation', 'No specific abnormalities detected.')}

==================================================
Generated automatically by Smart Nail Health Monitoring System.
"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Disposition', f'attachment; filename="NailHealth_Report_{report_id}.txt"')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(content.encode('utf-8'))

    def do_POST(self):
        try:
            if self.path == '/api/auth/register':
                self.handle_register()
            elif self.path == '/api/auth/login':
                self.handle_login()
            elif self.path == '/api/auth/forgot-password':
                self.handle_forgot_password()
            elif self.path == '/api/auth/reset-password':
                self.handle_reset_password()
            elif self.path == '/api/analysis':
                self.handle_analysis()
            else:
                self.send_json({"detail": "Not found"}, 404)
        except Exception as e:
            self.send_json({"detail": str(e)}, 500)
            
    def do_GET(self):
        try:
            if self.path == '/api/analysis/history' or self.path == '/api/reports':
                self.handle_get_reports()
            elif self.path.startswith('/api/reports/') and self.path.endswith('/download'):
                parts = self.path.split('/')
                report_id = parts[3]
                self.handle_download_report(report_id)
            elif self.path.startswith('/api/analysis/'):
                report_id = self.path.split('/')[-1]
                if report_id.isdigit():
                    self.handle_get_report(report_id)
                else:
                    self.send_json({"detail": "Not found"}, 404)
            elif self.path == '/api/reports':
                self.handle_get_reports()
            elif self.path == '/api/admin/stats':
                self.handle_admin_stats()
            elif self.path == '/api/admin/users':
                self.handle_admin_users()
            elif self.path == '/api/admin/reports':
                self.handle_admin_reports()
            elif self.path.startswith('/api/uploads/'):
                filepath = self.path.replace('/api/', '')
                if os.path.exists(filepath):
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_cors_headers()
                    self.end_headers()
                    with open(filepath, 'rb') as f:
                        self.wfile.write(f.read())
                else:
                    self.send_json({"detail": "Not found"}, 404)
            elif self.path.startswith('/api/'):
                self.send_json({"detail": "Not found"}, 404)
            else:
                # Fallback to SimpleHTTPRequestHandler for frontend static files
                if self.path == '/':
                    self.path = '/index.html'
                super().do_GET()
        except Exception as e:
            self.send_json({"detail": str(e)}, 500)

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True
    daemon_threads = True

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()

if __name__ == "__main__":
    try:
        httpd = ThreadedTCPServer(("::", PORT), CORSRequestHandler)
    except Exception:
        ThreadedTCPServer.address_family = socket.AF_INET
        httpd = ThreadedTCPServer(("", PORT), CORSRequestHandler)
        
    print(f"Serving at port {PORT} with Standard Library only")
    httpd.serve_forever()
