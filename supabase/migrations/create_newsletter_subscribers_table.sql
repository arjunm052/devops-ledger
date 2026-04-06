CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  confirmed boolean DEFAULT false
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
