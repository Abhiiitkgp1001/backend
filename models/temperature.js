const mongoose = require("mongoose");

const TemperatureSchema = new mongoose.Schema({
    temp_id: {
        type: String,
        required: true,
        unique: true,
    },
    bms_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BmsSchema",
    },
    data: {
        type: [
            {
                timeStamp: {
                    type: Date,
                    required: true,
                },
                value: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    temp_name: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("TemperatureSchema", TemperatureSchema);