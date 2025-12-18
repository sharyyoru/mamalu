-- =============================================
-- MAMALU KITCHEN - MARKETING SYSTEM (SAFE VERSION)
-- This script handles existing tables gracefully
-- =============================================

-- Create ENUM types (safe to re-run)
DO $$ BEGIN CREATE TYPE campaign_type AS ENUM ('email', 'sms', 'push', 'in_app'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE discount_type AS ENUM ('percent', 'fixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE discount_status AS ENUM ('active', 'paused', 'expired', 'exhausted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE recipient_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- DROP EXISTING TABLES (clean slate)
-- =============================================
DROP TABLE IF EXISTS public.discount_usage CASCADE;
DROP TABLE IF EXISTS public.campaign_recipients CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.customer_credits CASCADE;
DROP TABLE IF EXISTS public.discount_codes CASCADE;
DROP TABLE IF EXISTS public.marketing_campaigns CASCADE;
DROP TABLE IF EXISTS public.referral_program CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;

-- =============================================
-- CREATE TABLES (fresh)
-- =============================================
CREATE TABLE public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type campaign_type NOT NULL DEFAULT 'email',
    status campaign_status NOT NULL DEFAULT 'draft',
    subject TEXT,
    content TEXT,
    html_content TEXT,
    template_id UUID,
    segment_filters JSONB DEFAULT '{}',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    profile_id UUID,
    email TEXT NOT NULL,
    status recipient_status DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type discount_type NOT NULL DEFAULT 'percent',
    value DECIMAL(10,2) NOT NULL,
    description TEXT,
    status discount_status NOT NULL DEFAULT 'active',
    usage_limit INTEGER,
    usage_per_user INTEGER DEFAULT 1,
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    applies_to TEXT[] DEFAULT '{}',
    excludes TEXT[] DEFAULT '{}',
    first_order_only BOOLEAN DEFAULT FALSE,
    new_customers_only BOOLEAN DEFAULT FALSE,
    total_used INTEGER DEFAULT 0,
    total_revenue_generated DECIMAL(10,2) DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.discount_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
    profile_id UUID,
    order_id UUID,
    order_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.referral_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT TRUE,
    referrer_reward_type discount_type DEFAULT 'fixed',
    referrer_reward_value DECIMAL(10,2) DEFAULT 50,
    referee_reward_type discount_type DEFAULT 'fixed',
    referee_reward_value DECIMAL(10,2) DEFAULT 50,
    min_purchase_amount DECIMAL(10,2) DEFAULT 100,
    reward_expires_days INTEGER DEFAULT 90,
    referrer_reward_description TEXT,
    referee_reward_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referee_id UUID,
    referral_code TEXT NOT NULL,
    status referral_status DEFAULT 'pending',
    referrer_reward_amount DECIMAL(10,2),
    referee_reward_amount DECIMAL(10,2),
    referrer_credit_id UUID,
    referee_credit_id UUID,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.customer_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL,
    source TEXT NOT NULL,
    source_id UUID,
    description TEXT,
    expires_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    used_order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    category TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_campaigns_type ON public.marketing_campaigns(type);
CREATE INDEX idx_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_recipients_status ON public.campaign_recipients(status);
CREATE INDEX idx_discounts_code ON public.discount_codes(code);
CREATE INDEX idx_discounts_status ON public.discount_codes(status);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_credits_profile ON public.customer_credits(profile_id);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (simple - allow all for now)
-- =============================================
CREATE POLICY "Allow all on campaigns" ON public.marketing_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all on recipients" ON public.campaign_recipients FOR ALL USING (true);
CREATE POLICY "Allow all on discounts" ON public.discount_codes FOR ALL USING (true);
CREATE POLICY "Allow all on discount_usage" ON public.discount_usage FOR ALL USING (true);
CREATE POLICY "Allow all on referral_program" ON public.referral_program FOR ALL USING (true);
CREATE POLICY "Allow all on referrals" ON public.referrals FOR ALL USING (true);
CREATE POLICY "Allow all on credits" ON public.customer_credits FOR ALL USING (true);
CREATE POLICY "Allow all on templates" ON public.email_templates FOR ALL USING (true);

-- =============================================
-- SIMPLE APPLY DISCOUNT FUNCTION (no orders check)
-- =============================================
CREATE OR REPLACE FUNCTION apply_discount(
    p_code TEXT,
    p_profile_id UUID,
    p_order_amount DECIMAL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    discount_amount DECIMAL,
    message TEXT,
    discount_id UUID
) AS $$
DECLARE
    v_discount public.discount_codes%ROWTYPE;
    v_usage_count INTEGER;
    v_discount_amount DECIMAL;
BEGIN
    SELECT * INTO v_discount FROM public.discount_codes 
    WHERE code = UPPER(p_code) AND status = 'active';
    
    IF v_discount IS NULL THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Invalid discount code'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF v_discount.valid_until IS NOT NULL AND v_discount.valid_until < NOW() THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Discount code has expired'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF v_discount.usage_limit IS NOT NULL AND v_discount.total_used >= v_discount.usage_limit THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Discount code usage limit reached'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF v_discount.min_order_amount IS NOT NULL AND p_order_amount < v_discount.min_order_amount THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, ('Minimum order amount is ' || v_discount.min_order_amount)::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    IF v_discount.type = 'percent' THEN
        v_discount_amount := p_order_amount * (v_discount.value / 100);
    ELSE
        v_discount_amount := v_discount.value;
    END IF;
    
    IF v_discount.max_discount_amount IS NOT NULL AND v_discount_amount > v_discount.max_discount_amount THEN
        v_discount_amount := v_discount.max_discount_amount;
    END IF;
    
    IF v_discount.usage_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_usage_count FROM public.discount_usage 
        WHERE discount_id = v_discount.id AND profile_id = p_profile_id;
        
        IF v_usage_count >= v_discount.usage_per_user THEN
            RETURN QUERY SELECT FALSE, 0::DECIMAL, 'You have already used this discount code'::TEXT, NULL::UUID;
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT TRUE, v_discount_amount, 'Discount applied successfully'::TEXT, v_discount.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referral_program_updated_at BEFORE UPDATE ON public.referral_program FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERT DEFAULT REFERRAL PROGRAM
-- =============================================
INSERT INTO public.referral_program (
    is_active, referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value,
    min_purchase_amount, reward_expires_days, referrer_reward_description, referee_reward_description
) VALUES (
    TRUE, 'fixed', 100, 'fixed', 100, 200, 90,
    'AED 100 credit for each friend who makes a purchase',
    'AED 100 off your first order'
);

-- DONE!
SELECT 'Marketing system tables created successfully!' as result;
