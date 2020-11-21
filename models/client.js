const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");


const clientSchema = new mongoose.Schema({
    username: String,
    password: String
});

clientSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Client",clientSchema);