-- Comprehensive Organization Isolation Fix
-- This script fixes RLS policies for ALL tables to ensure proper multi-tenancy

-- 1. Check current state of all tables
SELECT 
    'Current state check' as info,
    (SELECT COUNT(*) FROM bottles) as total_bottles,
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM rentals) as total_rentals,
    (SELECT COUNT(*) FROM organizations) as total_organizations;

-- 2. Check organization distribution across all tables
SELECT 'Bottles by organization:' as table_info, organization_id, COUNT(*) as count
FROM bottles 
GROUP BY organization_id 
ORDER BY count DESC;

SELECT 'Customers by organization:' as table_info, organization_id, COUNT(*) as count
FROM customers 
GROUP BY organization_id 
ORDER BY count DESC;

SELECT 'Profiles by organization:' as table_info, organization_id, COUNT(*) as count
FROM profiles 
GROUP BY organization_id 
ORDER BY count DESC;

-- 3. Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('bottles', 'customers', 'profiles', 'rentals', 'organizations', 'invoices', 'cylinder_fills', 'deliveries', 'notifications', 'audit_logs', 'imported_invoices', 'imported_sales_receipts')
ORDER BY tablename;

-- 4. Fix BOTTLES table RLS
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on bottles" ON bottles;
DROP POLICY IF EXISTS "Allow users to read bottles in their organization" ON bottles;
DROP POLICY IF EXISTS "Allow users to insert bottles in their organization" ON bottles;
DROP POLICY IF EXISTS "Allow users to update bottles in their organization" ON bottles;
DROP POLICY IF EXISTS "Allow users to delete bottles in their organization" ON bottles;

CREATE POLICY "Allow users to read bottles in their organization" ON bottles
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to insert bottles in their organization" ON bottles
FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to update bottles in their organization" ON bottles
FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to delete bottles in their organization" ON bottles
FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 5. Fix CUSTOMERS table RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Allow users to read customers in their organization" ON customers;
DROP POLICY IF EXISTS "Allow users to insert customers in their organization" ON customers;
DROP POLICY IF EXISTS "Allow users to update customers in their organization" ON customers;
DROP POLICY IF EXISTS "Allow users to delete customers in their organization" ON customers;

CREATE POLICY "Allow users to read customers in their organization" ON customers
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to insert customers in their organization" ON customers
FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to update customers in their organization" ON customers
FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to delete customers in their organization" ON customers
FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 6. Fix RENTALS table RLS
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on rentals" ON rentals;
DROP POLICY IF EXISTS "Allow users to read rentals in their organization" ON rentals;
DROP POLICY IF EXISTS "Allow users to insert rentals in their organization" ON rentals;
DROP POLICY IF EXISTS "Allow users to update rentals in their organization" ON rentals;
DROP POLICY IF EXISTS "Allow users to delete rentals in their organization" ON rentals;

CREATE POLICY "Allow users to read rentals in their organization" ON rentals
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to insert rentals in their organization" ON rentals
FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to update rentals in their organization" ON rentals
FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to delete rentals in their organization" ON rentals
FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 7. Fix PROFILES table RLS (users can only see their own profile and profiles in their org)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to read profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

CREATE POLICY "Allow users to read their own profile" ON profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Allow users to read profiles in their organization" ON profiles
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow users to update their own profile" ON profiles
FOR UPDATE USING (id = auth.uid());

-- 8. Fix ORGANIZATIONS table RLS (users can only see their own organization)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on organizations" ON organizations;
DROP POLICY IF EXISTS "Allow users to read their own organization" ON organizations;
DROP POLICY IF EXISTS "Allow owners to manage their organization" ON organizations;

CREATE POLICY "Allow users to read their own organization" ON organizations
FOR SELECT USING (
    id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Allow owners to manage their organization" ON organizations
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin')
    AND id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 9. Create triggers to automatically set organization_id on insert for all tables
CREATE OR REPLACE FUNCTION set_organization_id()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
    -- Get the user's organization_id
    SELECT organization_id INTO user_org_id
    FROM profiles 
    WHERE id = auth.uid();
    
    -- If user has an organization_id, set it
    IF user_org_id IS NOT NULL THEN
        NEW.organization_id = user_org_id;
    ELSE
        -- If no organization_id, raise an error
        RAISE EXCEPTION 'User must be assigned to an organization to create records';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all tables that have organization_id
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT t.table_name FROM information_schema.tables t
        WHERE t.table_name IN ('bottles', 'customers', 'rentals', 'invoices', 'cylinder_fills', 'deliveries', 'notifications', 'audit_logs', 'imported_invoices', 'imported_sales_receipts')
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = t.table_name AND c.column_name = 'organization_id'
        )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_organization_id_%I ON %I', table_name, table_name);
        EXECUTE format('CREATE TRIGGER set_organization_id_%I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_organization_id()', table_name, table_name);
    END LOOP;
END $$;

-- 10. Verify all policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 11. Test organization isolation for current user
SELECT 
    'Organization isolation test' as info,
    (SELECT COUNT(*) FROM bottles) as visible_bottles,
    (SELECT COUNT(*) FROM customers) as visible_customers,
    (SELECT COUNT(*) FROM rentals) as visible_rentals,
    (SELECT COUNT(*) FROM profiles WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())) as visible_profiles;

-- 12. Show organization breakdown for current user
SELECT 
    'Current user organization breakdown' as info,
    organization_id,
    COUNT(*) as record_count
FROM (
    SELECT organization_id FROM bottles
    UNION ALL
    SELECT organization_id FROM customers
    UNION ALL
    SELECT organization_id FROM rentals
    UNION ALL
    SELECT organization_id FROM profiles WHERE organization_id IS NOT NULL
) all_records
GROUP BY organization_id
ORDER BY record_count DESC;
