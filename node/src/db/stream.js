/**
 * @typedef {import("../models/stream")} Stream
 */

const Db = require("./db");

// MARK: class StreamDb extends Db
/**
 * A class that handles database calls for streams.
 */
class StreamDb extends Db {
    // MARK: static convertToData
    /**
     * Converts the stream object to data.
     * @param {Stream} stream The stream.
     * @returns {Partial<Stream>} The stream data.
     */
    static convertToData(stream) {
        return {
            id: stream.id,
            eventId: stream.eventId,
            hostDiscordId: stream.hostDiscordId,
            date: stream.date,
            discordChannelId: stream.discordChannelId,
            discordEventId: stream.discordEventId,
            signupStartDate: stream.signupStartDate,
            signupsStarted: stream.signupsStarted,
            signupMessageId: stream.signupMessageId
        };
    }

    // MARK: static get key
    /**
     * Gets the key for the data.
     * @returns {string} The key for the data.
     */
    static get key() {
        return "stream";
    }

    // MARK: constructor
    /**
     * Creates a new stream database object.
     */
    constructor() {
        super();
    }

    // MARK: add
    /**
     * Adds a stream to the database.
     * @param {Stream} stream The stream.
     * @returns {number} The stream ID.
     */
    add(stream) {
        stream.id = this.nextId();
        this.data.push(StreamDb.convertToData(stream));
        return stream.id;
    }

    // MARK: get
    /**
     * Gets a stream by its ID.
     * @param {number} id The stream ID.
     * @returns {Partial<Stream>} The stream.
     */
    get(id) {
        return this.data.find((s) => s.id === id);
    }

    // MARK: getAll
    /**
     * Gets all streams.
     * @returns {Partial<Stream>[]} The streams.
     */
    getAll() {
        return this.data || [];
    }

    // MARK: getAllByEventId
    /**
     * Gets all streams for an event.
     * @param {number} id The event ID.
     * @returns {Partial<Stream>[]} The streams.
     */
    getAllByEventId(id) {
        return this.data.filter((s) => s.eventId === id);
    }

    // MARK: getBySignupMessageId
    /**
     * Gets a stream by its signup message ID.
     * @param {string} messageId The message ID.
     * @returns {Partial<Stream>} The stream.
     */
    getBySignupMessageId(messageId) {
        return this.data.find((s) => s.signupMessageId === messageId);
    }

    // MARK: getUpcomingStartedStreamByMember
    /**
     * Gets the upcoming stream for a member that has been started.
     * @param {string} hostDiscordId The host's Discord ID.
     * @returns {Partial<Stream>} The stream.
     */
    getUpcomingStartedStreamByMember(hostDiscordId) {
        return this.data.find((s) => s.hostDiscordId === hostDiscordId && s.discordChannelId);
    }

    // MARK: getUpcomingStreamByMember
    /**
     * Gets the upcoming stream for a member that has not been started.
     * @param {string} hostDiscordId The host's Discord ID.
     * @returns {Partial<Stream>} The stream.
     */
    getUpcomingStreamByMember(hostDiscordId) {
        return this.data.find((s) => s.hostDiscordId === hostDiscordId && !s.discordChannelId);
    }

    // MARK: remove
    /**
     * Removes a stream from the database.
     * @param {Stream} stream The stream.
     * @returns {void}
     */
    remove(stream) {
        const index = this.data.findIndex((e) => e.id === stream.id);

        if (index === -1) {
            return;
        }

        this.data.splice(index, 1);
    }

    // MARK: update
    /**
     * Updates a stream in the database.
     * @param {Stream} stream The stream.
     * @returns {void}
     */
    update(stream) {
        const index = this.data.findIndex((e) => e.id === stream.id);

        if (index === -1) {
            return;
        }

        this.data[index] = StreamDb.convertToData(stream);
    }
}

module.exports = StreamDb;
