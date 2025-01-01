

const VOLATAGE_COMMAND=1
const TEMPERATURE_COMMAND=2
const CURRENT_COMMAND=3
const NUM_SALVES_COMMAND=4
const NUM_CELLS_LAST_SLAVE=5


const parseVoltage = async(dataBytes, StartBMS, StartCell, EndBMS, EndCell,num_slaves, num_cells_last_slave, version)=>{
    voltages={}
    let tempByteSize;
    if(version==0){
        tempByteSize=2
    }else{
        tempByteSize=2
    }
    let pointer=0
    for(let i=StartBMS; i<=EndBMS; i++){
        for(let j=StartCell; j<=EndCell; j++){
            vol=(new DataView(dataBytes.slice(pointer, pointer+tempByteSize)).getInt16())/1000; // mv to v
            pointer= pointer +tempByteSize
            if(`bms_${i}` in voltages){
                voltages[`bms_${i}`].push(vol)
            }else{
                voltages[`bms_${i}`] = [vol]
            }
        }
    }
    return voltages;

}

const parseTemp= async(dataBytes, StartBMS, StartCell, EndBMS, EndCell, num_slaves, num_cells_last_slave, version)=>{
    temps={}
    let tempByteSize;
    if(version==0){
        tempByteSize=2
    }else{
        tempByteSize=2
    }
    let pointer=0
    for(let i=StartBMS; i<=EndBMS; i++){
        for(let j=StartCell; j<=EndCell; j++){
            vol=(new DataView(dataBytes.slice(pointer, pointer+tempByteSize)).getInt16())/1000; // mC to C
            pointer= pointer +tempByteSize
            if(`bms_${i}` in voltages){
                temps[`bms_${i}`].push(vol)
            }else{
                temps[`bms_${i}`] = [vol]
            }
        }
    }
    return temps;
}


const dataParser= async (data)=>{
    // remove first 10 bytes and start processing
    let parsedData={}
    const decoder = new TextDecoder("utf-8");
    const bytes = Array.from(Buffer.from(data))
    const version = bytes.slice(4,6)
    const dataBytesSize = bytes.slice(6,10) 
    const dataBytes = bytes.slice(10,)
    if(dataBytes.length == dataBytesSize){
        let pointer = 0;
        let num_slaves, num_cells_last_slave;
        while(pointer < dataBytesSize){
            // read first byte if it is 0xAA then else return bad data 
            startByte = dataBytes[pointer++]
            if(startByte=== '0xAA'){
                const protocolVersion= new DataView(dataBytes[pointer++]).getUint8();
                const deviceId = decoder.decode(dataBytes.slice(pointer, pointer+4))
                if (!deviceId in parsedData){
                    parsedData ={
                        deviceId:{
                            'voltage':[],
                            'temp':[],
                            'current':[]
                        }
                    }
                }
                pointer = pointer + 4
                const commandType = dataBytes[pointer++]; // command type size is 1 byte
                const coordinates = dataBytes.slice(pointer, pointer+4)
                pointer = pointer +4 
                let voltages, temps, current;
                if(commandType=='') { // parse voltage
                    // get size of voltage bytes
                    let StartBMS = coordinates[0]
                    let StartCell = coordinates[1]
                    let EndBMS= coordinates[2]
                    let EndCell = coordinates[3]
                    let voltageBytesSize = 2*((EndBMS - StartBMS) * 16 + (16 - StartCell) + (EndCell + 1))
                    voltages = await parseVoltage(dataBytes.slice(pointer, pointer+voltageBytesSize), StartBMS, StartCell, EndBMS, EndCell, protocolVersion)
                    pointer = pointer + voltageBytesSize;
                    let timeByte = dataBytes.slice(pointer, pointer+4) // convert to time before puting to 
                    pointer = pointer + 4 
                    parsedData[deviceId]['voltage'].push({
                        'cellsVoltage': voltages,
                        'timeStamps': timeByte
                    })
                    
                } 
                else if(commandType=='') { // parse temperature
                    let StartBMS = coordinates[0]
                    let StartCell = coordinates[1]
                    let EndBMS= coordinates[2]
                    let EndCell = coordinates[3]
                    let tempBytesSize = 2* ((EndBMS - StartBMS) * 5 + (5 - StartCell) + (EndCell + 1))
                    temps = await parseVoltage(dataBytes.slice(pointer, pointer+tempBytesSize), StartBMS, StartCell, EndBMS, EndCell, protocolVersion)
                    pointer = pointer + tempBytesSize;
                    let timeByte = dataBytes.slice(pointer, pointer+4) // convert to time before puting to 
                    parsedData[deviceId]['temp'].push({
                        'tempSensors': temps,
                        'timeStamps': timeByte
                    })
                   

                } 
                else if(commandType=='') { // parse current
                    current = new DataView(dataBytes[pointer++]).getUint32()
                    let timeByte = dataBytes.slice(pointer, pointer+4) // convert to time before puting to 
                    parsedData[deviceId]['current'].push({
                        'curent': current,
                        'timeStamps': timeByte
                    })

                } 
                else if(commandType=='') { // parse num_slaves
                    num_slaves = new DataView(dataBytes[pointer++]).getUint8()
                } 
                else if(commandType=='') { // parse num_cells_last_slave
                    num_cells_last_slave = new DataView(dataBytes[pointer++]).getUint8()
                } 

            }else{
                return null
            }
            let endBytes= dataBytes[pointer++]
            console.log(`Data block End: ${endBytes.toString('hex')} `)
        }
        return parsedData;
    }else{
        return null;
    }
    
}