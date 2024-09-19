/**
 * @typedef {import("discord.js").ChatInputCommandInteraction} DiscordJs.ChatInputCommandInteraction
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 */
const Discord = require("../discord"),
    Event = require("../models/event"),
    Stream = require("../models/stream"),
    tc = require("timezonecomplete"),
    Warning = require("../errors/warning");

// MARK: class Validation
/**
 * A class to handle command validations.
 */
class Validation {
    // MARK: static async dateShouldBeValid
    /**
     * Validates that a date is valid.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} date The date string.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Date>} A promise that returns the date.
     */
    static async dateShouldBeValid(interaction, date, member) {
        const now = new Date();

        const tz = tc.TimeZone.zone("UTC");

        let dt;
        try {
            dt = new Date(new tc.DateTime(new Date(`${date} UTC`).toISOString(), tz).startOfDay().toIsoString());
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I couldn't parse that date and time.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid date.");
        }

        if (dt.getFullYear() === 2001 && date.indexOf("2001") === -1) {
            dt.setFullYear(now.getFullYear());
            if (dt.getTime() < now.getTime()) {
                dt.setFullYear(now.getFullYear() + 1);
            }
        }

        if (!date || isNaN(dt.valueOf())) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I couldn't parse that date and time.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid date.");
        }

        return dt;
    }

    // MARK: static async datetimeShouldBeValid
    /**
     * Validates that a datetime is valid.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} datetime The datetime string.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Date>} A promise that returns the datetime.
     */
    static async datetimeShouldBeValid(interaction, datetime, member) {
        const now = new Date();

        const tz = tc.TimeZone.zone("UTC");

        let dt;
        try {
            // TODO: Get the user's timezone.
            dt = new Date(new tc.DateTime(new Date(`${datetime} UTC`).toISOString(), tz).toIsoString());
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I couldn't parse that date and time.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid date.");
        }

        if (dt.getFullYear() === 2001 && datetime.indexOf("2001") === -1) {
            dt.setFullYear(now.getFullYear());
            if (dt.getTime() < now.getTime()) {
                dt.setFullYear(now.getFullYear() + 1);
            }
        }

        if (!datetime || isNaN(dt.valueOf())) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I couldn't parse that date and time.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid date.");
        }

        return dt;
    }

    // MARK: static async eventShouldExist
    /**
     * Validates that an event exists.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {number} id The event ID.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Event>} A promise that returns the event.
     */
    static async eventShouldExist(interaction, id, member) {
        const event = Event.get(id);

        if (!event) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I couldn't find an event with the ID ${id}.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Event does not exist.");
        }

        return event;
    }

    // MARK: static async memberShouldBeRestreamer
    /**
     * Validates that the member is a restreamer.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldBeRestreamer(interaction, member) {
        if (!Discord.isRestreamer(member)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must be a restreamer to use this command.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is not a restreamer.");
        }
    }

    // MARK: static async memberShouldHaveUpcomingStream
    /**
     * Validates that the member should have an upcoming stream.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Stream>} A promise that resolves when the validation is complete.
     */
    static async memberShouldHaveUpcomingStream(interaction, member) {
        const stream = Stream.getUpcomingStreamByMember(member);

        if (!stream) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you don't have an upcoming stream.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member does not have an upcoming stream.");
        }

        return stream;
    }

    // MARK: static async memberShouldNotHaveUpcomingStreamAlreadyStarted
    /**
     * Validates that the member doesn't have an upcoming match that has already opened for signups.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldNotHaveUpcomingStreamAlreadyStarted(interaction, member) {
        const stream = Stream.getUpcomingStartedStreamByMember(member);

        if (stream) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you already have an upcoming stream open for signups.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member has an upcoming stream that is open for signups.");
        }
    }

    // MARK: static async streamShouldExist
    /**
     * Validates that an stream exists.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {number} id The stream ID.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Stream>} A promise that returns the stream.
     */
    static async streamShouldExist(interaction, id, member) {
        const stream = Stream.get(id);

        if (!stream) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I couldn't find an stream with the ID ${id}.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Stream does not exist.");
        }

        return stream;
    }
}

module.exports = Validation;
