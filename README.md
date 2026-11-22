# 🎈 Convite Interativo para Festa Infantil com Confirmação (RSVP)

Um site completo, alegre e moderno para convite de festa infantil, com contagem regressiva, local no mapa, animações festivas, formulário de confirmação de presença (RSVP) e lista em tempo real dos convidados confirmados!

---

## 🌟 Recursos Principais

- 🎈 **Design Lúdico e Festivo:** Balões animados, chuva de confetes ao confirmar presença e cores vibrantes adaptadas para celulares e computadores.
- ⏳ **Contagem Regressiva em Tempo Real:** Dias, horas, minutos e segundos até o início da festa.
- 📍 **Localização Completa:** Endereço, botão para abrir no Google Maps/Waze e botão para copiar endereço com um clique.
- ✍️ **Confirmação de Presença (RSVP):**
  - Nome completo do convidado.
  - Contador interativo de adultos e crianças.
  - Nome dos acompanhantes.
  - Espaço para deixar um recadinho carinhoso para o aniversariante.
- 👥 **Mural de Confirmados ao Vivo:**
  - Mostra quem já confirmou com avatares e mensagens.
  - Estatísticas de contagem total (famílias, adultos, crianças e total geral).
  - Barra de busca para filtrar convidados rapidamente.
- 📲 **Compartilhamento no WhatsApp:** Botão com mensagem pronta e link do convite.
- 📅 **Salvar no Google Calendar:** Adiciona o evento direto na agenda dos convidados.
- ⚙️ **Painel do Organizador (`admin.html`):**
  - Altere o nome da criança, idade, data, horários, local e mensagens sem mexer em código.
  - Baixe a lista de confirmados em formato Excel / CSV.
  - Botão para imprimir a lista da recepção/buffet.
  - Remova confirmações duplicadas ou de teste com facilidade.

---

## 🚀 Como Iniciar

### Opção 1: Clique Duplo (Mais Fácil no Windows)
Basta dar dois cliques no arquivo:
👉 `iniciar_servidor.bat`

Ele abrirá seu navegador automaticamente em `http://localhost:3000`.

### Opção 2: Pelo Terminal / PowerShell
No diretório do projeto, execute:
```bash
node server.js
```
Acesse no navegador:
- Convite: [http://localhost:3000](http://localhost:3000)
- Painel Administrativo: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🌐 Como Colocar na Internet para os Convidados Acessarem pelo Celular

Para enviar o link no WhatsApp e os convidados confirmarem de onde estiverem, você pode usar uma dessas opções gratuitas:

1. **Compartilhar instantaneamente do seu computador:**
   - Usando o [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) ou [ngrok](https://ngrok.com/):
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
   Ele gera um link público e seguro (ex: `https://festa-do-lucas.trycloudflare.com`) na hora!

2. **Hospedar gratuitamente na nuvem (24 horas por dia):**
   - **Render.com / Railway / Fly.io:** Basta subir a pasta no GitHub e conectar no Render (Web Service gratuito, comando `node server.js`).
   - Seus dados ficam salvos e todo mundo pode acessar e confirmar em tempo real!
