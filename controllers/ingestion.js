import { parseBinaryBlob  } from "../data_ingestion/payload_parser.js";
import crc32 from 'crc-32';

const MAGIC_WORD = "BMSG";
const UINT32_MAX = 0xFFFFFFFF;
const START_BYTE = 0xAA; // Example start byte
const END_BYTE = 0xBB;   // Example end byte
const NUM_CELLS_PER_BMS = 16;
const NUM_TEMP_SENSORS_PER_BMS = 5;
const NUM_BYTES_PER_CELL_VOLTAGE = 2;
const NUM_BYTES_PER_TEMP_SENSOR = 2;


const postDataIngest = async(req, res, next)=>{
    try{
        const blob = req.body; // Access the binary data directly
        console.log('Blob received:', blob);
        const bytes = Array.from(blob)
        if (bytes.length==0){
            res.send(500).send({
                "message":"Data length zero could not receive data"
            })
        }else{
            const buffer = Buffer.from(blob);
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
                res.status(400).json({
                    "message":"Data Error"
                })
            }else{
                // Extract the payload
                const payload = buffer.slice(offset);
            
                // Verify the CRC
                const calculatedCrc = (crc32.buf(payload) >>> 0) & UINT32_MAX; // Ensure unsigned
                if (calculatedCrc !== crc) {
                    res.status(400).json({
                        "message":"Data Error CRC mot matched"
                    })
                }
                else{
                    res.status(201).json({
                        "message":"Data saved"
                    })
                }

                
            }
            parseBinaryBlob(blob)
        }
       
    }catch(e){
        e.statusCode=500
        next(e)
    }
    

}

export {postDataIngest}
