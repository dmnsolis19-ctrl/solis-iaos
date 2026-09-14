#!/bin/sh
set -eu

: "${MQTT_USERNAME:?MQTT_USERNAME is required}"
: "${MQTT_PASSWORD:?MQTT_PASSWORD is required}"
: "${SOLIS_TENANT_ID:?SOLIS_TENANT_ID is required}"
: "${SOLIS_GATEWAY_ID:?SOLIS_GATEWAY_ID is required}"

password_file="/mosquitto/data/passwords"
acl_file="/mosquitto/data/acl"
mkdir -p /mosquitto/data

if [ -f "$password_file" ]; then
  mosquitto_passwd -b "$password_file" "$MQTT_USERNAME" "$MQTT_PASSWORD"
else
  mosquitto_passwd -b -c "$password_file" "$MQTT_USERNAME" "$MQTT_PASSWORD"
fi

cat >"$acl_file" <<EOF
user ${MQTT_USERNAME}
topic write solis/v1/tenants/${SOLIS_TENANT_ID}/gateways/${SOLIS_GATEWAY_ID}/telemetry
topic write solis/v1/tenants/${SOLIS_TENANT_ID}/gateways/${SOLIS_GATEWAY_ID}/status
topic write solis/v1/tenants/${SOLIS_TENANT_ID}/gateways/${SOLIS_GATEWAY_ID}/diagnostics
topic write solis/v1/tenants/${SOLIS_TENANT_ID}/gateways/${SOLIS_GATEWAY_ID}/config/reported
topic read solis/v1/tenants/${SOLIS_TENANT_ID}/gateways/${SOLIS_GATEWAY_ID}/config/desired
topic read \$SYS/broker/version
EOF

chown -R mosquitto:mosquitto /mosquitto/data
chmod 0600 "$password_file" "$acl_file"

exec mosquitto -c /mosquitto/config/mosquitto.conf
