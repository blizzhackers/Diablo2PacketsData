const express = require('express');
const app = express();

const port = 8080;

app.use('/', express.static('.'));
app.listen(8080);
console.log('Listening on port', port, '...');
