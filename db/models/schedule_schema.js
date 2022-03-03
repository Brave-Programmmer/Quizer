const mongoose = require('mongoose')

const reqString = {
  type: String,
  required: true,
}

const scheduledSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    content: {
        type: Object,
        required: true
    },
    channelId: reqString,
})

const name = 'scheduled-messages'

module.exports =
  mongoose.model[name] || mongoose.model(name, scheduledSchema, name)