/**
 * @typedef {{content?: string, embed: DiscordJs.EmbedBuilder, channel: DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GuildMember|DiscordJs.User|DiscordJs.GuildTextBasedChannel}} RichQueueOptions
 */

const DiscordJs = require("discord.js"),
    fs = require("fs/promises"),
    Log = require("@roncli/node-application-insights-logger"),
    path = require("path"),
    Rest = require("@discordjs/rest"),
    util = require("util"),

    discord = new DiscordJs.Client({
        intents: [
            DiscordJs.IntentsBitField.Flags.Guilds,
            DiscordJs.IntentsBitField.Flags.GuildMessages,
            DiscordJs.IntentsBitField.Flags.GuildMessageReactions,
            DiscordJs.IntentsBitField.Flags.MessageContent
        ],
        partials: [
            DiscordJs.Partials.Channel,
            DiscordJs.Partials.Message,
            DiscordJs.Partials.Reaction
        ]
    });

let readied = false;

/** @type {DiscordJs.Role} */
let adminRole;

/** @type {DiscordJs.Guild} */
let ctwGuild;

/** @type {DiscordJs.Role} */
let restreamersRole;

/** @type {DiscordJs.TextChannel} */
let rotationScheduleChannel;

/** @type {DiscordJs.Role} */
let upcomingMatchesRole;

/** @type {DiscordJs.CategoryChannel} */
let weeklyEventsCategory;

/** @type {typeof import("./reaction")} */
let Reaction = void 0;
setTimeout(() => {
    Reaction = require("./reaction");
}, 1);

// MARK: class Discord
/**
 * A static class that handles all Discord.js interactions.
 */
class Discord {
    // MARK: static get adminRole
    /**
     * Returns the admin role.
     * @returns {DiscordJs.Role} The admin role.
     */
    static get adminRole() {
        return adminRole;
    }

    // MARK: static get icon
    /**
     * Returns the guild's icon.
     * @returns {string} The URL of the icon.
     */
    static get icon() {
        if (discord && discord.ws && discord.ws.status === 0) {
            return discord.user.avatarURL();
        }

        return void 0;
    }

    // MARK: static get restreamersRole
    /**
     * Returns the restreamers role.
     * @returns {DiscordJs.Role} The restreamers role.
     */
    static get restreamersRole() {
        return restreamersRole;
    }

    // MARK: static get rotationScheduleChannel
    /**
     * Returns the rotation schedule channel.
     * @returns {DiscordJs.TextChannel} The rotation schedule channel.
     */
    static get rotationScheduleChannel() {
        return rotationScheduleChannel;
    }

    // MARK: static get upcomingMatchesRole
    /**
     * Returns the upcoming matches role.
     * @returns {DiscordJs.Role} The upcoming matches role.
     */
    static get upcomingMatchesRole() {
        return upcomingMatchesRole;
    }

    // MARK: static get weeklyEventsCategory
    /**
     * Returns the weekly events category.
     * @returns {DiscordJs.CategoryChannel} The weekly events category.
     */
    static get weeklyEventsCategory() {
        return weeklyEventsCategory;
    }

