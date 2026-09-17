/*
 * seed.js — Dados de demonstração, criados apenas na primeira execução
 * (quando ainda não existe nenhum projeto salvo), só para que a tela
 * inicial não abra vazia. O usuário pode arquivar/remover esses projetos
 * livremente; nada aqui é recriado depois da primeira vez.
 */

const Seed = {
  ensureDemoData() {
    if (localStorage.getItem('sistemaMateriais.seeded')) return;
    localStorage.setItem('sistemaMateriais.seeded', '1');
    if (DB.Projects.list().length > 0) return;

    const obra = DB.Projects.create({
      nome: 'Ampliação Galpão 3',
      codigo: 'OBRA-2026-014',
      descricao: 'Ampliação do galpão de armazenagem com nova estrutura metálica e cobertura.',
      local: 'Unidade Industrial - Setor Norte',
      responsavel: 'Nicolas Lopes',
      dataInicio: '2026-08-01',
      prazoPrevisto: '2026-12-15',
      observacoes: 'Projeto piloto da nova arquitetura por projetos.',
    });

    const materiais = [
      { nome: 'Perfil metálico W150x13', codigoSAP: '100234', quantidadeNecessaria: 80, quantidadeDisponivel: 80, local: 'Almoxarifado A', prioridade: 'alta' },
      { nome: 'Chapa de aço 1/4"', codigoSAP: '100987', quantidadeNecessaria: 40, quantidadeDisponivel: 15, local: 'Almoxarifado A', prioridade: 'alta' },
      { nome: 'Parafuso sextavado M12', codigoSAP: '', referenciaExterna: 'Catálogo Fornecedor XPTO #A123', quantidadeNecessaria: 500, quantidadeDisponivel: 500, local: 'Almoxarifado B', prioridade: 'media' },
      { nome: 'Telha termoacústica', codigoSAP: '', quantidadeNecessaria: 200, quantidadeDisponivel: 0, local: 'Pátio', prioridade: 'alta' },
      { nome: 'Tinta esmalte industrial', codigoSAP: '100555', quantidadeNecessaria: 30, quantidadeDisponivel: 30, local: 'Almoxarifado C', prioridade: 'baixa' },
      { nome: 'Cabo elétrico 10mm²', codigoSAP: '100777', quantidadeNecessaria: 300, quantidadeDisponivel: 120, local: 'Almoxarifado B', prioridade: 'media' },
    ];
    const created = materiais.map((m) => DB.Materials.create(obra.id, m));

    DB.Pendencies.create(obra.id, {
      titulo: 'Telha termoacústica sem previsão de entrega',
      descricao: 'Fornecedor não confirmou data de entrega da telha termoacústica.',
      prioridade: 'critica',
      materialId: created[3].id,
    });
    DB.Pendencies.create(obra.id, {
      titulo: 'Confirmar código SAP da chapa de aço',
      descricao: 'Verificar com o almoxarifado se o código SAP está correto.',
      prioridade: 'media',
      materialId: created[1].id,
    });

    DB.Projects.create({
      nome: 'Reforma Subestação 02',
      codigo: 'OBRA-2026-021',
      descricao: 'Reforma elétrica da subestação 02 com troca de transformadores.',
      local: 'Unidade Industrial - Setor Sul',
      responsavel: 'Equipe Elétrica',
      dataInicio: '2026-09-01',
      prazoPrevisto: '2026-11-30',
      observacoes: '',
    });
  },
};

window.Seed = Seed;
