const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Formatters = require("@discordjs/formatters"),
    Validation = require("../validation");

// MARK: class EditEvent
/**
 * A command that edits an event.
 */
class EditEvent {
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
                .setName("title")
                .setDescription("Optional.  The title of the event.")
                .setRequired(false))
            .addStringOption((option) => option
                .setName("startDate")
                .setDescription("Optional.  The start date in M/d/yyyy format.")
                .setRequired(false))
            .addStringOption((option) => option
                .setName("endDate")
                .setDescription("Optional.  The end date in M/d/yyyy format.")
                .setRequired(false))
            .setName("editevent")
            .setDescription("Edits an event.  Get the ID from the /events command.");
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
            title = interaction.options.getString("title", false) || void 0,
            start = interaction.options.getString("startDate", false) || void 0,
            end = interaction.options.getString("endDate", false) || void 0;

        await Validation.memberShouldBeRestreamer(interaction, member);
        const event = await Validation.eventShouldExist(interaction, id, member);

        if (title !== void 0) {
            event.title = title;
        }

        if (start !== void 0) {
            event.startDate = await Validation.dateShouldBeValid(interaction, start, member);
        }

        if (end !== void 0) {
            event.endDate = await Validation.dateShouldBeValid(interaction, end, member);
        }

        await event.save();

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    title: "Event Updated",
                    description: `The event **${event.title}** (Event ID: ${event.id}) has been updated, starting at ${Formatters.time(event.startDate, Formatters.TimestampStyles.LongDate)}${event.endDate ? ` and ending at ${Formatters.time(event.endDate, Formatters.TimestampStyles.LongDate)}` : ""}.`
                })
            ]
        });

        return true;
    }
}

module.exports = EditEvent;
