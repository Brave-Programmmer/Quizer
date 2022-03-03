console.clear();

process.on('uncaughtException', (err, origin) => {
    console.log(err);
});

require("dotenv").config();
const bot = require("./bot");
const http = require('http');
var url = require('url');
const quiz = require("./modules/quiz");

require("./db/conn");

const requestListener = async function (req, res) {
    const body = req.body;
    var q = url.parse(req.url, true);
    
    if (req.method === 'POST') {
        const module = q.pathname.replace(/\//, "");
        const paths = module.split("/");
        // console.log(paths)
        if (paths.length > 0) {
            if (paths[0] === "quiz") {
                const data = await quiz[paths[1]](body);
                return res.end(JSON.stringify(data));
            } else {
                const data = await bot[paths[0]](body);
                return res.end(JSON.stringify(data));
            }
        }
    }
    
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    return res.end('Hello, World!');
}

const server = http.createServer((req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });
    
    req.on('end', () => {
        const body = JSON.parse(data);
        req.body = body;
        requestListener(req, res);
    })
});
server.listen(3000, (err) => {
    if(err) console.error(err);
    console.log(">>===> Server is started.\n");
    bot.startBot();
    quiz.startQuiz();
});