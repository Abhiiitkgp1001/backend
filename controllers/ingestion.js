const checkMagicBytes= async(bytes)=>{
    bytes= bytes.map(decimal => '0x' + decimal.toString(16));
    // Assign hexadecimal values to variables
    let hexB = '0x42'; // 'B' in ASCII
    let hexM = '0x4d'; // 'M' in ASCII
    let hexS = '0x53'; // 'S' in ASCII
    let lastByte = '0x47' // 47 hex value
    console.log(bytes[0], bytes[1], bytes[2], bytes[3])
    if(bytes[0]===hexB.toString() && bytes[1]===hexM.toString() && bytes[2]===hexS.toString() && bytes[3]===lastByte.toString()){
        return true;
    }else{
        return false;
    }

}



const postDataIngest = async(req, res, next)=>{
    try{
        const bytes = Array.from(Buffer.from(req.body.data))
        if (bytes.length==0){
            res.send(500).send({
                "message":"Data length zero could not receive data"
            })
        }else{
            // get bytes and then 
            const magicBytes = bytes.slice(0,4);
            const resMagic = await checkMagicBytes(magicBytes)
            if(resMagic){

                res.status(201).json({
                    "message":"Data saved"
                })
            }else{
                res.status(400).json({
                    "message":"Data Error"
                })
            }
        }
       
    }catch(e){
        e.statusCode=500
        next(e)
    }
    

}

export {postDataIngest}
