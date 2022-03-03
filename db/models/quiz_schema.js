const mongoose = require('mongoose')

const reqString = {
  type: String,
  required: true,
}
const reqObject = {
  type: Object,
  required: true,
}
const reqNumber = {
  type: Number,
  required: true,
}
const reqDate = {
  type: Date,
  required: true,
}

const quizSchema = new mongoose.Schema({
    questionBody: reqObject,
    answerBody: reqObject,
    correctOption: reqString,
    time: reqDate,
    timeOffset: reqDate,
    state: reqNumber,
    questionMessage: {
        type: Object,
        required: false,
    },
    options: reqObject
})

const name = 'Quizs'

module.exports =
  mongoose.model[name] || mongoose.model(name, quizSchema, name)