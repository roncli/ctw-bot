const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Event = require("../../models/event"),
    Formatters = require("@discordjs/formatters"),
    Validation = require("../validation");

// MARK: class AddEvent
/**
 * A command that adds an event.
 */
class AddEvent {
    // MARK: static command
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .addStringOption((option) => option
                .setName("title")
                .setDescription("The title of the event.")
                .setRequired(true))
            .addStringOption((option) => option
                .setName("startDate")
                .setDescription("The start date in M/d/yyyy format.")
                .setRequired(true))
            .addStringOption((option) => option
                .setName("endDate")
                .setDescription("The end date in M/d/yyyy format.  Defaults to one week after the start date.")
                .setRequired(false))
            .setName("addevent")
            .setDescription("Adds an upcoming event to the schedule.");
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
            title = interaction.options.getString("title"),
            start = interaction.options.getString("startDate"),
            end = interaction.options.getString("endDate", false) || void 0;

        await Validation.memberShouldBeRestreamer(interaction, member);
        const startDate = await Validation.dateShouldBeValid(interaction, start, member),
            endDate = end === void 0 ? void 0 : await Validation.dateShouldBeValid(interaction, end, member);

        const event = new Event({
            id: void 0,
            title,
            startDate,
            endDate
        });

        await event.save();

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    title: "Event Added",
                    description: `The event **${event.title}** (Event ID: ${event.id}) has been added to the schedule, starting at ${Formatters.time(event.startDate, Formatters.TimestampStyles.LongDate)}${event.endDate ? ` and ending at ${Formatters.time(event.endDate, Formatters.TimestampStyles.LongDate)}` : ""}.`
                })
            ]
        });

        return true;
    }
}

module.exports = AddEvent;
