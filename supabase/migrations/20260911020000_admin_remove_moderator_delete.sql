create or replace function public.admin_remove_moderator(
  p_auth_user_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_role text;
  v_reason text;
  v_email text;
begin
  v_owner := private.require_owner();
  v_reason := btrim(coalesce(p_reason, ''));

  if char_length(v_reason) < 3 then
    raise exception 'reason required';
  end if;

  select a.role, u.email::text
    into v_role, v_email
  from private.admin_users a
  left join auth.users u on u.id = a.auth_user_id
  where a.auth_user_id = p_auth_user_id
  for update of a;

  if not found then
    raise exception 'admin user not found';
  end if;

  if v_role = 'owner' then
    raise exception 'owner cannot be removed';
  end if;

  insert into private.admin_actions(
    admin_auth_user_id,
    target_auth_user_id,
    action_type,
    reason,
    details
  )
  values (
    v_owner,
    p_auth_user_id,
    'moderator_remove',
    v_reason,
    jsonb_build_object('email', v_email)
  );

  delete from private.admin_users
  where auth_user_id = p_auth_user_id
    and role = 'moderator';

  if not found then
    raise exception 'moderator not found';
  end if;

  return true;
end;
$$;

revoke all on function public.admin_remove_moderator(uuid, text) from public, anon;
grant execute on function public.admin_remove_moderator(uuid, text) to authenticated;
