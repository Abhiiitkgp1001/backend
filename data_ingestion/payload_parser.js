// const zlib = require('zlib'); // For CRC validation
// const crc32 = require('crc-32'); // Install via npm: `npm install crc-32`
import crc32 from 'crc-32';
import zlib from 'zlib';

const MAGIC_WORD = "BMSG";
const UINT32_MAX = 0xFFFFFFFF;
const START_BYTE = 0xAA; // Example start byte
const END_BYTE = 0xBB;   // Example end byte
const NUM_CELLS_PER_BMS = 16;
const NUM_TEMP_SENSORS_PER_BMS = 5;
const NUM_BYTES_PER_CELL_VOLTAGE = 2;
const NUM_BYTES_PER_TEMP_SENSOR = 2;

/**
 * Parse the binary blob and extract the details.
 */
function parseBinaryBlob(data) {
    const buffer = Buffer.from(data);
    let offset = 0;

    // Extract the magic word, version, size, and CRC
    const magicWord = buffer.toString('utf8', offset, offset + 4);
    offset += 4;
    const version = buffer.readUInt8(offset++);
    const size = buffer.readUInt32LE(offset);
    offset += 4;
    const crc = buffer.readUInt32LE(offset);
    offset += 4;

    // Verify the magic word
    if (magicWord !== MAGIC_WORD) {
        throw new Error("Magic word mismatch");
    }

    // Extract the payload
    const payload = buffer.slice(offset);

    // Verify the CRC
    const calculatedCrc = (crc32.buf(payload) >>> 0) & UINT32_MAX; // Ensure unsigned
    if (calculatedCrc !== crc) {
        throw new Error("CRC mismatch");
    }

    offset = 0;
    while (offset < payload.length) {
        if (payload[offset] === START_BYTE) {
            offset++;
            const protocolVersion = payload.readUInt8(offset++);
            const timestamp = payload.slice(offset, offset + 12);
            console.log(timestamp);
            console.log(timestamp.toString('utf-8'))
            offset += 12;
            const deviceId = payload.readUInt32LE(offset);
            offset += 4;
            const commandType = payload.readUInt8(offset++);
            
            if (commandType === 0) {
                const startBms = payload.readUInt8(offset++);
                const endBms = payload.readUInt8(offset++);
                const startSensorEndSensor = payload.readUInt8(offset++);
                const startSensor = (startSensorEndSensor >> 4) & 0x0F;
                const endSensor = startSensorEndSensor & 0x0F;

                const voltageDataSize = ((endBms - startBms - 1) * NUM_CELLS_PER_BMS 
                                        + (NUM_CELLS_PER_BMS - startSensor) 
                                        + (endSensor + 1)) * NUM_BYTES_PER_CELL_VOLTAGE;
                const voltageData = payload.slice(offset, offset + voltageDataSize);
                offset += voltageDataSize;

                const voltageValues = [];
                for (let i = 0; i < voltageData.length; i += 2) {
                    voltageValues.push(voltageData.readUInt16LE(i) / 1000);
                }
                console.log(`Command Type: ${commandType}, Start BMS: ${startBms}, End BMS: ${endBms}, Start Sensor: ${startSensor}, End Sensor: ${endSensor}, Voltage Data: ${voltageValues}`);
            } else if (commandType === 1) {
                const startBms = payload.readUInt8(offset++);
                const endBms = payload.readUInt8(offset++);
                const startSensorEndSensor = payload.readUInt8(offset++);
                const startSensor = (startSensorEndSensor >> 4) & 0x0F;
                const endSensor = startSensorEndSensor & 0x0F;

                const temperatureDataSize = ((endBms - startBms - 1) * NUM_TEMP_SENSORS_PER_BMS 
                                            + (NUM_TEMP_SENSORS_PER_BMS - startSensor) 
                                            + (endSensor + 1)) * NUM_BYTES_PER_TEMP_SENSOR;
                const temperatureData = payload.slice(offset, offset + temperatureDataSize);
                offset += temperatureDataSize;

                const temperatureValues = [];
                for (let i = 0; i < temperatureData.length; i += 2) {
                    temperatureValues.push(temperatureData.readInt16LE(i) / 10);
                }
                console.log(`Command Type: ${commandType}, Start BMS: ${startBms}, End BMS: ${endBms}, Start Sensor: ${startSensor}, End Sensor: ${endSensor}, Temperature Data: ${temperatureValues}`);
            } else if (commandType === 2) {
                const current = payload.readInt32LE(offset) / 1000;
                offset += 4;
                console.log(`Command Type: ${commandType}, Current in Ampere: ${current}`);
            } else if (commandType === 3) {
                const numOfSlaves = payload.readUInt8(offset++);
                console.log(`Command Type: ${commandType}, Number of Slaves: ${numOfSlaves}`);
            } else if (commandType === 4) {
                const numOfCellsInLastBms = payload.readUInt8(offset++);
                console.log(`Command Type: ${commandType}, Number of cells in the last BMS: ${numOfCellsInLastBms}`);
            } else {
                throw new Error("Invalid Command Type");
            }

            if (payload[offset] !== END_BYTE) {
                throw new Error("End byte mismatch");
            }
            offset++;
        } else {
            throw new Error("Expected a Start Byte");
        }
    }
}

export {parseBinaryBlob};


