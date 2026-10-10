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

# The deployment .env is a trusted operator-owned configuration file.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

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
