const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

// MARK: class StartSignups
/**
 * A command that starts signups for a stream.
 */
class StartSignups {
    // MARK: static command
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .setName("startsignups")
            .setDescription("Starts signups for your next stream.");
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

        const member = Discord.findGuildMemberById(user.id);

        await Validation.memberShouldBeRestreamer(interaction, member);
        await Validation.memberShouldNotHaveUpcomingStreamAlreadyStarted(interaction, member);
        const stream = await Validation.memberShouldHaveUpcomingStream(interaction, member);
        const event = await Validation.eventShouldExist(interaction, stream.eventId, member);

        await stream.startSignups();

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    title: "Signups Started",
                    description: `The event **${event.title}** (Event ID: ${event.id}) has opened for signups.`
                })
            ]
        });

        return true;
    }
}

module.exports = StartSignups;
