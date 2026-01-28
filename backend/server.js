import express from 'express';
import 'reflect-metadata';

const app = express();
app.use(express.json());


app.listen(3000, () => {
    console.log("Server rodando em 127.0.0.1:3000");
});