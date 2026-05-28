#!/bin/bash
set -euo pipefail

JUMP_HOST="${1:-10.2.7.1}"
JUMP_PORT="${2:-2202}"
JUMP_USER="${3:-ncadmin}"
MOODLE_HOST="${4:-192.168.86.28}"
MOODLE_PORT="${5:-2022}"
MOODLE_USER="${6:-ncadmin}"
MOODLE_DIR="/volume1/web/moodle"
PHP_BIN="/usr/local/bin/php74"
WEB_USER="http"
PLUGIN_DIR="$(cd "$(dirname "$0")/plugin-build" && pwd)"
SSH_CMD="ssh -o BatchMode=yes -J $JUMP_USER@$JUMP_HOST:$JUMP_PORT -p $MOODLE_PORT"

echo "============================================"
echo "Deploy on-site monitoring plugin via ProxyJump"
echo "============================================"
echo "Jump: $JUMP_USER@$JUMP_HOST:$JUMP_PORT"
echo "Host: $MOODLE_USER@$MOODLE_HOST:$MOODLE_PORT"
echo "Src:  $PLUGIN_DIR"
echo "Dest: $MOODLE_DIR/local/onsitemonitoring/"
echo "PHP:  $PHP_BIN"
echo ""

if ! $SSH_CMD "$MOODLE_USER@$MOODLE_HOST" "echo OK" 2>/dev/null; then
  echo "ERROR: Cannot SSH to Moodle host via proxyjump"
  exit 1
fi

echo "[1/5] Deploying files via tar+ssh..."
tar cz -C "$PLUGIN_DIR" . | $SSH_CMD "$MOODLE_USER@$MOODLE_HOST" \
  "sudo tar xz -C $MOODLE_DIR/local/onsitemonitoring && sudo chown -R $WEB_USER:$WEB_USER $MOODLE_DIR/local/onsitemonitoring"

echo ""
echo "[2/5] Running Moodle upgrade..."
$SSH_CMD "$MOODLE_USER@$MOODLE_HOST" \
  "cd $MOODLE_DIR && sudo -u $WEB_USER $PHP_BIN admin/cli/upgrade.php --non-interactive"

echo ""
echo "[3/5] Seeding demo data..."
$SSH_CMD "$MOODLE_USER@$MOODLE_HOST" \
  "sudo -u $WEB_USER $PHP_BIN $MOODLE_DIR/local/onsitemonitoring/scripts/seed_demo_data.php"

echo ""
echo "[4/5] Setting up webservice..."
TOKEN_LINE=$($SSH_CMD "$MOODLE_USER@$MOODLE_HOST" \
  "sudo -u $WEB_USER $PHP_BIN $MOODLE_DIR/local/onsitemonitoring/scripts/setup_webservice.php 2>/dev/null | grep 'TOKEN_SECRET=' || true")

if [ -n "$TOKEN_LINE" ]; then
  TOKEN="${TOKEN_LINE#TOKEN_SECRET=}"
else
  TOKEN=$($SSH_CMD "$MOODLE_USER@$MOODLE_HOST" \
    "$PHP_BIN -r \"require('$MOODLE_DIR/config.php'); global \\\$DB; \\\$s = \\\$DB->get_record('external_services', ['shortname'=>'onsitemonitoring']); if(\\\$s){ \\\$t = \\\$DB->get_record('external_tokens', ['externalserviceid'=>\\\$s->id], 'token', IGNORE_MULTIPLE); if(\\\$t) echo \\\$t->token; }\"")
fi

echo ""
echo "[5/5] Verification curl..."
$SSH_CMD "$MOODLE_USER@$MOODLE_HOST" \
  "curl -sk 'https://localhost/moodle/webservice/rest/server.php?wstoken=$TOKEN&wsfunction=local_onsitemonitoring_get_dashboard&moodlewsrestformat=json&tenant_id=DEMO001'"

echo ""
echo "============================================"
echo "DEPLOYMENT COMPLETE"
echo "============================================"
echo ""
echo "Dashboard URL (local network):"
echo "  https://vault.pxg.studio/moodle/local/onsitemonitoring/dashboard/?token=$TOKEN&tenant=DEMO001"
