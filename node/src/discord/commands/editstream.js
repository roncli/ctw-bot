const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Formatters = require("@discordjs/formatters"),
    Validation = require("../validation");

// MARK: class EditStream
/**
 * A command that edits a stream.
 */
class EditStream {
    // MARK: static command
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .addIntegerOption((option) => option
                .setName("id")
                .setDescription("The ID of the stream.  Get from the /streams command.")
                .setRequired(true)
                .setMinValue(1))
            .addStringOption((option) => option
                .setName("date")
                .setDescription("The date in M/d/yyyy format.")
                .setRequired(true))
            .setName("editstream")
            .setDescription("Edits a stream.  Get the ID from the /streams command.");
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
            id = interaction.options.getInteger("id"),
            date = interaction.options.getString("date");

        await Validation.memberShouldBeRestreamer(interaction, member);
        const stream = await Validation.streamShouldExist(interaction, id, member);
        const event = await Validation.eventShouldExist(interaction, stream.eventId, member);

        const oldDate = stream.date;

        stream.date = await Validation.dateShouldBeValid(interaction, date, member);

        await stream.save();

        await stream.updateSessions(oldDate);

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    title: "Stream Updated",
                    description: `The stream for event **${event.title}** (Event ID: ${event.id}) starting at ${Formatters.time(stream.date, Formatters.TimestampStyles.LongDate)} (Stream ID: ${stream.id}) has been updated.`
                })
            ]
        });

        return true;
    }
}

module.exports = EditStream;
