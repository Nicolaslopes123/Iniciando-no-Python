/* views/report.js — Aba Relatório: relatório imprimível e exportação CSV do projeto. */

const ReportView = {
  render(container, project) {
    const s = DB.Stats.summary(project.id);
    const materials = DB.Materials.listByProject(project.id).sort((a, b) => a.nome.localeCompare(b.nome));
    const pendenciasAbertas = DB.Pendencies.listByProject(project.id).filter((p) => p.status === 'aberta');

    container.innerHTML = `
      <div class="tab-panel">
        <div class="toolbar toolbar--no-print">
          <button class="btn btn--primary" id="btn-imprimir">Imprimir / Salvar PDF</button>
          <button class="btn btn--secondary" id="btn-csv">Exportar materiais (CSV)</button>
        </div>

        <div class="report" id="report-area">
          <header class="report__header">
            <h2>${Utils.escapeHtml(project.nome)}</h2>
            ${project.codigo ? `<p>Código: ${Utils.escapeHtml(project.codigo)}</p>` : ''}
            <p>Local: ${Utils.escapeHtml(project.local) || '—'} · Responsável: ${Utils.escapeHtml(project.responsavel) || '—'}</p>
            <p class="muted">Relatório gerado em ${Utils.formatDateTime(new Date().toISOString())}</p>
          </header>

          <section>
            <h3>Indicadores</h3>
            <table class="table">
              <tbody>
                <tr><th>Total de materiais</th><td>${s.totalMateriais}</td></tr>
                <tr><th>Disponíveis</th><td>${s.disponiveis}</td></tr>
                <tr><th>Faltantes</th><td>${s.faltantes}</td></tr>
                <tr><th>Parciais</th><td>${s.parciais}</td></tr>
                <tr><th>Referências externas</th><td>${s.referenciasExternas}</td></tr>
                <tr><th>Não identificados</th><td>${s.naoIdentificados}</td></tr>
                <tr><th>Quantidade total faltante</th><td>${s.quantidadeTotalFaltante}</td></tr>
                <tr><th>Percentual de atendimento</th><td>${s.percentualAtendimento}%</td></tr>
                <tr><th>Percentual de identificação SAP</th><td>${s.percentualIdentificacaoSAP}%</td></tr>
                <tr><th>Status geral</th><td>${s.statusGeral}</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>Materiais (${materials.length})</h3>
            ${
              materials.length === 0
                ? '<p class="muted">Nenhum material cadastrado.</p>'
                : `<table class="table">
                    <thead><tr><th>Material</th><th>Cód. SAP</th><th>Necessário</th><th>Disponível</th><th>Status</th><th>Local</th></tr></thead>
                    <tbody>
                      ${materials
                        .map(
                          (m) => `<tr>
                            <td>${Utils.escapeHtml(m.nome)}</td>
                            <td>${Utils.escapeHtml(m.codigoSAP) || '—'}</td>
                            <td>${m.quantidadeNecessaria}</td>
                            <td>${m.quantidadeDisponivel}</td>
                            <td>${Labels.statusDisponibilidade[DB.Materials.statusDisponibilidade(m)].label}</td>
                            <td>${Utils.escapeHtml(m.local) || '—'}</td>
                          </tr>`
                        )
                        .join('')}
                    </tbody>
                  </table>`
            }
          </section>

          <section>
            <h3>Pendências em aberto (${pendenciasAbertas.length})</h3>
            ${
              pendenciasAbertas.length === 0
                ? '<p class="muted">Nenhuma pendência em aberto.</p>'
                : `<ul>${pendenciasAbertas
                    .map((p) => `<li>[${Labels.prioridadePendencia[p.prioridade].label}] ${Utils.escapeHtml(p.titulo)}</li>`)
                    .join('')}</ul>`
            }
          </section>
        </div>
      </div>
    `;

    container.querySelector('#btn-imprimir').addEventListener('click', () => window.print());
    container.querySelector('#btn-csv').addEventListener('click', () => this._exportCsv(project, materials));
  },

  async _exportCsv(project, materials) {
    const header = ['Material', 'Codigo SAP', 'Qtd Necessaria', 'Qtd Disponivel', 'Status', 'Local', 'Prioridade', 'Origem', 'Referencia Externa'];
    const rows = materials.map((m) => [
      m.nome,
      m.codigoSAP,
      m.quantidadeNecessaria,
      m.quantidadeDisponivel,
      Labels.statusDisponibilidade[DB.Materials.statusDisponibilidade(m)].label,
      m.local,
      Labels.prioridade[m.prioridade].label,
      Labels.origemIdentificacao[DB.Materials.origemIdentificacao(m)].label,
      m.referenciaExterna,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const filename = `materiais-${(project.codigo || project.nome).replace(/\s+/g, '_')}.csv`;

    // Dentro de um Claude Artifact, um <a download> não tem permissão para salvar
    // arquivos; nesse caso usamos a capability "downloads" da plataforma.
    const downloads = window.claude?.use ? await window.claude.use('downloads').catch(() => null) : null;
    if (downloads) {
      try {
        await downloads.save({ filename, data: '﻿' + csv });
      } catch (e) {
        Utils.toast('Exportação cancelada.', 'error');
      }
      return;
    }

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

window.ReportView = ReportView;
