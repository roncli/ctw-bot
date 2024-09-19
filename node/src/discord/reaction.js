/**
 * @typedef {import("discord.js").MessageReaction} DiscordJs.MessageReaction
 * @typedef {import("discord.js").User} DiscordJs.User
 */

const Stream = require("../models/stream");

// MARK: class Reaction
/**
 * A static class that handles Discord reactions.
 */
class Reaction {
    // MARK: getSessionFromEmoji
    /**
     * Returns the session number from a given emoji.
     * @param {string} emoji The Discord emoji name.
     * @returns {number} The session number, or void if the emoji is not a session emoji.
     */
    static getSessionFromEmoji(emoji) {
        // Handle 1️⃣ through 5️⃣.
        if (emoji === ":one:") {
            return 1;
        } else if (emoji === ":two:") {
            return 2;
        } else if (emoji === ":three:") {
            return 3;
        } else if (emoji === ":four:") {
            return 4;
        } else if (emoji === ":five:") {
            return 5;
        }

        // Not a session emoji.
        return void 0;
    }

    // MARK: static async handle
    /**
     * Handles a reaction.
     * @param {DiscordJs.MessageReaction} reaction The reaction object.
     * @param {DiscordJs.User} user The user who reacted.
     * @param {boolean} added Whether the reaction was added.  False if reaction was removed.
     * @returns {Promise} A promise that resolves when the reaction has been handled.
     */
    static async handle(reaction, user, added) {
        if (added) {
            // Remove the reaction.
            await reaction.remove();

            // Check if this is a reaction for a stream signup.
            const messageId = reaction.message.id;
            const stream = Stream.getBySignupMessageId(messageId);

            if (stream) {
                await stream.addSignup(user, Reaction.getSessionFromEmoji(reaction.emoji.name));
            }
        }
    }
}

module.exports = Reaction;
