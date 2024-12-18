import express from "express";

import { postDataIngest } from "../controllers/ingestion.js";

const router = express.Router()

router.get("/ping_ingestion", async(req, res)=>{
    res.status(200).send('pong_ingestion')
})

router.post("/data_ingest", postDataIngest)


export default router;