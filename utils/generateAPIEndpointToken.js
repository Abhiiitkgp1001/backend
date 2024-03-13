import jwt from "jsonwebtoken";

const APIEndpointId = "api-endpoint-id";
const secretKey = "supersecret";
const generateToken = () => {
  const token = jwt.sign(
    {
      apiId: APIEndpointId,
    },
    secretKey
  );
  console.log(token);
};
generateToken();

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlJZCI6ImFwaS1lbmRwb2ludC1pZCIsImlhdCI6MTY5OTA5ODI4OH0.FX5q1nl41eQA02-dmrJyvAinH_4dL-QXJu0MiBc6sY4
