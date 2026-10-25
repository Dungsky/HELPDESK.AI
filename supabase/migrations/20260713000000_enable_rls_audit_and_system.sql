-- Migration: Enable Row-Level Security for rls_audit_log and system_operations
-- Resolves Supabase security vulnerability checks for rls_disabled_in_public

-- 1. Enable Row-Level Security on rls_audit_log
ALTER TABLE public.rls_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for rls_audit_log
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.rls_audit_log;
CREATE POLICY "Users can view their own audit logs" ON public.rls_audit_log
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role bypass for rls_audit_log" ON public.rls_audit_log;
CREATE POLICY "Service role bypass for rls_audit_log" ON public.rls_audit_log
    FOR ALL TO service_role
    USING (true);


-- 2. Enable Row-Level Security on system_operations
ALTER TABLE public.system_operations ENABLE ROW LEVEL SECURITY;

-- Policies for system_operations
DROP POLICY IF EXISTS "Service role bypass for system_operations" ON public.system_operations;
CREATE POLICY "Service role bypass for system_operations" ON public.system_operations
    FOR ALL TO service_role
    USING (true);
