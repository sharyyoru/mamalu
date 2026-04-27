-- Site Content Configuration Table
-- Stores configurable content for the website (homepage, etc.)

CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read site content
CREATE POLICY "Anyone can read site content"
  ON site_content FOR SELECT
  USING (true);

-- Only authenticated admins can update site content
CREATE POLICY "Admins can update site content"
  ON site_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin', 'super_admin')
    )
    OR auth.jwt()->>'email' = 'wilson@mutant.ae'
  );

CREATE POLICY "Admins can modify site content"
  ON site_content FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin', 'super_admin')
    )
    OR auth.jwt()->>'email' = 'wilson@mutant.ae'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin', 'super_admin')
    )
    OR auth.jwt()->>'email' = 'wilson@mutant.ae'
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_content_id ON site_content(id);

-- Insert default homepage content
INSERT INTO site_content (id, content)
VALUES (
  'homepage',
  '{
    "heroImages": [
      "/images/1-2.jpg",
      "/images/File_010.jpeg",
      "/images/PHOTO-2025-12-02-18-26-42 (5).jpg",
      "/images/Mamalou Kitchen - 165.jpg",
      "/images/File_001.jpeg",
      "/images/Mamalou Kitchen - 67.jpg",
      "/images/Mamalou Kitchen - 78.jpg",
      "/images/Mamalou Kitchen - 103.jpg",
      "/images/Mamalou Kitchen - 193.jpg",
      "/images/Mamalou Kitchen - 220.jpg",
      "/shared-files/Kids high res pics/_C3A5778 (1).jpg",
      "/shared-files/Kids high res pics/_C3A5818.jpg",
      "/shared-files/Kids high res pics/_C3A5906 (1).jpg"
    ],
    "serviceButtons": [
      {
        "id": "mini-chef",
        "title": "Mini Chef",
        "href": "/minichef",
        "backgroundImage": "/images/taco tuesday.jpg",
        "textColor": "#1c1917"
      },
      {
        "id": "big-chef",
        "title": "Big Chef",
        "href": "/bigchef",
        "backgroundImage": "/images/_C3A5493.jpg",
        "textColor": "#1c1917"
      },
      {
        "id": "rentals",
        "title": "Rentals",
        "href": "/book/rentals",
        "backgroundImage": "/images/_C3A0998.JPG",
        "textColor": "#1c1917"
      },
      {
        "id": "eazy-freezy",
        "title": "Eazy Freezy",
        "href": "/products",
        "backgroundImage": "/images/chicken-alfredo-lasagna-roll-ups-recipe-4.jpg",
        "textColor": "#ff7f5c"
      }
    ],
    "galleryImages": [
      "/images/PHOTO-2025-12-02-18-26-42.jpg",
      "/images/deep dish pizza.jpg",
      "/images/File_017.jpeg.jpg"
    ],
    "lifeAtMamaluTitle": "Life at Mamalu",
    "ourStoryTitle": "OUR STORY",
    "ourStoryParagraph1": "Mamalu Kitchen was inspired by her 3 boys and the need to help fellow mums and families simplify their day-to-day lives without having to worry about feeding their family fuss-free healthy food.",
    "ourStoryParagraph2": "Mamalu Kitchen is creating a cooking movement under the slogan #feedingfamilies.",
    "ourStoryButtonText": "Our Story",
    "founderImage": "/images/IMG_4756_edited.jpg",
    "founderName": "Lama - Founder of Mamalu Kitchen",
    "stats": [
      { "value": "2000+", "label": "Happy Kids" },
      { "value": "500+", "label": "Classes Held" },
      { "value": "4.9", "label": "Star Rating" },
      { "value": "5+", "label": "Years Experience" }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
