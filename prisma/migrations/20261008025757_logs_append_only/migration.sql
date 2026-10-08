CREATE OR REPLACE FUNCTION prevent_verification_log_changes()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'verification_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verification_logs_append_only
BEFORE UPDATE OR DELETE ON verification_logs
FOR EACH ROW EXECUTE FUNCTION prevent_verification_log_changes();