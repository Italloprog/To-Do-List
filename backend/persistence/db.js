import { Pool } from 'pg';

const pool = new Pool({
  host: 'dpg-d5tu91nfte5s73cmig5g-a.oregon-postgres.render.com', //endereço do servidor do PostgreSQL
  port: 5432,
  user: 'to_do_list_db_0jdp_user',       //usuário do PostgreSQL
  password: 'XtkWZmm7kyK5SGkWnHEgQqoOyM16gv2s',  //senha
  database: 'to_do_list_db_0jdp',  //nome do banco
  ssl: { rejectUnauthorized: false }, //Configurando SSL
});

export default pool;