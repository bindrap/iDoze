-- Tecumseh Jujutsu Gym Management Database Schema

-- Users table for authentication and basic info
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('member', 'coach', 'admin') DEFAULT 'member',
    membership_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    membership_start_date DATE,
    membership_end_date DATE,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT,
    is_on_bench BOOLEAN DEFAULT FALSE,
    bench_reason VARCHAR(500),
    bench_start_date DATE,
    bench_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Classes/Sessions table
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    instructor_id INT REFERENCES users(id),
    max_capacity INT DEFAULT 40,
    duration_minutes INT DEFAULT 60,
    skill_level ENUM('beginner', 'intermediate', 'advanced', 'all') DEFAULT 'all',
    is_recurring BOOLEAN DEFAULT TRUE,
    day_of_week TINYINT, -- 0=Sunday, 1=Monday, etc.
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Specific class sessions (instances of classes)
CREATE TABLE class_sessions (
    id SERIAL PRIMARY KEY,
    class_id INT REFERENCES classes(id),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    instructor_id INT REFERENCES users(id),
    max_capacity INT DEFAULT 40,
    current_bookings INT DEFAULT 0,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    techniques_covered TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Class bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    class_session_id INT REFERENCES class_sessions(id),
    booking_status ENUM('booked', 'checked_in', 'no_show', 'cancelled') DEFAULT 'booked',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_time TIMESTAMP NULL,
    cancellation_time TIMESTAMP NULL,
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_booking (user_id, class_session_id)
);

-- Attendance tracking
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    class_session_id INT REFERENCES class_sessions(id),
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP NULL,
    attendance_status ENUM('present', 'late', 'left_early') DEFAULT 'present',
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (user_id, class_session_id)
);

-- Newsletter/announcements
CREATE TABLE newsletters (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT REFERENCES users(id),
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE,
    target_audience ENUM('all', 'members', 'coaches') DEFAULT 'all',
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Member progress tracking
CREATE TABLE member_progress (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    belt_rank VARCHAR(50),
    stripes INT DEFAULT 0,
    promotion_date DATE,
    promoted_by INT REFERENCES users(id),
    total_classes_attended INT DEFAULT 0,
    last_attendance_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications system
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type ENUM('missed_class', 'booking_reminder', 'newsletter', 'general') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    delivery_method ENUM('email', 'sms', 'in_app') DEFAULT 'in_app',
    scheduled_time TIMESTAMP,
    sent_time TIMESTAMP NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(500),
    updated_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_membership_status ON users(membership_status);
CREATE INDEX idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX idx_class_sessions_status ON class_sessions(status);
CREATE INDEX idx_bookings_user_session ON bookings(user_id, class_session_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_attendance_user_session ON attendance(user_id, class_session_id);
CREATE INDEX idx_attendance_date ON attendance(check_in_time);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('max_class_capacity', '40', 'Maximum number of students per class'),
('utilization_target', '50', 'Target utilization rate percentage'),
('missed_class_notification_days', '14', 'Days after which to send missed class notifications'),
('booking_deadline_hours', '2', 'Hours before class when booking closes'),
('cancellation_deadline_hours', '4', 'Hours before class when cancellation is allowed');