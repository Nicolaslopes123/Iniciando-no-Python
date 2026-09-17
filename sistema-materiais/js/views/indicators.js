/* views/indicators.js — Aba Indicadores: gráficos por status, local, prioridade e origem. */

const IndicatorsView = {
  _charts: [],

  render(container, project) {
    this._charts.forEach((c) => c.destroy());
    this._charts = [];

    const g = DB.Stats.groupings(project.id);
    const totalMateriais = DB.Materials.listByProject(project.id).length;

    if (totalMateriais === 0) {
      container.innerHTML = `<div class="tab-panel"><div class="empty-state"><p>Cadastre materiais para visualizar os indicadores do projeto.</p></div></div>`;
      return;
    }

    container.innerHTML = `
      <div class="tab-panel">
        <div class="charts-grid">
          <div class="panel"><h3>Por status</h3><canvas id="chart-status"></canvas></div>
          <div class="panel"><h3>Por origem de identificação</h3><canvas id="chart-origem"></canvas></div>
          <div class="panel"><h3>Por prioridade</h3><canvas id="chart-prioridade"></canvas></div>
          <div class="panel"><h3>Por local</h3><canvas id="chart-local"></canvas></div>
        </div>
      </div>
    `;

    const palette = {
      status: ['#22c55e', '#f59e0b', '#ef4444'],
      origem: ['#3b82f6', '#a855f7', '#94a3b8'],
      prioridade: ['#ef4444', '#f59e0b', '#94a3b8'],
      local: ['#0ea5e9', '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#eab308'],
    };

    this._charts.push(
      this._makeChart('chart-status', 'doughnut', ['Disponível', 'Parcial', 'Faltante'], [g.byStatus.disponivel, g.byStatus.parcial, g.byStatus.faltante], palette.status)
    );
    this._charts.push(
      this._makeChart(
        'chart-origem',
        'doughnut',
        ['SAP', 'Referência externa', 'Não identificado'],
        [g.byOrigem.sap, g.byOrigem.referencia_externa, g.byOrigem.nao_identificado],
        palette.origem
      )
    );
    this._charts.push(
      this._makeChart('chart-prioridade', 'bar', ['Alta', 'Média', 'Baixa'], [g.byPrioridade.alta, g.byPrioridade.media, g.byPrioridade.baixa], palette.prioridade)
    );

    const localLabels = Object.keys(g.byLocal);
    this._charts.push(this._makeChart('chart-local', 'bar', localLabels, localLabels.map((l) => g.byLocal[l]), palette.local));
  },

  _makeChart(canvasId, type, labels, data, colors) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: type === 'doughnut' ? 2 : 0,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: type === 'doughnut', position: 'bottom' } },
        scales: type === 'bar' ? { y: { beginAtZero: true, ticks: { precision: 0 } } } : undefined,
      },
    });
  },
};

window.IndicatorsView = IndicatorsView;
