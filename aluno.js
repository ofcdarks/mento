// Lógica para o Portal do Aluno

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const alunoNome = urlParams.get('aluno');

    const alunoNomeDisplay = document.getElementById('alunoNomeDisplay');
    const nextClassContainer = document.getElementById('nextClassContainer');
    const galleryList = document.getElementById('galleryList');

    if(!alunoNome) {
        alunoNomeDisplay.textContent = "Acesso Inválido";
        nextClassContainer.innerHTML = `<div class="empty-state">Link incorreto. Peça um novo acesso ao seu mentor.</div>`;
        return;
    }

    alunoNomeDisplay.textContent = alunoNome;

    // Busca o banco Local
    const mentoriasData = JSON.parse(localStorage.getItem('mentoriasData')) || [];
    
    // Filtra mentorias rigorosamente por esse aluno (ignorando case)
    const mentoriasAluno = mentoriasData.filter(m => m.nome.toLowerCase().trim() === alunoNome.toLowerCase().trim());

    if(mentoriasAluno.length === 0) {
        nextClassContainer.innerHTML = `<div class="empty-state">Nenhum vínculo encontrado para ${alunoNome}.</div>`;
        return;
    }

    // Separa abertas e concluidas
    const proxima = mentoriasAluno.filter(m => m.status === 'aberta')[0]; // Pega a primeira mais próxima
    const concluidas = mentoriasAluno.filter(m => m.status === 'concluida');

    // Render Próxima Sessão
    if(proxima) {
        const d = new Date(proxima.data + "T00:00:00");
        const dataDia = d.toLocaleDateString('pt-BR', {day: '2-digit', month: 'long'});
        const linkHTML = proxima.link.startsWith('http') 
            ? `<a href="${proxima.link}" target="_blank" class="primary-btn" style="width:max-content; margin-top:12px;"><i class="ph ph-video-camera"></i> Entrar na Sala</a>`
            : `<p style="margin-top:12px; color:var(--text-muted)">Link indisponível. Aguarde seu mentor enviar.</p>`;

        nextClassContainer.innerHTML = `
            <div class="event-card glass-panel" style="flex-direction:row; padding:32px;">
                <div style="flex:1;">
                    <h3 style="color:var(--text-muted); font-size:14px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Próximo Encontro</h3>
                    <h2 style="font-size:28px; margin-bottom: 4px;">${dataDia} às ${proxima.hora}</h2>
                    <p style="color:var(--text-secondary);"><i class="ph ph-info"></i> Tópico: ${proxima.anotacoes || 'Geral'}</p>
                    ${linkHTML}
                </div>
                <div style="font-size:80px; color:rgba(59,130,246,0.1);">
                    <i class="ph ph-calendar-star"></i>
                </div>
            </div>
        `;
    } else {
        nextClassContainer.innerHTML = `<div class="event-card glass-panel"><p style="color:var(--text-secondary)">Você não possui próximas sessões agendadas no momento.</p></div>`;
    }

    // Render Galeria (Concluídas)
    if(concluidas.length === 0) {
        galleryList.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding: 40px; color:var(--text-muted);">Nenhuma aula gravada disponível ainda.</div>`;
    } else {
        concluidas.forEach(grav => {
            const dateStr = new Date(grav.data + "T00:00:00").toLocaleDateString('pt-BR');
            const card = document.createElement('div');
            card.className = 'video-card glass-panel';
            card.innerHTML = `
                <div class="video-thumbnail">
                    <i class="ph ph-play"></i>
                </div>
                <div class="video-content">
                    <h4>Mentoria de ${dateStr}</h4>
                    <p>${grav.anotacoes || 'Revisão e mentoria estratégica.'}</p>
                    <div class="video-actions">
                        <a href="${grav.linkGravacao}" target="_blank" class="primary-btn" style="background:var(--accent-purple); padding:8px 12px; font-size:13px;">
                            <i class="ph ph-play-circle"></i> Assistir
                        </a>
                        <a href="${grav.linkGravacao}" target="_blank" class="primary-btn" style="background:transparent; border:1px solid var(--accent-blue); padding:8px 12px; font-size:13px;" download>
                            <i class="ph ph-download-simple"></i> Baixar
                        </a>
                    </div>
                </div>
            `;
            galleryList.appendChild(card);
        });
    }

});
