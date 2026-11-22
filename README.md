# thinking-orbs

Indicadores pontilhados de carregamento para interfaces de IA e agentes. São seis estados animados ajustados manualmente, cada um disponível em dois tamanhos específicos e renderizado em um canvas 2D simples, sem WebGL e sem filtros. O resultado funciona da mesma forma no Chrome, Safari e Firefox.

[Demonstração](https://orbs.jakubantalik.com) · [Repositório](https://github.com/Jakubantalik/thinking-orbs) · [Relatar um problema](https://github.com/Jakubantalik/thinking-orbs/issues)

## Instalação

```bash
npm install thinking-orbs
```

## Início rápido

```tsx
import { ThinkingOrb } from 'thinking-orbs';

function Status() {
  return <ThinkingOrb state="searching" size={64} />;
}
```

## Estados

Seis ações que um agente pode estar executando, cada uma com uma animação distinta:

```tsx
<ThinkingOrb state="working" />    {/* partículas em órbitas inclinadas */}
<ThinkingOrb state="searching" />  {/* um meridiano de varredura percorre um globo pontilhado */}
<ThinkingOrb state="solving" />    {/* as faixas se embaralham e voltam à solução */}
<ThinkingOrb state="listening" />  {/* uma onda percorre os anéis */}
<ThinkingOrb state="composing" />  {/* uma faixa ondulada com múltiplas linhas */}
<ThinkingOrb state="shaping" />    {/* contorno pontilhado: círculo → triângulo → quadrado */}
```

## Tamanhos

Dois presets ajustados como desenhos independentes, não como simples fatores de escala. Use `64` para a escala de avatar do chat e `20` para elementos junto ao texto. Cada tamanho possui quantidade, dimensão e velocidade próprias para os pontos:

```tsx
<ThinkingOrb state="working" size={64} />
<ThinkingOrb state="working" size={20} />
```

## Tema

Estritamente monocromático, com pontos claros em fundos escuros e pontos escuros em fundos claros. O modo é selecionado automaticamente a partir do projeto hospedeiro:

```tsx
<ThinkingOrb theme="auto" />   {/* padrão: detecta a partir do projeto */}
<ThinkingOrb theme="dark" />   {/* fixa pontos claros para fundos escuros */}
<ThinkingOrb theme="light" />  {/* fixa pontos escuros para fundos claros */}
```

`auto` é resolvido em três camadas e atualizado em tempo real quando qualquer uma delas muda:

1. um atributo ancestral `data-theme="dark|light"` ou uma classe `dark`/`light`, seguindo a convenção do Tailwind e do shadcn, observado por `MutationObserver`;
2. na ausência disso, `prefers-color-scheme`, com atualização em tempo real quando o tema do sistema operacional muda;
3. compatibilidade com SSR: o canvas é desenhado apenas no cliente, depois que o tema é resolvido.

## Outras propriedades

```tsx
<ThinkingOrb
  state="solving"
  size={20}
  speed={1.5}          // multiplica a velocidade definida no preset
  paused={false}       // congela a animação no quadro atual
  aria-label="Analisando o repositório…"  // substitui o padrão do estado
/>
```

Todas as outras propriedades de `<canvas>` (`className`, `style`, `data-*`, …) são repassadas.

## Acessibilidade e desempenho

- `role="img"` com um `aria-label` adequado para cada estado por padrão.
- `prefers-reduced-motion: reduce` renderiza um quadro estático representativo, sem animação, e continua acompanhando o tema em tempo real.
- Cada instância pausa automaticamente quando sai da área visível (`IntersectionObserver`) ou quando a aba é ocultada. Ao voltar, ela retoma em fase, pois todas as instâncias compartilham o mesmo relógio.
- Apenas arcos em canvas 2D simples, sem `ctx.filter`, filtros SVG ou WebGL. Os mesmos pixels são produzidos em todos os navegadores, com baixo custo até em dispositivos de entrada. A proporção de pixels do dispositivo é limitada a 2.

## Licença

MIT © Jakub Antalik
