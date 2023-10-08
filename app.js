const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.get("/cities", (req,res) => {
    const cities = [
        {
            id: 1,
            name: "New York",
        },
        {
            id: 2,
            name: "Berlin",
        },
        {
        id: 3,
        name: "London",
        },
    ];
  
    res.json(cities);
});

app.listen(port, () => console.log(`Express app running on port ${port}!`));