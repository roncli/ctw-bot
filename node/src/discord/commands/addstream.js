const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Formatters = require("@discordjs/formatters"),
    Stream = require("../../models/stream"),
    Validation = require("../validation");

// MARK: class AddStream
/**
 * A command that adds a stream.
 */
class AddStream {
    // MARK: static command
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .addIntegerOption((option) => option
                .setName("id")
                .setDescription("The ID of the event.  Get from the /events command.")
                .setRequired(true)
                .setMinValue(1))
            .addStringOption((option) => option
                .setName("date")
                .setDescription("The date in M/d/yyyy h:mm tt format.")
                .setRequired(true))
            .addIntegerOption((option) => option
                .setName("sessions")
                .setDescription("The number of sessions.")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5))
            .setName("addstream")
            .setDescription("Adds an upcoming stream to the calendar.  Get the ID from the /events command.");
    }

    // MARK: static async handle
    /**
     * The command handler.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.User} user The user initiating the interaction.
     * @returns {Promise<boolean>} A promise that returns whether the interaction was successfully handled.
     */
    static async handle(interaction, user) {
        await interaction.deferReply({ephemeral: true});

        const member = Discord.findGuildMemberById(user.id),
            eventId = interaction.options.getInteger("id"),
            dateTime = interaction.options.getString("date"),
            sessions = interaction.options.getInteger("sessions");

        await Validation.memberShouldBeRestreamer(interaction, member);
        const date = await Validation.datetimeShouldBeValid(interaction, dateTime, member),
            event = await Validation.eventShouldExist(interaction, eventId, member);

        const stream = new Stream({
            eventId,
            hostDiscordId: user.id,
            date
        });

        await stream.save();

        await stream.addSessions(sessions);

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    title: "Stream Added",
                    description: `The stream **${event.title}** (Event ID: ${event.id}) hosted by ${Formatters.userMention(stream.hostDiscordId)} (Stream ID: ${stream.id}) has been added with ${stream.sessions.length} session${stream.sessions.length === 1 ? "" : "s"}.`,
                    fields: stream.sessions.sort((a, b) => a.date.getTime() - b.date.getTime()).map((s, index) => ({
                        name: `Session ${index + 1} (Session ID: ${s.id})`,
                        value: `${Formatters.time(s.date, Formatters.TimestampStyles.LongDateTime)}`,
                        inline: false
                    }))
                })
            ]
        });

        return true;
    }
}

module.exports = AddStream;
