-- Fixed get_all_users function with proper type casting
DROP FUNCTION IF EXISTS get_all_users();

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  created_at timestamptz
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,  -- Cast to text
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))::text as name,
    COALESCE(au.raw_user_meta_data->>'role', 'USER')::text as role,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;
