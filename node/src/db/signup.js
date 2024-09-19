const Db = require("./db"),
    Signup = require("../models/signup");

// MARK: class SignupDb extends Db
/**
 * A class that handles database calls for signups.
 */
class SignupDb extends Db {
    // MARK: static get key
    /**
     * Gets the key for the data.
     * @returns {string} The key for the data.
     */
    static get key() {
        return "signup";
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
     * Gets all signups for a stream.
     * @param {number} id The stream ID.
     * @returns {Partial<Signup>[]} The signups.
     */
    getAllByStreamId(id) {
        return this.data.filter((s) => s.streamId === id);
    }

    // MARK: remove
    /**
     * Removes a signup from the database.
     * @param {Signup} signup The signup.
     * @returns {void}
     */
    remove(signup) {
        const index = this.data.findIndex((e) => e.id === signup.id);

        if (index === -1) {
            return;
        }

        this.data.splice(index, 1);
    }
}

module.exports = SignupDb;
