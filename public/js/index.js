$(function () {
    $('#time').datetimepicker({
        // defaultDate: (new Date()).getDate(),
        "date": new Date(),
        "minDate": new Date(),
        //locale: 'en'
    });
    $('#timeend').datetimepicker({
        "date": new Date(),
        "minDate": new Date(),
        //locale: 'en'
    });
    
    var inputs = JSON.parse(localStorage.getItem("inputs"));
    $("#quiz_num").val(inputs.quiz_num);
    $("#question").val(inputs.question);
    $("#opt1").val(inputs.options[0]);
    $("#opt2").val(inputs.options[1]);
    $("#opt3").val(inputs.options[2]);
    $("#opt4").val(inputs.options[3]);
    $("#correct_opt").val(inputs.correct_opt);
    $("#quiz_channel").val(inputs.quiz_channel);
    $("#winner_channel").val(inputs.winner_channel);
    $("#time").val(inputs.time);
});

$("#clear").on("click", e => {
    localStorage.setItem("inputs", JSON.stringify({}))
    
    var inputs = JSON.parse(localStorage.getItem("inputs"));
    $("#quiz_num").val(inputs.quiz_num);
    $("#question").val(inputs.question);
    $("#opt1").val(inputs.options[0]);
    $("#opt2").val(inputs.options[1]);
    $("#opt3").val(inputs.options[2]);
    $("#opt4").val(inputs.options[3]);
    $("#correct_opt").val(inputs.correct_opt);
    $("#quiz_channel").val(inputs.quiz_channel);
    $("#winner_channel").val(inputs.winner_channel);
    $("#time").data("DateTimePicker").clear()
    $("#timeend").data("DateTimePicker").clear()
});

var time = {}, timeend = {}, inputs = {};
$('#time').on('dp.change', function (ev) {
    // $('#timeend').data("DateTimePicker").minDate(ev.date);

    var datetime = new Date(ev.date._d?.getTime());
    // Convert local timestamp to UTC timestamp
    var local = moment(datetime).valueOf();
    time = {
        local,
        //utc: moment.utc(local).format()
        utc: ev.date._d?.getTime()
    };
});
$('#timeend').on('dp.change', function (ev) {
    // $('#time').data("DateTimePicker").maxDate(ev.date);
    
    var datetime = new Date(ev.date._d?.getTime());
    // Convert local timestamp to UTC timestamp
    var local = moment(datetime).valueOf();
    timeend = {
        local,
        // utc: moment.utc(local).format()
        utc: ev.date._d?.getTime()
    };
});


$("#quiz_num, #question, #opt1, #opt2, #opt3, #opt4, #correct_opt, #quiz_channel, #winner_channel, #password").on("keyup, keydown, keypress, change", e => {
    inputs = {
        quiz_num: $("#quiz_num").val(),
        question: $("#question").val(),
        options: [
            $("#opt1").val(),
            $("#opt2").val(),
            $("#opt3").val(),
            $("#opt4").val(),
        ],
        correct_opt: $("#correct_opt").val(),
        quiz_channel: $("#quiz_channel").val(),
        winner_channel: $("#winner_channel").val(),
        password: $("#password").val(),
        time: time.utc,
        timeend: timeend.utc,
    }
    
    localStorage.setItem("inputs", JSON.stringify(inputs));
});


// get all values
const submit = document.getElementById("submit");
$(submit).on("click", async e => {
    const quiz_num = $("#quiz_num");
    const question = $("#question");
    const opt1 = $("#opt1");
    const opt2 = $("#opt2");
    const opt3 = $("#opt3");
    const opt4 = $("#opt4");
    const correct_opt = $("#correct_opt");
    const quiz_channel = $("#quiz_channel");
    const winner_channel = $("#winner_channel");
    const password = $("#password");
    
    if (!quiz_num.val() || !question.val() || !opt1.val() || !opt2.val() || !opt3.val() || !opt4.val() || !correct_opt.val() || !quiz_channel.val() || !winner_channel.val() || !password.val()) {
        alert("Please fill all the fields properly.")
        return;
    }
    
    inputs = {
        quiz_num: quiz_num.val(),
        question: question.val(),
        options: [
            opt1.val(),
            opt2.val(),
            opt3.val(),
            opt4.val(),
        ],
        correct_opt: correct_opt.val() || "",
        quiz_channel: quiz_channel.val() || "",
        winner_channel: winner_channel.val() || "",
        password: password.val(),
        time: time.utc,
        timeend: timeend.utc,
    }
    
    const obj = {
        "questionBody": {
            "content": "@everyone",
            "embeds": [
                {
                    "title": "Quiz #" + inputs.quiz_num,
                    "description": "**`Question:`** " + inputs.question,
                    "color": 259476,
                    "fields": [
                        {
                            "name": "Option :one:",
                            "value": inputs.options[0]
                        },
                        {
                            "name": "Option :two:",
                            "value": inputs.options[1]
                        },
                        {
                            "name": "Option :three:",
                            "value": inputs.options[2]
                        },
                        {
                            "name": "Option :four:",
                            "value": inputs.options[3]
                        }
                    ],
                    "footer": {
                        "text": "𝗥𝗮𝗻𝗱𝗼𝗺 𝗼𝗻𝗲 𝘄𝗵𝗼 𝘄𝗶𝗹𝗹 𝗮𝗻𝘀𝘄𝗲𝗿 𝘁𝗵𝗲 𝗰𝗼𝗿𝗿𝗲𝗰𝘁 𝗼𝗽𝘁𝗶𝗼𝗻, 𝘄𝗶𝗹𝗹 𝘄𝗶𝗻 𝘁𝗵𝗲 𝗾𝘂𝗶𝘇. 𝗔𝗻𝗱 𝗵𝗲 𝘄𝗶𝗹𝗹 𝗯𝗲 𝗴𝗶𝘃𝗲𝗻 arcane 𝗹𝗲𝘃𝗲𝗹 +𝟭."
                    },
                    "timestamp": inputs.time
                }
            ]
        },
        "answerBody": {
            "content": "@everyone",
            "embeds": [
                {
                    "title": "Result of Quiz #" + inputs.quiz_num,
                    "color": 259476,
                    "description": "{winnerId} is the winner of the Quiz #" +
                        inputs.quiz_num +". Congratulations 🎉, you won arcane level +1.\n\nThe correct answer was option :" +
                        (inputs.correct_opt === "Option 1" ? "one" : (inputs.correct_opt === "Option 2" ? 'two' : (inputs.correct_opt === "Option 3" ? 'three' : 'four')))
                        + ": " + inputs.options[parseInt(inputs.correct_opt.replace("Option ", "")) - 1],
                    "timestamp": inputs.timeend,
                    "author": {},
                    "image": {},
                    "thumbnail": {},
                    "footer": {
                        "text": "The member who didn't win the quiz, don't be sorry. Try for next one."
                    },
                    "fields": []
                }
            ],
            "components": []
        },
        "correctOption": inputs.correct_opt.replace("Option ", ""),
        "time": inputs.time,
        "timeOffset": inputs.timeend,
        "options": {
            "password": inputs.password,
            "channelId": inputs.quiz_channel,
            "resultChannelId":inputs.winner_channel
        }
    }
    
    axios.post("/quiz/setQuiz", obj).then(res => {
        console.log(res)
    }).catch(err => {
        console.log(err)
    });
})



