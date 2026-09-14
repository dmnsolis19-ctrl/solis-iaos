FROM eclipse-mosquitto:2.1.2

COPY mosquitto.conf /mosquitto/config/mosquitto.conf
COPY entrypoint.sh /usr/local/bin/solis-mosquitto-entrypoint

RUN chmod 0755 /usr/local/bin/solis-mosquitto-entrypoint

ENTRYPOINT ["/usr/local/bin/solis-mosquitto-entrypoint"]
