const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Event = require("../../models/event"),
    Formatters = require("@discordjs/formatters"),
    Stream = require("../../models/stream");

// MARK: class Streams
/**
 * A command that returns the list of upcoming streams.
 */
class Streams {
    // MARK: static command
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .setName("streams")
            .setDescription("Returns the list of upcoming streams.");
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
            streams = Stream.getAll().sort((a, b) => a.date.getTime() - b.date.getTime());

        if (streams.length === 0) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: "There are no upcoming streams."
                    })
                ]
            });

            return true;
        }

        if (Discord.isAdmin(member) || Discord.isRestreamer(member)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        title: "Upcoming CTW Streams",
                        fields: streams.map((s) => {
                            const event = Event.get(s.eventId);
                            return {
                                name: `**${event.title}** (Event ID: ${event.id}), hosted by ${Formatters.userMention(s.hostDiscordId)} (Stream ID: ${s.id})`,
                                value: `${Formatters.time(s.date, Formatters.TimestampStyles.LongDateTime)}, ${s.sessions.length} session${s.sessions.length === 1 ? "" : "s"}`,
                                inline: false
                            };
                        })
                    })
                ]
            });
        } else {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        title: "Upcoming CTW Streams",
                        fields: streams.map((s) => {
                            const event = Event.get(s.eventId);
                            return {
                                name: `**${event.title}**, hosted by ${Formatters.userMention(s.hostDiscordId)}`,
                                value: `${Formatters.time(s.date, Formatters.TimestampStyles.LongDateTime)}, ${s.sessions.length} session${s.sessions.length === 1 ? "" : "s"}`,
                                inline: false
                            };
                        })
                    })
                ]
            });
        }

        return true;
    }
}

module.exports = Streams;
