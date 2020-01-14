const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.sendFile(__dirname + '/src/html/index.html'));

app.use(express.static('src'));

app.listen(port, () => console.log(`Example app listening on port ${port}!`))