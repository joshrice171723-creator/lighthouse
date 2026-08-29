param(
  [Parameter(Mandatory = $true)]
  [string]$SuperPassword
)

$ErrorActionPreference = "Stop"

$bin = "C:\Program Files\PostgreSQL\17\bin"
$data = "C:\PostgreSQL\17\data"
$service = "postgresql-x64-17"

$sql = @'
ALTER ROLE postgres PASSWORD '__PASSWORD__';
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin LOGIN PASSWORD '';
  ELSE
    ALTER ROLE admin LOGIN PASSWORD '';
  END IF;
END $$;
'@
$sql = $sql.Replace("__PASSWORD__", $SuperPassword.Replace("'", "''"))

Restart-Service -Name $service -Force
Start-Sleep -Seconds 2
& "$bin\psql.exe" -h 127.0.0.1 -p 5443 -U postgres -d postgres -v ON_ERROR_STOP=1 -c $sql
& "$bin\createdb.exe" -h 127.0.0.1 -p 5443 -U postgres backend_development 2>$null
& "$bin\createdb.exe" -h 127.0.0.1 -p 5443 -U postgres backend_test 2>$null

Get-Service -Name $service | Select-Object Name, Status, StartType
& "$bin\psql.exe" -h 127.0.0.1 -U admin -d backend_development -c "SELECT current_user, current_database();"