    // MARK: static startup
    /**
     * Sets up Discord events.  Should only ever be called once.
     * @returns {void}
     */
    static startup() {
        discord.on(DiscordJs.Events.ClientReady, async () => {
            Log.info("Connected to Discord.");

            ctwGuild = discord.guilds.cache.find((g) => g.id === process.env.DISCORD_GUILD_ID);

            const files = await fs.readdir(path.join(__dirname, "commands")),
                guildCommands = [],
                globalCommands = [];

            for (const file of files) {
                const commandFile = require(`./commands/${file}`);

                if (commandFile.getData) {
                    await commandFile.getData();
                }

                /** @type {DiscordJs.SlashCommandBuilder} */
                const command = commandFile.command();

                if (commandFile.global) {
                    globalCommands.push(command);
                } else {
                    guildCommands.push(command);
                }
            }

            try {
                const rest = new Rest.REST().setToken(process.env.DISCORD_TOKEN);

                await rest.put(DiscordJs.Routes.applicationGuildCommands(process.env.DISCORD_CLIENTID, ctwGuild.id), {body: guildCommands});
                await rest.put(DiscordJs.Routes.applicationCommands(process.env.DISCORD_CLIENTID), {body: globalCommands});
            } catch (err) {
                Log.error("Error adding slash commands.", {err});
            }

            if (!readied) {
                readied = true;
            }

            adminRole = ctwGuild.roles.cache.find((r) => r.name === "Admin");
            restreamersRole = ctwGuild.roles.cache.find((r) => r.name === "Restreamers");
            rotationScheduleChannel = /** @type {DiscordJs.TextChannel} */(ctwGuild.channels.cache.find((c) => c.name === "Rotation Schedule")); // eslint-disable-line @stylistic/no-extra-parens
            upcomingMatchesRole = ctwGuild.roles.cache.find((r) => r.name === "Upcoming Matches");
            weeklyEventsCategory = /** @type {DiscordJs.CategoryChannel} */(ctwGuild.channels.cache.find((c) => c.name === "Weekly Events")); // eslint-disable-line @stylistic/no-extra-parens
        });

        discord.on("disconnect", (ev) => {
            Log.error("Disconnected from Discord.", {err: ev instanceof Error ? ev : new Error(util.inspect(ev))});
        });

        discord.on(DiscordJs.Events.MessageReactionAdd, async (reaction, user) => {
            // Fetch the reaction if it is a partial.
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    return;
                }
            }

            // If the message wasn't created by the bot, ignore it.
            if (!reaction.message.author || reaction.message.author.id !== discord.user.id) {
                return;
            }

            // Process the reaction.
            await Reaction.handle(/** @type {DiscordJs.MessageReaction} */(reaction), /** @type {DiscordJs.User} */(user), true); // eslint-disable-line @stylistic/no-extra-parens
        });

        discord.on(DiscordJs.Events.MessageReactionRemove, async (reaction, user) => {
            // Fetch the reaction if it is a partial.
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    return;
                }
            }

            // If the message wasn't created by the bot, ignore it.
            if (!reaction.message.author || reaction.message.author.id !== discord.user.id) {
                return;
            }

            // Process the reaction removal.
            await Reaction.handle(/** @type {DiscordJs.MessageReaction} */(reaction), /** @type {DiscordJs.User} */(user), false); // eslint-disable-line @stylistic/no-extra-parens
        });
    }

    // MARK: static async connect
    /**
     * Connects to Discord.
     * @returns {Promise} A promise that resolves once Discord is connected.
     */
    static async connect() {
        Log.verbose("Connecting to Discord...");

        try {
            await discord.login(process.env.DISCORD_TOKEN);
        } catch (err) {
            Log.error("Error connecting to Discord, will automatically retry.", {err});
        }
    }

    // MARK: static embedBuilder
    /**
     * Gets a new DiscordJs EmbedBuilder object.
     * @param {DiscordJs.EmbedData} [options] The options to pass.
     * @returns {DiscordJs.EmbedBuilder} The EmbedBuilder object.
     */
    static embedBuilder(options) {
        const embed = new DiscordJs.EmbedBuilder(options);

        embed.setFooter({text: embed.data && embed.data.footer ? embed.data.footer.text : "CTW Bot", iconURL: Discord.icon});

        if (!embed.data || !embed.data.color) {
            embed.setColor(0xE22922);
        }

        if (!embed.data || !embed.data.timestamp) {
            embed.setTimestamp(new Date());
        }

        return embed;
    }

    // MARK: static findChannelById
    /**
     * Finds a Discord channel by its ID.
     * @param {string} id The ID of the channel.
     * @returns {DiscordJs.GuildChannel | DiscordJs.ThreadChannel} The Discord channel.
     */
    static findChannelById(id) {
        if (!ctwGuild) {
            return void 0;
        }
        return ctwGuild.channels.cache.find((c) => c.id === id);
    }

    // MARK: static findEventById
    /**
     * Finds a Discord event by its ID.
     * @param {*} id The ID of the event.
     * @returns {DiscordJs.GuildScheduledEvent} The event.
     */
    static findEventById(id) {
        if (!ctwGuild) {
            return void 0;
        }
        return ctwGuild.scheduledEvents.cache.find((e) => e.id === id);
    }

    // MARK: static findGuildMemberById
    /**
     * Returns the Discord user in the guild by their Discord ID.
     * @param {string} id The ID of the Discord user.
     * @returns {DiscordJs.GuildMember} The guild member.
     */
    static findGuildMemberById(id) {
        if (!ctwGuild) {
            return void 0;
        }
        return ctwGuild.members.cache.find((m) => m.id === id);
    }

    // MARK: static async queue
    /**
     * Queues a message to be sent.
     * @param {string} message The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GuildMember|DiscordJs.User|DiscordJs.GuildTextBasedChannel} channel The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that returns the sent message.
     */
    static async queue(message, channel) {
        if (channel.id === discord.user.id) {
            return void 0;
        }

        let msg;
        try {
            msg = await channel.send(message);
        } catch {}
        return msg;
    }

    // MARK: static async richEdit
    /**
     * Edits a rich embed message.
     * @param {DiscordJs.Message} message The posted message to edit.
     * @param {DiscordJs.EmbedBuilder} embed The message to change the posted message to.
     * @returns {Promise} A promise that resolves when the message is edited.
     */
    static async richEdit(message, embed) {
        embed.setFooter({
            text: embed.data && embed.data.footer ? embed.data.footer.text : "CTW Bot",
            iconURL: Discord.icon
        });

        if (embed && embed.data && embed.data.fields) {
            embed.data.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        embed.setColor(message.embeds[0].color);

        if (!embed.data || !embed.data.timestamp) {
            embed.setTimestamp(new Date());
        }

        await message.edit({embeds: [embed]});
    }

    // MARK: static async richQueue
    /**
     * Queues a rich embed message to be sent.
     * @param {RichQueueOptions} options The options to use.
     * @returns {Promise<DiscordJs.Message>} A promise that returns the sent message.
     */
    static async richQueue(options) {
        if (options.channel.id === discord.user.id) {
            return void 0;
        }

        if (options.embed && options.embed.data && options.embed.data.fields) {
            options.embed.data.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        let msg;
        try {
            const msgSend = await options.channel.send({content: options.content, embeds: [options.embed]});

            if (msgSend instanceof Array) {
                msg = msgSend[0];
            } else {
                msg = msgSend;
            }
        } catch {}
        return msg;
    }

    // MARK: static channelIsOnServer
    /**
     * Returns whether the channel is on the OTL server.
     * @param {DiscordJs.GuildTextBasedChannel} channel The channel.
     * @returns {boolean} Whether the channel is on the OTL server.
     */
    static channelIsOnServer(channel) {
        return channel.type === DiscordJs.ChannelType.GuildText && channel.guild.name === process.env.GUILD;
    }

    // MARK: static createChannel
    /**
     * Creates a new channel on the Discord server.
     * @param {string} name The name of the channel.
     * @param {DiscordJs.GuildChannelTypes} type The type of channel to create.
     * @param {DiscordJs.OverwriteResolvable[]|DiscordJs.Collection<DiscordJs.Snowflake, DiscordJs.OverwriteResolvable>} [overwrites] The permissions that should overwrite the default permission set.
     * @param {DiscordJs.CategoryChannel} [category] The category to put the channel in.
     * @param {string} [reason] The reason the channel is being created.
     * @returns {Promise<DiscordJs.TextChannel | DiscordJs.NewsChannel | DiscordJs.VoiceChannel | DiscordJs.CategoryChannel | DiscordJs.StageChannel | DiscordJs.ForumChannel | DiscordJs.MediaChannel>} The created channel.
     */
    static createChannel(name, type, overwrites, category, reason) {
        if (!ctwGuild) {
            return void 0;
        }
        const options = {name, type, permissionOverwrites: overwrites, reason};
        if (category) {
            options.parent = category;
        }

        return ctwGuild.channels.create(options);
    }

    // MARK: static createEvent
    /**
     * Creates a new event on the Discord server.
     * @param {DiscordJs.GuildScheduledEventCreateOptions} data The event data.
     * @returns {Promise<DiscordJs.GuildScheduledEvent>} A promise that returns the event.
     */
    static createEvent(data) {
        if (!ctwGuild) {
            return void 0;
        }
        return ctwGuild.scheduledEvents.create(data);
    }

    // MARK: static isAdmin
    /**
     * Determins whether the user is an admin.
     * @param {DiscordJs.GuildMember} member The user to check.
     * @returns {boolean} Whether the user is an admin.
     */
    static isAdmin(member) {
        return !!(member && adminRole.members.find((m) => m.id === member.id));
    }

    // MARK: static isRestreamer
    /**
     * Determins whether the user is a restreamer.
     * @param {DiscordJs.GuildMember} member The user to check.
     * @returns {boolean} Whether the user is a restreamer.
     */
    static isRestreamer(member) {
        return !!(member && restreamersRole.members.find((m) => m.id === member.id));
    }

    // MARK: static isSelf
    /**
     * Determines whether the user is the bot.
     * @param {DiscordJs.User} user The user to check.
     * @returns {boolean} Whether the user is the bot.
     */
    static isSelf(user) {
        return user.id === discord.user.id;
    }
}

module.exports = Discord;
