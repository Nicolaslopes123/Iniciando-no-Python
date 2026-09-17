/* views/projectShell.js — Cabeçalho + abas do ambiente do projeto. */

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'materiais', label: 'Materiais' },
  { key: 'fotos', label: 'Fotos' },
  { key: 'pendencias', label: 'Pendências' },
  { key: 'indicadores', label: 'Indicadores' },
  { key: 'relatorio', label: 'Relatório' },
  { key: 'historico', label: 'Histórico' },
];

const ProjectShell = {
  render(container, projectId, tab) {
    const project = DB.Projects.get(projectId);
    if (!project) {
      Utils.toast('Projeto não encontrado.', 'error');
      Router.navigate('#/');
      return;
    }
    const activeTab = TABS.some((t) => t.key === tab) ? tab : 'dashboard';

    container.innerHTML = `
      <div class="page page--project">
        <div class="project-header">
          <button class="btn btn--ghost btn--sm" id="btn-voltar">← Voltar para Projetos</button>
          <div class="project-header__title">
            <h1>${Utils.escapeHtml(project.nome)}</h1>
            ${project.codigo ? `<span class="project-header__code">${Utils.escapeHtml(project.codigo)}</span>` : ''}
            ${project.status === 'arquivado' ? '<span class="badge badge--muted">Arquivado</span>' : ''}
          </div>
        </div>

        <nav class="tabs" id="project-tabs">
          ${TABS.map(
            (t) => `<button class="tab ${t.key === activeTab ? 'tab--active' : ''}" data-tab="${t.key}">${t.label}</button>`
          ).join('')}
        </nav>

        <div id="tab-content" class="tab-content"></div>
      </div>
    `;

    container.querySelector('#btn-voltar').addEventListener('click', () => Router.navigate('#/'));
    container.querySelectorAll('#project-tabs .tab').forEach((btn) =>
      btn.addEventListener('click', () => Router.navigate(`#/projeto/${projectId}/${btn.dataset.tab}`))
    );

    const content = container.querySelector('#tab-content');
    const views = {
      dashboard: DashboardView,
      materiais: MaterialsView,
      fotos: PhotosView,
      pendencias: PendenciesView,
      indicadores: IndicatorsView,
      relatorio: ReportView,
      historico: HistoryView,
    };
    views[activeTab].render(content, project);
  },
};

window.ProjectShell = ProjectShell;
