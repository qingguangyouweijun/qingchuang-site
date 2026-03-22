-- =============================================
-- 鏅寸獥钁宠暏 - 鏁版嵁搴撹〃缁撴瀯
-- 鍦?Supabase SQL Editor 涓墽琛屾鑴氭湰
-- =============================================

-- 1. 鐢ㄦ埛璧勬枡琛?(profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account VARCHAR(320) UNIQUE NOT NULL, -- 鐢ㄤ簬瀛樺偍閭鍦板潃
  nickname VARCHAR(50),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')), -- 鎬у埆
  age INTEGER CHECK (age >= 18 AND age <= 60), -- 骞撮緞
  appearance VARCHAR(20) CHECK (appearance IN ('normal', 'good', 'stunning')), -- 鐩歌矊: 鏅€?鍑轰紬/瓒呯骇鍝囧
  identity VARCHAR(20) CHECK (identity IN ('student', 'non_student')), -- 韬唤: 瀛︾敓/闈炲鐢?
  location VARCHAR(100), -- 鍦板煙/瀛︽牎
  grade VARCHAR(20), -- 骞寸骇 (瀛︾敓鏃跺繀濉?
  bio TEXT, -- 涓汉浠嬬粛
  contact_visibility_limit INTEGER DEFAULT 0 CHECK (contact_visibility_limit >= 0 AND contact_visibility_limit <= 20), -- 鍙浜烘暟涓婇檺
  balance DECIMAL(10, 2) DEFAULT 0.00, -- 閽卞寘浣欓
  is_verified BOOLEAN DEFAULT FALSE, -- 鏄惁宸茶璇?
  is_profile_complete BOOLEAN DEFAULT FALSE, -- 璧勬枡鏄惁瀹屽杽
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 鑱旂郴鏂瑰紡姹犺〃 (contact_pool)
CREATE TABLE IF NOT EXISTS contact_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wechat VARCHAR(100), -- 寰俊鍙?
  qq VARCHAR(20), -- QQ鍙?
  phone VARCHAR(20), -- 鎵嬫満鍙?
  is_active BOOLEAN DEFAULT TRUE, -- 鏄惁鍦ㄦ睜涓?
  drawn_count INTEGER DEFAULT 0, -- 宸茶鎶藉彇娆℃暟
  max_drawn_count INTEGER DEFAULT 0, -- 鏈€澶у彲鎶藉彇娆℃暟 (鏉ヨ嚜profile.contact_visibility_limit)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. 鎶藉彇璁板綍琛?(draw_history)
CREATE TABLE IF NOT EXISTS draw_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- 鎶藉彇鑰?
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- 琚娊鍙栬€?
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'advanced', 'vip')), -- 鎶藉彇妗ｄ綅
  price DECIMAL(10, 2) NOT NULL, -- 鏀粯閲戦
  contact_wechat VARCHAR(100), -- 鎶藉彇鏃剁殑寰俊
  contact_qq VARCHAR(20), -- 鎶藉彇鏃剁殑QQ
  contact_phone VARCHAR(20), -- 鎶藉彇鏃剁殑鎵嬫満
  note TEXT, -- 鐢ㄦ埛澶囨敞
  is_deleted BOOLEAN DEFAULT FALSE, -- 鏄惁宸插垹闄?杞垹闄?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 浜ゆ槗璁板綍琛?(transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('recharge', 'draw', 'refund')), -- 绫诲瀷: 鍏呭€?鎶藉彇/閫€娆?
  amount DECIMAL(10, 2) NOT NULL, -- 閲戦
  balance_after DECIMAL(10, 2) NOT NULL, -- 浜ゆ槗鍚庝綑棰?
  description TEXT, -- 鎻忚堪
  related_draw_id UUID REFERENCES draw_history(id), -- 鍏宠仈鐨勬娊鍙栬褰?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 鍒涘缓绱㈠紩
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_identity ON profiles(identity);
CREATE INDEX IF NOT EXISTS idx_profiles_appearance ON profiles(appearance);
CREATE INDEX IF NOT EXISTS idx_contact_pool_active ON contact_pool(is_active);
CREATE INDEX IF NOT EXISTS idx_draw_history_drawer ON draw_history(drawer_id);
CREATE INDEX IF NOT EXISTS idx_draw_history_created ON draw_history(created_at DESC);

