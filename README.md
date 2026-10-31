# RHYTHM HARMONY — protótipo de jogo de ritmo

🎮 **[Jogue agora](https://markuseagle39.github.io/RHYTHM-HARMONY/)**

Protótipo local para navegador, com menu lateral, identidade escura em dourado e ciano, catálogo, pista de quatro colunas e telas de pausa e resultado. Não exige dependências de terceiros nem acesso à internet; não tem login, backend ou banco de dados.

## Como abrir

Abra `index.html` diretamente no navegador; a página carrega `game.bundle.js`, compatível com `file://`. Os módulos-fonte ficam em `js/`. Depois de editar um módulo, regenere o bundle na pasta do projeto com:

```sh
node build.mjs
```

Node.js é necessário apenas para regenerar o bundle e executar os testes. Para rodar a suíte, use:

```sh
node --test
```

Os testes cobrem o catálogo e os arquivos de arte, a geração e duração dos charts por dificuldade, a atualização da seleção e as condições de Game Over da Fever.

Se preferir servir os arquivos localmente com Python 3, execute nesta pasta:

```sh
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Como jogar

1. Selecione **Jogar**, escolha a faixa e a dificuldade e inicie a partida.
2. Pressione **D / F / J / K** ou as **setas** conforme cada nota alcança a linha luminosa. Em celular ou tablet, toque nos botões D/F/J/K na parte inferior das faixas. No menu, use as setas para navegar e **Enter** para confirmar.
3. Use **Backspace** para voltar; durante a partida, ele abre a pausa. **Esc** ou o botão `Ⅱ` também pausam. A tela de resultado apresenta score, combo máximo e julgamentos.
4. As configurações permitem ajustar o volume sintetizado, velocidade das notas, efeitos visuais e ativar ou desativar a mecânica Fever.

A barra **Fever** começa em 50%, aumenta com acertos (Perfect +4, Great +3, Good +2) e diminui 5 pontos por Miss. Ao chegar a 100%, ela se ilumina. Se chegar a 0%, a partida termina imediatamente em Game Over. A mecânica pode ser ativada ou desativada em Configurações; desativada, a barra some e não causa Game Over. Fever não altera o score.

O navegador pode exigir um clique na página para liberar áudio. O catálogo inclui demos sintetizadas localmente com Web Audio de **Für Elise**, **Atraente**, **Brejeiro** e **Odeon**. Easy, Medium e Hard alteram a densidade do chart da faixa escolhida; as demos não baixam nem tocam gravações comerciais. A duração planejada de cada partida é inferior a um minuto, sem contar pausas. Resultados e preferências existem apenas durante a sessão e não são salvos depois que a página é fechada ou recarregada.

## Estrutura

- `index.html` — telas de menu, catálogo, partida, resultado e configurações.
- `style.css` — identidade visual responsiva.
- `game.js` — inicialização e conexão dos módulos ES.
- `game.bundle.js` — versão compilada usada pelo HTML para também funcionar com `file://`.
- `build.mjs` — gera o bundle a partir dos módulos-fonte.
- `js/Game.js` — estado da partida, chart, notas, pontuação, Fever e julgamentos.
- `js/tracks.js` — catálogo, compositores e motivos musicais de cada faixa.
- `js/Screen.js` — atualização das telas, HUD e resultados.
- `js/Menu.js` — navegação, controles e configurações.
- `js/Audio.js` — síntese local e controle do volume.
- `assets/home-hero.jpg` — arte principal da tela inicial.
- `assets/music/` — capas individuais exibidas na seleção de faixa.
- `tests/game.test.mjs` — testes automatizados usando o runner nativo do Node.js.

Os motivos musicais, metadados e caminhos das capas ficam em `js/tracks.js`; cada faixa pode ser jogada nas três dificuldades sem alterar seu motivo principal. O [SKILL.md](SKILL.md) registra as regras do protótipo e o mapa entre áreas e módulos. Catálogo adicional, contas, autenticação e persistência continuam fora do escopo desta versão.

## Mapa de responsabilidades

| Área | Arquivo principal |
| --- | --- |
| Estado da partida, charts, julgamentos, score e Fever | `js/Game.js` |
| Faixas, motivos, compositores e capas | `js/tracks.js` |
| Telas, HUD, seleção e resultados | `js/Screen.js` |
| Navegação, teclado, touch e configurações | `js/Menu.js` |
| Síntese de áudio | `js/Audio.js` |
| Inicialização e compilação para `file://` | `game.js`, `build.mjs` |
| Layout, responsividade e arte visual | `index.html`, `style.css`, `assets/` |
| Testes de lógica | `tests/game.test.mjs` |
