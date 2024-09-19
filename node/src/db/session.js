/**
 * @typedef {import("../models/session")} Session
 */

const Db = require("./db");

// MARK: class SessionDb extends Db
/**
 * A class that handles database calls for sessions.
 */
class SessionDb extends Db {
    // MARK: static convertToData
    /**
     * Converts the session object to data.
     * @param {Session} session The session.
     * @returns {Partial<Session>} The session data.
     */
    static convertToData(session) {
        return {
            id: session.id,
            streamId: session.streamId,
            date: session.date
        };
    }

    // MARK: static get key
    /**
     * Gets the key for the data.
     * @returns {string} The key for the data.
     */
    static get key() {
        return "session";
    }

    // MARK: add
    /**
     * Adds a session to the database.
     * @param {Session} session The session.
     * @returns {number} The session ID.
     */
    add(session) {
        session.id = this.nextId();
        this.data.push(SessionDb.convertToData(session));
        return session.id;
    }

    // MARK: constructor
    /**
     * Creates a new event database object.
     */
    constructor() {
        super();
    }

    // MARK: getAllByStreamId
    /**
     * Gets all sessions for a stream.
     * @param {number} id The stream ID.
     * @returns {Partial<Session>[]} The sessions.
     */
    getAllByStreamId(id) {
        return this.data.filter((s) => s.streamId === id);
    }

    // MARK: remove
    /**
     * Removes a session from the database.
     * @param {Session} session The session.
     * @returns {void}
     */
    remove(session) {
        const index = this.data.findIndex((e) => e.id === session.id);

        if (index === -1) {
            return;
        }

        this.data.splice(index, 1);
    }

    // MARK: update
    /**
     * Updates a session in the database.
     * @param {Session} session The session.
     * @returns {void}
     */
    update(session) {
        const index = this.data.findIndex((e) => e.id === session.id);

        if (index === -1) {
            return;
        }

        this.data[index] = SessionDb.convertToData(session);
    }
}

module.exports = SessionDb;
