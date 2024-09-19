const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Formatters = require("@discordjs/formatters"),
    Validation = require("../validation");

// MARK: class RemoveEvent
/**
 * A command that removes an event.
 */
class RemoveEvent {
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
            .setName("removeevent")
            .setDescription("Removes an event.  Get the ID from the /events command.");
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
        const event = await Validation.eventShouldExist(interaction, id, member);

        await event.remove();

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    title: "Event Removed",
                    description: `The event **${event.title}** has been removed, which was starting at ${Formatters.time(event.startDate, Formatters.TimestampStyles.LongDate)}${event.endDate ? ` and ending at ${Formatters.time(event.endDate, Formatters.TimestampStyles.LongDate)}` : ""}.`
                })
            ]
        });

        return true;
    }
}

module.exports = RemoveEvent;
