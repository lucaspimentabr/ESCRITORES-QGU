# Diretrizes Arquiteturais e Regras de Negócio do Projeto

## 1. Páginas-Modelo do Sistema (Templates Globais de Processo Seletivo)
- As rotas abaixo são **páginas-modelo** do sistema (templates/blueprints canônicos):
  - `/inscricao`: Página-modelo de apresentação, instruções e edital.
  - `/candidato`: Página-modelo de cadastro, dados pessoais, eclesiásticos e documentação.
  - `/prova`: Página-modelo de avaliação teológica (questões de múltipla escolha e redação dissertativa).
  - `/inscricao/[id-da-inscricao]`: Página-modelo de comprovante, confirmação e recibo da inscrição com número de protocolo.
- **Princípio Arquitetural:** Essas páginas **não pertencem a nenhum processo seletivo específico**. Elas funcionam como matrizes/modelos-base reutilizáveis para a configuração e instanciação de novos processos seletivos no ecossistema QGU/COMIEADEPA.
- As alterações realizadas na aba "Processo Seletivo" do painel administrativo (nos botões "Candidato" e "prova") editam as definições canônicas dessas páginas-modelo.
