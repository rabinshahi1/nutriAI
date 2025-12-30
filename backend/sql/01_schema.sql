
-- Food-items table to store all the detail about the food that the model can inference
CREATE TABLE IF NOT EXISTS food_items (
    food_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,

    calories_kcal NUMERIC(6,2) NOT NULL,
    protein_g NUMERIC(5,2) NOT NULL,
    fat_g NUMERIC(5,2) NOT NULL,
    carbs_g NUMERIC(5,2) NOT NULL,

    vitamins JSONB,
    minerals JSONB
);

-- Food prediction to store  who click the phto and the  food name that model prideicted

CREATE TABLE food_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    food_id INTEGER REFERENCES food_items(food_id),

    confidence NUMERIC(4,2) NOT NULL,
    image_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--User schema ( the personal detals)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    height_cm NUMERIC(5,2) CHECK (height_cm > 0),
    weight_kg NUMERIC(5,2) CHECK (weight_kg > 0),
    age INT CHECK (age > 0),

    gender VARCHAR(10),

    timezone VARCHAR(50),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE user_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    contact_type VARCHAR(20) NOT NULL, 
    -- 'email', 'phone', 'whatsapp', 'push'

    contact_value VARCHAR(255) NOT NULL,

    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (contact_type, contact_value)
);


-- Here we stored the targets that a user created ....
CREATE TABLE daily_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calories_target INT NOT NULL,
    protein_target INT,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--- Here we stored the the progress of the users

CREATE TABLE daily_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    calories_consumed INT DEFAULT 0,
    protein_consumed INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, activity_date)
);

-- here we stored the streak of the users 
CREATE TABLE user_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_completed_date DATE
);
 

 -- In future we gonna use this  to notify the  user for completing the daily targets
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g. 'TARGET_COMPLETED', 'STREAK_MISSED'
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT FALSE,
    reminder_time TIME DEFAULT '20:00'
);
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    session_token TEXT NOT NULL UNIQUE,
    -- JWT id or refresh token id

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    is_revoked BOOLEAN DEFAULT FALSE
);
