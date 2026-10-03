-- ==========================================================
-- REIGN CITY SECURITY TEAM VOTING SYSTEM
-- Supabase PostgreSQL Schema & Seed Migration Script
-- ==========================================================

-- Enable pgcrypto extension if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. POSITIONS TABLE
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VOTERS TABLE
CREATE TABLE IF NOT EXISTS voters (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    first_name VARCHAR(100) UNIQUE NOT NULL,
    allowed BOOLEAN DEFAULT TRUE,
    has_voted BOOLEAN DEFAULT FALSE,
    device_hash VARCHAR(256),
    voted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) UNIQUE NOT NULL,
    image_url TEXT,
    eligible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CANDIDATE_POSITIONS (Many-to-Many)
CREATE TABLE IF NOT EXISTS candidate_positions (
    candidate_id INT REFERENCES candidates(id) ON DELETE CASCADE,
    position_id INT REFERENCES positions(id) ON DELETE CASCADE,
    PRIMARY KEY (candidate_id, position_id)
);

-- 5. VOTES TABLE
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    voter_id INT NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    position_id INT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_voter_position UNIQUE (voter_id, position_id)
);

-- 6. SYSTEM STATE TABLE (Singleton)
CREATE TABLE IF NOT EXISTS system_state (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    voting_open BOOLEAN DEFAULT TRUE,
    results_released BOOLEAN DEFAULT FALSE,
    voting_closed_at TIMESTAMPTZ,
    results_released_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FINAL RESULTS TABLE
CREATE TABLE IF NOT EXISTS final_results (
    id SERIAL PRIMARY KEY,
    position_id INT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    winner_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    vote_count INT NOT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_position_winner UNIQUE (position_id, winner_id)
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_results ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to positions, candidates, system state, and final results
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read positions') THEN
        CREATE POLICY "Allow public read positions" ON positions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read candidates') THEN
        CREATE POLICY "Allow public read candidates" ON candidates FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read candidate_positions') THEN
        CREATE POLICY "Allow public read candidate_positions" ON candidate_positions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read system_state') THEN
        CREATE POLICY "Allow public read system_state" ON system_state FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read final_results') THEN
        CREATE POLICY "Allow public read final_results" ON final_results FOR SELECT USING (true);
    END IF;
END $$;

-- Note on voters and votes: Direct access from browser client (anon key) is restricted.
-- All vote casting, verification, and admin controls run via Next.js API routes using service_role,
-- which securely bypasses RLS on the server.

-- ==========================================================
-- ATOMIC TRANSACTION FUNCTION FOR VOTING
-- ==========================================================
CREATE OR REPLACE FUNCTION submit_votes_atomic(
    p_voter_id INT,
    p_device_hash TEXT,
    p_votes JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voting_open BOOLEAN;
    v_has_voted BOOLEAN;
    v_allowed BOOLEAN;
    v_item JSONB;
BEGIN
    -- Check if voting is open
    SELECT voting_open INTO v_voting_open FROM system_state WHERE id = 1;
    IF v_voting_open IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voting is currently closed.');
    END IF;

    -- Lock and verify voter record
    SELECT allowed, has_voted INTO v_allowed, v_has_voted
    FROM voters
    WHERE id = p_voter_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voter not found.');
    END IF;

    IF v_allowed IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voter is not authorized to vote.');
    END IF;

    IF v_has_voted IS TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already voted.');
    END IF;

    -- Insert individual votes
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_votes)
    LOOP
        INSERT INTO votes (voter_id, position_id, candidate_id)
        VALUES (
            p_voter_id,
            (v_item->>'position_id')::INT,
            (v_item->>'candidate_id')::INT
        );
    END LOOP;

    -- Mark voter as voted
    UPDATE voters
    SET has_voted = TRUE,
        device_hash = COALESCE(device_hash, p_device_hash),
        voted_at = NOW()
    WHERE id = p_voter_id;

    RETURN jsonb_build_object('success', true, 'message', 'Your votes have been recorded successfully.');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ==========================================================
-- SEED INITIAL DATA
-- ==========================================================

-- Initialize system state (Default: Voting Open)
INSERT INTO system_state (id, voting_open, results_released)
VALUES (1, TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Seed Positions (7 Positions)
INSERT INTO positions (id, name, description) VALUES
(1, 'team_lead', 'Overall leader of the Reign City Security Team. Answerable to the patron. Oversees all other leads and acts as operations manager for indoor and outdoor activities.'),
(2, 'program_coordinator', 'Responsible for organizing events, coordinating programs, and ensuring smooth execution of team activities.'),
(3, 'secretary', 'Performs secretariat functions including documentation, assisting discussions, and supporting internal voting processes.'),
(4, 'treasurer', 'Responsible for financial oversight, budget generation, advisory on spending, safe keeping of funds, and ensuring financial discipline.'),
(5, 'events_coordinator', 'Responsible for planning, logistical organization, venue preparation, hospitality, and seamless execution of all team events and gatherings.'),
(6, 'welfare', 'Championing team wellness, personal support, member care, celebrating milestones and birthdays, and maintaining team camaraderie.'),
(7, 'logistics_and_equipment_custodian', 'Entrusted with safeguarding team equipment, uniforms, inventory tracking, and supply distribution.')
ON CONFLICT (name) DO NOTHING;

SELECT setval('positions_id_seq', (SELECT MAX(id) FROM positions));

-- Seed Voters (22 Registered Voters)
INSERT INTO voters (full_name, first_name, allowed, has_voted) VALUES
('Allan', 'Allan', TRUE, FALSE),
('Anitah', 'Anitah', TRUE, FALSE),
('Barchi', 'Barchi', TRUE, FALSE),
('Brandon', 'Brandon', TRUE, FALSE),
('Christian', 'Christian', TRUE, FALSE),
('Clinton', 'Clinton', TRUE, FALSE),
('Denno', 'Denno', TRUE, FALSE),
('Dorcas', 'Dorcas', TRUE, FALSE),
('Fortunate', 'Fortunate', TRUE, FALSE),
('Hope', 'Hope', TRUE, FALSE),
('Judah', 'Judah', TRUE, FALSE),
('Konzolo', 'Konzolo', TRUE, FALSE),
('Max', 'Max', TRUE, FALSE),
('Nancy', 'Nancy', TRUE, FALSE),
('Patron', 'Patron', TRUE, FALSE),
('Phinehas', 'Phinehas', TRUE, FALSE),
('Sam', 'Sam', TRUE, FALSE),
('Stan', 'Stan', TRUE, FALSE),
('Teddy', 'Teddy', TRUE, FALSE),
('Terrence', 'Terrence', TRUE, FALSE),
('Trevor', 'Trevor', TRUE, FALSE),
('Wesley', 'Wesley', TRUE, FALSE)
ON CONFLICT (first_name) DO NOTHING;

-- Seed Candidates (13 Eligible Candidates)
INSERT INTO candidates (id, full_name, eligible) VALUES
(1, 'Konzolo', TRUE),
(2, 'Fortunate', TRUE),
(3, 'Teddy', TRUE),
(4, 'Terrence', TRUE),
(5, 'Trevor', TRUE),
(6, 'Anitah', TRUE),
(7, 'Wesley', TRUE),
(8, 'Dorcas', TRUE),
(9, 'Christian', TRUE),
(10, 'Sam', TRUE),
(11, 'Hope', TRUE),
(12, 'Nancy', TRUE),
(13, 'Barchi', TRUE)
ON CONFLICT (full_name) DO NOTHING;

SELECT setval('candidates_id_seq', (SELECT MAX(id) FROM candidates));

-- Associate all 13 candidates with all 4 positions
INSERT INTO candidate_positions (candidate_id, position_id)
SELECT c.id, p.id
FROM candidates c
CROSS JOIN positions p
ON CONFLICT DO NOTHING;
