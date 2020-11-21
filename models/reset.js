const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const resetSchema = new mongoose.Schema({
    resetPasswordToken: String,
    resetPasswordExpires: Number,
    username: String
});

resetSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Reset",resetSchema);