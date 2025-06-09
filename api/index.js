const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

const produtos = [];

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: 'segredo',
    resave: false,
    saveUninitialized: true,
  })
);

// Servir HTML/CSS da pasta public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Página inicial (login)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Rota de login
app.post('/api/login', (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.send('Nome obrigatório para login.');
  req.session.usuario = nome;

  // Cookie de último acesso
  const agora = new Date().toLocaleString('pt-BR');
  res.cookie('ultimoAcesso', agora, { maxAge: 24 * 60 * 60 * 1000 });

  res.redirect('/cadastro');
});

// Tela de cadastro de produto
app.get('/cadastro', (req, res) => {
  if (!req.session.usuario) {
    return res.send(`
      <h2>Acesso negado</h2>
      <p>Você precisa estar logado para acessar esta página.</p>
      <a href="/">Voltar para login</a>
    `);
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'cadastro.html'));
});

// Cadastro de produto
app.post('/api/produtos', (req, res) => {
  if (!req.session.usuario) {
    return res.send('Acesso negado. Faça login primeiro.');
  }

  const produto = req.body;
  produtos.push(produto);

  res.redirect('/produtos');
});

// Exibir lista de produtos
app.get('/api/produtos', (req, res) => {
  if (!req.session.usuario) {
    return res.send('Acesso negado. Faça login primeiro.');
  }

  const ultimoAcesso = req.cookies.ultimoAcesso || 'Primeira vez';

  let tabela = `
    <h2>Usuário: ${req.session.usuario}</h2>
    <p>Último acesso: ${ultimoAcesso}</p>
    <table border="1" cellpadding="5" cellspacing="0">
      <tr>
        <th>Código</th>
        <th>Descrição</th>
        <th>Preço Custo</th>
        <th>Preço Venda</th>
        <th>Validade</th>
        <th>Estoque</th>
        <th>Fabricante</th>
      </tr>
  `;

  tabela += produtos
    .map(p => {
      return `
      <tr>
        <td>${p.codigo}</td>
        <td>${p.descricao}</td>
        <td>${p.precoCusto}</td>
        <td>${p.precoVenda}</td>
        <td>${p.validade}</td>
        <td>${p.estoque}</td>
        <td>${p.fabricante}</td>
      </tr>`;
    })
    .join('');

  tabela += `</table><br><a href="/cadastro">Cadastrar novo produto</a> | <a href="/">Logout</a>`;

  res.send(tabela);
});

// Redireciona /produtos para a rota correta
app.get('/produtos', (req, res) => {
  res.redirect('/api/produtos');
});

// Logout (destroi sessão)
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = app;
