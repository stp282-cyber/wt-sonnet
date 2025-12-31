-- Create a function to get grammar titles without fetching the full JSON
-- This runs inside Postgres, parses the JSON, and returns a lightweight array

CREATE OR REPLACE FUNCTION get_grammar_titles()
RETURNS TABLE (
    id TEXT,
    title TEXT,
    description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (book->>'id')::TEXT as id,
        (book->>'title')::TEXT as title,
        (book->>'description')::TEXT as description
    FROM grammar_lectures,
    jsonb_array_elements(content) as book
    LIMIT 20; -- Safety limit, though we expect few books
END;
$$;
