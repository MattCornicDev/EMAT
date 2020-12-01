const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
    image: String,
    title: String, 
    description: String,
    user: String,
    date: 
    {
        type: Date, // date est type 
        default: Date.now() // date actuel crée automatiquement 
    }
});

module.exports = mongoose.model("Favourite",favouriteSchema);