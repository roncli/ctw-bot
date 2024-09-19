const Db = require("./src/db"),
    Event = require("./src/models/event"),
    Discord = require("./src/discord"),
    Log = require("@roncli/node-application-insights-logger"),
    util = require("util");

process.on("unhandledRejection", (reason) => {
    Log.error("Unhandled promise rejection caught.", {err: reason instanceof Error ? reason : new Error(util.inspect(reason))});
});

// MARK: async function startup
/**
 * Starts up the application.
 */
(async function startup() {
    // Setup application insights.
    if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY !== "") {
        Log.setupApplicationInsights(process.env.APPINSIGHTS_INSTRUMENTATIONKEY, {application: "ctw-bot", container: "ctw-bot-node"});
    }

    Log.info("Starting up...");

    // Set title.
    if (process.platform === "win32") {
        process.title = "CTW Bot";
    } else {
        process.stdout.write("\x1b]2;CTW Bot\x1b\x5c");
    }

    // Startup Discord.
    Discord.startup();
    await Discord.connect();

    await Db.start();

    const events = Event.getAll();
    for (const event of events) {
        event.createJobs();

        for (const stream of event.streams) {
            stream.createJobs();
        }
    }
}());
