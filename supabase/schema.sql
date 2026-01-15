-- =============================================
-- 晴窗葳蕤 - 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================

-- 1. 用户资料表 (profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account VARCHAR(11) UNIQUE NOT NULL, -- 11位数字账号
  nickname VARCHAR(50),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')), -- 性别
  age INTEGER CHECK (age >= 18 AND age <= 60), -- 年龄
  appearance VARCHAR(20) CHECK (appearance IN ('normal', 'good', 'stunning')), -- 相貌: 普通/出众/超级哇塞
  identity VARCHAR(20) CHECK (identity IN ('student', 'non_student')), -- 身份: 学生/非学生
  location VARCHAR(100), -- 地域/学校
  grade VARCHAR(20), -- 年级 (学生时必填)
  bio TEXT, -- 个人介绍
  contact_visibility_limit INTEGER DEFAULT 0 CHECK (contact_visibility_limit >= 0 AND contact_visibility_limit <= 20), -- 可见人数上限
  balance DECIMAL(10, 2) DEFAULT 0.00, -- 钱包余额
  is_verified BOOLEAN DEFAULT FALSE, -- 是否已认证
  is_profile_complete BOOLEAN DEFAULT FALSE, -- 资料是否完善
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 联系方式池表 (contact_pool)
CREATE TABLE IF NOT EXISTS contact_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wechat VARCHAR(100), -- 微信号
  qq VARCHAR(20), -- QQ号
  phone VARCHAR(20), -- 手机号
  is_active BOOLEAN DEFAULT TRUE, -- 是否在池中
  drawn_count INTEGER DEFAULT 0, -- 已被抽取次数
  max_drawn_count INTEGER DEFAULT 0, -- 最大可抽取次数 (来自profile.contact_visibility_limit)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. 抽取记录表 (draw_history)
CREATE TABLE IF NOT EXISTS draw_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- 抽取者
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- 被抽取者
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'advanced', 'vip')), -- 抽取档位
  price DECIMAL(10, 2) NOT NULL, -- 支付金额
  contact_wechat VARCHAR(100), -- 抽取时的微信
  contact_qq VARCHAR(20), -- 抽取时的QQ
  contact_phone VARCHAR(20), -- 抽取时的手机
  note TEXT, -- 用户备注
  is_deleted BOOLEAN DEFAULT FALSE, -- 是否已删除(软删除)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 交易记录表 (transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('recharge', 'draw', 'refund')), -- 类型: 充值/抽取/退款
  amount DECIMAL(10, 2) NOT NULL, -- 金额
  balance_after DECIMAL(10, 2) NOT NULL, -- 交易后余额
  description TEXT, -- 描述
  related_draw_id UUID REFERENCES draw_history(id), -- 关联的抽取记录
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_identity ON profiles(identity);
CREATE INDEX IF NOT EXISTS idx_profiles_appearance ON profiles(appearance);
CREATE INDEX IF NOT EXISTS idx_contact_pool_active ON contact_pool(is_active);
CREATE INDEX IF NOT EXISTS idx_draw_history_drawer ON draw_history(drawer_id);
CREATE INDEX IF NOT EXISTS idx_draw_history_created ON draw_history(created_at DESC);

-- 6. 启用 Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 7. RLS 策略

-- profiles: 用户只能读自己的资料，但可以读取其他用户的公开信息
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许查看其他用户的公开资料 (用于抽取结果展示)
CREATE POLICY "Users can view public profiles for matching" ON profiles
  FOR SELECT USING (is_profile_complete = TRUE);

-- contact_pool: 用户只能管理自己的联系方式
CREATE POLICY "Users can manage own contact" ON contact_pool
  FOR ALL USING (auth.uid() = user_id);

-- 允许抽取时读取其他用户的联系方式
CREATE POLICY "Active contacts visible for draw" ON contact_pool
  FOR SELECT USING (is_active = TRUE AND drawn_count < max_drawn_count);

-- draw_history: 用户只能看自己的抽取记录
CREATE POLICY "Users can view own draw history" ON draw_history
  FOR SELECT USING (auth.uid() = drawer_id);

CREATE POLICY "Users can insert own draw history" ON draw_history
  FOR INSERT WITH CHECK (auth.uid() = drawer_id);

CREATE POLICY "Users can update own draw history" ON draw_history
  FOR UPDATE USING (auth.uid() = drawer_id);

-- transactions: 用户只能看自己的交易记录
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. 自动更新 updated_at 的触发器
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

-- 9. 抽取函数 (随机匹配 + 扣费 + 记录)
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
  -- 获取抽取者信息
  SELECT balance, gender INTO v_drawer_balance, v_drawer_gender
  FROM profiles WHERE id = p_drawer_id;
  
  -- 检查余额
  IF v_drawer_balance < p_price THEN
    RETURN json_build_object('success', FALSE, 'error', '余额不足，请先充值');
  END IF;
  
  -- 查找匹配的异性用户 (排除自己和30天内抽过的)
  SELECT p.id INTO v_target_id
  FROM profiles p
  JOIN contact_pool c ON c.user_id = p.id
  WHERE p.id != p_drawer_id
    AND p.is_profile_complete = TRUE
    AND c.is_active = TRUE
    AND c.drawn_count < c.max_drawn_count
    AND p.gender != v_drawer_gender  -- 只匹配异性
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
  
  -- 检查是否找到匹配
  IF v_target_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', '暂无符合条件的用户，请调整筛选条件');
  END IF;
  
  -- 获取目标用户信息
  SELECT * INTO v_target_record FROM profiles WHERE id = v_target_id;
  SELECT * INTO v_contact_record FROM contact_pool WHERE user_id = v_target_id;
  
  -- 扣费
  v_new_balance := v_drawer_balance - p_price;
  UPDATE profiles SET balance = v_new_balance WHERE id = p_drawer_id;
  
  -- 增加被抽取次数
  UPDATE contact_pool SET drawn_count = drawn_count + 1 WHERE user_id = v_target_id;
  
  -- 如果达到上限，自动下架
  UPDATE contact_pool 
  SET is_active = FALSE 
  WHERE user_id = v_target_id AND drawn_count >= max_drawn_count;
  
  -- 创建抽取记录
  INSERT INTO draw_history (drawer_id, target_id, tier, price, contact_wechat, contact_qq, contact_phone)
  VALUES (p_drawer_id, v_target_id, p_tier, p_price, v_contact_record.wechat, v_contact_record.qq, v_contact_record.phone)
  RETURNING id INTO v_draw_id;
  
  -- 创建交易记录
  INSERT INTO transactions (user_id, type, amount, balance_after, description, related_draw_id)
  VALUES (p_drawer_id, 'draw', -p_price, v_new_balance, '抽取 ' || p_tier || ' 档位', v_draw_id);
  
  -- 返回结果
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
