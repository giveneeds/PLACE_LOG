-- Create keywords table
CREATE TABLE IF NOT EXISTS keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create place_tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS place_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracked_place_id UUID REFERENCES tracked_places(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tracked_place_id, tag_id)
);

-- Add keyword_id to tracked_places table
ALTER TABLE tracked_places 
ADD COLUMN keyword_id UUID REFERENCES keywords(id),
ADD COLUMN period_start DATE,
ADD COLUMN period_end DATE;

-- Create index for better performance
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_place_tags_place ON place_tags(tracked_place_id);
CREATE INDEX idx_place_tags_tag ON place_tags(tag_id);
CREATE INDEX idx_tracked_places_keyword ON tracked_places(keyword_id);

-- Enable RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for keywords (admin only)
CREATE POLICY "Admin can manage keywords" ON keywords
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

-- RLS policies for tags (admin can manage, others can read)
CREATE POLICY "Anyone can read tags" ON tags
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admin can manage tags" ON tags
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

-- RLS policies for place_tags (admin only)
CREATE POLICY "Admin can manage place_tags" ON place_tags
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));