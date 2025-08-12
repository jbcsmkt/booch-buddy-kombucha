-- Booch Buddy Database Schema
-- MySQL 8.0+ compatible

-- Create database
CREATE DATABASE IF NOT EXISTS booch_buddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE booch_buddy;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    openai_api_key VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    brew_size DECIMAL(5,2) NOT NULL,
    tea_type VARCHAR(100) NOT NULL,
    tea_blend_notes TEXT,
    tea_steeping_temp DECIMAL(5,1),
    tea_steeping_time DECIMAL(4,1),
    starter_tea DECIMAL(5,2),
    sugar_used DECIMAL(5,2),
    sugar_type VARCHAR(100) NOT NULL,
    scoby_used BOOLEAN DEFAULT FALSE,
    method VARCHAR(100),
    start_ph DECIMAL(3,1),
    start_brix DECIMAL(4,1),
    end_ph DECIMAL(3,1),
    end_brix DECIMAL(4,1),
    taste_profile TEXT,
    ai_status VARCHAR(100),
    primary_ferment_complete BOOLEAN DEFAULT FALSE,
    secondary_flavoring_added TEXT,
    flavoring_amount DECIMAL(5,2),
    secondary_start_date DATE,
    secondary_end_date DATE,
    ready_to_bottle BOOLEAN DEFAULT FALSE,
    final_ph DECIMAL(3,1),
    final_brix DECIMAL(4,1),
    final_taste_notes TEXT,
    packaging_date DATE,
    packaging_type VARCHAR(100),
    pasteurized BOOLEAN DEFAULT FALSE,
    qa_testing_performed BOOLEAN DEFAULT FALSE,
    qa_notes TEXT,
    flavoring_method VARCHAR(100),
    flavor_ingredients TEXT,
    sterilized BOOLEAN DEFAULT FALSE,
    flavoring_notes TEXT,
    filtering_method VARCHAR(100),
    filtering_notes TEXT,
    date_filtered DATE,
    clarity_achieved VARCHAR(100),
    carbonation_temp DECIMAL(5,1),
    target_co2_volume DECIMAL(3,1),
    force_carb_psi INT,
    carbonation_status VARCHAR(100),
    pressurization_started BOOLEAN DEFAULT FALSE,
    carb_time_estimate INT,
    starter_volume DECIMAL(5,2),
    tea_weight DECIMAL(5,2),
    water_volume DECIMAL(5,2),
    sugar_amount DECIMAL(5,2),
    alcohol_estimate DECIMAL(3,1),
    last_entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percentage INT DEFAULT 0,
    status ENUM('needs-attention', 'in-progress', 'ready', 'complete') DEFAULT 'needs-attention',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_batch_number (user_id, batch_number),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_batch_number (batch_number)
);

-- Batch intervals table for measurements over time
CREATE TABLE IF NOT EXISTS batch_intervals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    recorded_at DATE NOT NULL,
    ph_level DECIMAL(3,1),
    brix_level DECIMAL(4,1),
    temperature DECIMAL(5,1),
    taste_notes TEXT,
    visual_notes TEXT,
    aroma_notes TEXT,
    ai_analysis TEXT,
    health_score INT CHECK (health_score >= 0 AND health_score <= 100),
    recommendations JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    INDEX idx_batch_id (batch_id),
    INDEX idx_recorded_at (recorded_at)
);

-- Enhanced measurements table
CREATE TABLE IF NOT EXISTS enhanced_measurements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    measurement_date DATE NOT NULL,
    ph DECIMAL(3,1),
    brix DECIMAL(4,1),
    temperature DECIMAL(5,1),
    specific_gravity DECIMAL(6,4),
    alcohol_content DECIMAL(4,2),
    acidity DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    INDEX idx_batch_id (batch_id),
    INDEX idx_measurement_date (measurement_date)
);

-- Recipe templates table
CREATE TABLE IF NOT EXISTS recipe_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    tea_type VARCHAR(100) NOT NULL,
    tea_amount DECIMAL(5,2) NOT NULL,
    sugar_type VARCHAR(100) NOT NULL,
    sugar_amount DECIMAL(5,2) NOT NULL,
    water_amount DECIMAL(5,2) NOT NULL,
    steep_temp DECIMAL(5,1) NOT NULL,
    steep_time DECIMAL(4,1) NOT NULL,
    fermentation_days INT NOT NULL,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_is_public (is_public),
    INDEX idx_is_favorite (is_favorite)
);

-- Batch photos table
CREATE TABLE IF NOT EXISTS batch_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    caption TEXT,
    phase VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    INDEX idx_batch_id (batch_id),
    INDEX idx_phase (phase)
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    capacity DECIMAL(8,2),
    notes TEXT,
    last_sanitized TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_active (is_active)
);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    batch_id INT,
    title VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_batch_id (batch_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_role (role)
);

-- Session table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- NOTE: No default users created for security
-- Create your first admin user via the application registration