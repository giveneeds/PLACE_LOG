# Supabase Edge Functions

## Crawler Scheduler

This edge function is designed to be called by Supabase's cron scheduler to trigger the crawler API at regular intervals.

### Setup

1. Deploy the function:
```bash
supabase functions deploy crawler-scheduler
```

2. Set the required environment variables:
```bash
supabase secrets set CRAWLER_API_URL=https://your-domain.com/api/crawler/run
supabase secrets set CRAWLER_API_KEY=your-secure-api-key
```

3. Create cron jobs in Supabase dashboard or via SQL:
```sql
-- Schedule crawler to run at 11:20 AM KST (2:20 AM UTC)
SELECT cron.schedule(
  'crawler-morning',
  '20 2 * * *',  -- 2:20 AM UTC = 11:20 AM KST
  $$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/crawler-scheduler',
    '{}',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- Schedule crawler to run at 1:50 PM KST (4:50 AM UTC)
SELECT cron.schedule(
  'crawler-afternoon',
  '50 4 * * *',  -- 4:50 AM UTC = 1:50 PM KST
  $$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/crawler-scheduler',
    '{}',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- To remove old schedule if exists
SELECT cron.unschedule('crawler-daily');
```

### Testing

Test the function locally:
```bash
supabase functions serve crawler-scheduler
```

Then make a request:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/crawler-scheduler' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

### Monitoring

- Check function logs in Supabase dashboard
- Monitor webhook notifications for crawler status
- Review crawler_results table for data integrity