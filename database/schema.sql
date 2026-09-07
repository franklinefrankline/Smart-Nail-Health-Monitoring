CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analysis_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_path VARCHAR(255) NOT NULL,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    risk_level VARCHAR(50) NOT NULL,
    brightness FLOAT,
    contrast FLOAT,
    color_variation FLOAT,
    edge_density FLOAT,
    texture_score FLOAT,
    moisture_indicator VARCHAR(50),
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_reports_user_id ON analysis_reports(user_id);
CREATE INDEX idx_reports_created_at ON analysis_reports(created_at);
