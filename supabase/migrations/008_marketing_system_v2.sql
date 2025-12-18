-- =============================================
-- MAMALU KITCHEN - MARKETING SYSTEM SCHEMA
-- Version 2: Safe migration with IF NOT EXISTS
-- =============================================

-- =============================================
-- ENUM TYPES (CREATE IF NOT EXISTS workaround)
-- =============================================

DO $$ BEGIN
    CREATE TYPE campaign_type AS ENUM ('email', 'sms', 'push', 'whatsapp');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percent', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_status AS ENUM ('active', 'paused', 'expired', 'exhausted');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE recipient_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE reward_type AS ENUM ('fixed', 'percent', 'credit');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- MARKETING CAMPAIGNS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type campaign_type NOT NULL DEFAULT 'email',
    status campaign_status NOT NULL DEFAULT 'draft',
    
    -- Email specific
    subject TEXT,
    html_content TEXT,
    email_design JSONB,
    
    -- Audience targeting
    audience_filter JSONB DEFAULT '{}',
    audience_name TEXT,
    
    -- Scheduling
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Stats (denormalized for performance)
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CAMPAIGN RECIPIENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    
    status recipient_status DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Tracking
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(campaign_id, profile_id)
);

-- =============================================
-- DISCOUNT CODES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type discount_type NOT NULL DEFAULT 'percent',
    value DECIMAL(10,2) NOT NULL,
    
    description TEXT,
    status discount_status NOT NULL DEFAULT 'active',
    
    -- Limits
    usage_limit INTEGER,
    total_used INTEGER DEFAULT 0,
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Restrictions
    first_order_only BOOLEAN DEFAULT FALSE,
    specific_products JSONB,
    specific_categories JSONB,
    
    -- Campaign link
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DISCOUNT USAGE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.discount_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID REFERENCES public.discount_codes(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    amount_saved DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REFERRAL PROGRAM TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.referral_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Referrer rewards
    referrer_reward_type reward_type DEFAULT 'fixed',
    referrer_reward_value DECIMAL(10,2) DEFAULT 100,
    referrer_reward_description TEXT DEFAULT 'AED 100 credit for each friend who makes a purchase',
    
    -- Referee rewards
    referee_reward_type reward_type DEFAULT 'fixed',
    referee_reward_value DECIMAL(10,2) DEFAULT 100,
    referee_reward_description TEXT DEFAULT 'AED 100 off your first order',
    
    -- Rules
    min_purchase_amount DECIMAL(10,2),
    max_referrals_per_user INTEGER,
    reward_expires_days INTEGER DEFAULT 90,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REFERRALS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    referral_code TEXT NOT NULL,
    status referral_status DEFAULT 'pending',
    
    -- Rewards
    referrer_reward_amount DECIMAL(10,2),
    referee_reward_amount DECIMAL(10,2),
    referrer_reward_applied BOOLEAN DEFAULT FALSE,
    referee_reward_applied BOOLEAN DEFAULT FALSE,
    
    -- Order tracking
    qualifying_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_amount DECIMAL(10,2),
    
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(referrer_id, referee_id)
);

-- =============================================
-- CUSTOMER CREDITS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.customer_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    
    source TEXT NOT NULL, -- 'referral', 'campaign', 'manual', 'refund'
    source_id UUID, -- ID of referral, campaign, etc.
    description TEXT,
    
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMAIL TEMPLATES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    email_design JSONB,
    
    category TEXT, -- 'marketing', 'transactional', 'notification'
    is_default BOOLEAN DEFAULT FALSE,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADD BIRTHDAY TO PROFILES (if not exists)
-- =============================================

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM date_of_birth)) STORED;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday_day INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM date_of_birth)) STORED;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON public.marketing_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recipients_profile ON public.campaign_recipients(profile_id);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON public.campaign_recipients(status);

CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discounts_status ON public.discount_codes(status);
CREATE INDEX IF NOT EXISTS idx_discounts_valid ON public.discount_codes(valid_until);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

CREATE INDEX IF NOT EXISTS idx_credits_profile ON public.customer_credits(profile_id);
CREATE INDEX IF NOT EXISTS idx_credits_expires ON public.customer_credits(expires_at);

CREATE INDEX IF NOT EXISTS idx_profiles_birthday ON public.profiles(birthday_month, birthday_day);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Admins can manage recipients" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Admins can manage discounts" ON public.discount_codes;
DROP POLICY IF EXISTS "Public can view active discounts" ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can view discount usage" ON public.discount_usage;
DROP POLICY IF EXISTS "Public can view referral program" ON public.referral_program;
DROP POLICY IF EXISTS "Admins can manage referral program" ON public.referral_program;
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view own credits" ON public.customer_credits;
DROP POLICY IF EXISTS "Admins can manage credits" ON public.customer_credits;
DROP POLICY IF EXISTS "Admins can manage templates" ON public.email_templates;

