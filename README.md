# Tradutor de Voz para Texto

Aplicativo web que traduz fala em português para outros idiomas em tempo real.

## Funcionalidades

- Reconhecimento de voz em português
- Tradução em tempo real para 12 idiomas diferentes
- Síntese de voz para ouvir a tradução
- Interface simples e intuitiva

## Tecnologias Utilizadas

- Next.js
- React
- Tailwind CSS
- API Web Speech (reconhecimento e síntese de voz)
- Anthropic Claude API (tradução)

## Como Executar Localmente

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Crie um arquivo `.env.local` com sua chave API Anthropic
   ```
   NEXT_PUBLIC_ANTHROPIC_API_KEY=sua-chave-api
   NEXT_PUBLIC_ANTHROPIC_MODEL=claude-3-7-sonnet-20250219
   ```
4. Execute o servidor de desenvolvimento: `npm run dev`
5. Acesse http://localhost:3000

## Deploy

Este aplicativo foi configurado para funcionar em um subdiretório `/tradutor` usando:

```javascript
// next.config.js
const nextConfig = {
  basePath: '/tradutor',
  assetPrefix: '/tradutor/'
};
```

## Autor

[Navesz](https://github.com/Navesz)