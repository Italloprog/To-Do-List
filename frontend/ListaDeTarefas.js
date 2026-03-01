let dragId = null;
let somatorio = 0;
let ApiUrl = 'https://to-do-list-backend-7uj7.onrender.com';

document.addEventListener("DOMContentLoaded", configurarPagina);

async function configurarPagina() {
  document.getElementById("data").setAttribute("min", new Date().toISOString().split("T")[0]);
  document.getElementById("data-e").setAttribute("min", new Date().toISOString().split("T")[0]);
  const response = await fetch(`${ApiUrl}/tarefas`);
  const tarefas = await response.json();
  renderTarefas(tarefas);
}

function renderTarefas(tarefas) {
  somatorio = 0;
  const ul = document.getElementById("lista-tarefas");
  ul.innerHTML = "";

  tarefas.forEach((tarefa) => {
    somatorio += Number(tarefa.custo);
    document.getElementById("total-custo").innerText = `R$ ${somatorio.toFixed(2).replace(".", ",")}`;

    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = tarefa.id_tarefa;
    li.dataset.ordem = tarefa.ordem_apresentacao;

    if(Number(tarefa.custo) >= 1000){
      li.classList.add("high-cost");
    }

    li.innerHTML = `
      <div class="task-info">
        <div class="task-title">${tarefa.nome_tarefa}</div>
        <span>ID: ${tarefa.id_tarefa}</span>
        <span>📅 Data limite: ${formatarData(tarefa.data_limite)}</span>
        <span>💰 Custo: R$ ${Number(tarefa.custo).toFixed(2).replace(".", ",")}</span>
      </div>

      <div class="task-actions">
        <button class="btn-up" onclick="subir(${tarefa.id_tarefa})">⬆</button>
        <button class="btn-down" onclick="descer(${tarefa.id_tarefa})">⬇</button>
        <button class="btn-edit" onclick="mostrarEditarTarefa(${tarefa.id_tarefa},'${tarefa.nome_tarefa}',${tarefa.custo},'${tarefa.data_limite.split("T")[0]}')">✏</button>
        <button class="btn-delete" onclick="excluir(${tarefa.id_tarefa})">🗑</button>
      </div>
    `;

    /* ===== DRAG EVENTS ===== */
    li.addEventListener("dragstart", () => {
      dragId = tarefa.id_tarefa;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      li.classList.add("drag-over");
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", () => {
      li.classList.remove("drag-over");
      if (dragId === Number(li.dataset.id)) return; 
      const novaOrdem = Number(li.dataset.ordem);
      atualizarOrdem(dragId, novaOrdem);
    });

    ul.appendChild(li);
  });

}

/* ===== BACKEND ===== */
async function atualizarOrdem(id, novaOrdem) {
    try {
  await fetch(`${ApiUrl}/tarefas/reordenar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_tarefa: id, nova_ordem: novaOrdem }),
  }).then(configurarPagina);
    } catch (error) {
        alert("Erro ao reordenar tarefas: " + error.message);
    }
}

/* ===== UTIL ===== */
function formatarData(data) {
  return data.split("T")[0].split("-").reverse().join("/");
}

/* ===== BOTÕES ===== */
async function subir(id) {
  const li = document.querySelector(`li[data-id="${id}"]`);
  const ordemAtual = Number(li.dataset.ordem);
  if (ordemAtual <= 1) return;

  await atualizarOrdem(id, ordemAtual - 1);
}

async function descer(id) {
  const li = document.querySelector(`li[data-id="${id}"]`);
  const ordemAtual = Number(li.dataset.ordem);
  await atualizarOrdem(id, ordemAtual + 1);
}

async function excluir(id) {
  if (confirm("Deseja excluir esta tarefa?")) {
    await fetch(`${ApiUrl}/tarefas/excluir/${id}`, {
      method: "DELETE",
    }).then(configurarPagina);
  }
}

function mostrarEditarTarefa(id, nome, custo, data) {
    let formCard = document.querySelector(".form-e-card");

    formCard.style.display = "block";

    document.querySelector("#id-e").innerHTML = id;
    document.querySelector("#nome-e").value = nome;
    document.querySelector("#custo-e").value = custo;
    document.querySelector("#data-e").value = data;

    

    document.querySelector("#nome-e").focus();
}

function esconderEditarTarefa() {
    let formCard = document.querySelector(".form-e-card");
    formCard.style.display = "none";
}

async function editarTarefa() {
    let id = document.querySelector("#id-e").innerHTML;
    let nomeTarefa = document.getElementById("nome-e").value;
    let custoTarefa = document.getElementById("custo-e").value;
    let dataTarefa = document.getElementById("data-e").value;

    if(custoTarefa < 0 || custoTarefa > 99999999.99){
        alert("Custo inválido. O valor deve estar entre 0 e 99.999.999,99.");
        return;
    }

    let response = await fetch(`${ApiUrl}/tarefas/editar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nome: nomeTarefa,
            custo: custoTarefa,
            data: dataTarefa
        })
    });

    const data = await response.json();
    alert(JSON.stringify(data));
    configurarPagina();
    esconderEditarTarefa();
}

function mostrarAdicionarTarefa() {
    let formCard = document.querySelector(".form-card");
    formCard.style.display = "block";
    document.querySelector("#nome").focus();
}

function esconderAdicionarTarefa() {
    let formCard = document.querySelector(".form-card");
    formCard.style.display = "none";
}

async function adicionarTarefa() {
  let nomeTarefa = document.getElementById("nome").value;
  let custoTarefa = document.getElementById("custo").value;
  let dataTarefa = document.getElementById("data").value;
  

  if(custoTarefa < 0 || custoTarefa > 99999999.99){
        alert("Custo inválido. O valor deve estar entre 0 e 99.999.999,99.");
        return;
    }
  
  const response = await fetch(`${ApiUrl}/tarefas/adicionar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: nomeTarefa,
      custo: custoTarefa,
      data: dataTarefa
    })
  });
  
  const data = await response.json();
  alert(JSON.stringify(data));
  configurarPagina();
  esconderAdicionarTarefa();
}
