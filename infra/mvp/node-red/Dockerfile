FROM nodered/node-red:5.0.7

COPY --chown=node-red:root settings.js /data/settings.js
COPY --chown=node-red:root flows.json /data/flows.json

USER node-red