-- Create policies
CREATE POLICY "Admins can manage campaigns" ON public.marketing_campaigns
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage recipients" ON public.campaign_recipients
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage discounts" ON public.discount_codes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Public can view active discounts" ON public.discount_codes
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can view discount usage" ON public.discount_usage
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Public can view referral program" ON public.referral_program
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage referral program" ON public.referral_program
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Admins can manage referrals" ON public.referrals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can view own credits" ON public.customer_credits
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage credits" ON public.customer_credits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_name TEXT)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate code from first 4 chars of name + 4 random chars
        code := UPPER(
            LEFT(REGEXP_REPLACE(user_name, '[^a-zA-Z]', '', 'g'), 4) ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
        );
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_check;
        
        IF NOT exists_check THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Apply discount function
CREATE OR REPLACE FUNCTION apply_discount(
    p_code TEXT,
    p_order_amount DECIMAL,
    p_profile_id UUID
)
RETURNS TABLE(success BOOLEAN, discount_amount DECIMAL, message TEXT, discount_id UUID) AS $$
DECLARE
    v_discount RECORD;
    v_discount_amount DECIMAL;
    v_usage_count INTEGER;
    v_first_order BOOLEAN;
BEGIN
    -- Get discount
    SELECT * INTO v_discount FROM public.discount_codes 
    WHERE code = UPPER(p_code) AND status = 'active';
    
    IF v_discount IS NULL THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Invalid discount code'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check validity period
    IF v_discount.valid_from > NOW() OR (v_discount.valid_until IS NOT NULL AND v_discount.valid_until < NOW()) THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Discount code has expired'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF v_discount.usage_limit IS NOT NULL AND v_discount.total_used >= v_discount.usage_limit THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Discount code usage limit reached'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check minimum order amount
    IF v_discount.min_order_amount IS NOT NULL AND p_order_amount < v_discount.min_order_amount THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, ('Minimum order amount is ' || v_discount.min_order_amount)::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check first order only
    IF v_discount.first_order_only THEN
        SELECT COUNT(*) = 0 INTO v_first_order FROM public.orders 
        WHERE profile_id = p_profile_id AND status IN ('completed', 'processing');
        
        IF NOT v_first_order THEN
            RETURN QUERY SELECT FALSE, 0::DECIMAL, 'This discount is for first orders only'::TEXT, NULL::UUID;
            RETURN;
        END IF;
    END IF;
    
    -- Calculate discount
    IF v_discount.type = 'percent' THEN
        v_discount_amount := p_order_amount * (v_discount.value / 100);
    ELSE
        v_discount_amount := v_discount.value;
    END IF;
    
    -- Apply max discount cap
    IF v_discount.max_discount_amount IS NOT NULL AND v_discount_amount > v_discount.max_discount_amount THEN
        v_discount_amount := v_discount.max_discount_amount;
    END IF;
    
    -- Don't exceed order amount
    IF v_discount_amount > p_order_amount THEN
        v_discount_amount := p_order_amount;
    END IF;
    
    RETURN QUERY SELECT TRUE, v_discount_amount, 'Discount applied'::TEXT, v_discount.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON public.marketing_campaigns;
DROP TRIGGER IF EXISTS update_campaign_recipients_updated_at ON public.campaign_recipients;
DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON public.discount_codes;
DROP TRIGGER IF EXISTS update_referral_program_updated_at ON public.referral_program;
DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
DROP TRIGGER IF EXISTS update_customer_credits_updated_at ON public.customer_credits;
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;

-- Create triggers
CREATE TRIGGER update_marketing_campaigns_updated_at
    BEFORE UPDATE ON public.marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_recipients_updated_at
    BEFORE UPDATE ON public.campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at
    BEFORE UPDATE ON public.discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_program_updated_at
    BEFORE UPDATE ON public.referral_program
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_credits_updated_at
    BEFORE UPDATE ON public.customer_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERT DEFAULT REFERRAL PROGRAM (if not exists)
-- =============================================

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
) 
SELECT 
    TRUE,
    'fixed',
    100,
    'fixed',
    100,
    200,
    90,
    'AED 100 credit for each friend who makes a purchase',
    'AED 100 off your first order'
WHERE NOT EXISTS (SELECT 1 FROM public.referral_program);

-- =============================================
-- DONE!
-- =============================================
