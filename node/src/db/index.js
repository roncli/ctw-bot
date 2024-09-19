const EventDb = require("./event"),
    SessionDb = require("./session"),
    SignupDb = require("./signup"),
    StreamDb = require("./stream");

// MARK: class Db
/**
 * A class that sets up the database.
 */
class Db {
    /**
     * The event database.
     * @type {EventDb}
     */
    static Event = null;

    /**
     * The session database.
     * @type {SessionDb}
     */
    static Session = null; // add a static property for the session database

    /**
     * The signup database.
     * @type {SignupDb}
     */
    static Signup = null; // add a static property for the signup database

    /**
     * The stream database.
     * @type {StreamDb}
     */
    static Stream = null;

    // MARK: static async start
    /**
     * Initializes the database.
     * @returns {Promise} A promise that resolves when the database is started up.
     */
    static async start() {
        await Promise.all([
            (async () => {
                if (Db.Event) {
                    return;
                }

                Db.Event = new EventDb();

                await Db.Event.load();
            })(),
            (async () => {
                if (Db.Stream) {
                    return;
                }

                Db.Stream = new StreamDb();

                await Db.Stream.load();
            })(),
            (async () => {
                if (Db.Session) {
                    return;
                }

                Db.Session = new SessionDb();

                await Db.Session.load();
            })(),
            (async () => {
                if (Db.Signup) {
                    return;
                }

                Db.Signup = new SignupDb();

                await Db.Signup.load();
            })()
        ]);
    }
}

module.exports = Db;
