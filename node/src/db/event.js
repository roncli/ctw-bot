/**
 * @typedef {import("../models/event")} Event
 */

const Db = require("./db");

// MARK: class EventDb extends Db
/**
 * A class that handles database calls for events.
 */
class EventDb extends Db {
    // MARK: static convertToData
    /**
     * Converts the event object to data.
     * @param {Event} event The event.
     * @returns {Partial<Event>} The event data.
     */
    static convertToData(event) {
        return {
            id: event.id,
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate
        };
    }

    // MARK: static get key
    /**
     * Gets the key for the data.
     * @returns {string} The key for the data.
     */
    static get key() {
        return "events";
    }

    // MARK: constructor
    /**
     * Creates a new event database object.
     */
    constructor() {
        super();
    }

    // MARK: add
    /**
     * Adds an event to the database.
     * @param {Event} event The event.
     * @returns {number} The event ID.
     */
    add(event) {
        event.id = this.nextId();
        this.data.push(EventDb.convertToData(event));
        return event.id;
    }

    // MARK: get
    /**
     * Gets an event by its ID.
     * @param {number} id The event ID.
     * @returns {Partial<Event>} The event.
     */
    get(id) {
        return this.data.find((e) => e.id === id);
    }

    // MARK: getAll
    /**
     * Gets all events.
     * @returns {Partial<Event>[]} The events.
     */
    getAll() {
        return this.data || [];
    }

    // MARK: remove
    /**
     * Removes an event from the database.
     * @param {Event} event The event.
     * @returns {void}
     */
    remove(event) {
        const index = this.data.findIndex((e) => e.id === event.id);

        if (index === -1) {
            return;
        }

        this.data.splice(index, 1);
    }

    // MARK: update
    /**
     * Updates an event in the database.
     * @param {Event} event The event.
     * @returns {void}
     */
    update(event) {
        const index = this.data.findIndex((e) => e.id === event.id);

        if (index === -1) {
            return;
        }

        this.data[index] = EventDb.convertToData(event);
    }
}

module.exports = EventDb;
