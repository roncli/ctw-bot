const Discord = require("../discord"),
    DiscordJs = require("discord.js"),
    EventDb = require("../db").Event,
    Formatters = require("@discordjs/formatters"),
    Schedule = require("node-schedule"),
    Session = require("./session"),
    SessionDb = require("../db").Session,
    Signup = require("./signup"),
    SignupDb = require("../db").Signup,
    StreamDb = require("../db").Stream;

/** @type {Object.<number, Schedule.Job>} */
const streamRemovalJobs = {};

/** @type {Object.<number, Schedule.Job>} */
const streamSignupJobs = {};

// MARK: class Stream
/**
 * A class that represents a stream.
 */
class Stream {
    // MARK: static get
    /**
     * Gets a stream by its ID.
     * @param {number} id The stream ID.
     * @returns {Stream} The stream.
     */
    static get(id) {
        const data = StreamDb.get(id);
        if (data) {
            return new Stream(data);
        }
        return void 0;
    }

    // MARK: static getAll
    /**
     * Gets all streams.
     * @returns {Stream[]} The streams.
     */
    static getAll() {
        return StreamDb.getAll().map((s) => new Stream(s));
    }

    // MARK: static getAllByEventId
    /**
     * Gets all streams for an event.
     * @param {number} id The event ID.
     * @returns {Stream[]} The streams.
     */
    static getAllByEventId(id) {
        return StreamDb.getAllByEventId(id).map((s) => new Stream(s));
    }

    // MARK: static getBySignupMessageId
    /**
     * Gets a stream by its signup message ID.
     * @param {string} messageId The message ID.
     * @returns {Stream} The stream.
     */
    static getBySignupMessageId(messageId) {
        const data = StreamDb.getBySignupMessageId(messageId);
        if (data) {
            return new Stream(data);
        }
        return void 0;
    }

    // MARK: static getUpcomingStartedStreamByMember
    /**
     * Gets the upcoming stream for a member that has been started.
     * @param {DiscordJs.GuildMember} member The host.
     * @returns {Stream} The stream.
     */
    static getUpcomingStartedStreamByMember(member) {
        const data = StreamDb.getUpcomingStartedStreamByMember(member.id);
        if (data) {
            return new Stream(data);
        }
        return void 0;
    }

    // MARK: static getUpcomingStreamByMember
    /**
     * Gets the upcoming stream for a member that has not been started.
     * @param {DiscordJs.GuildMember} member The host.
     * @returns {Stream} The stream.
     */
    static getUpcomingStreamByMember(member) {
        const data = StreamDb.getUpcomingStreamByMember(member.id);
        if (data) {
            return new Stream(data);
        }
        return void 0;
    }

    // MARK: constructor
    /**
     * Creates a new stream object.
     * @param {Partial<Stream>} data The stream data.
     */
    constructor(data) {
        /**
         * The ID of the stream.
         * @type {number}
         */
        this.id = data.id || void 0;

        /**
         * The ID of the event.
         * @type {number}
         */
        this.eventId = data.eventId || void 0;

        /**
         * The Discord ID of the stream's host.
         * @type {string}
         */
        this.hostDiscordId = data.hostDiscordId || void 0;

        /**
         * The date the stream is scheduled to begin.
         * @type {Date}
         */
        this.date = data.date || void 0;

        /**
         * The Discord channel ID of the stream.
         * @type {string}
         */
        this.discordChannelId = data.discordChannelId || void 0;

        /**
         * The Discord event ID for the stream.
         * @type {string}
         */
        this.discordEventId = data.discordEventId || void 0;

        /**
         * The date signups start for the stream.
         * @type {Date}
         */
        this.signupStartDate = data.signupStartDate || void 0;

        /**
         * Whether signups have started for the stream.
         * @type {boolean}
         */
        this.signupsStarted = data.signupsStarted || false;

        /**
         * The signup message ID for the stream.
         * @type {string}
         */
        this.signupMessageId = data.signupMessageId || void 0;

        /**
         * Who has signed up for the stream.
         * @type {Signup[]}
         */
        this.signups = this.id ? Signup.getAllByStreamId(this.id) : [];

        /**
         * The sessions for the stream.
         * @type {Session[]}
         */
        this.sessions = this.id ? Session.getAllByStreamId(this.id) : [];
    }

