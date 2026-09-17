/* views/dashboard.js — Aba Dashboard: visão geral do projeto. */

const DashboardView = {
  render(container, project) {
    const s = DB.Stats.summary(project.id);
    const statusClass = {
      'Crítico': 'badge--danger',
      'Concluído': 'badge--success',
      'Em andamento': 'badge--info',
      'Início': 'badge--muted',
    }[s.statusGeral] || 'badge--muted';

    container.innerHTML = `
      <div class="tab-panel">
        <div class="dashboard-top">
          <div class="dashboard-status">
            <div class="dashboard-status__ring" style="--pct:${Math.min(s.percentualAtendimento, 100)}">
              <span>${s.percentualAtendimento}%</span>
            </div>
            <div>
              <div class="badge ${statusClass} badge--lg">${s.statusGeral}</div>
              <p class="muted">Percentual de atendimento das necessidades do projeto</p>
            </div>
          </div>
          ${project.descricao ? `<p class="dashboard-desc">${Utils.escapeHtml(project.descricao)}</p>` : ''}
        </div>

        <div class="stats-grid">
          <div class="stat-card"><span class="stat-card__value">${s.totalMateriais}</span><span class="stat-card__label">Total de materiais</span></div>
          <div class="stat-card stat-card--success"><span class="stat-card__value">${s.disponiveis}</span><span class="stat-card__label">Disponíveis</span></div>
          <div class="stat-card stat-card--danger"><span class="stat-card__value">${s.faltantes}</span><span class="stat-card__label">Faltantes</span></div>
          <div class="stat-card stat-card--warning"><span class="stat-card__value">${s.parciais}</span><span class="stat-card__label">Parciais</span></div>
          <div class="stat-card stat-card--purple"><span class="stat-card__value">${s.referenciasExternas}</span><span class="stat-card__label">Referências externas</span></div>
          <div class="stat-card"><span class="stat-card__value">${s.naoIdentificados}</span><span class="stat-card__label">Não identificados</span></div>
          <div class="stat-card"><span class="stat-card__value">${s.quantidadeTotalFaltante}</span><span class="stat-card__label">Qtde. total faltante</span></div>
          <div class="stat-card"><span class="stat-card__value">${s.percentualIdentificacaoSAP}%</span><span class="stat-card__label">Identificação SAP</span></div>
        </div>

        <div class="panel">
          <h3>Pendências críticas</h3>
          ${
            s.pendenciasCriticas.length === 0
              ? '<p class="muted">Nenhuma pendência crítica em aberto.</p>'
              : `<ul class="critical-list">
                  ${s.pendenciasCriticas
                    .map(
                      (p) => `<li><span class="badge badge--danger">Crítica</span> ${Utils.escapeHtml(p.titulo)}
                        <span class="muted"> — aberta em ${Utils.formatDate(p.criadoEm)}</span></li>`
                    )
                    .join('')}
                </ul>`
          }
        </div>
      </div>
    `;
  },
};

window.DashboardView = DashboardView;
