let todosOsVideosGlobal = [];


const gradeDeVideos = document.getElementById("minha-grade");
const tituloPagina = document.getElementById("titulo-pagina");
const barraPesquisa = document.getElementById("barra-pesquisa");
const modal = document.getElementById("modal-player");
const iframe = document.getElementById("video-iframe");
const containerAnos = document.getElementById("container-anos");


async function inicializarSite() {
    try {
        const resposta = await fetch('videos.json');
        const dadosBrutos = await resposta.json();
        todosOsVideosGlobal = dadosBrutos.sort((a, b) => b.data.localeCompare(a.data));

        gerarBotoesDeAno();
        configurarFiltrosDeQuadros(); 
        
        const anoMaisRecente = todosOsVideosGlobal[0].data.substring(0, 4);
        filtrarPorAno(anoMaisRecente);
        atualizarContador();

    } catch (erro) {
        console.error("Erro ao carregar o JSON:", erro);
    }
}

function gerarBotoesDeAno() {
    const anosUnicos = [...new Set(todosOsVideosGlobal.map(v => v.data.substring(0, 4)))].sort((a, b) => b - a);
    containerAnos.innerHTML = "";
    
    anosUnicos.forEach(ano => {
        const btn = document.createElement("button");
        btn.innerText = ano;
        btn.className = "btn-ano";
        
        btn.onclick = () => {
        document.querySelectorAll('.btn-ano, .btn-quadro').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    
        localStorage.setItem("ultimoFiltroTipo", "ano");
        localStorage.setItem("ultimoFiltroValor", ano);
    
    filtrarPorAno(ano);
};  
        containerAnos.appendChild(btn);
    });
}

function filtrarPorAno(anoAlvo) {
    const filtrados = todosOsVideosGlobal.filter(v => v.data.startsWith(anoAlvo));
    carregarAno(filtrados, anoAlvo);
}

function configurarFiltrosDeQuadros() {
    document.querySelectorAll('.btn-quadro').forEach(botao => {
        botao.onclick = (e) => {
            e.preventDefault();
            const termoBusca = (botao.getAttribute('data-quadro') || botao.getAttribute('data-busca')).toLowerCase();
            
            
            localStorage.setItem("ultimoFiltroTipo", "quadro");
            localStorage.setItem("ultimoFiltroValor", termoBusca);
            localStorage.setItem("ultimoTituloFiltro", botao.innerText);

            const filtrados = todosOsVideosGlobal.filter(v => {
                const titulo = normalizarTexto(v.titulo);
                const tags = v.tags ? normalizarTexto(v.tags) : ""; 
                return titulo.includes(normalizarTexto(termoBusca)) || tags.includes(normalizarTexto(termoBusca));
            });

            carregarAno(filtrados, `Quadro: ${botao.innerText}`);
            
            
            document.querySelectorAll('.btn-quadro, .btn-ano').forEach(b => b.classList.remove('active'));
            botao.classList.add('active');
        };
    });
}

function carregarAno(listaDeVideos, titulo) {
    tituloPagina.innerText = titulo;
    const vistos = JSON.parse(localStorage.getItem("videosVistos")) || [];
    
    gradeDeVideos.innerHTML = ""; 
    const fragmento = document.createDocumentFragment();

    listaDeVideos.forEach(video => {
        const jaVisto = vistos.includes(video.id);
        
        const card = document.createElement("div");
        card.className = `video-card ${jaVisto ? "visto" : ""}`;
        card.id = `card-${video.id}`;
        
        card.innerHTML = `
            <div class="thumbnail-default">
                <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" 
                     loading="lazy" 
                     onclick="abrirVideo('${video.id}')">
            </div>
            <div class="video-info">
                <h3 onclick="abrirVideo('${video.id}')">${video.titulo}</h3>
                <div class="video-meta">
                    <p>${video.data.substring(6,8)}/${video.data.substring(4,6)}/${video.data.substring(0,4)}</p>
                    <button class="btn-visto" onclick="alternarVisto('${video.id}')">
                        ${jaVisto ? "✓ Visto" : "Marcar visto"}
                    </button>
                </div>
            </div>`;
        
        fragmento.appendChild(card);
    });

    gradeDeVideos.appendChild(fragmento);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function abrirVideo(id) {
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    modal.style.display = "block";

    const btnVistoModal = document.getElementById("btn-visto-modal");
    const vistos = JSON.parse(localStorage.getItem("videosVistos")) || [];
    

    if (vistos.includes(id)) {
        btnVistoModal.classList.add("sucesso");
        btnVistoModal.innerHTML = "🚀 Vídeo Assistido! Progresso Salvo!";
    } else {
        btnVistoModal.classList.remove("sucesso");
        btnVistoModal.innerHTML = "✅ Marcar como visto e somar no Progresso";
    }

    btnVistoModal.onclick = () => {
        const vistosAtualizados = JSON.parse(localStorage.getItem("videosVistos")) || [];
        if (vistosAtualizados.includes(id)) {
            alert("Este vídeo já está no seu progresso! 😊");
            return;
        }

        alternarVisto(id); 
        btnVistoModal.classList.add("sucesso");
        btnVistoModal.innerHTML = "🚀 Vídeo Assistido! Progresso Salvo!";
        dispararConfetes(); 
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


let debounceTimer;

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

barraPesquisa.oninput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const termoOriginal = barraPesquisa.value.trim();
        const termoNormalizado = normalizarTexto(termoOriginal);
        
        if (termoNormalizado.length > 0) {
            const palavrasBusca = termoNormalizado.split(/\s+/); 
            const filtrados = todosOsVideosGlobal.filter(video => {
                const tituloNormalizado = normalizarTexto(video.titulo);
                return palavrasBusca.every(palavra => tituloNormalizado.includes(palavra));
            });
            carregarAno(filtrados, `Resultados para: "${termoOriginal}"`);
        } else {
            const fallbackAno = todosOsVideosGlobal[0].data.substring(0, 4);
            filtrarPorAno(fallbackAno);
        }
    }, 250);
};

async function inicializarSite() {
    try {
        const resposta = await fetch('videos.json');
        const dadosBrutos = await resposta.json();
        todosOsVideosGlobal = dadosBrutos.sort((a, b) => b.data.localeCompare(a.data));

        gerarBotoesDeAno();
        configurarFiltrosDeQuadros();
        
        
        const tipoFiltro = localStorage.getItem("ultimoFiltroTipo");
        const valorFiltro = localStorage.getItem("ultimoFiltroValor");
        const tituloFiltro = localStorage.getItem("ultimoTituloFiltro");

        if (tipoFiltro === "quadro" && valorFiltro) {
            
            const filtrados = todosOsVideosGlobal.filter(v => {
                const titulo = normalizarTexto(v.titulo);
                const tags = v.tags ? normalizarTexto(v.tags) : "";
                return titulo.includes(normalizarTexto(valorFiltro)) || tags.includes(normalizarTexto(valorFiltro));
            });
            carregarAno(filtrados, `Quadro: ${tituloFiltro}`);
        } else {
            
            const anoMaisRecente = todosOsVideosGlobal[0].data.substring(0, 4);
            const anoParaCarregar = (tipoFiltro === "ano" && valorFiltro) ? valorFiltro : anoMaisRecente;
            filtrarPorAno(anoParaCarregar);
        }

        atualizarContador();
    } catch (erro) {
        console.error("Erro:", erro);
    }
}

inicializarSite();