    // MARK: get channel
    /**
     * Gets the stream's Discord channel.
     * @returns {DiscordJs.TextChannel} The stream's Discord channel.
     */
    get channel() {
        return /** @type {DiscordJs.TextChannel} */(Discord.findChannelById(this.discordChannelId)); // eslint-disable-line @stylistic/no-extra-parens
    }

    // MARK: async addSessions
    /**
     * Adds the specified number of sessions to the stream.
     * @param {number} sessions The number of sessions to add.
     * @returns {Promise} A promise that resolves when the sessions have been added.
     */
    async addSessions(sessions) {
        for (let i = 0; i < sessions; i++) {
            const session = new Session({
                streamId: this.id,
                date: new Date(this.date.getTime() + i * 1000 * 60 * 60 * 2)
            });

            SessionDb.add(session);

            this.sessions.push(session);
        }

        await SessionDb.save();

        await this.save();
    }

    // MARK: async addSignup
    /**
     * Adds a signup to the stream.
     * @param {DiscordJs.User} user The user signing up.
     * @param {number} [session] The session the user is signing up for.  If not specified, the user is signing up for any session.
     * @returns {Promise} A promise that resolves when the signup has been added.
     */
    async addSignup(user, session) {
        // Check if the user has already signed up.
        let signup = this.signups.find((s) => s.discordId === user.id);

        // Get the session ID for the session the user is signing up for.
        const sessionId = session ? this.sessions[session].id : void 0;

        if (signup.preferredSessionId === sessionId) {
            // User is already signed up for this session, just bail.
            return;
        }

        // Get all signups for the event.
        const streams = Stream.getAllByEventId(this.eventId);
        const otherEventSignups = streams.filter((s) => s.id !== this.id).flatMap((s) => s.signups);

        // Determine if the user should automatically be an alternate.
        let autoAlternate = !!otherEventSignups.find((s) => s.discordId === user.id && s.status === "confirmed");

        // If the alternate start date has passed, the user is not automatically an alternate.
        const alternateStartDate = new Date(Math.min(
            this.signupStartDate.getTime() + 60 * 60 * 1000,
            this.sessions[0].date.getTime() - 15 * 60 * 1000
        ));

        if (Date.now() >= alternateStartDate.getTime()) {
            autoAlternate = false;
        }

        if (signup) {
            if (autoAlternate && signup.status === "alternate") {
                // Allow the session change.
                signup.preferredSessionId = sessionId;
                signup.anySession = sessionId === void 0;
                signup.status = "alternate";
                await signup.save();

                Discord.richQueue({
                    embed: Discord.embedBuilder({
                        title: "Session Change",
                        description: `You have signed up as an _ALTERNATE_ for ${sessionId ? `session ${session + 1}` : "any session"}.`
                    }),
                    channel: this.channel
                });
            } else if (sessionId) {
                // Check if the session is full.
                const sessionSignups = this.signups.filter((s) => s.preferredSessionId === sessionId && s.status === "confirmed");

                if (sessionSignups.length < 8) {
                    // Allow the session change.
                    signup.preferredSessionId = sessionId;
                    signup.anySession = sessionId === void 0;
                    signup.status = "confirmed";
                    await signup.save();

                    Discord.richQueue({
                        embed: Discord.embedBuilder({
                            title: "Session Change",
                            description: `You are **CONFIRMED** for ${sessionId ? `session ${session + 1}` : "any session"}.`
                        }),
                        channel: this.channel
                    });
                } else {
                    Discord.richQueue({
                        embed: Discord.embedBuilder({
                            title: "Session Full",
                            description: "The session you are trying to sign up for is full.  If you would like to sign up as an alternate for this session, you will need to `/withdraw` and sign up again."
                        }),
                        channel: this.channel
                    });
                }
            } else {
                const totalSignups = this.signups.filter((s) => s.status === "confirmed");

                if (totalSignups.length < 8 * this.sessions.length || signup.status === "alternate") {
                    // Allow the session change.
                } else {
                    Discord.richQueye({
                        embed: Discord.embedBuilder({
                            title: "Event Full",
                            description: "All sessions are full."
                        }),
                        channel: this.channel
                    })
                }
            }
        } else if (sessionId) {
            // Allow the signup.
            const sessionSignups = this.signups.filter((s) => s.preferredSessionId === sessionId && s.status === "confirmed");

            signup = new Signup({
                streamId: this.id,
                discordId: user.id,
                preferredSessionId: session ? this.sessions[session].id : void 0,
                anySession: !session,
                status: autoAlternate || sessionSignups.length >= 8 ? "alternate" : "confirmed"
            });

            // TODO: Confirm the signup with the user.
        } else {
            // Check if there are any spots available in any session.
            const anySessionSignups = this.signups.filter((s) => !s.preferredSessionId && s.status === "confirmed");

            signup = new Signup({
                streamId: this.id,
                discordId: user.id,
                preferredSessionId: void 0,
                anySession: true,
                status: autoAlternate || anySessionSignups.length >= 8 * this.sessions.length ? "alternate" : "confirmed"
            });

            // TODO: Confirm the signup with the user.
        }

        // TODO: If the number of signups without a preferred session is equal to the number of signup spots remaining, assign the signups to a preferred session.

        this.signups.push(signup);
    }