-- 6. 鍚敤 Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ALTER COLUMN account TYPE VARCHAR(320);
ALTER TABLE contact_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 7. RLS 绛栫暐

-- profiles: 鐢ㄦ埛鍙兘璇昏嚜宸辩殑璧勬枡锛屼絾鍙互璇诲彇鍏朵粬鐢ㄦ埛鐨勫叕寮€淇℃伅
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 鍏佽鏌ョ湅鍏朵粬鐢ㄦ埛鐨勫叕寮€璧勬枡 (鐢ㄤ簬鎶藉彇缁撴灉灞曠ず)
CREATE POLICY "Users can view public profiles for matching" ON profiles
  FOR SELECT USING (is_profile_complete = TRUE);

-- contact_pool: 鐢ㄦ埛鍙兘绠＄悊鑷繁鐨勮仈绯绘柟寮?
CREATE POLICY "Users can manage own contact" ON contact_pool
  FOR ALL USING (auth.uid() = user_id);

-- 鍏佽鎶藉彇鏃惰鍙栧叾浠栫敤鎴风殑鑱旂郴鏂瑰紡
CREATE POLICY "Active contacts visible for draw" ON contact_pool
  FOR SELECT USING (is_active = TRUE AND drawn_count < max_drawn_count);

-- draw_history: 鐢ㄦ埛鍙兘鐪嬭嚜宸辩殑鎶藉彇璁板綍
CREATE POLICY "Users can view own draw history" ON draw_history
  FOR SELECT USING (auth.uid() = drawer_id);

CREATE POLICY "Users can insert own draw history" ON draw_history
  FOR INSERT WITH CHECK (auth.uid() = drawer_id);

CREATE POLICY "Users can update own draw history" ON draw_history
  FOR UPDATE USING (auth.uid() = drawer_id);

