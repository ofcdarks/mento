// Elementos do DOM (Visão Mentor)
const btnOpenModal = document.getElementById('btnOpenModal');
const btnHeaderAdicionar = document.getElementById('btnHeaderAdicionar');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelForm = document.getElementById('btnCancelForm');
const modalOverlay = document.getElementById('modalOverlay');
const agendamentoForm = document.getElementById('agendamentoForm');
const eventsList = document.getElementById('eventsList');
const currentDateDisplay = document.getElementById('currentDateDisplay');

const modalFinalizarOverlay = document.getElementById('modalFinalizarOverlay');
const btnCloseFinalizar = document.getElementById('btnCloseFinalizar');
const btnCancelarFinalizar = document.getElementById('btnCancelarFinalizar');
const finalizarForm = document.getElementById('finalizarForm');
const finalizarId = document.getElementById('finalizarId');

const metricTotal = document.getElementById('metricTotal');
const metricConcluidos = document.getElementById('metricConcluidos');
const searchAluno = document.getElementById('searchAluno');

// Painéis / Menus Toggling
const menuAgendas = document.getElementById('menuAgendas');
const menuConfig = document.getElementById('menuConfig');
const viewAgendas = document.getElementById('viewAgendas');
const viewConfig = document.getElementById('viewConfig');
const pageTitle = document.getElementById('pageTitle');
const headerActions = document.getElementById('headerActions');

// Filtros
const btnFilterAbertas = document.getElementById('filterAbertas');
const btnFilterConcluidas = document.getElementById('filterConcluidas');
let currentFilter = 'abertas'; // abertas ou concluidas
let searchQuery = '';

// N8N Config elements
const webhookUrlInput = document.getElementById('webhookUrl');
const salaMasterUrlInput = document.getElementById('salaMasterUrl');
const btnSalvarConfig = document.getElementById('btnSalvarConfig');

// Carregamento do DB "Database" 
let mentoriasData = JSON.parse(localStorage.getItem('mentoriasData')) || [];
let n8nWebhookConfig = localStorage.getItem('n8nWebhookConfig') || '';
let salaMasterConfig = localStorage.getItem('salaMasterConfig') || '';

// Alternância de Telas
function switchView(target) {
    if(target === 'config') {
        viewAgendas.style.display = 'none';
        headerActions.style.display = 'none';
        viewConfig.style.display = 'block';
        menuConfig.classList.add('active');
        menuAgendas.classList.remove('active');
        pageTitle.textContent = "Serviços e APIs";
        webhookUrlInput.value = n8nWebhookConfig; // Load da Config
        if(salaMasterUrlInput) salaMasterUrlInput.value = salaMasterConfig;
    } else {
        viewAgendas.style.display = 'block';
        headerActions.style.display = 'flex';
        viewConfig.style.display = 'none';
        menuAgendas.classList.add('active');
        menuConfig.classList.remove('active');
        pageTitle.textContent = "Painel do Mentor";
    }
}
menuAgendas.addEventListener('click', () => switchView('agendas'));
menuConfig.addEventListener('click', () => switchView('config'));

// Salvar Config Webhook N8N
btnSalvarConfig.addEventListener('click', () => {
    n8nWebhookConfig = webhookUrlInput.value.trim();
    if(salaMasterUrlInput) salaMasterConfig = salaMasterUrlInput.value.trim();
    localStorage.setItem('n8nWebhookConfig', n8nWebhookConfig);
    localStorage.setItem('salaMasterConfig', salaMasterConfig);
    alert('Configurações Globais Salvas com Sucesso!');
});

// Inicia
document.addEventListener('DOMContentLoaded', () => {
    updateDateDisplay();
    renderMentorias();
    webhookUrlInput.value = n8nWebhookConfig;
    if(salaMasterUrlInput) salaMasterUrlInput.value = salaMasterConfig;
});

function updateDateDisplay() {
    const dataHora = new Date();
    const opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
    let dFormat = dataHora.toLocaleDateString('pt-BR', opcoes);
    currentDateDisplay.textContent = `Hoje é ${dFormat.charAt(0).toUpperCase() + dFormat.slice(1)}`;
}

// Interatividade Modais
function openModal() { modalOverlay.classList.add('active'); }
function closeModal() { modalOverlay.classList.remove('active'); agendamentoForm.reset(); }
function closeFinalizarModal() { modalFinalizarOverlay.classList.remove('active'); finalizarForm.reset(); }

