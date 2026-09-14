#!/bin/sh
set -eu

mqtt_host="${MQTT_HOST:-mqtt}"
mqtt_port="${MQTT_PORT:-1883}"
interval="${PUBLISH_INTERVAL_SECONDS:-5}"
tenant_id="${SOLIS_TENANT_ID:-018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76}"
gateway_id="${SOLIS_GATEWAY_ID:-555db956-bf4e-4f86-9483-a16c247b6212}"
session_id="ee6aa92e-46f8-499f-874f-8fac6c15bb41"
topic="solis/v1/tenants/${tenant_id}/gateways/${gateway_id}/telemetry"
status_topic="solis/v1/tenants/${tenant_id}/gateways/${gateway_id}/status"

case "$interval" in
  ''|*[!0-9]*) echo "PUBLISH_INTERVAL_SECONDS must be a positive integer" >&2; exit 1 ;;
  0) echo "PUBLISH_INTERVAL_SECONDS must be greater than zero" >&2; exit 1 ;;
esac

sequence=0

mosquitto_pub -V mqttv5 -h "$mqtt_host" -p "$mqtt_port" -q 1 -r \
  -t "$status_topic" \
  -m "{\"schemaVersion\":\"1.0\",\"gatewayId\":\"${gateway_id}\",\"state\":\"ONLINE\"}"

while true; do
  sequence=$((sequence + 1))
  source_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  message_id=$(printf '00000000-0000-4000-8000-%012d' "$sequence")
  pressure=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 4.60 + 0.25 * sin(n / 4) }')
  flow=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 118 + 9 * sin(n / 6) }')
  level=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 71 + 4 * sin(n / 10) }')

  if [ $((sequence % 20)) -lt 15 ]; then
    pump_running=true
  else
    pump_running=false
  fi

  payload=$(printf '%s' "{
    \"schemaVersion\":\"1.0\",
    \"messageId\":\"${message_id}\",
    \"gatewayId\":\"${gateway_id}\",
    \"sessionId\":\"${session_id}\",
    \"sequence\":${sequence},
    \"sourceTime\":\"${source_time}\",
    \"clockStatus\":\"SYNCED\",
    \"configVersion\":1,
    \"samples\":[
      {\"sampleIndex\":0,\"variableId\":\"d3cda2ec-dda5-405c-81a9-5312f18d86af\",\"mappingId\":\"2b2c00b9-dbf8-478c-aae7-f0732dc0bb21\",\"dataType\":\"FLOAT64\",\"value\":${pressure},\"unitCode\":\"bar\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":1,\"variableId\":\"de1baad0-2ab7-4a96-bf7e-69a8e62a0139\",\"mappingId\":\"3cd2cb43-825d-451e-a102-c10aebec4678\",\"dataType\":\"FLOAT64\",\"value\":${flow},\"unitCode\":\"m3/h\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":2,\"variableId\":\"abc70054-df38-494c-bb19-f9f559bc40b6\",\"mappingId\":\"1f848ee6-536f-48fa-a2e7-5e56d30aebff\",\"dataType\":\"FLOAT64\",\"value\":${level},\"unitCode\":\"pct\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":3,\"variableId\":\"1ead21fe-3ee8-484d-8fc5-a12252201c25\",\"mappingId\":\"48493dcb-c559-4935-9ef1-b69423465a87\",\"dataType\":\"BOOLEAN\",\"value\":${pump_running},\"unitCode\":\"state\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"}
    ]
  }")

  mosquitto_pub -V mqttv5 -h "$mqtt_host" -p "$mqtt_port" -q 1 -t "$topic" -m "$payload"
  touch /tmp/solis-last-publish
  echo "published sequence=${sequence} pressure=${pressure} flow=${flow} level=${level} pump=${pump_running}"
  sleep "$interval"
done
