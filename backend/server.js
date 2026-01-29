import express from 'express';
import { Routes } from './presentation/routes.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

new Routes('Rotas Tarefas', app, '/tarefas');

/* apenas primeiro uso para criar o banco de dados no PostgreSQL hospedado
app.get('/criarBD', (req, res) => {
    try {
    pool.query(`CREATE TABLE tarefas (
    id_tarefa SERIAL PRIMARY KEY,
    
    nome_tarefa VARCHAR(255) NOT NULL UNIQUE,
    
    custo NUMERIC(10,2) NOT NULL
        CHECK (custo >= 0),
    
    data_limite DATE NOT NULL,
    
    ordem_apresentacao INTEGER NOT NULL UNIQUE
);`),
        pool.query(`ALTER TABLE tarefas
DROP CONSTRAINT tarefas_ordem_apresentacao_key;`);

        pool.query(`
ALTER TABLE tarefas
ADD CONSTRAINT tarefas_ordem_apresentacao_key
UNIQUE (ordem_apresentacao)
DEFERRABLE INITIALLY DEFERRED;`); 

 }catch (error) {
        res.status(500).json({ erro: 'Erro ao criar db: ' + error.message });
    }
}),
*/

app.listen(3000, () => {
    console.log('Servidor iniciado na porta 3000');
});