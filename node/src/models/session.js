const SessionDb = require("../db").Session;

// MARK: class Session
/**
 * A class that represents a session.
 */
class Session {
    // MARK: static getAllByStreamId
    /**
     * Gets all sessions for a stream.
     * @param {number} id The stream ID.
     * @returns {Session[]} The sessions.
     */
    static getAllByStreamId(id) {
        return SessionDb.getAllByStreamId(id).map((s) => new Session(s));
    }

    // MARK: constructor
    /**
     * Creates a new session object.
     * @param {Partial<Session>} data The session data.
     */
    constructor(data) {
        /**
         * The ID of the session.
         * @type {number}
         */
        this.id = data.id || 0;

        /**
         * The ID of the stream.
         * @type {number}
         */
        this.streamId = data.streamId || 0;

        /**
         * The date the session is scheduled to begin.
         * @type {Date}
         */
        this.date = data.date || new Date();

        /**
         * The players in the session.
         * @type {string[]}
         */
        this.players = data.players || [];
    }
}

module.exports = Session;
