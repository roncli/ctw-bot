const Discord = require("../discord"),
    fs = require("fs/promises"),
    fsSync = require("fs"),
    path = require("path");

// MARK: class Db
/**
 * A class that represents a database.
 */
class Db {
    static semaphore = Promise.resolve();

    // MARK: static get filename
    /**
     * Gets the filename for the data.
     */
    static get filename() {
        return path.join(process.env.DATA_DIRECTORY, `${this.key}.json`);
    }

    // MARK: static get key
    /**
     * Gets the key for the data.
     * @returns {string} The key for the data.
     * @virtual This property must be overridden.
     */
    static get key() {
        throw new Error("Db.key must be overridden.");
    }

    // MARK: constructor
    /**
     * Creates a new database object.
     */
    constructor() {
        // Throw an error if this class wasn't overwridden.
        if (this.constructor === Db) {
            throw new Error("The Db class may not be instantiated directly.");
        }

        /** @type {object[]} */
        this.data = [];
    }

    // MARK: nextId
    /**
     * Gets the next ID of the data.
     * @returns {number} The next ID of the data.
     */
    nextId() {
        return Math.max(...this.data.map((d) => d.id || 0), 0) + 1;
    }

    // MARK: async load
    /**
     * Loads the data into memory.
     * @returns {Promise} A promise that resolves when the data has been loaded.
     */
    async load() {
        if (fsSync.existsSync(/** @type {typeof Db} */(this.constructor).filename)) { // eslint-disable-line @stylistic/no-extra-parens
            const data = await fs.readFile(/** @type {typeof Db} */(this.constructor).filename, "utf8"); // eslint-disable-line @stylistic/no-extra-parens
            this.data = JSON.parse(data);
        }
    }

    // MARK: async save
    /**
     * Saves the data to disk.
     * @returns {Promise} A promise that resolves when the data has been saved.
     */
    async save() {
        const oldSemaphore = Db.semaphore;

        Db.semaphore = new Promise((resolve) => {
            oldSemaphore.then(async () => {
                try {
                    await fs.writeFile(/** @type {typeof Db} */(this.constructor).filename, JSON.stringify(this.data), "utf8"); // eslint-disable-line @stylistic/no-extra-parens
                } catch (err) {
                    Discord.richQueue({
                        embed: Discord.embedBuilder({
                            description: `An error occurred while saving to the ${/** @type {typeof Db} */(this.constructor).key} database.`, // eslint-disable-line @stylistic/no-extra-parens
                            fields: [{name: "Error", value: err.toString().slice(0, 1024)}]
                        }),
                        channel: Discord.findGuildMemberById(process.env.DISCORD_OWNER_ID)
                    });
                }
                resolve();
            });
        });

        await Db.semaphore;
    }
}

module.exports = Db;
