-- ===========================================
-- MARKETING SYSTEM SCHEMA
-- Campaigns, Discounts, Referrals
-- ===========================================

-- ===========================================
-- CAMPAIGN TYPES & STATUSES
-- ===========================================
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE campaign_type AS ENUM ('email', 'sms', 'push', 'whatsapp');
CREATE TYPE discount_type AS ENUM ('percent', 'fixed');
CREATE TYPE discount_status AS ENUM ('active', 'paused', 'exhausted', 'expired');
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired', 'cancelled');

-- ===========================================
-- MARKETING CAMPAIGNS
-- ===========================================
CREATE TABLE public.marketing_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type campaign_type NOT NULL DEFAULT 'email',
    status campaign_status DEFAULT 'draft',
    
    -- Email Content
    subject TEXT,
    preview_text TEXT,
    html_content TEXT,
    json_content JSONB, -- For email builder state
    
    -- Audience Targeting
    audience_filter JSONB DEFAULT '{}', -- Stores filter criteria
    audience_name TEXT, -- Human readable name
    estimated_recipients INTEGER DEFAULT 0,
    
    -- Schedule
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Date Range (for recurring or limited campaigns)
    start_date DATE,
    end_date DATE,
    
    -- Stats
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Linked discount (optional)
    discount_id UUID,
    
    -- Metadata
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage campaigns" ON public.marketing_campaigns
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- ===========================================
-- CAMPAIGN RECIPIENTS (Tracking)
-- ===========================================
CREATE TABLE public.campaign_recipients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    
    -- Status
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    
    -- Conversion tracking
    converted_at TIMESTAMPTZ,
    conversion_value DECIMAL(10,2),
    conversion_order_id UUID REFERENCES public.orders(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage recipients" ON public.campaign_recipients
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- ===========================================
-- DISCOUNT CODES
-- ===========================================
CREATE TABLE public.discount_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Discount Value
    type discount_type NOT NULL DEFAULT 'percent',
    value DECIMAL(10,2) NOT NULL, -- Percentage or fixed amount
    
    -- Limits
    min_order_amount DECIMAL(10,2), -- Minimum order to apply
    max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
    usage_limit INTEGER, -- Total uses allowed (NULL = unlimited)
    usage_per_customer INTEGER DEFAULT 1, -- Uses per customer
    
    -- Usage Stats
    total_used INTEGER DEFAULT 0,
    total_revenue_generated DECIMAL(10,2) DEFAULT 0,
    
    -- Status & Validity
    status discount_status DEFAULT 'active',
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Targeting
    applies_to TEXT, -- 'all', 'classes', 'products', 'bookings'
    applies_to_ids TEXT[], -- Specific product/class IDs
    customer_segments TEXT[], -- Customer segments that can use
    first_order_only BOOLEAN DEFAULT FALSE,
    
    -- Linked Campaign
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    
    -- Metadata
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage discounts" ON public.discount_codes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

CREATE POLICY "Users can view active discounts" ON public.discount_codes
    FOR SELECT USING (status = 'active');

-- ===========================================
-- DISCOUNT USAGE TRACKING
-- ===========================================
CREATE TABLE public.discount_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discount_id UUID REFERENCES public.discount_codes(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.class_bookings(id) ON DELETE SET NULL,
    
    discount_amount DECIMAL(10,2) NOT NULL,
    order_total DECIMAL(10,2),
    
    used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view usage" ON public.discount_usage
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

CREATE POLICY "Users can view own usage" ON public.discount_usage
    FOR SELECT USING (auth.uid() = profile_id);

-- ===========================================
-- REFERRAL PROGRAM SETTINGS
-- ===========================================
CREATE TABLE public.referral_program (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Rewards
    referrer_reward_type discount_type DEFAULT 'fixed',
    referrer_reward_value DECIMAL(10,2) DEFAULT 100, -- What referrer gets
    referee_reward_type discount_type DEFAULT 'fixed',
    referee_reward_value DECIMAL(10,2) DEFAULT 100, -- What new customer gets
    
    -- Conditions
    min_purchase_amount DECIMAL(10,2), -- Min purchase to trigger referral
    reward_expires_days INTEGER DEFAULT 90, -- Days until reward expires
    max_referrals_per_user INTEGER, -- NULL = unlimited
    
    -- Description
    referrer_reward_description TEXT DEFAULT 'AED 100 credit',
    referee_reward_description TEXT DEFAULT 'AED 100 off your first order',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referral_program ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view program" ON public.referral_program
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage program" ON public.referral_program
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- ===========================================
-- REFERRALS TRACKING
-- ===========================================
CREATE TABLE public.referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    referee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    referee_email TEXT,
    
    -- Referral code used
    referral_code TEXT NOT NULL,
    
    -- Status
    status referral_status DEFAULT 'pending',
    
    -- Rewards
    referrer_reward DECIMAL(10,2),
    referee_reward DECIMAL(10,2),
    referrer_rewarded_at TIMESTAMPTZ,
    referee_rewarded_at TIMESTAMPTZ,
    
    -- Conversion
    converted_order_id UUID REFERENCES public.orders(id),
    converted_at TIMESTAMPTZ,
    conversion_value DECIMAL(10,2),
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Staff can manage referrals" ON public.referrals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- ===========================================
-- CUSTOMER CREDITS (for referral rewards, etc.)
-- ===========================================
CREATE TABLE public.customer_credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Credit Details
    amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    
    -- Source
    source TEXT NOT NULL, -- 'referral', 'promotion', 'refund', 'manual'
    source_id UUID, -- referral_id, campaign_id, order_id, etc.
    description TEXT,
    
    -- Validity
    expires_at TIMESTAMPTZ,
    
    -- Usage
    used_at TIMESTAMPTZ,
    used_order_id UUID REFERENCES public.orders(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.customer_credits
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Staff can manage credits" ON public.customer_credits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- ===========================================
-- EMAIL TEMPLATES
-- ===========================================
CREATE TABLE public.email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'marketing', -- 'marketing', 'transactional', 'notification'
    
    -- Content
    subject TEXT NOT NULL,
    preview_text TEXT,
    html_content TEXT NOT NULL,
    json_content JSONB, -- For email builder state
    
    -- Variables available
    available_variables TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_campaigns_type ON public.marketing_campaigns(type);
CREATE INDEX idx_campaigns_scheduled ON public.marketing_campaigns(scheduled_at);
CREATE INDEX idx_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_recipients_email ON public.campaign_recipients(email);
CREATE INDEX idx_discounts_code ON public.discount_codes(code);
CREATE INDEX idx_discounts_status ON public.discount_codes(status);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_credits_profile ON public.customer_credits(profile_id);

-- ===========================================
-- TRIGGERS
-- ===========================================
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON public.discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_program_updated_at BEFORE UPDATE ON public.referral_program
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Generate unique referral code for a user
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    user_name TEXT;
BEGIN
    SELECT UPPER(SUBSTRING(REPLACE(COALESCE(full_name, email), ' ', ''), 1, 4)) 
    INTO user_name FROM public.profiles WHERE id = user_id;
    
    code := COALESCE(user_name, 'REF') || UPPER(SUBSTRING(user_id::TEXT, 1, 4));
    
    -- Update profile with referral code
    UPDATE public.profiles SET referral_code = code WHERE id = user_id AND referral_code IS NULL;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply discount to order
CREATE OR REPLACE FUNCTION apply_discount(
    p_code TEXT,
    p_profile_id UUID,
    p_order_total DECIMAL
)
RETURNS TABLE (
    success BOOLEAN,
    discount_amount DECIMAL,
    message TEXT,
    discount_id UUID
) AS $$
DECLARE
    v_discount RECORD;
    v_usage_count INTEGER;
    v_user_usage_count INTEGER;
    v_discount_amount DECIMAL;
BEGIN
    -- Get discount
    SELECT * INTO v_discount FROM public.discount_codes 
    WHERE code = UPPER(p_code) AND status = 'active';
    
    IF v_discount IS NULL THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Invalid discount code'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check validity dates
    IF v_discount.valid_from > NOW() THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Discount not yet active'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF v_discount.valid_until IS NOT NULL AND v_discount.valid_until < NOW() THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Discount has expired'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check minimum order amount
    IF v_discount.min_order_amount IS NOT NULL AND p_order_total < v_discount.min_order_amount THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 
            ('Minimum order amount is AED ' || v_discount.min_order_amount)::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF v_discount.usage_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_usage_count FROM public.discount_usage WHERE discount_id = v_discount.id;
        IF v_usage_count >= v_discount.usage_limit THEN
            RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Discount usage limit reached'::TEXT, NULL::UUID;
            RETURN;
        END IF;
    END IF;
    
    -- Check per-customer limit
    IF v_discount.usage_per_customer IS NOT NULL AND p_profile_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_usage_count FROM public.discount_usage 
        WHERE discount_id = v_discount.id AND profile_id = p_profile_id;
        IF v_user_usage_count >= v_discount.usage_per_customer THEN
            RETURN QUERY SELECT FALSE, 0::DECIMAL, 'You have already used this discount'::TEXT, NULL::UUID;
            RETURN;
        END IF;
    END IF;
    
    -- Calculate discount amount
    IF v_discount.type = 'percent' THEN
        v_discount_amount := p_order_total * (v_discount.value / 100);
        IF v_discount.max_discount_amount IS NOT NULL AND v_discount_amount > v_discount.max_discount_amount THEN
            v_discount_amount := v_discount.max_discount_amount;
        END IF;
    ELSE
        v_discount_amount := v_discount.value;
    END IF;
    
    -- Cap at order total
    IF v_discount_amount > p_order_total THEN
        v_discount_amount := p_order_total;
    END IF;
    
    RETURN QUERY SELECT TRUE, v_discount_amount, 'Discount applied'::TEXT, v_discount.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default referral program
INSERT INTO public.referral_program (
    is_active,
    referrer_reward_type,
    referrer_reward_value,
    referee_reward_type,
    referee_reward_value,
    min_purchase_amount,
    reward_expires_days,
    referrer_reward_description,
    referee_reward_description
) VALUES (
    TRUE,
    'fixed',
    100,
    'fixed',
    100,
    200,
    90,
    'AED 100 credit for each friend who makes a purchase',
    'AED 100 off your first order'
);

-- ===========================================
-- ADD BIRTHDAY TO PROFILES (if not exists)
-- ===========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM date_of_birth)) STORED;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday_day INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM date_of_birth)) STORED;

-- ===========================================
-- DONE!
-- ===========================================