btnOpenModal.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
btnHeaderAdicionar.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
btnCancelForm.addEventListener('click', closeModal);
btnCloseFinalizar.addEventListener('click', closeFinalizarModal);
btnCancelarFinalizar.addEventListener('click', closeFinalizarModal);

modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeModal(); });
modalFinalizarOverlay.addEventListener('click', (e) => { if(e.target === modalFinalizarOverlay) closeFinalizarModal(); });

function getMagicLink(nome) {
    const baseUrl = window.location.href.split('index.html')[0];
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    return `${cleanUrl}aluno.html?aluno=${encodeURIComponent(nome)}`;
}

// Toggle Recorrência Menu
const cbRecorrente = document.getElementById('recorrente');
const recorrenteOptions = document.getElementById('recorrenteOptions');
if(cbRecorrente) {
    cbRecorrente.addEventListener('change', (e) => {
        recorrenteOptions.style.display = e.target.checked ? 'block' : 'none';
    });
}

// CRIANDO MENTORIA E DESPACHANDO N8N
agendamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formNome = document.getElementById('nome').value.trim();
    const formWhats = document.getElementById('whatsapp').value.trim();
    const formData = document.getElementById('data').value;
    const formHora = document.getElementById('hora').value;
    let formLink = document.getElementById('link').value.trim();
    
    // Fallback: Link Vazio usa a Sala Mestra Automática configurada
    if(!formLink && salaMasterConfig) {
        formLink = salaMasterConfig;
    }

    const anot = document.getElementById('anotacoes').value;
    const pgmt = document.getElementById('statusPagamento').value;

    const isRecorrente = cbRecorrente && cbRecorrente.checked;
    const loopCount = isRecorrente ? parseInt(document.getElementById('qtdSemanas').value) || 1 : 1;
    
    let baseDate = new Date(`${formData}T00:00:00`);

    document.querySelector('#agendamentoForm .primary-btn').textContent = "Processando Lote...";

    for(let i = 0; i < loopCount; i++) {
        let loopDate = new Date(baseDate);
        if (i > 0) loopDate.setDate(loopDate.getDate() + (i * 7));
        
        const dataFormatada = loopDate.toISOString().split("T")[0]; // Mantem ISO String Date
        const uid = Date.now().toString() + "-" + i;
        const nomeFinal = isRecorrente ? `${formNome} (Sessão ${i+1}/${loopCount})` : formNome;

        const novoAgendamento = {
            id: uid,
            nome: nomeFinal,
            whatsapp: formWhats,
            data: dataFormatada,
            hora: formHora,
            link: formLink,
            anotacoes: anot,
            pagamento: pgmt,
            status: 'aberta',
            linkGravacao: ''
        };

        mentoriasData.push(novoAgendamento);

        // Envios de Webhook com AWAIT pra não engarrafar picos de Rede
        if(n8nWebhookConfig && n8nWebhookConfig.startsWith('http')) {
            const magicLnk = getMagicLink(formNome);
            const requestPayload = {
                agenda_id: novoAgendamento.id,
                nome: novoAgendamento.nome,
                whatsapp: formWhats,
                data_aula: dataFormatada,
                hora_aula: formHora,
                link_reuniao: formLink,
                link_portal_aluno: magicLnk,
                timestamp_creation: new Date().toISOString(),
                is_recorrente: isRecorrente
            };

            try {
                const response = await fetch(n8nWebhookConfig, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestPayload)
                });
                
                // Interceptação Bidirecional: Ouvindo Retorno do N8n (Google Ultra)
                if(response.ok) {
                    const dataBack = await response.json();
                    if(dataBack && dataBack.meet_link) {
                        novoAgendamento.link = dataBack.meet_link;
                    }
                }

            } catch (error) {
                console.error("Erro interno n8n post agenda em loop: ", error);
            }
        }
    }

    document.querySelector('#agendamentoForm .primary-btn').textContent = "Agendar e Automatizar";

    // Refresh e Save Main DB
    mentoriasData.sort((a,b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));
    saveAndRender();
    closeModal();
});

// Finalizando e inserindo URL Gravada
function openFinalizarModal(id) {
    finalizarId.value = id;
    modalFinalizarOverlay.classList.add('active');
}

finalizarForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = finalizarId.value;
    const urlVideo = document.getElementById('linkVideo').value;

    const idx = mentoriasData.findIndex(m => m.id === id);
    if(idx !== -1) {
        mentoriasData[idx].status = 'concluida';
        mentoriasData[idx].linkGravacao = urlVideo;
        saveAndRender();
        closeFinalizarModal();
    }
});

