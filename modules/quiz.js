
const bot = require("../bot");
const client = bot.client;
const quizSchema = require("../db/models/quiz_schema");
const emojis = require("./emojis");
const chalk = require("chalk");

Date.prototype.isValid = function () { 
    // If the date object is invalid it 
    // will return 'NaN' on getTime()  
    // and NaN is never equal to itself. 
    return this.getTime() === this.getTime(); 
};

const setQuiz = async ({ questionBody, answerBody, correctOption, time, timeOffset, options }) => {
    try {
        
        if(!options.password || options.password !== process.env.QuizPassword) {
            return {
                type: "error",
                msg: "Password mismatch",
            }
        }
        
        if (
            (typeof questionBody === "object" && !Array.isArray(questionBody))
            &&
            (typeof answerBody === "object" && !Array.isArray(answerBody))
            &&
            (typeof correctOption === "string" || typeof correctOption === "numbee")
            &&
            (typeof time === "number")
            &&
            (typeof timeOffset === "string" || typeof timeOffset === "number")
            &&
            (typeof options === "object" && !Array.isArray(options))
        ) {
            
            await new quizSchema({
                questionBody,
                answerBody,
                correctOption,
                time: new Date(time),
                timeOffset: new Date(timeOffset),
                state: 1,
                options
            }).save();
            
            return {
                type: "success",
                msg: "Message scheduled successfully",
            }
            
        } else {
            return {
                type: "error",
                msg: "parameters are invalid"
            };
        }
        
    } catch (err) {
        console.error(chalk.red(">>===> setQuiz() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}


const askQuestion = async () => {
    try {
        const query = {
            time: {
                $lte: Date.now(),
            },
            state: 1
        };
        const results = await quizSchema.find(query);
        
        for (const post of results) {
            const message = await bot.sendMessage({
                body: post?.questionBody,
                options: {
                    channelId: post?.options?.channelId,
                    reactions: [
                        emojis[1],
                        emojis[2],
                        emojis[3],
                        emojis[4],
                    ],
                    password: process.env.QuizPassword
                }
            });
            post.state = 2;
            post.questionMessage = message;
            await post.save();
        }
        
        setTimeout(askQuestion, 1000 * 10);
    } catch (err) {
        console.error(chalk.red(">>===> askQuestion() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const getWinner = async (post, correctOption) => {
    
    var entries = [];
    for (let  i = 0; i < 4; i++) {
        entries.push((await bot.getReactedUsers({
            options: {
                channelId: post?.options?.channelId,
                msgId: post?.questionMessage?.data,
                emoji: [
                    emojis[1],
                    emojis[2],
                    emojis[3],
                    emojis[4],
                ][i],
                password: process.env.QuizPassword
            }
        })).data)
    }
    // console.log(entries)
    
    let wrongOptions = [0, 1, 2, 3].filter(e => e !== correctOption)
    // console.log(wrongOptions)
    let unique1 = entries[correctOption].filter((o) => entries[wrongOptions[0]].indexOf(o) === -1);
    let unique2 = unique1.filter((o) => entries[wrongOptions[1]].indexOf(o) === -1);
    let unique3 = unique2.filter((o) => entries[wrongOptions[2]].indexOf(o) === -1);
    // console.log(unique1, unique2, unique3)
    function removeDuplicates(arr) { 
        return arr.filter((item, index) => arr.indexOf(item) === index); 
    }

    // let unique = removeDuplicates(unique1.concat(unique2, unique3));
    // console.log(users)
    const winner = unique3[Math.floor(Math.random() * unique3.length)];
    return winner;
}

const declareWinner = async () => {
    try {
        const query = {
            timeOffset: {
                $lte: Date.now(),
            },
            state: 2
        };
        const results = await quizSchema.find(query);
        
        for (const post of results) {
            const channel = await client.channels.fetch(post?.options?.channelId);
            const msg = await channel.messages.fetch(post?.questionMessage?.data);
            
            const winner = await getWinner(post, parseInt(post?.correctOption) - 1);
            
            const replacer = (obj) => {
                const replaceArray = arr => {
                    let newArray = [];
                    for (const value of arr) {
                        if (typeof value === "string") {
                            newArray.pish(value.replace(/{winnerId}/g, `<@${winner}>`));
                        } else if (typeof value === "object" && !Array.isArray(value)) {
                            newArray.push(replacer(value));
                        } else if (Array.isArray(value)) {
                            newArray.push(replaceArray(value))
                        }
                    }
                    return newArray;
                }
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === "string") {
                        obj[key] = value.replace(/{winnerId}/g, `<@${winner}>`);
                    } else if (typeof value === "object" && !Array.isArray(value)) {
                        obj[key] = replacer(value);
                    } else if (Array.isArray(value)) {
                        obj[key] = replaceArray(value)
                    }
                }
                return obj;
            }
            
            const message = await bot.sendMessage({
                body: replacer(post?.answerBody),
                options: {
                    channelId: post?.options?.resultChannelId,
                    password: process.env.QuizPassword
                }
            });
            
            post.state = 3;
            await post.save();
        }
        
        // await quizSchema.deleteMany(query)
        
        setTimeout(declareWinner, 1000 * 10);
    } catch (err) {
        console.error(chalk.red(">>===> declareWinner() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const getUpcommingQuizes = async () => {
    try {
        const query = {
            time: {
                $gte: Date.now(),
            },
            state: 1
        };
        const results = await quizSchema.find(query);
        
        if (results.length < 1) {
            return {
                type: "success",
                msg: "no upcoming quizs found",
                data: results
            }
        } else {
            return {
                type: "success",
                msg: results.length + " upcoming quizes found.",
                data: results
            }
        }
    } catch (err) {
        console.error(chalk.red(">>===> getUpcommingQuizes() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const getRunningQuizes = async () => {
    try {
        const query = {
            time: {
                $lte: Date.now(),
            },
            timeOffset: {
                $gte: Date.now(),
            },
            state: 2
        };
        const results = await quizSchema.find(query);
        
        if (results.length < 1) {
            return {
                type: "success",
                msg: "no running quizs found",
                data: results
            }
        } else {
            return {
                type: "success",
                msg: results.length + " running quizes found.",
                data: results
            }
        }
    } catch (err) {
        console.error(chalk.red(">>===> getRunningQuizes() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

const getEndedQuizes = async () => {
    try {
        const query = {
            timeOffset: {
                $lte: Date.now(),
            },
            state: 3
        };
        const results = await quizSchema.find(query);
        
        if (results.length < 1) {
            return {
                type: "success",
                msg: "no ended quizs found",
                data: results
            }
        } else {
            return {
                type: "success",
                msg: results.length + " ended quizes found.",
                data: results
            }
        }
    } catch (err) {
        console.error(chalk.red(">>===> getEndedQuizes() \n"), err);
        return {
            type: "error",
            msg: err
        };
    }
}

module.exports = {
    setQuiz,
    startQuiz: () => {
        askQuestion();
        declareWinner();
    },
    getRunningQuizes,
    getUpcommingQuizes,
    getEndedQuizes
};