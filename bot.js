                                                                                                                                

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

var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var passwordLength = 32;
var password = "";
var passTimeOut;
const generateNewPass = () => {
    var pass = "";
    for (var i = 0; i <= passwordLength; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        pass += chars.substring(randomNumber, randomNumber +1);
    }
    password = pass;
    process.env.QuizPassword = pass;
    if (passTimeOut) clearTimeout(passTimeOut);
    passTimeOut = setTimeout(generateNewPass, 1000 * 60 * 2);
}
generateNewPass();

const sendMessage = async ({ body, options }) => {
    try {
        if(!body || !options) throw new Error("Provide Options and Body of the message");
        
        if(!options.password || options.password !== process.env.QuizPassword) {
            return {
                type: "error",
                msg: "Password mismatch",
            }
        }
        
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
        
        if(!options.password || options.password !== process.env.QuizPassword) {
            return {
                type: "error",
                msg: "Password mismatch",
            }
        }
        
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
    try {
        if(!options.password || options.password !== process.env.QuizPassword) {
            return {
                type: "error",
                msg: "Password mismatch",
            }
        }
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
    } catch (err) {
        console.error(chalk.red(">>===> getReactedUsers() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const scheduleMessage = async ({ body, options }) => {
    try {
        if(!body || !options || !options.wait) throw new Error("Provide Options, schedule time and Body of the message");
        
        if(!options.password || options.password !== process.env.QuizPassword) {
            return {
                type: "error",
                msg: "Password mismatch",
            }
        }
        
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

function isAdmin(msg) {
    return msg.member.permissionsIn(msg.channel).has("ADMINISTRATOR")
}

const prefix1 = "Q!"
const prefix2 = "q!"
client.on('messageCreate', (message) => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix1) && !message.content.startsWith(prefix2)) return;
	
	const commandBody = message.content.slice(prefix1.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
	
	if (command === "generatenewpassword") {
	    if (!isAdmin(message)) {
	        message.reply({
                "embeds": [
                    {
                        "title": "Unwanted Act Detected",
                        "color": 16711680,
                        "description": "**Applying for generating new password is an administrative act. You are not an admin of this channel. If you need to use this command, ask the owner or undersigned.**\n\n**Username:** " + message.author.username + "#" + message.author.discriminator + "\n**Id:** " + message.author.id,
                        "timestamp": new Date(),
                        "author": {
                            "name": message .author.username + "#" + message.author.discriminator,
                            "icon_url": message.author.displayAvatarURL()
                        },
                    }
                ],
            })
	    } else {
	        generateNewPass();
	        message.reply({
                "embeds": [
                    {
                        "title": "New Password Generated",
                        "color": 65535,
                        "description": "**A new password is generated for QUIZER Bot. This password is only valid till next 2 minutes.**\n\n**Username:** " + message.author.username + "#" + message.author.discriminator + "\n**Id:** " + message.author.id,
                        "timestamp": new Date(),
                        "author": {
                            "name": message .author.username + "#" + message.author.discriminator,
                            "icon_url": message.author.displayAvatarURL()
                        },
                    },
                    {
                        "color": 65535,
                        "description": "**Password:** " + process.env.QuizPassword,
                    }
                ],
            })
	    }
	}
	
});



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