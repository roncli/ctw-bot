const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Formatters = require("@discordjs/formatters"),
    Validation = require("../validation");

// MARK: class RemoveStream
/**
 * A command that removes a stream.
 */
class RemoveStream {
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
            .setName("removestream")
            .setDescription("Removes a stream.  Get the ID from the /streams command.");
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
            id = interaction.options.getInteger("id");

        await Validation.memberShouldBeRestreamer(interaction, member);
        const stream = await Validation.streamShouldExist(interaction, id, member);
        const event = await Validation.eventShouldExist(interaction, stream.eventId, member);

        await stream.remove();

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    title: "Stream Removed",
                    description: `The stream **${event.title}** (Event ID: ${event.id}) hosted by ${Formatters.userMention(stream.hostDiscordId)} (Stream ID: ${stream.id}) has been removed, which was starting at ${Formatters.time(stream.date, Formatters.TimestampStyles.LongDateTime)}.`
                })
            ]
        });

        return true;
    }
}

module.exports = RemoveStream;
