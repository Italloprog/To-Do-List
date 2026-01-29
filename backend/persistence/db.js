import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.host, //endereço do servidor do PostgreSQL
  port: 5432,
  user: process.env.user,       //usuário do PostgreSQL
  password: process.env.password,  //senha
  database: process.env.database,  //nome do banco
  ssl: { rejectUnauthorized: false }, //Configurando SSL
});

export default pool;