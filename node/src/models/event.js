const Discord = require("../discord"),
    EventDb = require("../db").Event,
    Formatters = require("@discordjs/formatters"),
    SessionDb = require("../db").Session,
    Schedule = require("node-schedule"),
    SignupDb = require("../db").Signup,
    Stream = require("./stream"),
    StreamDb = require("../db").Stream;

/** @type {Object.<number, Schedule.Job>} */
const eventRemovalJobs = {};

// MARK: class Event
/**
 * A class that represents an event.
 */
class Event {
    // MARK: static get
    /**
     * Gets an event by its ID.
     * @param {number} id The event ID.
     * @returns {Event} The event.
     */
    static get(id) {
        const data = EventDb.get(id);
        if (data) {
            return new Event(data);
        }
        return void 0;
    }

    // MARK: static getAll
    /**
     * Gets all events.
     * @returns {Event[]} Gets all events.
     */
    static getAll() {
        return EventDb.getAll().map((e) => new Event(e));
    }

    // MARK: static async updateRotationSchedule
    /**
     * Updates the rotation schedule post.
     * @returns {Promise} A promise that resolves when the rotation schedule has been updated.
     */
    static async updateRotationSchedule() {
        const events = Event.getAll().sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        // Clear out the rotation schedule channel.
        Discord.rotationScheduleChannel.messages.fetch().then(async (messages) => {
            for (const [, message] of messages) {
                await message.delete();
            }
        });

        // Create the rotation schedule post.
        await Discord.richQueue({
            embed: Discord.embedBuilder({
                title: "**__Upcoming Events__**",
                fields: events.map((event) => ({
                    name: `${event.endDate ? `${event.startDate.toLocaleDateString("en-US", {month: "long", day: "numeric"})}${event.endDate.getTime() > event.startDate.getTime() ? ` to ${event.endDate.toLocaleDateString("en-US", {month: "long", day: "numeric"})}` : ""}` : `Week of ${event.startDate.toLocaleDateString("en-US", {month: "long", day: "numeric"})}`}`,
                    value: `**${event.title}**`,
                    inline: false
                }))
            }),
            channel: Discord.rotationScheduleChannel
        });
    }

    // MARK: constructor
    /**
     * Creates a new event object.
     * @param {Partial<Event>} data The event data.
     */
    constructor(data) {
        /**
         * The ID of the event.
         * @type {number}
         */
        this.id = data.id || void 0;

        /**
         * The title of the event.
         * @type {string}
         */
        this.title = data.title || void 0;

        /**
         * The date the event starts.
         * @type {Date}
         */
        this.startDate = data.startDate || void 0;

        /**
         * The date the event ends.
         * @type {Date}
         */
        this.endDate = data.endDate || (data.startDate ? new Date(data.startDate.getTime() + 1000 * 60 * 60 * 24 * 7) : void 0);

        /**
         * An array of streams for this event.
         * @type {Stream[]}
         */
        this.streams = this.id ? Stream.getAllByEventId(this.id) : [];
    }

    // MARK: createJobs
    /**
     * Creates the event's scheduled jobs.
     * @returns {void}
     */
    createJobs() {
        if (this.endDate) {
            eventRemovalJobs[this.id] = Schedule.scheduleJob(this.endDate, async () => {
                await this.remove();
            });
        }
    }

    // MARK: async remove
    /**
     * Removes the event.
     * @returns {Promise} A promise that resolves when the event has been removed.
     */
    async remove() {
        // Cancel the event's jobs.
        this.removeJobs();

        // Remove the event from the database.
        EventDb.remove(this);

        for (const stream of this.streams) {
            // Remove the stream's Discord items and cancel the stream's jobs.
            await stream.removeDiscordItems();
            stream.removeJobs();

            // Remove the stream from the database.
            StreamDb.remove(stream);

            for (const session of stream.sessions) {
                // Remove the session from the database.
                SessionDb.remove(session);
            }

            for (const signup of stream.signups) {
                // Remove the signup from the database.
                SignupDb.remove(signup);

                const member = Discord.findGuildMemberById(signup.discordId);

                if (member) {
                    await Discord.richQueue({
                        embed: Discord.embedBuilder({
                            title: "Event Cancelled",
                            description: `The event **${this.title}** has been cancelled.  Your signup for the stream at ${Formatters.time(stream.date, Formatters.TimestampStyles.LongDateTime)} has been removed.`
                        }),
                        channel: member.dmChannel
                    });
                }
            }
        }

        // Update the rotation schedule.
        await Event.updateRotationSchedule();

        // Save the data.
        await SignupDb.save();
        await SessionDb.save();
        await StreamDb.save();
        await EventDb.save();
    }

    // MARK: removeJobs
    /**
     * Removes the event's scheduled jobs.
     * @returns {void}
     */
    removeJobs() {
        if (eventRemovalJobs[this.id]) {
            eventRemovalJobs[this.id].cancel();
            delete eventRemovalJobs[this.id];
        }
    }

    // MARK: async save
    /**
     * Saves the event.
     * @returns {Promise} A promise that resolves when the event has been saved.
     */
    async save() {
        this.removeJobs();
        this.createJobs();

        if (this.id === void 0) {
            this.id = EventDb.add(this);
        } else {
            EventDb.update(this);
        }

        await Event.updateRotationSchedule();

        await EventDb.save();
    }
}

module.exports = Event;
