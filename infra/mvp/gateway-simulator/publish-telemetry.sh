#!/bin/sh
set -eu

mqtt_host="${MQTT_HOST:-mqtt}"
mqtt_port="${MQTT_PORT:-1883}"
interval="${PUBLISH_INTERVAL_SECONDS:-5}"
tenant_id="${SOLIS_TENANT_ID:-018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76}"
gateway_id="${SOLIS_GATEWAY_ID:-555db956-bf4e-4f86-9483-a16c247b6212}"
gateway_profile="${SOLIS_GATEWAY_PROFILE:-wecon-h-ag}"
session_id="ee6aa92e-46f8-499f-874f-8fac6c15bb41"
topic="solis/v1/tenants/${tenant_id}/gateways/${gateway_id}/telemetry"
status_topic="solis/v1/tenants/${tenant_id}/gateways/${gateway_id}/status"

case "$interval" in
  ''|*[!0-9]*) echo "PUBLISH_INTERVAL_SECONDS must be a positive integer" >&2; exit 1 ;;
  0) echo "PUBLISH_INTERVAL_SECONDS must be greater than zero" >&2; exit 1 ;;
esac

publish_status() {
  occurred_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  status_id=$(printf '10000000-0000-4000-8000-%012d' "$sequence")
  mosquitto_pub -V mqttv5 -h "$mqtt_host" -p "$mqtt_port" -q 1 -r \
    -t "$status_topic" \
    -m "{\"schemaVersion\":\"1.0\",\"messageId\":\"${status_id}\",\"gatewayId\":\"${gateway_id}\",\"state\":\"ONLINE\",\"occurredAt\":\"${occurred_at}\",\"sessionId\":\"${session_id}\",\"activeConfigVersion\":1,\"agentVersion\":\"solis-lab-0.4.0\",\"reasonCode\":\"STARTED\"}"
}

sequence=0
publish_status

while true; do
  sequence=$((sequence + 1))
  source_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  message_id=$(printf '00000000-0000-4000-8000-%012d' "$sequence")
  pressure=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 4.60 + 0.25 * sin(n / 4) }')
  flow=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 118 + 9 * sin(n / 6) }')
  level=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 71 + 4 * sin(n / 10) }')
  temperature=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 22 + 1.5 * sin(n / 14) }')
  speed=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 1450 + 30 * sin(n / 8) }')
  ph=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 7.20 + 0.12 * sin(n / 12) }')
  conductivity=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 420 + 25 * sin(n / 9) }')
  turbidity=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 0.85 + 0.18 * sin(n / 7) }')
  chlorine=$(awk -v n="$sequence" 'BEGIN { printf "%.3f", 0.72 + 0.08 * sin(n / 11) }')
  if [ $((sequence % 20)) -lt 15 ]; then pump_running=true; else pump_running=false; fi
  if [ $((sequence % 30)) -eq 0 ]; then turbidity_quality="UNCERTAIN"; turbidity_detail="OUT_OF_RANGE"; else turbidity_quality="GOOD"; turbidity_detail="OK"; fi

  payload=$(printf '%s' "{
    \"schemaVersion\":\"1.0\",\"messageId\":\"${message_id}\",\"gatewayId\":\"${gateway_id}\",
    \"sessionId\":\"${session_id}\",\"sequence\":${sequence},\"sourceTime\":\"${source_time}\",\"clockStatus\":\"SYNCED\",\"configVersion\":1,
    \"samples\":[
      {\"sampleIndex\":0,\"variableId\":\"d3cda2ec-dda5-405c-81a9-5312f18d86af\",\"mappingId\":\"2b2c00b9-dbf8-478c-aae7-f0732dc0bb21\",\"dataType\":\"FLOAT64\",\"value\":${pressure},\"unitCode\":\"bar\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":1,\"variableId\":\"de1baad0-2ab7-4a96-bf7e-69a8e62a0139\",\"mappingId\":\"3cd2cb43-825d-451e-a102-c10aebec4678\",\"dataType\":\"FLOAT64\",\"value\":${flow},\"unitCode\":\"m3/h\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":2,\"variableId\":\"abc70054-df38-494c-bb19-f9f559bc40b6\",\"mappingId\":\"1f848ee6-536f-48fa-a2e7-5e56d30aebff\",\"dataType\":\"FLOAT64\",\"value\":${level},\"unitCode\":\"%\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":3,\"variableId\":\"1ead21fe-3ee8-484d-8fc5-a12252201c25\",\"mappingId\":\"48493dcb-c559-4935-9ef1-b69423465a87\",\"dataType\":\"BOOLEAN\",\"value\":${pump_running},\"unitCode\":\"1\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":4,\"variableId\":\"82c76d55-834d-4d8b-ae7c-e7cb28dcedbc\",\"mappingId\":\"f521f6e2-b58b-4597-8e87-e3dc5713e166\",\"dataType\":\"FLOAT64\",\"value\":${temperature},\"unitCode\":\"Cel\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":5,\"variableId\":\"51fa768b-e3c1-4093-bf5d-f857a44a7d5a\",\"mappingId\":\"7d70aa22-ecda-4978-b917-d39a27605203\",\"dataType\":\"FLOAT64\",\"value\":${speed},\"unitCode\":\"r/min\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":6,\"variableId\":\"5df7dd7c-71f1-44a5-a2d5-497f0981acb9\",\"mappingId\":\"94615e80-1e29-42d6-b3ca-e28a1bd3db24\",\"dataType\":\"FLOAT64\",\"value\":${ph},\"unitCode\":\"1\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":7,\"variableId\":\"d5150fdc-7eea-46a4-93f2-1cd746a30ad2\",\"mappingId\":\"e12fd5f7-9a44-4437-9d13-015291c4e122\",\"dataType\":\"FLOAT64\",\"value\":${conductivity},\"unitCode\":\"uS/cm\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"},
      {\"sampleIndex\":8,\"variableId\":\"77717868-ada6-47df-bb9d-4162ab4fc396\",\"mappingId\":\"d66a6bbe-a3b6-41a3-be65-916e31494540\",\"dataType\":\"FLOAT64\",\"value\":${turbidity},\"unitCode\":\"NTU\",\"quality\":\"${turbidity_quality}\",\"qualityDetail\":\"${turbidity_detail}\"},
      {\"sampleIndex\":9,\"variableId\":\"18b46d91-cff5-4784-9393-09d565ef49e8\",\"mappingId\":\"487ed8fb-334e-4563-a962-61b96618a70b\",\"dataType\":\"FLOAT64\",\"value\":${chlorine},\"unitCode\":\"mg/L\",\"quality\":\"GOOD\",\"qualityDetail\":\"OK\"}
    ]
  }")

  mosquitto_pub -V mqttv5 -h "$mqtt_host" -p "$mqtt_port" -q 1 -t "$topic" -m "$payload"
  publish_status
  touch /tmp/solis-last-publish
  echo "published profile=${gateway_profile} sequence=${sequence} samples=10"
  sleep "$interval"
done
