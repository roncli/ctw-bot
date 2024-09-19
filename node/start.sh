#!/bin/sh

# Validation.
if [ ! $APPINSIGHTS_INSTRUMENTATIONKEY ];
then
    echo "Warning: Application Insights is not setup.  Application will log to console."
fi

# Run app.
exec env APPINSIGHTS_INSTRUMENTATIONKEY=$(cat $APPINSIGHTS_INSTRUMENTATIONKEY) env DISCORD_CLIENTID=$(cat $DISCORD_CLIENTID_FILE) env DISCORD_TOKEN=$(cat $DISCORD_TOKEN_FILE) node index