    // MARK: createJobs
    /**
     * Creates the event's scheduled jobs.
     * @returns {void}
     */
    createJobs() {
        const expiry = new Date(this.date.getTime() + 24 * 60 * 60 * 1000);

        streamRemovalJobs[this.id] = Schedule.scheduleJob(expiry, async () => {
            await this.remove();
        });

        if (this.signupStartDate && !this.signupsStarted) {
            streamSignupJobs[this.id] = Schedule.scheduleJob(this.signupStartDate, async () => {
                await this.openSignups();
            });
        }
    }

    // MARK: async openSignups
    /**
     * Opens signups for the stream.
     * @returns {Promise} A promise that resolves when signups have opened.
     */
    async openSignups() {
        const event = EventDb.get(this.eventId);

        // Send a message to the stream's Discord channel.
        const embed = Discord.embedBuilder({
            title: `${event.title} Signups`,
            description: `Signups for **${event.title}** have begun!`
        });

        for (let index = 0; index < this.sessions.length; index++) {
            const session = this.sessions[index];
            embed.addFields({
                name: `Session ${index + 1} at ${Formatters.time(session.date, Formatters.TimestampStyles.LongDateTime)}`,
                value: `React with ${["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][index]} to sign up for this session.`,
                inline: true
            });
        }

        if (this.sessions.length > 1) {
            embed.addFields({
                name: "Any session",
                value: "React with 🔄 to sign up for any session.",
                inline: true
            });
        }

        embed.addFields({
            name: "Withdrawing",
            value: "To withdraw from the event, use the /withdraw command.  If you just wish to change the session you're signed up for and there is still room in that session, react to this message with the new session emoji.",
            inline: false
        });

        const message = await Discord.richQueue({
            content: `${Discord.upcomingMatchesRole}`,
            embed,
            channel: this.channel
        });

        // Update the stream.
        this.signupsStarted = true;
        this.signupMessageId = message.id;

        // Save the stream.
        await this.save();

        // Add reactions.
        for (let index = 0; index < this.sessions.length; index++) {
            await message.react(["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][index]);
        }

        if (this.sessions.length > 1) {
            await message.react("🔄");
        }
    }

    // MARK: async remove
    /**
     * Removes the stream.
     * @returns {Promise} A promise that resolves when the stream has been removed.
     */
    async remove() {
        // Remove the stream's Discord items and cancel the stream's jobs.
        await this.removeDiscordItems();
        this.removeJobs();

        // Remove the stream from the database.
        StreamDb.remove(this);

        for (const session of this.sessions) {
            // Remove the session from the database.
            SessionDb.remove(session);
        }

        for (const signup of this.signups) {
            // Remove the signup from the database.
            SignupDb.remove(signup);

            const member = Discord.findGuildMemberById(signup.discordId);

            if (member) {
                await Discord.richQueue({
                    embed: Discord.embedBuilder({
                        title: "Stream Cancelled",
                        description: `Your signup for the stream at ${Formatters.time(this.date, Formatters.TimestampStyles.LongDateTime)} has been removed.`
                    }),
                    channel: member.dmChannel
                });
            }
        }
    }

    // MARK: async removeDiscordItems
    /**
     * Removes the stream's Discord items.
     * @returns {Promise} A promise that resolves when the Discord items have been removed.
     */
    async removeDiscordItems() {
        if (this.channel) {
            await this.channel.delete();
        }

        const event = Discord.findEventById(this.discordEventId);

        if (event) {
            try {
                await event.delete();
            } catch (_) {}
        }
    }

    // MARK: removeJobs
    /**
     * Removes the stream's scheduled jobs.
     * @returns {void}
     */
    removeJobs() {
        if (streamRemovalJobs[this.id]) {
            streamRemovalJobs[this.id].cancel();
            delete streamRemovalJobs[this.id];
        }

        if (streamSignupJobs[this.id]) {
            streamSignupJobs[this.id].cancel();
            delete streamSignupJobs[this.id];
        }
    }

    // MARK: async removeSignup
    /**
     * Removes a signup from the stream.
     * @param {DiscordJs.User} user The user signing up.
     * @returns {Promise} A promise that resolves when the signup has been added.
     */
    async removeSignup(user) {
        // Get the signup.
        const signup = this.signups.find((s) => s.discordId === user.id);

        if (signup) {
            await signup.remove();
            this.signups = this.signups.filter((s) => s !== signup);
        }

        // TODO: Shuffle players around if necessary.

        // Update the pinned post.
        await this.save();
    }

    // MARK: async save
    /**
     * Saves the stream.
     * @returns {Promise} A promise that resolves when the stream has been saved.
     */
    async save() {
        this.removeJobs();
        this.createJobs();

        if (this.discordChannelId) {
            await this.updatePinnedPost();
        }
        await this.updateDiscordEvent();

        if (this.id === void 0) {
            this.id = StreamDb.add(this);
        } else {
            StreamDb.update(this);
        }

        await StreamDb.save();
    }

    // MARK: async startSignups
    /**
     * Starts signups for the stream.
     * @returns {Promise} A promise that resolves when signups have started.
     */
    async startSignups() {
        const event = EventDb.get(this.eventId);

        // Create the stream's Discord channel.
        const channel = /** @type {DiscordJs.TextChannel} */(await Discord.createChannel(`${event.title}-${this.date.toLocaleDateString("en-us", {month: "long", day: "numeric"})}`, DiscordJs.ChannelType.GuildText, void 0, Discord.weeklyEventsCategory, "Signups opened.")); // eslint-disable-line @stylistic/no-extra-parens

        this.discordChannelId = channel.id;
        this.signupStartDate = new Date(Date.now() + 15 * 60 * 1000);

        // Save the stream.
        await this.save();

        // Send a message to the stream's Discord channel.
        const embed = Discord.embedBuilder({
            title: `${event.title} Signups`,
            description: `Signups for **${event.title}** will begin ${Formatters.time(this.signupStartDate, Formatters.TimestampStyles.RelativeTime)} at ${Formatters.time(this.signupStartDate, Formatters.TimestampStyles.LongDateTime)}.`
        });

        for (let index = 0; index < this.sessions.length; index++) {
            const session = this.sessions[index];
            embed.addFields({
                name: `Session ${index + 1}`,
                value: `Begins ${Formatters.time(session.date, Formatters.TimestampStyles.RelativeTime)} at ${Formatters.time(session.date, Formatters.TimestampStyles.LongDateTime)}`
            });
        }

        await Discord.richQueue({
            content: `${Discord.upcomingMatchesRole}`,
            embed,
            channel
        });
    }

    // MARK: async updateDiscordEvent
    /**
     * Updates the stream's Discord event.
     * @returns {Promise} A promise that resolves when the Discord event has been updated.
     */
    async updateDiscordEvent() {
        if (this.sessions.length === 0) {
            return;
        }

        const event = EventDb.get(this.eventId);

        let discordEvent = Discord.findEventById(this.discordEventId);

        if (discordEvent) {
            const endDate = new Date(this.date.getTime() + 1000 * 60 * 60 * 2 * this.sessions.length);
            if (
                discordEvent.scheduledStartAt.getTime() !== this.date.getTime() ||
                discordEvent.scheduledEndAt.getTime() !== endDate.getTime()
            ) {
                discordEvent.edit({
                    scheduledStartTime: this.date,
                    scheduledEndTime: endDate,
                    reason: "Stream update."
                });
            }
        } else {
            discordEvent = await Discord.createEvent({
                name: event.title,
                scheduledStartTime: this.date,
                scheduledEndTime: new Date(this.date.getTime() + 1000 * 60 * 60 * 2 * this.sessions.length),
                privacyLevel: DiscordJs.GuildScheduledEventPrivacyLevel.GuildOnly,
                entityType: DiscordJs.GuildScheduledEventEntityType.External,
                entityMetadata: {location: "https://twitch.tv/tetriswars"},
                reason: "Stream update."
            });

            this.discordEventId = discordEvent.id;
        }
    }

    // MARK: async updatePinnedPost
    /**
     * Updates the stream's pinned post.
     * @returns {Promise} A promise that resolves when the pinned post has been updated.
     */
    async updatePinnedPost() {
        const event = EventDb.get(this.eventId);

        // Get the pinned post.
        const messages = await this.channel.messages.fetchPinned();
        const pinnedMessages = [];

        for (const message of messages.values()) {
            if (Discord.isSelf(message.author)) {
                pinnedMessages.push(message);
            } else {
                await message.unpin();
            }
        }

        const embed = Discord.embedBuilder({
            title: `${event.title}`,
            description: `Hosted by <@${this.hostDiscordId}>`,
            fields: []
        });

        if (Date.now() < this.signupStartDate.getTime()) {
            embed.addFields({
                name: "Signups not yet open",
                value: `Signups will begin ${Formatters.time(this.signupStartDate, Formatters.TimestampStyles.RelativeTime)} at ${Formatters.time(this.signupStartDate, Formatters.TimestampStyles.LongTime)}.`,
                inline: false
            });
        } else {
            embed.addFields({
                name: "Signups are open!",
                value: "You may sign up throughout the course of the stream.  To sign up, react to the pinned signup post.",
                inline: false
            });

            const alternateStartDate = new Date(Math.min(
                this.signupStartDate.getTime() + 60 * 60 * 1000,
                this.sessions[0].date.getTime() - 15 * 60 * 1000
            ));

            if (Date.now() < alternateStartDate.getTime()) {
                embed.addFields({
                    name: "Alternates",
                    value: `If you are listed as an alternate, you will be notified if a spot opens up for you.  Also, if there are still spots available ${Formatters.time(alternateStartDate, Formatters.TimestampStyles.RelativeTime)} at ${Formatters.time(alternateStartDate, Formatters.TimestampStyles.LongTime)}, alternates who played in previous streams for this event will be automatically added.`,
                    inline: false
                });
            } else {
                embed.addFields({
                    name: "Alternates",
                    value: "If you are listed as an alternate, you will be notified if a spot opens up for you.",
                    inline: false
                });
            }
        }

        for (let index = 0; index < this.sessions.length; index++) {
            const session = this.sessions[index],
                signups = this.signups.filter((s) => s.preferredSessionId === session.id && s.status === "confirmed").map((s) => `<@${s.discordId}>`);

            while (signups.length < 8) {
                signups.push("<open>");
            }

            embed.addFields({
                name: `Session ${index + 1} at ${Formatters.time(session.date, Formatters.TimestampStyles.LongTime)}`,
                value: signups.join("\n"),
                inline: true
            });
        }

        const signups = this.signups.filter((s) => !s.preferredSessionId && s.status === "confirmed").map((s) => `<@${s.discordId}>`);

        if (signups.length > 0) {
            embed.addFields({
                name: "Any session",
                value: signups.join("\n"),
                inline: true
            });
        }

        const alternates = this.signups.filter((s) => s.status === "alternate").map((s) => `<@${s.discordId}> (${s.preferredSessionId ? `Session ${this.sessions.findIndex((ses) => ses.id === s.preferredSessionId) + 1}` : "Any session"})`);

        if (alternates.length > 0) {
            embed.addFields({
                name: "Alternates",
                value: alternates.join("\n"),
                inline: true
            });
        }

        if (pinnedMessages.length === 0) {
            // Create the messsage.
            const message = await Discord.richQueue({
                embed,
                channel: this.channel
            });

            await message.pin();
        } else {
            // Update the message.
            await pinnedMessages[0].edit({embeds: [embed]});
        }
    }

    // MARK: async UpdateSessions
    /**
     * Updates the session date when the stream's date is updated.
     * @param {Date} oldDate The old date of the stream.
     * @returns {Promise} A promise that resolves when the sessions have been updated.
     */
    async updateSessions(oldDate) {
        const diff = this.date.getTime() - oldDate.getTime();

        for (const session of this.sessions) {
            session.date = new Date(session.date.getTime() + diff);
            SessionDb.update(session);
        }

        await SessionDb.save();
    }
}

module.exports = Stream;
