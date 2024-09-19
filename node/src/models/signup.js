const SignupDb = require("../db").Signup;

// MARK: class Signup
/**
 * A class that represents a signup.
 */
class Signup {
    // MARK: static getAllByStreamId
    /**
     * Gets all sessions for a stream.
     * @param {number} id The stream ID.
     * @returns {Signup[]} The sessions.
     */
    static getAllByStreamId(id) {
        return SignupDb.getAllByStreamId(id).map((s) => new Signup(s));
    }

    // MARK: constructor
    /**
     * Creates a new signup object.
     * @param {Partial<Signup>} data The signup data.
     */
    constructor(data) {
        /**
         * The ID of the signup.
         * @type {number}
         */
        this.id = data.id || void 0;

        /**
         * The ID of the stream.
         * @type {number}
         */
        this.streamId = data.streamId || void 0;

        /**
         * The Discord ID of the user who signed up.
         * @type {string}
         */
        this.discordId = data.discordId || void 0;

        /**
         * The date the user signed up.
         * @type {Date}
         */
        this.date = data.date || new Date();

        /**
         * The player's preferred session ID.
         * @type {number}
         */
        this.preferredSessionId = data.preferredSessionId || void 0;

        /**
         * Whether the user signed up for any session.
         * @type {boolean}
         */
        this.anySession = data.anySession || false;

        /**
         * The user's signup status.
         * @type {"alternate" | "confirmed"}
         */
        this.status = data.status || void 0;
    }
}

module.exports = Signup;
