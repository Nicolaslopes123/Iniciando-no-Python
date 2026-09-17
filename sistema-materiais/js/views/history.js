/* views/history.js — Aba Histórico: linha do tempo de ações do projeto. */

const HistoryView = {
  render(container, project) {
    const entries = DB.History.listByProject(project.id);

    if (entries.length === 0) {
      container.innerHTML = `<div class="tab-panel"><div class="empty-state"><p>Nenhum evento registrado ainda.</p></div></div>`;
      return;
    }

    const icons = {
      projeto: '📁',
      material: '📦',
      foto: '🖼️',
      pendencia: '⚠️',
    };

    container.innerHTML = `
      <div class="tab-panel">
        <ul class="timeline">
          ${entries
            .map(
              (h) => `<li class="timeline__item">
                <span class="timeline__icon">${icons[h.entidade] || '•'}</span>
                <div>
                  <p>${Utils.escapeHtml(h.descricao)}</p>
                  <span class="muted">${Utils.formatDateTime(h.timestamp)} · ${Utils.escapeHtml(h.usuario)}</span>
                </div>
              </li>`
            )
            .join('')}
        </ul>
      </div>
    `;
  },
};

window.HistoryView = HistoryView;
