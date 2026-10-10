#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${FESSIOR_ENV_FILE:-$ROOT_DIR/.env}"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.prod.yml"
JUDGE0_TEMPLATE="$ROOT_DIR/infra/judge0/judge0.env.example"
JUDGE0_CONFIG="$ROOT_DIR/infra/judge0/judge0.prod.conf"
TEMP_JUDGE0_CONFIG=""

cleanup() {
  if [[ -n "$TEMP_JUDGE0_CONFIG" && -f "$TEMP_JUDGE0_CONFIG" ]]; then
    rm -f -- "$TEMP_JUDGE0_CONFIG"
  fi
}
trap cleanup EXIT

fail() {
  printf 'deploy: %s\n' "$1" >&2
  exit 1
}

[[ -f "$ENV_FILE" ]] || fail "Missing $ENV_FILE. Copy .env.example to .env and set production values."
[[ -f "$JUDGE0_TEMPLATE" ]] || fail "Missing Judge0 config template: $JUDGE0_TEMPLATE"

# Read only the values this script validates. Docker Compose reads the complete
# file itself through --env-file. Never evaluate .env contents as shell code.
command -v python3 >/dev/null 2>&1 || fail "Python 3 is required to safely read .env values."
parsed_env=0
while IFS= read -r -d '' name && IFS= read -r -d '' value; do
  if [[ "$name" == "__FESSIOR_ENV_PARSE_OK__" ]]; then
    [[ "$value" == "1" ]] && parsed_env=1
    break
  fi
  [[ "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || fail "Invalid variable name in .env."
  printf -v "$name" '%s' "$value"
  export "$name"
done < <(python3 - "$ENV_FILE" <<'PY'
import re
import sys

allowed = {
    "DOMAIN", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_ROOT_PASSWORD", "MYSQL_PASSWORD",
    "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JUDGE0_POSTGRES_PASSWORD", "JUDGE0_REDIS_PASSWORD",
}
values = {}

def closing_quote(value, quote):
    escaped = False
    for index, character in enumerate(value[1:], start=1):
        if escaped:
            escaped = False
        elif character == "\\":
            escaped = True
        elif character == quote:
            return index
    return -1

try:
    with open(sys.argv[1], encoding="utf-8-sig") as env_file:
        lines = iter(env_file)
        for raw_line in lines:
            line = raw_line.rstrip("\r\n").lstrip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[7:].lstrip()
            key, separator, raw_value = line.partition("=")
            if not separator:
                continue
            key = key.strip()
            if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
                raise ValueError("invalid variable name")
            value = raw_value.lstrip()
            if value.startswith(("'", '"')):
                quote = value[0]
                while closing_quote(value, quote) < 0:
                    continuation = next(lines, None)
                    if continuation is None:
                        raise ValueError(f"unterminated quoted value for {key}")
                    value += "\n" + continuation.rstrip("\r\n")
                end = closing_quote(value, quote)
                trailing = value[end + 1:].strip()
                if trailing and not trailing.startswith("#"):
                    raise ValueError(f"unexpected text after quoted value for {key}")
                value = value[1:end]
                if quote == "'":
                    value = value.replace("\\'", "'")
                else:
                    value = value.replace("\\n", "\n").replace("\\r", "\r").replace("\\t", "\t")
                    value = value.replace('\\"', '"').replace("\\\\", "\\")
            else:
                value = re.split(r"\s+#", value, maxsplit=1)[0].rstrip()
            if "\0" in value:
                raise ValueError(f"NUL byte in value for {key}")
            values[key] = value

    output = sys.stdout.buffer
    for key in allowed:
        if key in values:
            output.write(key.encode() + b"\0" + values[key].encode() + b"\0")
    output.write(b"__FESSIOR_ENV_PARSE_OK__\0" + b"1\0")
except (OSError, UnicodeError, ValueError) as error:
    print(f"deploy: could not parse .env: {error}", file=sys.stderr)
    sys.exit(1)
PY
)
[[ "$parsed_env" == "1" ]] || fail "Could not safely parse $ENV_FILE."

required=(DOMAIN MYSQL_DATABASE MYSQL_USER MYSQL_ROOT_PASSWORD MYSQL_PASSWORD JWT_ACCESS_SECRET JWT_REFRESH_SECRET JUDGE0_POSTGRES_PASSWORD JUDGE0_REDIS_PASSWORD)
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || fail "$name must be set in .env."
done

[[ "$DOMAIN" =~ ^([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$ ]] || fail "DOMAIN must be a public DNS name, such as judge.example.org."
[[ "$DOMAIN" != *example* ]] || fail "Replace the example DOMAIN with your real DNS name."
[[ "$MYSQL_DATABASE" =~ ^[A-Za-z0-9_]+$ ]] || fail "MYSQL_DATABASE may contain only letters, numbers, and underscores."
[[ "$MYSQL_USER" =~ ^[A-Za-z0-9_]+$ ]] || fail "MYSQL_USER may contain only letters, numbers, and underscores."

for name in MYSQL_ROOT_PASSWORD MYSQL_PASSWORD JUDGE0_POSTGRES_PASSWORD JUDGE0_REDIS_PASSWORD; do
  value="${!name}"
  [[ "$value" =~ ^[A-Za-z0-9_-]{32,}$ ]] || fail "$name must be at least 32 URL-safe characters (letters, numbers, _ or -)."
  [[ "$value" != *replace* && "$value" != *change-me* ]] || fail "$name still contains a placeholder."
done

for name in JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
  value="${!name}"
  [[ "$value" =~ ^[A-Za-z0-9_-]{32,}$ ]] || fail "$name must be at least 32 URL-safe characters (letters, numbers, _ or -)."
  [[ "$value" != *your_jwt_* && "$value" != *replace* && "$value" != *change-me* ]] || fail "$name still contains a placeholder."
done

secret_names=(MYSQL_ROOT_PASSWORD MYSQL_PASSWORD JWT_ACCESS_SECRET JWT_REFRESH_SECRET JUDGE0_POSTGRES_PASSWORD JUDGE0_REDIS_PASSWORD)
for ((i = 0; i < ${#secret_names[@]}; i++)); do
  for ((j = i + 1; j < ${#secret_names[@]}; j++)); do
    first_name="${secret_names[i]}"
    second_name="${secret_names[j]}"
    [[ "${!first_name}" != "${!second_name}" ]] || fail "$first_name and $second_name must use different values."
  done
done

command -v docker >/dev/null 2>&1 || fail "Docker is required."
docker compose version >/dev/null 2>&1 || fail "Docker Compose plugin is required."

export COMPOSE_PROJECT_NAME=fessior-prod

TEMP_JUDGE0_CONFIG="$(mktemp "$ROOT_DIR/infra/judge0/.judge0.prod.conf.XXXXXX")"
sed \
  -e "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$JUDGE0_POSTGRES_PASSWORD/" \
  -e "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$JUDGE0_REDIS_PASSWORD/" \
  "$JUDGE0_TEMPLATE" > "$TEMP_JUDGE0_CONFIG"
grep -Fxq "POSTGRES_PASSWORD=$JUDGE0_POSTGRES_PASSWORD" "$TEMP_JUDGE0_CONFIG" || fail "Could not write the Judge0 PostgreSQL password into its runtime config."
grep -Fxq "REDIS_PASSWORD=$JUDGE0_REDIS_PASSWORD" "$TEMP_JUDGE0_CONFIG" || fail "Could not write the Judge0 Redis password into its runtime config."
chmod 600 "$TEMP_JUDGE0_CONFIG"
mv -- "$TEMP_JUDGE0_CONFIG" "$JUDGE0_CONFIG"
TEMP_JUDGE0_CONFIG=""

compose() {
  docker compose --env-file "$ENV_FILE" --project-name "$COMPOSE_PROJECT_NAME" -f "$COMPOSE_FILE" "$@"
}

printf 'Validating production Compose configuration...\n'
compose config --quiet

printf 'Building production images...\n'
compose build --pull frontend backend judge

printf 'Starting database and Judge0 state services...\n'
compose up -d --wait --wait-timeout 180 mysql redis judge0-db judge0-redis

printf 'Applying database migrations before replacing application containers...\n'
compose --profile tools run --rm migrate

printf 'Starting production application stack...\n'
compose up -d --remove-orphans --wait --wait-timeout 240

printf '\nProduction service status:\n'
compose ps
