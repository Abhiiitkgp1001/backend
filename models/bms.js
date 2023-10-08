const mongoose = require("mongoose");

const BmsSchema = new mongoose.Schema({
    bms_id: {
        type: String,
        required: true,
        unique: true,
    },
    voltage: {
        type: [
            {
                cell_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "VoltageSchema",
                },
            },
        ],
    },
    temp: {
        type: [
            {
                temp_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "TemperatureSchema",
                },
            },
        ],
    },
    current: {
        type: [
            {
                current_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "CurrentSchema",
                },
            },
        ],
    },
    bms_name: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("BmsSchema", BmsSchema);