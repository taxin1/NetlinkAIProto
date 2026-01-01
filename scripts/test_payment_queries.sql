-- Quick test queries for payment system

-- 1. Check subscriptions table exists and structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Check coupons table exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'coupons'
ORDER BY ordinal_position;

-- 3. Check if NETLINKFREE coupon exists
SELECT 
    id,
    code,
    description,
    discount_type,
    free_months,
    active,
    current_uses,
    max_uses,
    valid_from,
    valid_until,
    created_at
FROM coupons 
WHERE code = 'NETLINKFREE';

-- 4. Check all active coupons
SELECT 
    code,
    description,
    discount_type,
    free_months,
    current_uses,
    max_uses,
    active
FROM coupons
WHERE active = true
ORDER BY created_at DESC;

-- 5. View all subscriptions (replace 'your-user-id' with actual user ID)
SELECT 
    s.id,
    s.user_id,
    s.plan_name,
    s.status,
    s.amount,
    s.currency,
    s.paypal_order_id,
    s.coupon_id,
    c.code as coupon_code,
    s.started_at,
    s.expires_at,
    s.created_at
FROM subscriptions s
LEFT JOIN coupons c ON s.coupon_id = c.id
ORDER BY s.created_at DESC
LIMIT 10;

-- 6. Check coupon usage for a specific user (replace 'your-user-id')
SELECT 
    cu.id,
    cu.user_id,
    cu.coupon_id,
    c.code as coupon_code,
    cu.subscription_id,
    cu.used_at
FROM coupon_uses cu
JOIN coupons c ON cu.coupon_id = c.id
WHERE cu.user_id = 'your-user-id'
ORDER BY cu.used_at DESC;

-- 7. Count subscriptions by plan
SELECT 
    plan_name,
    status,
    COUNT(*) as count,
    SUM(amount) as total_revenue
FROM subscriptions
GROUP BY plan_name, status
ORDER BY plan_name, status;

-- 8. Count coupon usage
SELECT 
    c.code,
    c.current_uses,
    c.max_uses,
    COUNT(cu.id) as recorded_uses,
    (c.max_uses - c.current_uses) as remaining_uses
FROM coupons c
LEFT JOIN coupon_uses cu ON c.id = cu.coupon_id
GROUP BY c.id, c.code, c.current_uses, c.max_uses
ORDER BY c.created_at DESC;

-- 9. Check active subscriptions
SELECT 
    s.plan_name,
    s.status,
    s.amount,
    c.code as coupon_code,
    s.started_at,
    s.expires_at,
    CASE 
        WHEN s.expires_at > NOW() THEN 'Active'
        ELSE 'Expired'
    END as expiration_status
FROM subscriptions s
LEFT JOIN coupons c ON s.coupon_id = c.id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;

-- 10. Test coupon validation (check if user already used a coupon)
-- Replace 'your-user-id' and 'NETLINKFREE'
SELECT 
    cu.id,
    cu.user_id,
    c.code,
    cu.used_at
FROM coupon_uses cu
JOIN coupons c ON cu.coupon_id = c.id
WHERE cu.user_id = 'your-user-id'
AND c.code = 'NETLINKFREE';

-- 11. Check RLS policies for subscriptions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'subscriptions';

-- 12. Check RLS policies for coupons
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('coupons', 'coupon_uses');
