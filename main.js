console.clear();

process.on('uncaughtException', (err, origin) => {
    console.log(err);
});

require("dotenv").config();
const bot = require("./bot");
const quiz = require("./modules/quiz");

const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);

app.use(require("body-parser").json());
app.use(require("cors")());

require("./db/conn");

app.use(express.static("./public"));

app.post("/quiz/:id", async (req, res) => {
    const data = await quiz[req.params.id](req.body);
    return res.status(200).json(data);
})

app.post("/:id", async (req, res) => {
    const data = await bot[req.params.id](req.body);
    return res.status(200).json(data);
})

app.get("/", (req, res) => {
    res.status(200).sendFile("./public/index.html");
})

server.listen(3000, (err) => {
    if(err) console.error(err);
    console.log(">>===> Server is started.\n");
    bot.startBot();
    quiz.startQuiz();
});