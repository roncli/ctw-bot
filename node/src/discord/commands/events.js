const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Event = require("../../models/event"),
    Formatters = require("@discordjs/formatters");

// MARK: class Events
/**
 * A command that returns the list of upcoming events.
 */
class Events {
    // MARK: static command
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .setName("events")
            .setDescription("Returns the list of upcoming events.");
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
            events = Event.getAll().sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        if (events.length === 0) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: "There are no upcoming events."
                    })
                ]
            });

            return true;
        }

        if (Discord.isAdmin(member) || Discord.isRestreamer(member)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        title: "Upcoming CTW Events",
                        fields: events.map((e) => ({
                            name: `**${e.title}** (Event ID: ${e.id})`,
                            value: e.endDate ? `${Formatters.time(e.startDate, Formatters.TimestampStyles.LongDate)} - ${Formatters.time(e.endDate, Formatters.TimestampStyles.LongDate)}` : `Week of ${Formatters.time(e.startDate, Formatters.TimestampStyles.LongDate)}`,
                            inline: false
                        }))
                    })
                ]
            });
        } else {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        title: "Upcoming CTW Events",
                        fields: events.map((e) => ({
                            name: `**${e.title}**`,
                            value: e.endDate ? `${Formatters.time(e.startDate, Formatters.TimestampStyles.LongDate)} - ${Formatters.time(e.endDate, Formatters.TimestampStyles.LongDate)}` : `Week of ${Formatters.time(e.startDate, Formatters.TimestampStyles.LongDate)}`,
                            inline: false
                        }))
                    })
                ]
            });
        }

        return true;
    }
}

module.exports = Events;
