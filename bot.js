                                                                                                                                

const discord = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const chalk = require("chalk");
const Intents = discord.Intents;

const scheduledSchema = require("./db/models/schedule_schema");

const client = new discord.Client(
    {
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_BANS,
            // Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            Intents.FLAGS.GUILD_INTEGRATIONS,
            // Intents.FLAGS.GUILD_WEBHOOKS,
            // Intents.FLAGS.GUILD_INVITES,
            // Intents.FLAGS.GUILD_VOICE_STATES,
            // Intents.FLAGS.GUILD_PRESENCES,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILD_MESSAGE_TYPING,
            // Intents.FLAGS.DIRECT_MESSAGES,
            // Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
            // Intents.FLAGS.DIRECT_MESSAGE_TYPING,
            // Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
        ],
        partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    }
);

const sendMessage = async ({ body, options }) => {
    try {
        if(!body || !options) throw new Error("Provide Options and Body of the message");
        
        const channel = await client.channels.fetch(options.channelId);
        const message = await channel.send(body);
        
        if (Array.isArray(options.reactions)) {
            await addReactions(message, options.reactions)
        }
        
        return {
            type: "success",
            msg: "Message sent successfully",
            data: message
        }
        
    } catch (err) {
        console.error(chalk.red(">>===> sendMessage() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const editMessage = async ({ body, options }) => {
    try {
        if(!body || !options) throw new Error("Provide Options and Body of the message");
        
        const channel = await client.channels.fetch(options.channelId);
        const msg = await channel.messages.fetch(options.msgId);
        
        // const message = await channel.send(body);
        const message = await msg.edit(body);
        
        if (Array.isArray(options.reactions)) {
            await addReactions(message, options.reactions)
        }
        return {
            type: "success",
            msg: "Message edited successfully",
            data: message
        }
        
    } catch (err) {
        console.error(chalk.red(">>===> editMessage() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const addReactions = async (message, reactions) => {
    try {
        message.react(reactions[0])
        reactions.shift()
        if (reactions.length > 0) {
            setTimeout(async () => await addReactions(message, reactions), 750)
        }
    } catch (err) {
        console.error(chalk.red(">>===> addReactions() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const getReactedUsers = async ({ options }) => {
    const { channelId, msgId, emoji } = options;
    let cacheChannel = await client.channels.fetch(channelId);
    if(cacheChannel){
        //const msg = await channel.messages.fetch(msgId);
        const reactionMessage = await cacheChannel.messages.fetch(msgId);
        // console.log(reactionMessage)
        const userList = await reactionMessage.reactions.resolve(emoji).users.fetch();
        return {
            type: "success",
            msg: "Reaction Fetched successfully",
            data: userList.map((user) => user.id).filter((id) => id !== reactionMessage.author.id )
        }
    }
}

const scheduleMessage = async ({ body, options }) => {
    try {
        if(!body || !options || !options.wait) throw new Error("Provide Options, schedule time and Body of the message");
        
        // const scheduleTimeOut = setTimeout(async function() {
        //     const message = await sendMessage({ body, options });
        // }, options.wait);
        await new scheduledSchema({
            date: new Date(Date.now() + parseInt(options.wait, 10)),
            content: body,
            channelId: options.channelId
        }).save()
        
        return {
            type: "success",
            msg: "Message scheduled successfully",
        }
        
    } catch (err) {
        console.error(chalk.red(">>===> scheduleMessage() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const initScheduler = async () => {
    try {
        const query = {
            date: {
                $lte: Date.now(),
            },
        }
        const results = await scheduledSchema.find(query)
        
        for (const post of results) {
            const { channelId, content } = post;
            const message = await sendMessage({
                body: content,
                options: {
                    channelId
                }
            });
        }
        await scheduledSchema.deleteMany(query)
        
        setTimeout(initScheduler, 1000 * 10)
    } catch (err) {
        console.error(chalk.red(">>===> initScheduler() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}




function startBot() {
    console.log(chalk.green(">>===> Quizer is starting..."));
    client.login(process.env.DISCORD_TOKEN).then(() => {
        console.log(chalk.greenBright(">>===> Quizer is started...\n"));
        client.user.setPresence({
            activities: [{ 
                name: "Brave Programmer",
                type: "WATCHING"
            }],
            status: "online"
        })
        initScheduler();
    });
}

module.exports = {
    client,
    startBot,
    sendMessage,
    editMessage,
    scheduleMessage,
    addReactions,
    getReactedUsers,
    // setQuiz: require("./modules/quiz").setQuiz,
};