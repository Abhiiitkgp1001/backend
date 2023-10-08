const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true,
        unique: true,
    },
    no_of_bms: {
        type: Number,
        required: true,
    },
    bms: {
        type: [
            {
                bms_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "BmsSchema",
                },
            },
        ],
    },
    session_name: {
        type: String,
    },
    start_time: {
        type: Date,
        required: true,
    },
    end_time: {
        type: Date,
        required: true,
    }
});

module.exports = mongoose.model("SessionSchema", SessionSchema);