// Ações Globais
function deleteMentoria(id) {
    if(confirm('Tem certeza que deseja excluir? O aluno perderá acesso a esta gravação caso esteja concluída.')) {
        mentoriasData = mentoriasData.filter(m => m.id !== id);
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('mentoriasData', JSON.stringify(mentoriasData));
    renderMentorias();
}

function copyStudentLink(nome) {
    const magicLink = getMagicLink(nome);
    navigator.clipboard.writeText(magicLink).then(() => {
        alert('Link do portal do aluno copiado! Envie este link para: ' + nome);
    });
}

function formatarDataSimples(dataStr) {
    const d = new Date(dataStr + "T00:00:00");
    return d.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'});
}

// Filtros UI
btnFilterAbertas.addEventListener('click', () => { currentFilter = 'abertas'; btnFilterAbertas.classList.add('active'); btnFilterConcluidas.classList.remove('active'); renderMentorias(); });
btnFilterConcluidas.addEventListener('click', () => { currentFilter = 'concluidas'; btnFilterConcluidas.classList.add('active'); btnFilterAbertas.classList.remove('active'); renderMentorias(); });
searchAluno.addEventListener('input', (e) => { searchQuery = e.target.value.toLowerCase(); renderMentorias(); });

// Render Engine
function renderMentorias() {
    eventsList.innerHTML = '';
    
    const abertas = mentoriasData.filter(m => m.status === 'aberta');
    const concluidas = mentoriasData.filter(m => m.status === 'concluida');
    
    metricTotal.textContent = abertas.length;
    metricConcluidos.textContent = concluidas.length;

    let displayList = currentFilter === 'abertas' ? abertas : concluidas;
    if(searchQuery) {
        displayList = displayList.filter(m => m.nome.toLowerCase().includes(searchQuery));
    }

    if(displayList.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-state">
                <i class="ph ph-folder-dashed"></i>
                <p>Nenhuma mentoria ${currentFilter === 'abertas' ? 'agendada' : 'entregue'} encontrada.</p>
            </div>
        `;
        return;
    }

    displayList.forEach(mentoria => {
        const card = document.createElement('div');
        card.className = 'event-card';

        const isPago = mentoria.pagamento === 'Pago';
        const badgeColor = isPago ? 'paid' : 'pending';
        const badgeText = isPago ? 'Pago' : 'Pendente';
        const hasReuniao = mentoria.link.startsWith('http');

        let acoes = '';

        if(currentFilter === 'abertas') {
            acoes = `
                <button title="Copiar Link do Aluno" class="btn-icon btn-copylink" onclick="copyStudentLink('${mentoria.nome}')"><i class="ph ph-link"></i></button>
                ${hasReuniao ? `<a href="${mentoria.link}" target="_blank" title="Entrar no Meet" class="btn-icon btn-link"><i class="ph ph-video-camera"></i></a>` : ''}
                <button title="Finalizar e Incluir Gravação" class="btn-icon btn-finalizar" onclick="openFinalizarModal('${mentoria.id}')"><i class="ph ph-check-fat"></i></button>
                <button title="Excluir" class="btn-icon btn-delete" onclick="deleteMentoria('${mentoria.id}')"><i class="ph ph-trash"></i></button>
            `;
        } else {
             acoes = `
                <button title="Copiar Link do Aluno" class="btn-icon btn-copylink" onclick="copyStudentLink('${mentoria.nome}')"><i class="ph ph-link"></i></button>
                <a href="${mentoria.linkGravacao}" target="_blank" title="Testar Arquivo de Gravação" class="btn-icon"><i class="ph ph-play-circle"></i></a>
                <button title="Excluir Histórico" class="btn-icon btn-delete" onclick="deleteMentoria('${mentoria.id}')"><i class="ph ph-trash"></i></button>
            `;
        }
        
        card.innerHTML = `
            <div class="event-time">
                <strong>${mentoria.hora}</strong>
                <span>${formatarDataSimples(mentoria.data)}</span>
            </div>
            
            <div class="event-details">
                <h4>${mentoria.nome} <span class="badge ${badgeColor}">${badgeText}</span></h4>
                <p style="font-size:12px; color:var(--text-muted);"><i class="ph ph-whatsapp-logo"></i> ${mentoria.whatsapp}</p>
                <p style="margin-top:2px;"><i class="ph ph-note-pencil"></i> ${mentoria.anotacoes || "N/A"}</p>
            </div>
            
            <div class="event-actions">
                ${acoes}
            </div>
        `;
        
        eventsList.appendChild(card);
    });
}
