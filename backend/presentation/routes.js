import pool from "../persistence/db.js";

export class Routes {
  constructor(nome, app, rota) {
    this.nome = nome;
    this.app = app;
    this.rota = rota;
    this.configureRoutes();
  }

  configureRoutes() {
    this.app.route(this.rota).get(async (req, res) => {
      try {
        const result = await pool.query(
          "SELECT * FROM tarefas ORDER BY ordem_apresentacao",
        );
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar tarefas" });
      }
    });

    this.app.route(this.rota + "/adicionar").post(async (req, res) => {
      const { nome, custo, data } = req.body;
      try {
        if (!nome || !custo || !data) {
          throw new Error("Todos os campos são obrigatórios para adicionar");
        } else if (
          (
            await pool.query("SELECT * FROM tarefas WHERE nome_tarefa = $1", [
              nome,
            ])
          ).rows.length > 0
        ) {
          throw new Error(
            "Já existe uma tarefa com esse nome, escolha outro nome.",
          );
        }
        await pool.query(
          "INSERT INTO tarefas (nome_tarefa, custo, data_limite, ordem_apresentacao) VALUES ($1, $2, $3, (SELECT COALESCE(MAX(ordem_apresentacao), 0) + 1 FROM tarefas))",
          [nome, custo, data],
        );
      } catch (error) {
        res.status(500).json({ erro: error.message });
      }

      res.json({ message: "Tarefa adicionada com sucesso!" });
    });

    this.app.route(this.rota + "/excluir/:id").delete(async (req, res) => {
      const id = parseInt(req.params.id);

      try {
        await pool.query("BEGIN");

        // 1️⃣ Buscar ordem da tarefa
        const tarefa = await pool.query(
          "SELECT ordem_apresentacao FROM tarefas WHERE id_tarefa = $1",
          [id],
        );

        if (tarefa.rowCount === 0) {
          await pool.query("ROLLBACK");
          return res.status(404).json({ erro: "Tarefa não encontrada" });
        }

        const ordemRemovida = tarefa.rows[0].ordem_apresentacao;

        // 2️⃣ Excluir a tarefa
        await pool.query("DELETE FROM tarefas WHERE id_tarefa = $1", [id]);

        // 3️⃣ Reorganizar as ordens
        await pool.query(
          `
      UPDATE tarefas
      SET ordem_apresentacao = ordem_apresentacao - 1
      WHERE ordem_apresentacao > $1
      `,
          [ordemRemovida],
        );

        await pool.query("COMMIT");

        res.json({ mensagem: "Tarefa excluída com sucesso" });
      } catch (error) {
        await pool.query("ROLLBACK");
        res.status(500).json({ erro: "Erro ao excluir tarefa" });
      }
    });

    this.app.route(this.rota + "/editar/:id").put(async (req, res) => {
      const id = parseInt(req.params.id);
      const { nome, custo, data } = req.body;
      try {
        if (!nome || !custo || !data) {
          throw new Error("Todos os campos são obrigatórios para editar");
        } else if (
          (
            await pool.query(
              "SELECT * FROM tarefas WHERE nome_tarefa = $1 AND id_tarefa != $2",
              [nome, id],
            )
          ).rows.length > 0
        ) {
          throw new Error(
            "Já existe uma tarefa com esse nome, escolha outro nome.",
          );
        }
        await pool.query(
          "UPDATE tarefas SET nome_tarefa = $1, custo = $2, data_limite = $3 WHERE id_tarefa = $4",
          [nome, custo, data, id],
        );
      } catch (error) {
        res.status(500).json({ erro: error.message });
      }
      res.status(200).json({ message: "Tarefa editada com sucesso!" });
    });

    this.app.route(this.rota + "/reordenar").put(async (req, res) => {
  const { id_tarefa, nova_ordem } = req.body;

  try {
    await pool.query("BEGIN");
    await pool.query("SET CONSTRAINTS ALL DEFERRED");

    // 1) bloqueia a linha do item movido (evita que outro reordene ao mesmo tempo)
    const atualRes = await pool.query(
      "SELECT ordem_apresentacao FROM tarefas WHERE id_tarefa = $1 FOR UPDATE",
      [id_tarefa]
    );

    if (atualRes.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ erro: "Tarefa não encontrada" });
    }

    const ordemAtual = Number(atualRes.rows[0].ordem_apresentacao);

    if (ordemAtual === nova_ordem) {
      await pool.query("ROLLBACK");
      return res.json({ mensagem: "Nenhuma alteração necessária" });
    }

    // 2) calcula um valor temporário garantidamente fora do range atual
    const maxRes = await pool.query("SELECT COALESCE(MAX(ordem_apresentacao), 0) as m FROM tarefas");
    const maxOrdem = Number(maxRes.rows[0].m);
    const tempVal = -(maxOrdem + 1000); // numero negativo longe do range

    // 3) marca o item movido com valor temporário (remove do caminho)
    await pool.query(
      "UPDATE tarefas SET ordem_apresentacao = $1 WHERE id_tarefa = $2",
      [tempVal, id_tarefa]
    );

    // 4) bloqueia as linhas da faixa afetada para evitar concorrência
    if (ordemAtual < nova_ordem) {
      // mover para baixo: decrementa 1 das tarefas entre (ordemAtual, nova_ordem]
      await pool.query(
        `SELECT id_tarefa FROM tarefas
         WHERE ordem_apresentacao > $1 AND ordem_apresentacao <= $2
         FOR UPDATE`,
        [ordemAtual, nova_ordem]
      );

      await pool.query(
        `UPDATE tarefas
         SET ordem_apresentacao = ordem_apresentacao - 1
         WHERE ordem_apresentacao > $1 AND ordem_apresentacao <= $2`,
        [ordemAtual, nova_ordem]
      );
    } else {
      // mover para cima: incrementa 1 das tarefas entre [nova_ordem, ordemAtual)
      await pool.query(
        `SELECT id_tarefa FROM tarefas
         WHERE ordem_apresentacao >= $1 AND ordem_apresentacao < $2
         FOR UPDATE`,
        [nova_ordem, ordemAtual]
      );

      await pool.query(
        `UPDATE tarefas
         SET ordem_apresentacao = ordem_apresentacao + 1
         WHERE ordem_apresentacao >= $1 AND ordem_apresentacao < $2`,
        [nova_ordem, ordemAtual]
      );
    }

    // 5) coloca o item movido na nova posição
    await pool.query(
      "UPDATE tarefas SET ordem_apresentacao = $1 WHERE id_tarefa = $2",
      [nova_ordem, id_tarefa]
    );

    await pool.query("COMMIT");
    return res.json({ mensagem: "Ordem atualizada com sucesso" });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Erro /reordenar (com FOR UPDATE):", err);
    return res.status(500).json({ erro: err.message || "Erro ao reordenar tarefas" });
  }
});

    return this.app;
  }
}
