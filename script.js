let todosOsVideosGlobal = [];

// 1. Elementos do HTML
const gradeDeVideos = document.getElementById("minha-grade");
const tituloPagina = document.getElementById("titulo-pagina");
const barraPesquisa = document.getElementById("barra-pesquisa");
const modal = document.getElementById("modal-player");
const iframe = document.getElementById("video-iframe");
const containerAnos = document.getElementById("container-anos");

// 2. Inicialização
async function inicializarSite() {
    try {
        const resposta = await fetch('videos.json');
        const dadosBrutos = await resposta.json();
        todosOsVideosGlobal = dadosBrutos.sort((a, b) => b.data.localeCompare(a.data));

        gerarBotoesDeAno();
        const anoMaisRecente = todosOsVideosGlobal[0].data.substring(0, 4);
        filtrarPorAno(anoMaisRecente);
        atualizarContador();

    } catch (erro) {
        console.error("Erro ao carregar o JSON:", erro);
    }
}

// 3. Funções de Interface
function gerarBotoesDeAno() {
    const anosUnicos = [...new Set(todosOsVideosGlobal.map(v => v.data.substring(0, 4)))].sort((a, b) => b - a);
    containerAnos.innerHTML = "";
    
    anosUnicos.forEach(ano => {
        const btn = document.createElement("button");
        btn.innerText = ano;
        btn.className = "btn-ano";
        btn.onclick = () => {
            document.querySelectorAll('.btn-ano').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtrarPorAno(ano);
        };
        containerAnos.appendChild(btn);
    });
}

function filtrarPorAno(anoAlvo) {
    const filtrados = todosOsVideosGlobal.filter(v => v.data.startsWith(anoAlvo));
    carregarAno(filtrados, anoAlvo);
}

function carregarAno(listaDeVideos, titulo) {
    gradeDeVideos.innerHTML = "";
    tituloPagina.innerText = "Vídeos: " + titulo;
    const vistos = JSON.parse(localStorage.getItem("videosVistos")) || [];

    listaDeVideos.forEach(video => {
        const jaVisto = vistos.includes(video.id) ? "visto" : "";
        gradeDeVideos.innerHTML += `
            <div class="video-card ${jaVisto}" id="card-${video.id}">
                <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" onclick="abrirVideo('${video.id}')">
                <div class="video-info">
                    <h3 onclick="abrirVideo('${video.id}')">${video.titulo}</h3>
                    <p>${video.data.substring(6,8)}/${video.data.substring(4,6)}/${video.data.substring(0,4)}</p>
                    <button class="btn-visto" onclick="alternarVisto('${video.id}')">
                        ${jaVisto ? "✓ Visto" : "Marcar como visto"}
                    </button>
                </div>
            </div>`;
    });
    gradeDeVideos.scrollLeft = 0;
}

// 4. Modal Player e Fechamento
function abrirVideo(id) {
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    modal.style.display = "block";

    const btnVistoModal = document.getElementById("btn-visto-modal");
    btnVistoModal.onclick = () => {
        alternarVisto(id);
        alert("✅ Progresso atualizado!");
    };
}

const botaoFechar = document.querySelector(".close-modal");
botaoFechar.onclick = function() {
    modal.style.display = "none";
    iframe.src = "";
};

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        iframe.src = "";
    }
};

// 5. Progresso e Conquistas
function atualizarContador() {
    const vistos = JSON.parse(localStorage.getItem("videosVistos")) || [];
    const total = todosOsVideosGlobal.length;
    const quantidadeVistos = vistos.length;
    const percentagem = total > 0 ? (quantidadeVistos / total) * 100 : 0;
    
    document.getElementById("barra-progresso").style.width = percentagem + "%";
    document.getElementById("texto-contador").innerText = `${quantidadeVistos} / ${total} vídeos assistidos`;

    verificarConquistas(quantidadeVistos);
}

function alternarVisto(id) {
    let vistos = JSON.parse(localStorage.getItem("videosVistos")) || [];
    const card = document.getElementById(`card-${id}`);
    
    if (!vistos.includes(id)) {
        vistos.push(id);
        if (card) card.classList.add("visto");
        dispararConfetes();
    } else {
        vistos = vistos.filter(v => v !== id);
        if (card) card.classList.remove("visto");
    }

    localStorage.setItem("videosVistos", JSON.stringify(vistos));
    if (card) card.querySelector(".btn-visto").innerText = vistos.includes(id) ? "✓ Visto" : "Marcar como visto";
    atualizarContador();
}