-- transactions: 鐢ㄦ埛鍙兘鐪嬭嚜宸辩殑浜ゆ槗璁板綍
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. 鑷姩鏇存柊 updated_at 鐨勮Е鍙戝櫒
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER contact_pool_updated_at
  BEFORE UPDATE ON contact_pool
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. 鎶藉彇鍑芥暟 (闅忔満鍖归厤 + 鎵ｈ垂 + 璁板綍)
CREATE OR REPLACE FUNCTION perform_draw(
  p_drawer_id UUID,
  p_tier VARCHAR(20),
  p_price DECIMAL(10, 2),
  p_gender VARCHAR(10) DEFAULT NULL,
  p_age_min INTEGER DEFAULT NULL,
  p_age_max INTEGER DEFAULT NULL,
  p_identity VARCHAR(20) DEFAULT NULL,
  p_appearance VARCHAR(20) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_drawer_balance DECIMAL(10, 2);
  v_drawer_gender VARCHAR(10);
  v_target_id UUID;
  v_target_record RECORD;
  v_contact_record RECORD;
  v_draw_id UUID;
  v_new_balance DECIMAL(10, 2);
BEGIN
  -- 鑾峰彇鎶藉彇鑰呬俊鎭?
  SELECT balance, gender INTO v_drawer_balance, v_drawer_gender
  FROM profiles WHERE id = p_drawer_id;
  
  -- 妫€鏌ヤ綑棰?
  IF v_drawer_balance < p_price THEN
    RETURN json_build_object('success', FALSE, 'error', '浣欓涓嶈冻锛岃鍏堝厖鍊?);
  END IF;
  
  -- 鏌ユ壘鍖归厤鐨勫紓鎬х敤鎴?(鎺掗櫎鑷繁鍜?0澶╁唴鎶借繃鐨?
  SELECT p.id INTO v_target_id
  FROM profiles p
  JOIN contact_pool c ON c.user_id = p.id
  WHERE p.id != p_drawer_id
    AND p.is_profile_complete = TRUE
    AND c.is_active = TRUE
    AND c.drawn_count < c.max_drawn_count
    AND p.gender != v_drawer_gender  -- 鍙尮閰嶅紓鎬?
    AND (p_gender IS NULL OR p.gender = p_gender)
    AND (p_age_min IS NULL OR p.age >= p_age_min)
    AND (p_age_max IS NULL OR p.age <= p_age_max)
    AND (p_identity IS NULL OR p.identity = p_identity)
    AND (p_appearance IS NULL OR p.appearance = p_appearance)
    AND p.id NOT IN (
      SELECT target_id FROM draw_history 
      WHERE drawer_id = p_drawer_id 
      AND created_at > NOW() - INTERVAL '30 days'
    )
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- 妫€鏌ユ槸鍚︽壘鍒板尮閰?
  IF v_target_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', '鏆傛棤绗﹀悎鏉′欢鐨勭敤鎴凤紝璇疯皟鏁寸瓫閫夋潯浠?);
  END IF;
  
  -- 鑾峰彇鐩爣鐢ㄦ埛淇℃伅
  SELECT * INTO v_target_record FROM profiles WHERE id = v_target_id;
  SELECT * INTO v_contact_record FROM contact_pool WHERE user_id = v_target_id;
  
  -- 鎵ｈ垂
  v_new_balance := v_drawer_balance - p_price;
  UPDATE profiles SET balance = v_new_balance WHERE id = p_drawer_id;
  
  -- 澧炲姞琚娊鍙栨鏁?
  UPDATE contact_pool SET drawn_count = drawn_count + 1 WHERE user_id = v_target_id;
  
  -- 濡傛灉杈惧埌涓婇檺锛岃嚜鍔ㄤ笅鏋?
  UPDATE contact_pool 
  SET is_active = FALSE 
  WHERE user_id = v_target_id AND drawn_count >= max_drawn_count;
  
  -- 鍒涘缓鎶藉彇璁板綍
  INSERT INTO draw_history (drawer_id, target_id, tier, price, contact_wechat, contact_qq, contact_phone)
  VALUES (p_drawer_id, v_target_id, p_tier, p_price, v_contact_record.wechat, v_contact_record.qq, v_contact_record.phone)
  RETURNING id INTO v_draw_id;
  
  -- 鍒涘缓浜ゆ槗璁板綍
  INSERT INTO transactions (user_id, type, amount, balance_after, description, related_draw_id)
  VALUES (p_drawer_id, 'draw', -p_price, v_new_balance, '鎶藉彇 ' || p_tier || ' 妗ｄ綅', v_draw_id);
  
  -- 杩斿洖缁撴灉
  RETURN json_build_object(
    'success', TRUE,
    'draw_id', v_draw_id,
    'target', json_build_object(
      'id', v_target_record.id,
      'nickname', v_target_record.nickname,
      'gender', v_target_record.gender,
      'age', v_target_record.age,
      'appearance', v_target_record.appearance,
      'identity', v_target_record.identity,
      'location', v_target_record.location,
      'grade', v_target_record.grade,
      'bio', v_target_record.bio
    ),
    'contact', json_build_object(
      'wechat', v_contact_record.wechat,
      'qq', v_contact_record.qq,
      'phone', v_contact_record.phone
    ),
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 鏍″洯蹇€掍唬鍙?+ 鏃т功浜ゆ槗 + 绠＄悊鍚庡彴鎵╁睍
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role VARCHAR(20) DEFAULT 'user' CHECK (app_role IN ('user', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS campus_available_balance DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS campus_pending_balance DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS campus_settlement_applying_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS campus_settled_total DECIMAL(10, 2) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS campus_express_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(40) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  runner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  small_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  large_count INTEGER NOT NULL DEFAULT 0,
  xlarge_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  pickup_station VARCHAR(120) NOT NULL,
  pickup_codes TEXT[] NOT NULL DEFAULT '{}',
  delivery_building VARCHAR(120) NOT NULL,
  delivery_address VARCHAR(120) NOT NULL,
  expected_time VARCHAR(120) NOT NULL,
  remark TEXT,
  order_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  runner_income DECIMAL(10, 2) NOT NULL,
  pay_type VARCHAR(20) CHECK (pay_type IN ('wxpay', 'alipay')),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'OPEN', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'COMPLETED')),
  paid_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_book_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  isbn VARCHAR(40),
  condition_level VARCHAR(40) NOT NULL,
  sale_price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
  seller_income DECIMAL(10, 2) NOT NULL,
  description TEXT,
  shelf_status VARCHAR(20) NOT NULL DEFAULT 'ON_SALE' CHECK (shelf_status IN ('ON_SALE', 'LOCKED', 'SOLD', 'OFF_SHELF')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_book_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(40) UNIQUE NOT NULL,
  book_id UUID NOT NULL REFERENCES campus_book_posts(id) ON DELETE CASCADE,
  book_title VARCHAR(120) NOT NULL,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sale_price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  seller_income DECIMAL(10, 2) NOT NULL,
  delivery_building VARCHAR(120) NOT NULL,
  pay_type VARCHAR(20) CHECK (pay_type IN ('wxpay', 'alipay')),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'WAITING_SELLER', 'DELIVERED', 'COMPLETED')),
  paid_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  out_trade_no VARCHAR(50) UNIQUE NOT NULL,
  biz_type VARCHAR(30) NOT NULL CHECK (biz_type IN ('EXPRESS_ORDER', 'BOOK_ORDER')),
  biz_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  pay_type VARCHAR(20) CHECK (pay_type IN ('wxpay', 'alipay')),
  status VARCHAR(20) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'SUCCESS', 'FAILED')),
  trade_status VARCHAR(30),
  gateway_trade_no VARCHAR(80),
  gateway_order_id VARCHAR(80),
  pay_url TEXT,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_settlement_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_no VARCHAR(40) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  user_role VARCHAR(20) NOT NULL DEFAULT 'user',
  note TEXT,
  transfer_ref VARCHAR(100),
  handled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_balance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  biz_type VARCHAR(40) NOT NULL,
  biz_id VARCHAR(80) NOT NULL,
  change_type VARCHAR(40) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  before_available DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  after_available DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  before_pending DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  after_pending DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campus_express_orders_user_id ON campus_express_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_campus_express_orders_runner_id ON campus_express_orders(runner_id);
