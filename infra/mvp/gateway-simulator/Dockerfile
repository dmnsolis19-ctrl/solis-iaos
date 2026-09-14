FROM eclipse-mosquitto:2.1.2-alpine

COPY publish-telemetry.sh /usr/local/bin/publish-telemetry

RUN chmod 0755 /usr/local/bin/publish-telemetry

USER mosquitto
ENTRYPOINT ["/usr/local/bin/publish-telemetry"]