function verificarConquistas(quantidade) {
    const container = document.getElementById("badges-container");
    if (!container) return;
    container.innerHTML = ""; 

    if (quantidade >= 50) container.innerHTML += "<span>🗝️ Iniciante</span> ";
    if (quantidade >= 500) container.innerHTML += "<span>🎫 Fã de Elite</span> ";
    if (quantidade >= 1700) container.innerHTML += "<span>👑 Mestre da Chave</span> ";
}

// 6. Maratona e Outros
function modoMaratona() {
    document.getElementById("modal-maratona-aviso").style.display = "block";
}

function fecharAvisoMaratona() {
    document.getElementById("modal-maratona-aviso").style.display = "none";
}

function iniciarSorteioMaratona() {
    fecharAvisoMaratona();
    const vistos = JSON.parse(localStorage.getItem("videosVistos")) || [];
    let naoVistos = todosOsVideosGlobal.filter(v => !vistos.includes(v.id));
    let listaSorteio = naoVistos.length > 0 ? naoVistos : todosOsVideosGlobal;
    const sorteado = listaSorteio[Math.floor(Math.random() * listaSorteio.length)];
    abrirVideo(sorteado.id);
    tituloPagina.innerText = "🍿 Maratona: " + sorteado.titulo;
}

function capsulaDoTempo() {
    const hoje = new Date();
    const diaMes = String(hoje.getMonth() + 1).padStart(2, '0') + String(hoje.getDate()).padStart(2, '0');

    const filtrados = todosOsVideosGlobal.filter(video => video.data.substring(4, 8) === diaMes);

    if (filtrados.length > 0) {
        carregarAno(filtrados, "Cápsula do Tempo: " + hoje.getDate() + "/" + (hoje.getMonth() + 1));
    } else {
        alert("Nenhum vídeo encontrado para hoje nos anos anteriores! 😢");
    }
}

function dispararConfetes() {
    const container = document.getElementById("confetti-container");
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.backgroundColor = ['#ff0000', '#ffffff', '#ffd700'][Math.floor(Math.random() * 3)];
        confetti.style.animationDuration = (Math.random() * 2 + 1) + "s";
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Filtros e Busca
document.getElementById("btn-culinaria").onclick = (e) => {
    e.preventDefault();
    const palavras = ["cozinha", "provando", "comida", "doce", "receita", "gourmet", "restaurante", "geladeira", "provamos"];
    const filtrados = todosOsVideosGlobal.filter(v => palavras.some(p => v.titulo.toLowerCase().includes(p)));
    carregarAno(filtrados, "Culinária");
};

document.getElementById("btn-politica").onclick = (e) => {
    e.preventDefault();
    const palavras = ["política", "eleição", "voto", "governo", "canadá", "imposto", "notícia"];
    const filtrados = todosOsVideosGlobal.filter(v => palavras.some(p => v.titulo.toLowerCase().includes(p)));
    carregarAno(filtrados, "Política");
};

barraPesquisa.oninput = () => {
    const termo = barraPesquisa.value.toLowerCase().replace(/[\.\-]/g, " ");
    const palavrasBusca = termo.split(" ").filter(p => p.length > 0);

    if (palavrasBusca.length > 0) {
        const filtrados = todosOsVideosGlobal.filter(video => {
            const tituloLimpo = video.titulo.toLowerCase().replace(/[\.\-]/g, " ");
            return palavrasBusca.every(palavra => tituloLimpo.includes(palavra));
        });
        carregarAno(filtrados, "Busca: " + barraPesquisa.value);
    } else {
        filtrarPorAno("2024");
    }
};

document.getElementById("btn-direita").onclick = () => gradeDeVideos.scrollBy({ left: 1200, behavior: 'smooth' });
document.getElementById("btn-esquerda").onclick = () => gradeDeVideos.scrollBy({ left: -1200, behavior: 'smooth' });

inicializarSite();