CREATE INDEX IF NOT EXISTS idx_campus_express_orders_status ON campus_express_orders(status);
CREATE INDEX IF NOT EXISTS idx_campus_book_posts_seller_id ON campus_book_posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_campus_book_posts_shelf_status ON campus_book_posts(shelf_status);
CREATE INDEX IF NOT EXISTS idx_campus_book_orders_buyer_id ON campus_book_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_campus_book_orders_seller_id ON campus_book_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_campus_book_orders_status ON campus_book_orders(status);
CREATE INDEX IF NOT EXISTS idx_campus_payment_records_user_id ON campus_payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_campus_payment_records_out_trade_no ON campus_payment_records(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_campus_settlement_user_id ON campus_settlement_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_campus_settlement_status ON campus_settlement_applications(status);
CREATE INDEX IF NOT EXISTS idx_campus_balance_logs_user_id ON campus_balance_logs(user_id);

DROP TRIGGER IF EXISTS campus_express_orders_updated_at ON campus_express_orders;
CREATE TRIGGER campus_express_orders_updated_at
  BEFORE UPDATE ON campus_express_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS campus_book_posts_updated_at ON campus_book_posts;
CREATE TRIGGER campus_book_posts_updated_at
  BEFORE UPDATE ON campus_book_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS campus_book_orders_updated_at ON campus_book_orders;
CREATE TRIGGER campus_book_orders_updated_at
  BEFORE UPDATE ON campus_book_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS campus_payment_records_updated_at ON campus_payment_records;
CREATE TRIGGER campus_payment_records_updated_at
  BEFORE UPDATE ON campus_payment_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS campus_settlement_applications_updated_at ON campus_settlement_applications;
CREATE TRIGGER campus_settlement_applications_updated_at
  BEFORE UPDATE ON campus_settlement_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
