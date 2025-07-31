-- 크레딧 시스템 스키마
-- 사용자 크레딧 잔액 관리
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance INTEGER DEFAULT 3 CHECK (balance >= 0), -- 가입시 3 크레딧 제공
  total_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 크레딧 거래 내역
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'deduct', 'refund', 'bonus')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 무통장 입금 요청
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL CHECK (amount > 0), -- 원화 금액
  credit_amount INTEGER NOT NULL CHECK (credit_amount > 0), -- 구매할 크레딧 수
  depositor_name VARCHAR(255),
  bank_name VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 마케팅 레시피
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL, -- 무료로 볼 수 있는 요약
  content TEXT NOT NULL, -- 유료 컨텐츠
  price_credits INTEGER NOT NULL DEFAULT 1 CHECK (price_credits > 0),
  agency_contact JSONB, -- 대행사 연락처 정보
  author_id UUID REFERENCES auth.users(id),
  category VARCHAR(100),
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 레시피 구매 내역
CREATE TABLE recipe_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  credit_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, recipe_id) -- 동일 레시피 중복 구매 방지
);

-- 인덱스 생성
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_recipes_is_active ON recipes(is_active);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipe_purchases_user_id ON recipe_purchases(user_id);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 신규 사용자 가입 시 크레딧 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id, balance)
    VALUES (NEW.id, 3);
    
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 3, 'bonus', '회원가입 보너스');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS 정책
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_purchases ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 크레딧만 조회 가능
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 거래내역만 조회 가능
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 결제 요청 조회/생성 가능
CREATE POLICY "Users can view own payment requests" ON payment_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests" ON payment_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 활성화된 레시피는 모두 조회 가능
CREATE POLICY "Anyone can view active recipes" ON recipes
    FOR SELECT USING (is_active = TRUE);

-- 사용자는 자신의 구매내역만 조회 가능
CREATE POLICY "Users can view own purchases" ON recipe_purchases
    FOR SELECT USING (auth.uid() = user_id);