-- Create crawler_results table for storing crawl data
CREATE TABLE IF NOT EXISTS crawler_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracked_place_id UUID REFERENCES tracked_places(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    place_name VARCHAR(255),
    rank INTEGER,
    review_count INTEGER DEFAULT 0,
    visitor_review_count INTEGER DEFAULT 0,
    blog_review_count INTEGER DEFAULT 0,
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_crawler_results_place ON crawler_results(tracked_place_id);
CREATE INDEX idx_crawler_results_keyword ON crawler_results(keyword);
CREATE INDEX idx_crawler_results_crawled_at ON crawler_results(crawled_at DESC);
CREATE INDEX idx_crawler_results_rank ON crawler_results(rank);

-- Create a composite index for common queries
CREATE INDEX idx_crawler_results_place_crawled ON crawler_results(tracked_place_id, crawled_at DESC);

-- Enable RLS
ALTER TABLE crawler_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for crawler_results
-- Admin can view all results
CREATE POLICY "Admin can view all crawler results" ON crawler_results
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

-- Users can view results for their tracked places
CREATE POLICY "Users can view their crawler results" ON crawler_results
    FOR SELECT TO authenticated
    USING (
        tracked_place_id IN (
            SELECT id FROM tracked_places 
            WHERE user_id = auth.uid()
        )
    );

-- Only system/admin can insert crawler results
CREATE POLICY "System can insert crawler results" ON crawler_results
    FOR INSERT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

-- Create a function to get latest rank for a place
CREATE OR REPLACE FUNCTION get_latest_rank(place_id UUID)
RETURNS INTEGER AS $$
    SELECT rank 
    FROM crawler_results 
    WHERE tracked_place_id = place_id 
    ORDER BY crawled_at DESC 
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Create a materialized view for weekly summaries (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_rank_summary AS
SELECT 
    tracked_place_id,
    keyword,
    DATE_TRUNC('week', crawled_at) as week,
    AVG(rank) as avg_rank,
    MIN(rank) as best_rank,
    MAX(rank) as worst_rank,
    COUNT(*) as crawl_count
FROM crawler_results
WHERE rank IS NOT NULL
GROUP BY tracked_place_id, keyword, DATE_TRUNC('week', crawled_at);

-- Create index on materialized view
CREATE INDEX idx_weekly_summary_place ON weekly_rank_summary(tracked_place_id);
CREATE INDEX idx_weekly_summary_week ON weekly_rank_summary(week DESC);