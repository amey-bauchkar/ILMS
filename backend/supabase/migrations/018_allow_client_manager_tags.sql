-- Migration 018: Allow Client Managers to manage tags
-- Grant client_manager role permission to insert, update, and delete tags

DROP POLICY IF EXISTS tags_insert_admin ON public.tags;
CREATE POLICY tags_insert_admin ON public.tags
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'client_manager'));

DROP POLICY IF EXISTS tags_update_admin ON public.tags;
CREATE POLICY tags_update_admin ON public.tags
  FOR UPDATE USING (public.get_user_role() IN ('admin', 'client_manager'));

DROP POLICY IF EXISTS tags_delete_admin ON public.tags;
CREATE POLICY tags_delete_admin ON public.tags
  FOR DELETE USING (public.get_user_role() IN ('admin', 'client_manager'));

DROP POLICY IF EXISTS lead_tags_insert ON public.lead_tags;
CREATE POLICY lead_tags_insert ON public.lead_tags
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'client_manager')
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_id AND leads.owner_id = public.get_user_id()
    )
  );

DROP POLICY IF EXISTS lead_tags_delete ON public.lead_tags;
CREATE POLICY lead_tags_delete ON public.lead_tags
  FOR DELETE USING (
    public.get_user_role() IN ('admin', 'client_manager')
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_id AND leads.owner_id = public.get_user_id()
    )
  );
