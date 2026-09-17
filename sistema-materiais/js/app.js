/* app.js — Bootstrap da aplicação: define rotas e monta as telas no #app. */

(function bootstrap() {
  const appEl = document.getElementById('app');

  Router.on('/', () => ProjectsView.render(appEl))
    .on('/projeto/:id', ({ id }) => ProjectShell.render(appEl, id, 'dashboard'))
    .on('/projeto/:id/:aba', ({ id, aba }) => ProjectShell.render(appEl, id, aba));

  Seed.ensureDemoData();

  Router.start();
})();
