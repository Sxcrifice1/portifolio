import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Code2, ClipboardList, MapPin, Mail, Smartphone, Code, ChevronLeft, ChevronRight, X, Copy, Check, Play, Pause, Volume2, VolumeX, Download, Maximize } from "lucide-react";
import Personagem from './Personagem'; // 3D Avatar!
import { DraggableCard } from './DraggableTag';
import { PanoramaViewer } from './PanoramaViewer';
import IphoneContato from './IphoneContato';
import './BentoGrid.css';
import { arquivo } from "../arquivos";

// Manda o conteúdo pro <body>, fora da árvore do grid.
//
// Existe como COMPONENTE, e não como um createPortal solto lá embaixo,
// por causa do AnimatePresence: ele filtra os próprios filhos com
// `isValidElement`, que testa `$$typeof === REACT_ELEMENT_TYPE`. Um
// portal carrega `REACT_PORTAL_TYPE`, reprova nesse teste e é
// descartado em silêncio — a gaveta simplesmente não aparecia. Num
// componente comum ele vê um elemento normal, e o portal acontece
// dentro. O PresenceContext (que faz a animação de saída) atravessa
// portais numa boa, então o exit continua funcionando.
const GavetaEmPortal = ({ children }) => createPortal(children, document.body);

const DelayedMount = ({ children, delay = 800 }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!mounted) {
    return (
      <div className="bento-pano-loading">
        <div className="bento-pano-spinner" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="bento-pano-fade"
    >
      {children}
    </motion.div>
  );
};

// Um "case" completo de site: carrossel de fotos (quando há mais de uma)
// + corpo com tag/título/descrição/link. Fica num componente próprio (e
// não inline no map) porque o carrossel precisa de estado PRÓPRIO —
// `imgIndex` — e assim cada site monta/desmonta seu carrossel do zero
// ao trocar de card, sem herdar o índice de foto do card anterior.
// Player PRÓPRIO pro arquivo de vídeo (`{ videoFile: url }`) — não os
// controles nativos do navegador. O nativo tinha a barra (play/volume/
// tela cheia) bem na faixa de baixo do vídeo, exatamente onde mora o
// texto do card por cima (ver .bento-case-body): mesmo clicável (já
// tinha corrigido isso com pointer-events), ela ficava visualmente
// perdida atrás do degradê/texto. Aqui o botão de play fica GRANDE e
// CENTRALIZADO (longe da faixa de texto) e o único controle que sobra
// embaixo — mudo/som — vai pro canto de CIMA, também fora dessa faixa.
function VideoArquivoPlayer({ src, semCorte = false, idioma = "pt" }) {
  const t = ROTULOS_UI[idioma];
  const videoRef = useRef(null);
  const [tocando, setTocando] = useState(false);
  const [mudo, setMudo] = useState(false);

  // Pausa o vídeo ao DESMONTAR (troca de foto/vídeo no carrossel, ou
  // fecha a gaveta): sem isso, o <video> desta mídia continuava
  // tocando escondido atrás da próxima — o áudio dos dois se somava.
  // Roda antes/independente da animação de saída do Framer Motion, que
  // só REMOVE o elemento depois da transição — o pause() aqui é
  // imediato, não espera aquilo terminar.
  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  // Alguns dos vídeos da marca começam com um quadro preto/escuro (fade
  // de abertura) — sem isso, a "thumbnail" antes de apertar play parecia
  // vazia, como se nada tivesse carregado. Pulando 1s pra dentro (ou
  // 5% da duração, pro vídeo curto de 6s) assim que os metadados
  // chegam, pega um quadro real pra mostrar. Só ajusta o PONTO DE
  // PARTIDA (o vídeo ainda está pausado aqui) — quando o usuário der
  // play, ele começa exatamente desse ponto, não perde o vídeo, só
  // aquele primeiro segundo preto.
  const definirQuadroDeCapa = (e) => {
    const v = e.currentTarget;
    if (v.currentTime === 0) {
      v.currentTime = Math.min(1, v.duration * 0.05);
    }
  };

  const alternarPlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    // .play() devolve uma Promise que pode rejeitar (ex.: o usuário
    // clica de novo rápido o bastante pra interromper o play() com um
    // pause() no meio) — sem o catch, isso sobe como um erro não
    // tratado no console à toa.
    if (v.paused) v.play().catch(() => { });
    else v.pause();
  };

  const alternarMudo = (e) => {
    e.stopPropagation();
    setMudo((m) => !m);
  };

  // Tela cheia. O caminho padrão é `requestFullscreen` no elemento, mas
  // o Safari do iPhone NÃO implementa a API de fullscreen para elementos
  // comuns — lá só o próprio <video> sabe entrar em tela cheia, pelo
  // `webkitEnterFullscreen`. Sem esse segundo caminho o botão seria
  // inerte justamente no aparelho mais provável de assistir deitado.
  const alternarTelaCheia = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else if (v.requestFullscreen) {
      v.requestFullscreen().catch(() => { });
    } else if (v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen();
    }
  };

  return (
    <div className={`bento-case-video-wrap${semCorte ? ' bento-case-video-wrap--sem-corte' : ''}`} onClick={alternarPlay}>
      <video
        ref={videoRef}
        src={src}
        // `semCorte`: um vídeo HORIZONTAL (a maioria dos outros projetos
        // é vertical) numa caixa alta feito `cover` no tamanho cheio —
        // pra preencher tanta altura ele precisava dar um zoom enorme
        // (só uns pixels de pétala de flor apareciam). A classe no
        // .bento-case-video-wrap (ver CSS) limita a ALTURA da área do
        // vídeo a algo mais parecido com a proporção dele, então o
        // `cover` aqui só precisa cortar um pouco, não dar um zoom absurdo.
        className={`bento-case-media-video${semCorte ? ' bento-case-media-video--sem-corte' : ''}`}
        playsInline
        // "auto" (não "metadata"): é o que faz o navegador decodificar
        // e mostrar o primeiro quadro sozinho, funcionando como uma
        // thumbnail — sem isso, a área fica preta/cinza até apertar
        // play. Não temos uma imagem de capa separada pra cada vídeo,
        // então usar o primeiro quadro do próprio arquivo resolve sem
        // precisar pedir mais um arquivo pro usuário.
        preload="auto"
        muted={mudo}
        onLoadedMetadata={definirQuadroDeCapa}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
      />

      {/* SEMPRE montado (nunca some do DOM) — só troca opacity/pointer-
          events. Antes ele desmontava (`{!tocando && <button>}`) assim
          que o vídeo começava a tocar; como o clique acontece bem em
          cima do botão, o mouse "sai" dele por ele ter sido destruído,
          não por ter se movido — o TargetCursor (o cursor customizado
          do site) escuta `mouseleave` pra soltar o alvo, e um elemento
          destruído nunca dispara esse evento. Resultado: o cursor
          ficava travado nas bordas do botão que não existe mais. */}
      {/* Play E pause no mesmo botão. Antes ele ganhava
          `pointer-events: none` ao tocar, e aí não sobrava nada
          clicável pra pausar — no celular, onde não existe hover pra
          revelar nada, ficava sem saída. */}
      <button
        type="button"
        className={`bento-case-video-play${tocando ? ' esta-tocando' : ''}`}
        onClick={alternarPlay}
        aria-label={tocando ? t.videoPausar : t.videoTocar}
      >
        {tocando
          ? <Pause className="bento-case-video-play-icon" fill="currentColor" />
          : <Play className="bento-case-video-play-icon" fill="currentColor" />}
      </button>

      <div className="bento-case-video-controles">
        <button
          type="button"
          className="bento-case-video-botao"
          onClick={alternarMudo}
          aria-label={mudo ? t.videoAtivarSom : t.videoSilenciar}
        >
          {mudo
            ? <VolumeX className="bento-case-video-mute-icon" />
            : <Volume2 className="bento-case-video-mute-icon" />}
        </button>

        <button
          type="button"
          className="bento-case-video-botao"
          onClick={alternarTelaCheia}
          aria-label={t.videoTelaCheia}
        >
          <Maximize className="bento-case-video-mute-icon" />
        </button>
      </div>
    </div>
  );
}

// `variant`: "classic" (padrão, usado pela gaveta de Sites — mídia
// numa faixa fixa em cima, texto numa faixa sólida embaixo) ou
// "poster" (usado pela gaveta de Projects — mídia ocupa o card
// inteiro, texto vira um overlay com degradê por cima). É o MESMO
// componente porque é o mesmo formato de card; só o visual muda,
// via a classe `bento-case--poster` no elemento raiz.
function SiteCase({ site, variant = "classic", idioma = "pt" }) {
  const t = ROTULOS_UI[idioma];
  const [imgIndex, setImgIndex] = useState(0);
  const imagens = site.imagens || [];
  const temVariasFotos = imagens.length > 1;
  // Cada item é uma URL (string, imagem) OU um objeto marcando vídeo.
  // Dois formatos de vídeo, porque são duas coisas diferentes:
  //   { video: url }     → PÁGINA de outro site pra embutir em <iframe>
  //                         (ex.: player do YouTube/Vimeo).
  //   { videoFile: url }  → o ARQUIVO de vídeo em si (.mp4/.mkv/...), toca
  //                         direto numa tag <video>. Um link de arquivo
  //                         (ex.: storage.filebin.net) usado como <iframe>
  //                         é bloqueado pelo X-Frame-Options do host — não
  //                         é uma "página" pra ele deixar ser enquadrada.
  const itemAtual = imagens[imgIndex];
  const ehVideoEmbed = itemAtual != null && typeof itemAtual === "object" && itemAtual.video;
  const ehVideoArquivo = itemAtual != null && typeof itemAtual === "object" && itemAtual.videoFile;

  // Forma FUNCIONAL do setState (`i => ...`), não `irPara(imgIndex ± 1)`
  // fechando sobre a variável do render atual: com StrictMode (ligado em
  // main.jsx) o React monta/renderiza componentes em duplicidade de
  // propósito para pegar efeitos colaterais impuros, e uma closure presa
  // ao `imgIndex` de um render descartado faz o clique avançar o valor
  // errado — sintoma visto aqui como a foto ficando "um clique atrasada"
  // atrás das bolinhas, que liam o estado direto (sempre corretas).
  const normaliza = (i) => ((i % imagens.length) + imagens.length) % imagens.length;
  const irPara = (i) => setImgIndex(normaliza(i));
  const fotoAnterior = (e) => { e.stopPropagation(); setImgIndex((i) => normaliza(i - 1)); };
  const proximaFoto = (e) => { e.stopPropagation(); setImgIndex((i) => normaliza(i + 1)); };

  return (
    <div className={`bento-case group${variant === "poster" ? " bento-case--poster" : ""}`}>
      <div className="bento-case-media">
        {/* Site ainda sem mídia (`imagens: []`, caso do "em construção"):
            mesmo placeholder que o card de Projetos usa pra thumbnail
            vazia, em vez de tentar carregar um <img> sem src. */}
        {imagens.length > 0 ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={imgIndex}
              className="bento-case-media-slide"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {ehVideoEmbed ? (
                <iframe
                  src={itemAtual.video}
                  title={`${site.nome}${temVariasFotos ? ` (${imgIndex + 1}/${imagens.length})` : ''}`}
                  className="bento-case-media-video"
                  allow="autoplay; fullscreen"
                  frameBorder="0"
                />
              ) : ehVideoArquivo ? (
                <VideoArquivoPlayer key={itemAtual.videoFile} src={itemAtual.videoFile} semCorte={itemAtual.semCorte} idioma={idioma} />
              ) : (
                <img
                  src={itemAtual}
                  alt={`${site.nome}${temVariasFotos ? ` (${imgIndex + 1} de ${imagens.length})` : ''}`}
                  className="bento-case-media-img"
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="bento-case-media-empty">
            <Code className="bento-case-media-icon" strokeWidth={1} />
            <span className="bento-case-media-text">{t.emConstrucao}</span>
          </div>
        )}
        <div className="bento-case-media-tint"></div>

        {/* Setas e bolinhas só aparecem quando há mais de uma mídia —
            com uma só, não existe "carrossel" para navegar. */}
        {temVariasFotos && (
          <>
            <button
              type="button"
              onClick={fotoAnterior}
              aria-label={t.midiaAnterior}
              className="bento-case-photo-arrow bento-case-photo-arrow--prev"
            >
              <ChevronLeft className="bento-case-photo-arrow-icon" />
            </button>
            <button
              type="button"
              onClick={proximaFoto}
              aria-label={t.proximaMidia}
              className="bento-case-photo-arrow bento-case-photo-arrow--next"
            >
              <ChevronRight className="bento-case-photo-arrow-icon" />
            </button>
            <div className="bento-case-photo-dots">
              {imagens.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); irPara(i); }}
                  aria-label={t.verMidia(i + 1, imagens.length)}
                  className={`bento-case-photo-dot ${i === imgIndex ? 'esta-ativo' : ''}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bento-case-body">
        <div className="bento-case-meta">
          <span className="bento-case-tag">{site.tag}</span>
          {/* `year` só existe nos projetos (a gaveta de Projects reusa
              este mesmo componente) — sites nunca mandam essa prop. */}
          {site.year && <span className="bento-case-year">{site.year}</span>}
        </div>
        <h3 className="bento-case-title">{site.nome}</h3>
        <p className="bento-case-desc bento-case-desc--full">{site.descricao}</p>

        {/* Templates sem link (`link: null`) não ganham CTA. */}
        {site.link && (
          <a
            href={site.link}
            target="_blank"
            rel="noreferrer"
            className="bento-case-cta group/btn"
          >
            <span className="bento-case-cta-text">{t.visitarSite}</span>
            <ArrowUpRight className="bento-case-cta-icon" />
          </a>
        )}
      </div>
    </div>
  );
}

// Campos que NÃO mudam com o idioma (nomes próprios, contato, link do
// mapa) — ficam fora do dicionário de tradução.
// Currículo em PDF, um por idioma. `arquivo` é o caminho servido de
// /public; `nomeArquivo` é como ele chega no computador de quem baixa
// (atributo `download` do link) — sem isso o arquivo salvaria com o
// nome interno, que não diz nada pra quem recebe.
const CURRICULOS = {
  pt: { arquivo: arquivo("/cv/curriculo-joao-arthur-pt.pdf"), nomeArquivo: "Joao-Arthur-Curriculo.pdf" },
  en: { arquivo: arquivo("/cv/curriculo-joao-arthur-en.pdf"), nomeArquivo: "Joao-Arthur-Resume.pdf" },
};

const DADOS_FIXOS = {
  name: "João Arthur",
  avatarUrl: arquivo("/avatar.webp"),
  email: "joaoafg04@gmail.com",
  whatsapp: "+55 41 99575-4792",
  // Coordenadas de Curitiba. Os parâmetros `entry`/`g_ep` da URL copiada
  // do navegador são lixo de sessão e foram descartados — só @lat,long,zoom
  // já abre o mapa no ponto certo.
  mapa: "https://www.google.com/maps/@-25.4158322,-49.2676957,13.3z",
};

// Sites/projetos: a parte "pesada" (link, imagens, vídeos, ano, capa) não
// muda com o idioma — só nome/tag/descrição. Uma base única com um
// `texto: { pt, en }` embutido, e montarSites/montarProjects (mais
// abaixo) juntam a base com o texto do idioma ativo — assim as
// fotos/vídeos não precisam ser copiados duas vezes.
const SITES_BASE = [
  {
    link: "https://clydes.com.br/",
    // 4 prints reais do clydes.com.br: home, plugins/launcher, about e
    // a tela de login. Mais de uma imagem aqui já ativa o carrossel de
    // fotos sozinho.
    imagens: [
      arquivo("/projects/clydes-1-home.jpg"),
      arquivo("/projects/clydes-2-plugins.jpg"),
      arquivo("/projects/clydes-3-about.jpg"),
      arquivo("/projects/clydes-4-login.jpg"),
    ],
    texto: {
      pt: {
        nome: "Clydes",
        tag: "Plataforma de Áudio",
        descricao: "Idealizado por mim, o Clydes é o ecossistema oficial de plugins de áudio, produção musical e ferramentas de automação — com uma comunidade sempre buscando evoluir a música.",
      },
      en: {
        nome: "Clydes",
        tag: "Audio Platform",
        descricao: "Founded by me, Clydes is the official ecosystem for audio plugins, music production and automation tools — with a community always pushing music forward.",
      },
    },
  },
  {
    // Sem link próprio: o launcher é distribuído pelo site do Clydes, e
    // não me foi passada uma URL de download separada. Sem `link`, o
    // card simplesmente não mostra o botão de CTA (ver SiteCase) — se
    // um dia tiver uma página só dele, é só preencher aqui.
    link: null,
    // 4 telas do launcher: vendas, métodos de pagamento, scraping e a
    // aba de lives/notícias.
    imagens: [
      "https://i.postimg.cc/3J5rDtgf/Captura-de-tela-2026-06-28-194135.png",
      "https://i.postimg.cc/HsDW76QF/Captura-de-tela-2026-06-28-194150.png",
      "https://i.postimg.cc/wT8xswhS/Captura-de-tela-2026-06-28-194203.png",
      "https://i.postimg.cc/65J6GMrJ/image-orisginal.jpg",
    ],
    texto: {
      pt: {
        nome: "Clydes Launcher",
        tag: "Aplicativo Desktop",
        descricao: "Meu maior projeto: o aplicativo do Clydes, com sistema de vendas e métodos de pagamento integrados, scraping automatizado, transmissões ao vivo e um feed de notícias — tudo num lugar só.",
      },
      en: {
        nome: "Clydes Launcher",
        tag: "Desktop App",
        descricao: "My biggest project: the Clydes app, with a built-in sales system and payment methods, automated scraping, live streaming and a news feed — all in one place.",
      },
    },
  },
];

const PROJECTS_BASE = [
  {
    // Julho de 2026. Freelance para um cliente persa.
    year: "2026",
    link: null,
    imagens: [
      "https://i.postimg.cc/hvmJHq3n/9170f7fd-4a86-4f94-9086-55902357a705.png",
      "https://i.postimg.cc/Rht3jzbh/Sem-Titasdulo-1.png",
      "https://i.postimg.cc/bwmvVJN9/w2o-2.png",
      "https://i.postimg.cc/ZKcY0R3Z/e1236a74-29c8-4bf9-a865-6d33d9189c77.png",
      "https://i.postimg.cc/wvLgzTHf/1ff0a78a-5be0-4cac-a62c-fefa1cfbeb8a.png",
      // Vídeos da mesma marca — arquivo direto (`videoFile`, toca em
      // <video>), não embed de página (`video`, tocaria em <iframe>).
      // Link do Dropbox com `dl=1` (não `dl=0`): dl=1 entrega o
      // ARQUIVO direto, dl=0 abriria a página de preview do Dropbox
      // (um site inteiro, não algo que dê pra usar num <video src>).
      // Ao contrário do filebin, esse link não expira sozinho.
      { videoFile: "https://www.dropbox.com/scl/fi/eeh5zekkwbz49lpob2hi7/0630-4-1-.realesrgan.mkv?rlkey=j7utokkw4qlk3c6ssfyx6lph4&st=4vwt3r3v&dl=1" },
      { videoFile: "https://www.dropbox.com/scl/fi/w295t6z0v0ue1vl3fosvz/Five_hoodies_swaying_in_wind_202606302149.mp4?rlkey=yasu4tff82jbfg3b1c243fi2g&st=1gpjs4go&dl=1" },
    ],
    texto: {
      pt: {
        name: "Payandeh",
        tag: "Identidade Visual",
        descricao: "Projeto freelance para a marca de roupa Payandeh: montei toda a identidade visual pensando em juntar o streetwear com a cultura persa do cliente.",
      },
      en: {
        name: "Payandeh",
        tag: "Visual Identity",
        descricao: "Freelance project for the Payandeh clothing brand: I built the entire visual identity around blending streetwear with the client's Persian culture.",
      },
    },
  },
  {
    // Identidade visual da Clydes (a plataforma de áudio) — diferente
    // da entrada em `sites`, que é o SITE em si. Criada em janeiro de
    // 2024, para a marca própria dele.
    year: "2024",
    link: null,
    imagens: [
      "https://i.postimg.cc/MKc2sqtP/caixa-embalagem.png",
      "https://i.postimg.cc/SsQHchnb/P-ACOTE.png",
      "https://i.postimg.cc/gkf9QQTw/cartaoi-visita.png",
      "https://i.postimg.cc/JhLf4Jm4/Clean-Washed-T-shirt-Mockup-Front.png",
      "https://i.postimg.cc/vB8C5s4G/marca.png",
    ],
    texto: {
      pt: {
        name: "Clydes",
        tag: "Identidade Visual",
        descricao: "Identidade visual da Clydes: embalagem, cartão de visita, camiseta e o logo da marca.",
      },
      en: {
        name: "Clydes",
        tag: "Visual Identity",
        descricao: "Clydes visual identity: packaging, business card, t-shirt and the brand logo.",
      },
    },
  },
  {
    // 5 de outubro de 2020.
    year: "2020",
    link: null,
    // `thumb`: capa do MINI card arrastável (o deck da tela principal),
    // SEPARADA de `imagens` — a regra padrão dos outros projetos
    // (1ª foto de `imagens` = thumbnail do mini card) não serve aqui
    // porque o único item de `imagens` é o vídeo, que não dá pra usar
    // como capa estática. `thumb`, quando existe, tem prioridade sobre
    // aquela regra (ver DraggableCard mais abaixo no JSX).
    thumb: "https://i.postimg.cc/RFN1fsQY/Captura-de-tela-2026-08-28-144123.png",
    imagens: [
      // `semCorte: true`: este vídeo é HORIZONTAL (1024x576), diferente
      // de quase tudo nos outros projetos (vertical) — no card poster,
      // que é bem mais alto que largo, o `cover` padrão cortava boa
      // parte das laterais pra preencher a caixa. Essa flag ajusta só
      // ESTE item (object-position:top, ver CSS) sem mexer nos outros
      // vídeos/fotos.
      { videoFile: "https://www.dropbox.com/scl/fi/o5jlxd4q0itzibt3hvjz8/4eZnT-V6QaR_576.mp4?rlkey=521g42ds5ytzrdtknhi5davpi&st=m60f3fcw&dl=1", semCorte: true },
    ],
    texto: {
      pt: {
        name: "Mili",
        tag: "Produção Audiovisual",
        descricao: "Participei da produção de uma campanha publicitária da Mili, atuando nas áreas de gravação, iluminação, cenografia e decoração. Contribuí para criar uma ambientação visual impactante, garantindo que todos os elementos estéticos e técnicos estivessem alinhados à proposta criativa da marca.",
      },
      en: {
        name: "Mili",
        tag: "Audiovisual Production",
        descricao: "I took part in producing an ad campaign for Mili, working on filming, lighting, set design and decoration. I helped build an impactful visual atmosphere, making sure every aesthetic and technical element matched the brand's creative vision.",
      },
    },
  },
];

// Junta a base (link/imagens/ano/capa) com o texto do idioma ativo —
// mesmo formato que o resto do arquivo já espera (`site.nome`,
// `proj.name`, etc.), então nenhum outro lugar do JSX precisa mudar.
const montarSites = (idioma) => SITES_BASE.map(({ texto, ...resto }) => ({ ...resto, ...texto[idioma] }));
const montarProjects = (idioma) => PROJECTS_BASE.map(({ texto, ...resto }) => ({ ...resto, ...texto[idioma] }));

// Textos que mudam com o idioma mas não carregam mídia (cargo, serviços,
// ferramentas, credenciais) — arrays completos por idioma, curtos o
// bastante pra não valer a pena o mesmo esquema de "base + texto".
const TEXTO_POR_IDIOMA = {
  pt: {
    role: "Desenvolvedor e Designer",
    cidade: "Curitiba",
    estado: "Paraná",
    // Lista simples: a posição de cada chip vem do flex-wrap do CSS, não
    // de coordenadas. Para incluir ou tirar um serviço, basta mexer aqui
    // (nos dois idiomas).
    services: [
      "Design",
      "Audiovisual",
      "Landing page",
      "Edição de vídeo e foto",
      "Sites complexos",
      "Full stack",
      "Vibe code",
    ],
    // 8 ferramentas em grade 4×2. `sigla`/`cor` não mudam de idioma
    // (aparecem no quadradinho); só `nivel` (o que o balão mostra no
    // hover) precisa de tradução.
    tools: [
      { name: "Photoshop", sigla: "Ps", cor: "#31a8ff", nivel: "Avançado" },
      { name: "Illustrator", sigla: "Ai", cor: "#ff9a00", nivel: "Intermediário" },
      { name: "After Effects", sigla: "Ae", cor: "#9999ff", nivel: "Intermediário" },
      { name: "Premiere", sigla: "Pr", cor: "#ea77ff", nivel: "Intermediário" },
      { name: "DaVinci Resolve", sigla: "Dv", cor: "#fcb03c", nivel: "Intermediário" },
      { name: "CapCut", sigla: "Cc", cor: "#ffffff", nivel: "Avançado" },
      { name: "FL Studio", sigla: "FL", cor: "#f7941e", nivel: "Avançado" },
      { name: "Microsoft 365", sigla: "365", cor: "#d83b01", nivel: "Avançado" },
    ],
    // Certificados, formação e áreas de estudo. `titulo` é o destaque
    // (o quê), `detalhe` é a instituição ou o status (onde/quanto tempo).
    credenciais: [
      { titulo: "Formação em Programação", detalhe: "Rocketseat" },
      { titulo: "Inglês Intermediário", detalhe: "Influx — cursando" },
      { titulo: "Ensino Médio", detalhe: "Completo" },
      { titulo: "Música", detalhe: "5+ anos de estudo" },
      { titulo: "Design", detalhe: "Conhecimento prático" },
      { titulo: "Inteligência Artificial", detalhe: "Estudando há 2 anos" },
    ],
  },
  en: {
    role: "Developer & Designer",
    cidade: "Curitiba",
    estado: "Paraná",
    services: [
      "Design",
      "Audiovisual",
      "Landing page",
      "Video & photo editing",
      "Complex websites",
      "Full stack",
      "Vibe code",
    ],
    tools: [
      { name: "Photoshop", sigla: "Ps", cor: "#31a8ff", nivel: "Advanced" },
      { name: "Illustrator", sigla: "Ai", cor: "#ff9a00", nivel: "Intermediate" },
      { name: "After Effects", sigla: "Ae", cor: "#9999ff", nivel: "Intermediate" },
      { name: "Premiere", sigla: "Pr", cor: "#ea77ff", nivel: "Intermediate" },
      { name: "DaVinci Resolve", sigla: "Dv", cor: "#fcb03c", nivel: "Intermediate" },
      { name: "CapCut", sigla: "Cc", cor: "#ffffff", nivel: "Advanced" },
      { name: "FL Studio", sigla: "FL", cor: "#f7941e", nivel: "Advanced" },
      { name: "Microsoft 365", sigla: "365", cor: "#d83b01", nivel: "Advanced" },
    ],
    credenciais: [
      { titulo: "Programming Certification", detalhe: "Rocketseat" },
      { titulo: "Intermediate English", detalhe: "Influx — in progress" },
      { titulo: "High School", detalhe: "Completed" },
      { titulo: "Music", detalhe: "5+ years of study" },
      { titulo: "Design", detalhe: "Practical knowledge" },
      { titulo: "Artificial Intelligence", detalhe: "Studying for 2 years" },
    ],
  },
};

// Junta tudo (fixo + texto do idioma + sites/projects montados) no
// mesmo formato de objeto único que o resto do arquivo sempre usou
// (`profileData.x`) — só precisa ser chamada de novo quando o idioma
// muda, então vive DENTRO do componente, não aqui no topo do módulo.
function montarProfileData(idioma) {
  return {
    ...DADOS_FIXOS,
    ...TEXTO_POR_IDIOMA[idioma],
    sites: montarSites(idioma),
    projects: montarProjects(idioma),
  };
}

// Microcopy da interface (rótulos, dicas, aria-labels) — não é conteúdo
// do perfil, é "moldura" do site, então fica num dicionário à parte do
// TEXTO_POR_IDIOMA acima. Funções (não strings) onde o texto precisa de
// uma variável (nome, e-mail, cidade...) embutida.
const ROTULOS_UI = {
  pt: {
    hint: "Clique fora dos cards para alterar os formatos do Grid!",
    saudacao: (nome) => `Oi, eu sou ${nome}`,
    servicesTitulo: "Serviços",
    toolsTitulo: "Ferramentas que uso",
    credenciaisTitulo: "Certificados & Formação",
    chipFechar: "Fechar",
    chipMeusSites: "Meus sites",
    chipSobreMim: "Sobre mim",
    chipFaleComigo: "Fale comigo",
    chipVerTudo: "Ver tudo",
    chipComoTrabalho: "Como eu trabalho",
    cvBotao: "Baixar currículo",
    cvEscolha: "Em qual idioma?",
    cvPortugues: "Português",
    cvIngles: "Inglês",
    cvConfirmar: "Baixar",
    processoTitulo: "Como eu trabalho",
    processoDica: "Do briefing à entrega",
    processoEtapas: [
      {
        titulo: "Estudo antes de começar",
        texto: "Antes de escrever a primeira linha, eu estudo o projeto a fundo: levanto o que é essencial, o que pode dar errado e onde estão os riscos. Sai mais barato descobrir um problema no papel do que no meio do desenvolvimento.",
      },
      {
        titulo: "Escolha da tecnologia",
        texto: "Com o terreno mapeado, uso IA como apoio para comparar as tecnologias disponíveis e escolher a que faz sentido para aquele projeto específico — não a que está na moda.",
      },
      {
        titulo: "Design com propósito",
        texto: "No design, o ponto de partida é sempre quem vai usar e para quê. Entender o usuário e o objetivo vem antes de qualquer decisão visual.",
      },
      {
        titulo: "Honestidade antes de agrado",
        texto: "Se algo na ideia do cliente não se sustenta, eu aponto logo — mesmo que não seja o que ele quer ouvir. Prefiro uma conversa difícil no início a um resultado ruim no final.",
      },
      {
        titulo: "Três rodadas de ajustes",
        texto: "Todo projeto, de programação ou de design, inclui três rodadas de ajustes. Sem letra miúda.",
      },
    ],
    projectsTituloLinha1: "Projetos em",
    projectsTituloLinha2: "Destaque",
    projectsSub: "Arraste os cards para as abas",
    // No celular o baralho arrastável não aparece (ver CSS), então a
    // instrução de arrastar mentiria — lá o caminho é o chip "Ver tudo".
    projectsSubMobile: "Toque em Ver tudo para abrir",
    pano360Titulo: "Sobre mim 360",
    pano360Dica: "Deslize para ver",
    panoCartaoTitulo: "Meu cartão",
    panoCartaoDica: "Toque no botão",
    mailEnviarPara: (email) => `Enviar e-mail para ${email}`,
    mailCopiarEndereco: (email) => `Copiar endereço ${email}`,
    mailCopiado: "Copiado!",
    mapaVer: (cidade, estado) => `Ver ${cidade}, ${estado} no Google Maps (abre em nova aba)`,
    videoTocar: "Tocar vídeo",
    videoPausar: "Pausar vídeo",
    videoTelaCheia: "Tela cheia",
    videoSilenciar: "Silenciar vídeo",
    videoAtivarSom: "Ativar som",
    midiaAnterior: "Mídia anterior",
    proximaMidia: "Próxima mídia",
    verMidia: (i, total) => `Ver mídia ${i} de ${total}`,
    visitarSite: "Visitar site",
    emConstrucao: "Em construção",
    descricaoEmBreve: "Descrição do projeto em breve.",
    nivelLabel: "nível",
    whatsappMensagemInicial: "Oi! Vim pelo seu portfólio.",
    iphoneTitulo: "Vamos conversar?",
    iphoneTextoBotao: "Enviar mensagem",
    iphoneCarregando: "Carregando…",
    iphoneMensagensChat: [
      "Gostei muito do portfólio!",
      "Gostaria de fechar negócio",
      "Seu trabalho é excelente",
      "Tem disponibilidade esse mês?",
      "Quanto fica uma landing page?",
      "Podemos marcar uma call?",
      "Vi seu 3D, ficou insano",
      "Preciso de um site novo",
    ],
    trocarIdioma: "EN",
    trocarIdiomaAria: "Switch to English",
  },
  en: {
    hint: "Click outside the cards to change the Grid layouts!",
    saudacao: (nome) => `Hey, I'm ${nome}`,
    servicesTitulo: "Services",
    toolsTitulo: "Tools I use",
    credenciaisTitulo: "Certifications & Education",
    chipFechar: "Close",
    chipMeusSites: "My sites",
    chipSobreMim: "About me",
    chipFaleComigo: "Contact me",
    chipVerTudo: "View all",
    chipComoTrabalho: "How I work",
    cvBotao: "Download CV",
    cvEscolha: "In which language?",
    cvPortugues: "Portuguese",
    cvIngles: "English",
    cvConfirmar: "Download",
    processoTitulo: "How I work",
    processoDica: "From briefing to delivery",
    processoEtapas: [
      {
        titulo: "Research comes first",
        texto: "Before writing the first line, I study the project in depth: I map what's essential, what could go wrong and where the risks are. It's cheaper to find a problem on paper than halfway through development.",
      },
      {
        titulo: "Choosing the stack",
        texto: "With the ground mapped out, I use AI to help compare the available technologies and pick the one that fits that specific project — not the one that's trending.",
      },
      {
        titulo: "Design with purpose",
        texto: "In design, the starting point is always who will use it and what for. Understanding the user and the goal comes before any visual decision.",
      },
      {
        titulo: "Honesty over flattery",
        texto: "If something in the client's idea doesn't hold up, I say so upfront — even when it's not what they want to hear. I'd rather have a hard conversation at the start than a bad result at the end.",
      },
      {
        titulo: "Three rounds of revisions",
        texto: "Every project, development or design, includes three rounds of revisions. No fine print.",
      },
    ],
    projectsTituloLinha1: "Featured",
    projectsTituloLinha2: "Projects",
    projectsSub: "Drag the cards to the sides",
    projectsSubMobile: "Tap View all to open",
    pano360Titulo: "About me",
    pano360Dica: "Swipe to look around",
    panoCartaoTitulo: "My contact card",
    panoCartaoDica: "Tap the button",
    mailEnviarPara: (email) => `Send an email to ${email}`,
    mailCopiarEndereco: (email) => `Copy address ${email}`,
    mailCopiado: "Copied!",
    mapaVer: (cidade, estado) => `View ${cidade}, ${estado} on Google Maps (opens in a new tab)`,
    videoTocar: "Play video",
    videoPausar: "Pause video",
    videoTelaCheia: "Fullscreen",
    videoSilenciar: "Mute video",
    videoAtivarSom: "Unmute",
    midiaAnterior: "Previous media",
    proximaMidia: "Next media",
    verMidia: (i, total) => `View media ${i} of ${total}`,
    visitarSite: "Visit site",
    emConstrucao: "Under construction",
    descricaoEmBreve: "Project description coming soon.",
    nivelLabel: "level",
    whatsappMensagemInicial: "Hi! I came from your portfolio.",
    iphoneTitulo: "Let's talk?",
    iphoneTextoBotao: "Send message",
    iphoneCarregando: "Loading…",
    iphoneMensagensChat: [
      "I loved your portfolio!",
      "I'd like to work together",
      "Your work is excellent",
      "Are you available this month?",
      "How much is a landing page?",
      "Can we schedule a call?",
      "I saw your 3D, it's insane",
      "I need a new website",
    ],
    trocarIdioma: "PT",
    trocarIdiomaAria: "Mudar para português",
  },
};

// Layouts calculados matematicamente para um Grid de 20 colunas e 20 linhas (Tamanho Fixo!)
const LAYOUT_PRESETS = [
  { // 0: Screenshot 1 (Default) - 20 Linhas Totais (5 + 3 + 6 + 6)
    header: "order-1 sm:col-span-15 sm:row-span-5", // Ajustado para 15
    avatar: "order-2 sm:col-span-5 sm:row-span-5",  // 5x5 Quadrado Perfeito (1:1)
    github: "order-3 sm:col-span-4 sm:row-span-3",
    dribbble: "order-4 sm:col-span-4 sm:row-span-3",
    location: "order-5 sm:col-span-4 sm:row-span-3",
    mail: "order-6 sm:col-span-4 sm:row-span-3",
    phone: "order-7 sm:col-span-4 sm:row-span-3",
    projects: "order-8 sm:col-span-12 sm:row-span-6",
    services: "order-9 sm:col-span-8 sm:row-span-6",
    tools: "order-10 sm:col-span-8 sm:row-span-6",
    collab: "order-11 sm:col-span-12 sm:row-span-6"
  },
  { // 1: Screenshot 2 (Projects Full) - 20 Linhas Totais (5 + 5 + 4 + 6)
    avatar: "order-1 sm:col-span-5 sm:row-span-5",  // 5x5 Quadrado Perfeito (1:1)
    collab: "order-2 sm:col-span-15 sm:row-span-5", // Ajustado para 15
    projects: "order-3 sm:col-span-20 sm:row-span-5",
    services: "order-4 sm:col-span-8 sm:row-span-4",
    phone: "order-5 sm:col-span-4 sm:row-span-4",
    dribbble: "order-6 sm:col-span-4 sm:row-span-4",
    github: "order-7 sm:col-span-4 sm:row-span-4",
    header: "order-8 sm:col-span-8 sm:row-span-6",
    mail: "order-9 sm:col-span-4 sm:row-span-3",
    tools: "order-10 sm:col-span-8 sm:row-span-6",
    location: "order-11 sm:col-span-4 sm:row-span-3"
  },
  { // 2: Screenshot 3 (Map Location) - 20 Linhas Totais (5 + 4 + 5 + 6)
    collab: "order-1 sm:col-span-12 sm:row-span-5",
    location: "order-2 sm:col-span-8 sm:row-span-5",
    mail: "order-3 sm:col-span-4 sm:row-span-4",    // Socials viram 4x4
    avatar: "order-4 sm:col-span-4 sm:row-span-4",  // 4x4 Quadrado Perfeito (1:1), menor e no meio!
    phone: "order-5 sm:col-span-4 sm:row-span-4",   // Socials viram 4x4
    github: "order-6 sm:col-span-4 sm:row-span-4",  // Socials viram 4x4
    dribbble: "order-7 sm:col-span-4 sm:row-span-4",// Socials viram 4x4
    tools: "order-8 sm:col-span-8 sm:row-span-5",
    header: "order-9 sm:col-span-12 sm:row-span-5",
    services: "order-10 sm:col-span-8 sm:row-span-6",
    projects: "order-11 sm:col-span-12 sm:row-span-6"
  }
];

// Largura da gaveta, em px. Ela vive FORA do grid, então esse número não
// precisa fechar conta com as 20 colunas.
const DRAWER_W = 525;

// Fallback do respiro entre a gaveta e os cards, só até o gap real do grid ser
// medido. Nada de número chutado aqui: o valor que vale é lido do
// `getComputedStyle` do grid, para a gaveta respeitar o mesmo ritmo de
// espaçamento do resto do layout mesmo se o `sm:gap-4` mudar um dia.
//
// (O respiro vai em `style` inline porque o valor é MEDIDO em runtime —
// não dá para virar classe. O reset `* { margin: 0 }` do index.css hoje
// está dentro de @layer base, então utility de margin voltou a funcionar
// normalmente no JSX; isso aqui é inline por causa do valor dinâmico.)
const DRAWER_GAP_FALLBACK = 16;

// Folga, em px, para separar CLIQUE de ARRASTE. Se o ponteiro andou mais
// que isso entre o pointerdown e o click, foi arraste — e arraste nunca
// troca o layout nem fecha gaveta. 6px absorve o tremor natural da mão
// sem deixar passar um giro de verdade no 360.
const CLICK_SLOP = 6;

// ═══════════════════════════════════════════════════════════════
// CARDS QUE ABREM GAVETA
// ───────────────────────────────────────────────────────────────
// Para cada card e cada preset, de que lado(s) do grid a gaveta
// nasce — sempre o lado que o card ENCOSTA. A forma é consequência,
// não escolha: ela cai do cruzamento de "que lados" com "onde o
// card está na vertical".
//
//   1 lado + card no topo   →  L            1 lado + card no meio  →  T
//   1 lado + card embaixo   →  L invertido  2 lados + card no meio →  H
//
// Ou seja: não existe código de "desenhar um H". Existe o contorno
// da união, e o H aparece sozinho quando há gaveta dos dois lados.
// ═══════════════════════════════════════════════════════════════
const EXPANDABLE = {
  github: {
    label: "Meus sites",
    // Medido no navegador, igual ao phone:
    // 0: cols 1-4   -> já encosta na ESQUERDA, nada a trocar
    // 1: cols 17-20 -> já encosta na DIREITA, nada a trocar
    // 2: cols 13-16, no meio -> troca com mail (1-4, ESQ), mesmo span 4x144
    0: { sides: ["left"] },
    1: { sides: ["right"] },
    2: { sides: ["left"], swapWith: "mail" }
  },
  avatar: {
    label: "Sobre mim",
    // 0: em cima à direita → L      1: em cima à esquerda → L espelhado
    // 2: no MEIO da fileira de socials, sem encostar em borda nenhuma:
    //    troca de lugar com o card de e-mail para alcançar a esquerda → T
    0: { sides: ["right"] },
    1: { sides: ["left"] },
    2: { sides: ["left"], swapWith: "mail" }
  },
  phone: {
    label: "Fale comigo",
    // Medido no navegador, não deduzido:
    // 0: cols 17-20 → já encosta na DIREITA, nada a trocar
    // 1: cols 9-12, no meio → troca com o github (17-20), que é 4x4 igual
    // 2: cols 9-12, no meio → troca com o dribbble (17-20), também 4x4
    // Os parceiros têm exatamente o mesmo span, então a troca não deforma
    // o layout — o Framer anima o vaivém sozinho.
    0: { sides: ["right"] },
    1: { sides: ["right"], swapWith: "github" },
    2: { sides: ["right"], swapWith: "dribbble" }
  },
  dribbble: {
    label: "Como eu trabalho",
    // Medido no navegador (posição em px dentro do grid), não deduzido
    // das classes:
    // 0: no MEIO da fileira de socials → troca com o phone (encosta na
    //    DIREITA), mesmo span 4x3
    // 1: no MEIO também → troca com o github (encosta na DIREITA), 4x4
    // 2: já é o último da fileira, encosta na DIREITA sozinho
    0: { sides: ["right"], swapWith: "phone" },
    1: { sides: ["right"], swapWith: "github" },
    2: { sides: ["right"] }
  },
  projects: {
    label: "Ver tudo",
    // 0: cols 1-12, linhas 9-14 → encosta só na ESQUERDA, no meio      → T
    // 1: cols 1-20, linhas 6-10 → encosta nas DUAS bordas, no meio     → H
    // 2: cols 9-20, linhas 15-20 → encosta na DIREITA, no rodapé       → L invertido
    0: { sides: ["left"] },
    1: { sides: ["left", "right"] },
    2: { sides: ["right"] }
  }
};

const EXPANDABLE_CARDS = Object.keys(EXPANDABLE);

// ═══════════════════════════════════════════════════════════════
// A FORMA RECORTADA — um único <path> SVG por card
// ───────────────────────────────────────────────────────────────
// Em vez de duas divs emendadas com um pseudo-elemento tapando o
// buraco, desenhamos o contorno da UNIÃO card+gavetas como um
// caminho só. Vantagens:
//   • não existe emenda para esconder — é literalmente uma peça;
//   • os degraus ganham canto CÔNCAVO arredondado, coisa que
//     border-radius não sabe fazer;
//   • a borda é um stroke contínuo, sem risco de linha dupla;
//   • dá pra esticar a forma continuamente (é só remedir o path).
//
// São duas etapas independentes, e é isso que deixa geral:
//   1. shapeOutline  → os vértices da união, em polígono retilíneo
//   2. roundedPolygon→ arredonda cada canto conforme ele seja
//                      convexo (raio grande) ou côncavo (raio menor)
//
// Nenhuma das duas sabe o que é "L", "T" ou "H". As formas caem
// de onde as peças estão.
// ═══════════════════════════════════════════════════════════════

// Vértices da união, em sentido HORÁRIO.
//   h = o card (cabeça)      bl / br = gavetas esquerda / direita
// As gavetas são colunas de altura total; qualquer uma pode ser null.
// Os pontos atravessam o gap de propósito: é ele que some na forma.
function shapeOutline(h, bl, br) {
  const P = (x, y) => ({ x, y });
  const hx1 = h.x, hx2 = h.x + h.w, hy1 = h.y, hy2 = h.y + h.h;

  if (bl && br) {
    const l1 = bl.x, l2 = bl.x + bl.w, lt = bl.y, lb = bl.y + bl.h;
    const r1 = br.x, r2 = br.x + br.w, rt = br.y, rb = br.y + br.h;
    return [
      P(l1, lt), P(l2, lt), P(l2, hy1),   // gaveta esq: topo → desce até a barra
      P(r1, hy1), P(r1, rt),              // barra: atravessa → sobe na gaveta dir
      P(r2, rt), P(r2, rb), P(r1, rb),    // gaveta dir: contorno externo
      P(r1, hy2), P(l2, hy2),             // barra de volta
      P(l2, lb), P(l1, lb)                // gaveta esq: base
    ];
  }
  if (br) {
    const b1 = br.x, b2 = br.x + br.w, bt = br.y, bb = br.y + br.h;
    return [
      P(hx1, hy1), P(b1, hy1), P(b1, bt),
      P(b2, bt), P(b2, bb), P(b1, bb),
      P(b1, hy2), P(hx1, hy2)
    ];
  }
  if (bl) {
    const b1 = bl.x, b2 = bl.x + bl.w, bt = bl.y, bb = bl.y + bl.h;
    return [
      P(b1, bt), P(b2, bt), P(b2, hy1),
      P(hx2, hy1), P(hx2, hy2), P(b2, hy2),
      P(b2, bb), P(b1, bb)
    ];
  }
  return [P(hx1, hy1), P(hx2, hy1), P(hx2, hy2), P(hx1, hy2)];
}

// Arredonda os cantos de um polígono retilíneo horário.
//   R = raio dos cantos CONVEXOS (as quinas de fora do card)
//   r = raio dos cantos CÔNCAVOS (os degraus)
//
// Dois filtros fazem o trabalho pesado de graça: vértices repetidos
// e vértices colineares são descartados. É por isso que o mesmo
// código serve para L, T, L invertido e H — quando a gaveta encosta
// rente no topo (ou no rodapé) daquele degrau simplesmente não sobra
// vértice, e a aresta corre reta.
function roundedPolygon(pts, R, r) {
  const n = pts.length;
  const corners = [];

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
    if (l1 < 0.01 || l2 < 0.01) continue;              // vértice repetido

    const cross = v1.x * v2.y - v1.y * v2.x;
    if (Math.abs(cross) < 0.01) continue;              // colinear: não é canto

    // Horário na tela (y para baixo): cross > 0 é convexo.
    const convex = cross > 0;
    const rad = Math.min(convex ? R : r, l1 / 2, l2 / 2);

    corners.push({
      inX: p1.x - (v1.x / l1) * rad, inY: p1.y - (v1.y / l1) * rad,
      outX: p1.x + (v2.x / l2) * rad, outY: p1.y + (v2.y / l2) * rad,
      rad, sweep: convex ? 1 : 0
    });
  }

  if (corners.length < 3) return "";

  let d = `M ${corners[0].inX} ${corners[0].inY}`;
  for (let i = 0; i < corners.length; i++) {
    const c = corners[i], next = corners[(i + 1) % corners.length];
    d += c.rad > 0.01
      ? ` A ${c.rad} ${c.rad} 0 0 ${c.sweep} ${c.outX} ${c.outY}`
      : ` L ${c.outX} ${c.outY}`;
    d += ` L ${next.inX} ${next.inY}`;
  }
  return d + " Z";
}

// Retângulo-alvo de uma gaveta, em coordenadas do grid.
//
// Os clamps não são detalhe. Durante o voo entre presets o card passa
// POR CIMA de onde a gaveta nasce; sem travar, o corpo começaria
// DENTRO da cabeça e os degraus sairiam invertidos. Prendendo o corpo
// na borda da cabeça, a forma só abre conforme ela libera espaço — e o
// "estica" sai de graça disso.
function drawerTarget(h, raw, g, side) {
  const toLeft = side === "left";
  const hNear = toLeft ? h.x : h.x + h.w;           // borda da cabeça virada à gaveta

  if (!raw) return { x: hNear, y: h.y, w: 0, h: h.h };   // colapsada rente à cabeça

  const rx1 = raw.x - g.x, rx2 = rx1 + raw.width;
  const near = toLeft ? Math.min(rx2, hNear) : Math.max(rx1, hNear);
  const far = toLeft ? Math.min(rx1, near) : Math.max(rx2, near);

  // A gaveta é coluna de altura total: nunca pode ser mais curta que a
  // cabeça, senão a união deixa de ter degrau.
  const top = Math.min(raw.y - g.y, h.y);
  const bottom = Math.max(raw.y - g.y + raw.height, h.y + h.h);

  return { x: Math.min(near, far), y: top, w: Math.abs(far - near), h: bottom - top };
}

const lerpBox = (a, b, k) => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  h: a.h + (b.h - a.h) * k
});

export default function BentoGrid({ idioma = "pt" }) {
  // Reconstrói o objeto de conteúdo sempre que o idioma muda — é
  // barato (só junta objetos já prontos, não busca nada) e mantém
  // TODO o resto do arquivo (`profileData.x`, em centenas de lugares)
  // funcionando sem precisar tocar em cada um deles.
  const profileData = montarProfileData(idioma);
  // Atalho pro dicionário de microcopy — `t.hint`, `t.chipFechar`, etc.
  const t = ROTULOS_UI[idioma];

  // Viewport de celular: abaixo de 40rem (o mesmo breakpoint `sm` do
  // grid) ele vira UMA coluna — e aí não existe mais "lado" pro qual a
  // gaveta possa nascer. A gaveta desktop é uma coluna de 525px colada
  // na borda do grid; num telefone de ~390px isso caía inteiro fora da
  // tela, sem scroll horizontal pra alcançar. No celular ela vira um
  // painel de tela cheia (ver renderDrawer).
  const [ehMobile, setEhMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const ler = () => setEhMobile(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);

  // Painel de download do currículo: abre com o idioma do SITE já
  // pré-selecionado (quem está lendo em inglês provavelmente quer o CV
  // em inglês), mas dá pra trocar antes de baixar.
  const [cvAberto, setCvAberto] = useState(false);
  const [cvIdioma, setCvIdioma] = useState(idioma);
  // Posição do painel, medida a partir do botão. Ele é renderizado no
  // <body> por portal, e não dentro do card, porque o card carrega
  // `opacity: .8` — e opacidade vale para a SUBÁRVORE INTEIRA: nenhum
  // filho consegue ser mais opaco que o pai. Dentro dele o painel ficava
  // translúcido e os cards de trás apareciam através do texto.
  const cvBotaoRef = useRef(null);
  const cvPainelRef = useRef(null);
  const [cvPos, setCvPos] = useState({ top: 0, left: 0 });
  // useLayoutEffect (não useEffect): roda depois do painel entrar no DOM
  // mas ANTES de pintar, então dá pra medir a altura real dele e já
  // posicionar certo — com useEffect o painel piscaria no lugar errado.
  React.useLayoutEffect(() => {
    if (!cvAberto) return;
    const FOLGA = 8;
    const medir = () => {
      const b = cvBotaoRef.current?.getBoundingClientRect();
      if (!b) return;
      const p = cvPainelRef.current?.getBoundingClientRect();
      const alturaPainel = p?.height || 180;
      const larguraPainel = p?.width || 176;

      // Abre pra CIMA quando não sobra espaço embaixo — era o caso do
      // preset em que o card do nome fica no rodapé: o painel nascia
      // pra baixo, saía da tela e o botão "Baixar" ficava inalcançável.
      const cabeAbaixo = b.bottom + FOLGA + alturaPainel <= window.innerHeight - FOLGA;
      const top = cabeAbaixo
        ? b.bottom + FOLGA
        : Math.max(FOLGA, b.top - FOLGA - alturaPainel);

      // E não deixa escapar pela direita em tela estreita.
      const left = Math.max(
        FOLGA,
        Math.min(b.left, window.innerWidth - larguraPainel - FOLGA)
      );

      setCvPos({ top, left });
    };
    medir();
    // O grid se move (troca de preset, hover, resize), então a posição
    // precisa acompanhar enquanto o painel estiver aberto.
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [cvAberto]);
  useEffect(() => setCvIdioma(idioma), [idioma]);
  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!cvAberto) return;
    const foraDoPainel = (e) => { if (!e.target.closest(".bento-cv")) setCvAberto(false); };
    const noEsc = (e) => e.key === "Escape" && setCvAberto(false);
    window.addEventListener("pointerdown", foraDoPainel);
    window.addEventListener("keydown", noEsc);
    return () => {
      window.removeEventListener("pointerdown", foraDoPainel);
      window.removeEventListener("keydown", noEsc);
    };
  }, [cvAberto]);

  // Feedback do "copiar e-mail": vira true por 2s e volta sozinho.
  const [emailCopiado, setEmailCopiado] = useState(false);
  const copiarEmailTimer = useRef(null);

  const copiarEmail = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(profileData.email);
    } catch {
      // navegador sem permissão de clipboard (ou http): cai no seletor manual
      const campo = document.createElement("textarea");
      campo.value = profileData.email;
      document.body.appendChild(campo);
      campo.select();
      document.execCommand("copy");
      campo.remove();
    }
    setEmailCopiado(true);
    clearTimeout(copiarEmailTimer.current);
    copiarEmailTimer.current = setTimeout(() => setEmailCopiado(false), 2000);
  };

  useEffect(() => () => clearTimeout(copiarEmailTimer.current), []);
  const [layoutIndex, setLayoutIndex] = useState(0);

  // Qual card está expandido (null | "avatar" | "projects"). Um de cada vez:
  // duas gavetas abertas se sobreporiam na lateral.
  const [openCard, setOpenCard] = useState(null);
  const [draggedSides, setDraggedSides] = useState(new Set());
  const [activeDrawerProject, setActiveDrawerProject] = useState({ left: null, right: null });
  const handleProjectDrop = (side, projectName) => {
    // Adiciona o lado se não estiver aberto
    setDraggedSides(prev => {
      const next = new Set(prev);
      next.add(side);
      return next;
    });

    // Define qual projeto está ativo nesta gaveta. Se o OUTRO lado já
    // estiver mostrando ESTE MESMO projeto (ex.: o card do topo do
    // baralho — sempre o mesmo, já que ele volta pro topo depois de
    // jogado — acaba sendo arrastado duas vezes seguidas, uma pra cada
    // lado), troca por outro projeto qualquer em vez de deixar os dois
    // lados repetindo o mesmo card.
    setActiveDrawerProject(prev => {
      const outroLado = side === "left" ? "right" : "left";
      let nomeFinal = projectName;
      if (prev[outroLado] === projectName) {
        const outro = profileData.projects.find(p => p.name !== projectName);
        if (outro) nomeFinal = outro.name;
      }
      return { ...prev, [side]: nomeFinal };
    });

    if (openCard !== "projects") {
      setOpenCard("projects");
    }
  };

  useEffect(() => {
    if (openCard !== "projects") {
      setDraggedSides(new Set());
    }
  }, [openCard]);

  // Qual site está em exibição na gaveta do card `</>`. Reinicia sempre
  // que a gaveta fecha, pra reabrir do primeiro na próxima vez.
  const [siteIndex, setSiteIndex] = useState(0);
  useEffect(() => {
    if (openCard !== "github") setSiteIndex(0);
  }, [openCard]);

  // Rolar o mouse dentro da gaveta de sites TROCA de card, em vez de
  // rolar uma lista comprida — é a gaveta inteira que pagina, não o
  // conteúdo dela.
  //
  // O debounce (500ms) é o que faz um gesto de trackpad valer UMA troca
  // e não dez: sem ele, o mesmo movimento do dedo dispara dezenas de
  // eventos `wheel` e a gaveta passaria vários sites de uma vez só.
  //
  // Clamp, não módulo: os sites agora são uma COLUNA que desliza (estilo
  // "catálogo Netflix", com o próximo card espiando embaixo), não mais um
  // carrossel que troca de card — então não faz sentido dar a volta do
  // último pro primeiro.
  const ultimaTrocaDeSite = useRef(0);
  const handleWheelSites = (e) => {
    if (profileData.sites.length <= 1) return;
    e.preventDefault();
    const agora = performance.now();
    if (agora - ultimaTrocaDeSite.current < 500) return;
    ultimaTrocaDeSite.current = agora;
    const dir = e.deltaY > 0 ? 1 : -1;
    setSiteIndex((i) => Math.max(0, Math.min(profileData.sites.length - 1, i + dir)));
  };

  // Altura real de UM slot do carrossel (medida no DOM, não um número
  // fixo — cada preset de grid abre a gaveta com um tamanho diferente):
  // é ela que diz o quanto a coluna precisa deslizar pra cima a cada
  // troca de site. Remede sozinho se a janela for redimensionada.
  const sitesTrackRef = useRef(null);
  const sitesItemRef = useRef(null);
  const [sitesStep, setSitesStep] = useState(0);
  useEffect(() => {
    if (openCard !== "github") return;
    const medir = () => {
      if (!sitesItemRef.current || !sitesTrackRef.current) return;
      const itemH = sitesItemRef.current.getBoundingClientRect().height;
      const gap = parseFloat(getComputedStyle(sitesTrackRef.current).rowGap || "0");
      setSitesStep(itemH + gap);
    };
    // O rAF não é enfeite: `medir()` já se protegia de ref nulo, mas o
    // `ro.observe()` não — e observe(null) LANÇA. Rodando dentro de um
    // efeito, essa exceção derruba a árvore inteira do React (foi o que
    // sumia com o grid no celular). O elemento vive na gaveta, que no
    // celular vai para um portal, e aí o ref nem sempre está preenchido
    // quando este efeito passivo roda. Um quadro depois ele já existe.
    let ro;
    const raf = requestAnimationFrame(() => {
      const alvo = sitesTrackRef.current;
      if (!alvo) return;
      medir();
      ro = new ResizeObserver(medir);
      ro.observe(alvo);
    });
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, [openCard]);

  // Onde o ponteiro DESCEU e se desceu numa área interativa. Guardado em
  // ref porque é lido dentro do handler de click sem precisar re-renderizar.
  const pointerDown = useRef({ x: 0, y: 0, inside: false });

  useEffect(() => {
    // Tudo que "engole" o clique em vez de deixá-lo virar troca de layout.
    // A GAVETA entra nessa lista: arrastar o 360 lá dentro não pode fechá-la.
    const INTERACTIVE = '.card-interactable, .modal-content, .bento-drawer';

    // Capture: o OrbitControls do 360 pára a propagação, então sem capture
    // este handler nem chegaria a rodar no arraste dentro do canvas.
    const onPointerDown = (e) => {
      pointerDown.current = {
        x: e.clientX,
        y: e.clientY,
        inside: !!e.target.closest(INTERACTIVE)
      };
    };

    const onClick = (e) => {
      if (e.target.closest(INTERACTIVE)) return;
      if (pointerDown.current.inside) return;

      // ARRASTE ≠ CLIQUE. Girar o 360 e soltar o mouse sobre o fundo
      // dispara um `click`, mas o ponteiro andou dezenas de pixels no
      // caminho — e isso não é um clique no fundo.
      const andou = Math.hypot(
        e.clientX - pointerDown.current.x,
        e.clientY - pointerDown.current.y
      );
      if (andou > CLICK_SLOP) return;

      // Com uma gaveta aberta, o primeiro clique fora apenas fecha ela.
      // Só depois os cliques voltam a girar a roda de layouts.
      if (openCard) { setOpenCard(null); return; }
      setLayoutIndex((prev) => (prev + 1) % LAYOUT_PRESETS.length);
    };

    window.addEventListener('pointerdown', onPointerDown, true);

    // O atraso evita que o próprio clique que ABRIU a gaveta a feche em
    // seguida. O clearTimeout no cleanup é essencial: sem ele, o timeout
    // do efeito anterior ainda dispara e registra um handler com o
    // `openCard` ANTIGO capturado — handler que ninguém remove. Era isso
    // que fazia um clique só fechar a gaveta E trocar o grid ao mesmo tempo.
    const armar = setTimeout(() => window.addEventListener('click', onClick), 100);

    return () => {
      clearTimeout(armar);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('click', onClick);
    };
  }, [openCard]);

  // Trocar de preset fecha a gaveta.
  useEffect(() => { setOpenCard(null); }, [layoutIndex]);

  // Esc fecha a gaveta.
  useEffect(() => {
    if (!openCard) return;
    const onKey = (e) => e.key === "Escape" && setOpenCard(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCard]);

  // Limpa os lados arrastados ao fechar a gaveta
  useEffect(() => {
    if (!openCard) {
      setDraggedSides(new Set());
      setActiveDrawerProject({ left: null, right: null });
    }
  }, [openCard]);

  const cfg = openCard ? EXPANDABLE[openCard][layoutIndex] : null;
  const allowedSides = cfg ? cfg.sides : [];

  let openSides = allowedSides;
  if (openCard === "projects" && draggedSides.size > 0) {
    const active = Array.from(draggedSides).filter(s => allowedSides.includes(s));
    if (active.length > 0) openSides = active;
  }
  // No celular a gaveta cobre a tela inteira, então DOIS lados abertos
  // (caso do Projects no preset 1) viraria um painel em cima do outro,
  // com só o de cima visível. Fica um só.
  if (ehMobile && openSides.length > 1) openSides = openSides.slice(0, 1);

  // O GRID NÃO MUDA de proporções ao abrir uma gaveta — ela nasce FORA dele, e
  // por isso nenhum card é espremido.
  //
  // A ÚNICA exceção é o personagem no preset 2: lá ele fica no MEIO da fileira
  // de socials, sem encostar em borda nenhuma. Aí troca de lugar com o card de
  // e-mail para alcançar a borda esquerda — é só trocar as duas strings, porque
  // o que muda entre elas é o `order`. O Framer anima a troca sozinho.
  const p = React.useMemo(() => {
    const base = LAYOUT_PRESETS[layoutIndex];
    if (!cfg || !cfg.swapWith) return base;
    const other = cfg.swapWith;
    return { ...base, [openCard]: base[other], [other]: base[openCard] };
  }, [layoutIndex, openCard, cfg]);

  // `layout="position"` fica SEMPRE nas cabeças: é o que impede o card de
  // esticar e perder a proporção durante o voo entre presets. O hover só é
  // travado com a gaveta aberta, porque escalar só a cabeça deformaria a forma.
  const headMotion = (card) => ({
    layout: "position",
    ...(openCard === card ? { whileHover: { scale: 1 } } : {})
  });

  // ─────────────────────────────────────────────────────────────
  // O DESENHO DAS FORMAS
  // Um loop de rAF remede os cards a cada frame e reescreve o `d` de
  // cada path. Como ele lê a posição REAL (já com o transform que o
  // Framer aplica), a forma fica colada nos cards em qualquer
  // situação: durante o voo, no hover, no resize. E as gavetas são
  // interpoladas à parte, então ESTICAM para fora da cabeça em vez de
  // aparecer prontas do nada.
  //
  // Repare que o loop não consulta o EXPANDABLE: ele só olha quais
  // elementos de gaveta existem no DOM. Quem decide a forma é o React,
  // montando ou não cada lado.
  // ─────────────────────────────────────────────────────────────
  const gridRef = useRef(null);
  const shapes = useRef({});

  // Registra head / left / right / path de cada card expansível.
  const bind = (card, slot) => (el) => {
    (shapes.current[card] = shapes.current[card] || {})[slot] = el;
  };

  // O respiro da gaveta é o PRÓPRIO gap do grid, lido do computed style em vez
  // de repetido como número. A gaveta encosta na borda do grid, então ela tem
  // que entrar no mesmo ritmo de espaçamento dos cards — se o `sm:gap-4` mudar,
  // ela acompanha sozinha. (O gap também muda de 12px para 16px no breakpoint
  // `sm`, e por isso a leitura roda de novo no resize.)
  const [drawerGap, setDrawerGap] = useState(DRAWER_GAP_FALLBACK);
  useEffect(() => {
    const read = () => {
      if (!gridRef.current) return;
      const g = parseFloat(getComputedStyle(gridRef.current).columnGap);
      if (!Number.isNaN(g)) setDrawerGap(g);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const grid = gridRef.current;
      if (!grid) return;
      const g = grid.getBoundingClientRect();

      for (const card of EXPANDABLE_CARDS) {
        const s = shapes.current[card];
        if (!s || !s.head || !s.path) continue;

        const hr = s.head.getBoundingClientRect();
        const h = { x: hr.x - g.x, y: hr.y - g.y, w: hr.width, h: hr.height };

        const box = {};
        for (const side of ["left", "right"]) {
          const el = s[side];
          const target = drawerTarget(h, el ? el.getBoundingClientRect() : null, g, side);
          const key = side === "left" ? "boxL" : "boxR";
          s[key] = lerpBox(s[key] || target, target, 0.16);   // 0.16 = velocidade do estica
          box[side] = s[key].w >= 2 ? s[key] : null;          // fina demais: nem conta
        }

        s.path.setAttribute("d", roundedPolygon(shapeOutline(h, box.left, box.right), 16, 32));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // As gavetas crescem para fora do container. Agora que o scroll horizontal
  // foi liberado na página (overflowX: auto), o grid NÃO precisa mais se
  // mover (shift) para evitar cortes. O usuário pediu para que a posição fique
  // 100% FIXA e não vá mais "para os lados".

  // Uma gaveta: casca transparente ancorada FORA do grid. Quem a desenha é o
  // path; ela só segura conteúdo e diz ao path onde está.
  //
  // ATENÇÃO à lista de classes: ela NÃO reaproveita a do cardMotion. Aquela
  // começa com `relative`, e `relative` + `absolute` juntas não se resolvem
  // pela ordem no atributo — vale a ordem no CSS gerado, onde o `relative` vem
  // depois e ganha. A gaveta voltaria a ser item do grid e detonaria o
  // auto-placement.
  const renderDrawer = (card, side, content, innerClassName) => {
    const gaveta = (
      <motion.div
        key={`${card}-${side}`}
        // No celular a gaveta NÃO entra na conta da forma recortada: ela
        // deixou de ser um pedaço colado no card (virou painel sobre a
        // tela), então o path do SVG deve desenhar só a cabeça. Sem ref,
        // `drawerTarget` recebe null e é exatamente isso que acontece.
        ref={ehMobile ? null : bind(card, side)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.14, delay: 0 } }}
        // No celular não há forma pra "esperar chegar" — abre na hora.
        transition={ehMobile ? { duration: 0.2 } : { duration: 0.35, delay: 0.28 }}
        style={ehMobile ? undefined : {
          [side === "left" ? "right" : "left"]: `calc(100% + ${drawerGap}px)`,
          width: DRAWER_W
        }}
        className={`bento-drawer${ehMobile ? ' bento-drawer--mobile' : ''}`}
      >
        <div className={`bento-drawer-inner ${innerClassName || 'bento-drawer-pad'}`}>
          {content}
        </div>

        {/* Fecha a gaveta. Fica no canto de FORA — o lado oposto ao card —
            para não cair em cima da emenda entre os dois. No celular não
            existe emenda, então o CSS joga sempre pro canto superior direito. */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpenCard(null); }}
          aria-label={t.chipFechar}
          className={`bento-drawer-close bento-drawer-close--${side}`}
        >
          <X className="bento-drawer-close-icon" />
        </button>
      </motion.div>
    );

    // PORTAL no celular: o grid vive dentro de um wrapper com
    // `perspective: 1200px` (a animação 3D de entrada), e perspective —
    // como transform — cria bloco de contenção para descendentes
    // `position: fixed`. Medido: um `inset: 0` aqui dentro rende
    // 386×746 em vez de cobrir a tela de 386×840. Pendurando no <body>,
    // que não tem nada disso, o `fixed` volta a valer pela viewport.
    //
    // A key vai no GavetaEmPortal porque é ELE o filho direto do
    // AnimatePresence — a key lá dentro do motion.div não conta.
    return ehMobile
      ? <GavetaEmPortal key={`${card}-${side}`}>{gaveta}</GavetaEmPortal>
      : gaveta;
  };

  // Rótulo traduzido de cada chip — EXPANDABLE[card].label fica só em
  // português (é a chave de dados, não o texto exibido); aqui é onde o
  // idioma ativo entra.
  const ROTULO_CHIP_POR_CARD = {
    github: t.chipMeusSites,
    avatar: t.chipSobreMim,
    phone: t.chipFaleComigo,
    projects: t.chipVerTudo,
    dribbble: t.chipComoTrabalho,
  };

  // Chip de affordance. Fica no canto oposto à gaveta para não ser engolido
  // pela emenda, and a seta aponta para onde ela abre.
  const renderChip = (card) => {
    const sides = EXPANDABLE[card][layoutIndex].sides;
    const open = openCard === card;
    const toLeft = sides.length === 1 && sides[0] === "left";
    return (
      <div
        className={`bento-chip ${toLeft ? "right-3" : "left-3"
          }`}
      >
        <ChevronRight
          className={`bento-chip-icon ${open !== toLeft ? "rotate-180" : ""
            }`}
        />
        <span className="bento-chip-label">
          {open ? t.chipFechar : ROTULO_CHIP_POR_CARD[card]}
        </span>
      </div>
    );
  };

  const cardMotion = {
    layout: true,
    whileHover: { scale: 1.02 }, // Substitui o CSS hover para não bugar o framer motion!
    transition: {
      type: "spring",
      bounce: 0.35,      // Elasticidade (0 a 1) - dá o efeito chiclete sem ser exagerado
      duration: 1.2      // 1.2 Segundos de duração! Força a ser muito mais lento e majestoso
    },
    className: "relative overflow-hidden shadow-xl border border-white/5 bg-[#141414] rounded-2xl card-interactable flex items-center justify-center group cursor-pointer opacity-80"
  };

  return (
    <div className="bento-page">
      <div
        className="bento-stage opacity-100 scale-100 pointer-events-auto"
      >
        <p className="bento-hint">
          {t.hint}
        </p>

        {/* GRID 20 COLUNAS com AUTO-FLOW DENSE */}
        <div
          ref={gridRef}
          className="bento-grid"
        >

          {/* A FORMA EM "L" — desenhada como UMA peça só.
              É absoluta, então não ocupa célula do grid. Vem primeiro no DOM
              para ficar atrás dos cards (o avatar e a gaveta são só cascas
              transparentes por cima dela). */}
          <svg
            className="bento-shape-layer lshape-svg"
            aria-hidden="true"
          >
            {EXPANDABLE_CARDS.map((card) => (
              <path key={card} ref={bind(card, "path")}
                fill="#141414" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
          </svg>

          {/* HEADER */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.header} bento-card--header`}>
            {/* Wrapper: é ELE o flex que coloca nome e cargo lado a lado
                (e que vira coluna no card estreito). Precisa existir
                porque um elemento nunca casa com o próprio @container —
                a consulta só alcança descendentes, então não dá pra
                trocar o flex-direction do card por ali. */}
            <div className="bento-header-content">
              <h1 className="bento-header-name">
                {t.saudacao(profileData.name)}
              </h1>
              {/* Cargo e botão na MESMA coluna, pra o botão sentar
                  embaixo do "Desenvolvedor e Designer" — e não embaixo
                  do nome, que é o outro lado da linha. */}
              <div className="bento-header-lado">
                <p className="bento-header-role">{profileData.role}</p>

                {/* Baixar currículo: abre um painelzinho pra escolher o
                    idioma antes de baixar. O stopPropagation é necessário
                    porque o card inteiro está sob o handler global de
                    clique que gira os presets do grid. */}
                <div className="bento-cv" onClick={(e) => e.stopPropagation()}>
              <button
                ref={cvBotaoRef}
                type="button"
                className="bento-cv-botao"
                onClick={() => setCvAberto((v) => !v)}
                aria-expanded={cvAberto}
              >
                <Download className="bento-cv-icone" />
                <span>{t.cvBotao}</span>
              </button>

              {cvAberto && createPortal(
                <div
                  ref={cvPainelRef}
                  className="bento-cv-painel bento-cv"
                  role="group"
                  aria-label={t.cvEscolha}
                  style={{ top: cvPos.top, left: cvPos.left }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="bento-cv-pergunta">{t.cvEscolha}</span>

                  {[["pt", t.cvPortugues], ["en", t.cvIngles]].map(([cod, rotulo]) => (
                    <label
                      key={cod}
                      className={`bento-cv-opcao${cvIdioma === cod ? " esta-ativa" : ""}`}
                    >
                      <input
                        type="radio"
                        name="cv-idioma"
                        value={cod}
                        checked={cvIdioma === cod}
                        onChange={() => setCvIdioma(cod)}
                      />
                      <span>{rotulo}</span>
                    </label>
                  ))}

                  {/* <a download> em vez de botão com script: o próprio
                      navegador cuida do salvamento, e o atributo dá ao
                      arquivo um nome apresentável no computador de quem
                      baixa. */}
                  <a
                    href={CURRICULOS[cvIdioma].arquivo}
                    download={CURRICULOS[cvIdioma].nomeArquivo}
                    className="bento-cv-confirmar"
                    onClick={() => setCvAberto(false)}
                  >
                    <Download className="bento-cv-icone" />
                    <span>{t.cvConfirmar}</span>
                  </a>
                </div>,
                document.body
              )}
                </div>
              </div>
            </div>

            {/* O brilho do hover sangra pra fora do card de propósito
                (right/bottom negativos) e dependia do `overflow-hidden`
                do card pra ser recortado. Como o painel do currículo
                precisa ESCAPAR desse mesmo recorte, o brilho ganhou o
                seu próprio: assim o card libera o overflow sem o brilho
                vazar. */}
            <div className="bento-header-glow-clip" aria-hidden="true">
              <div className="bento-header-glow"></div>
            </div>
          </motion.div>

          {/* AVATAR — gatilho da panorâmica 360 e CABEÇA da forma recortada. */}
          <motion.div
            ref={bind("avatar", "head")}
            {...cardMotion}
            {...headMotion("avatar")}
            onClick={() => setOpenCard((v) => (v === "avatar" ? null : "avatar"))}
            aria-expanded={openCard === "avatar"}
            className={`${cardMotion.className} ${p.avatar} bento-card--avatar lshape-shell`}
          >
            {/* O clip do Canvas 3D perde o raio do lado que emenda na gaveta */}
            <div
              className={`bento-avatar-clip ${openCard === "avatar"
                ? (openSides.includes("left") ? "lshape-clip-l" : "lshape-clip-r")
                : ""
                }`}
            >
              <div className="bento-avatar-stage">
                <Personagem className="bento-avatar-canvas" />
              </div>
            </div>

            {renderChip("avatar")}
          </motion.div>

          {/* Gaveta do avatar com o Visualizador 360 */}
          <AnimatePresence>
            {openCard === "avatar" && openSides.map((side) =>
              renderDrawer("avatar", side, (
                <div className="bento-pano">
                  <div className="bento-pano-head">
                    <span className="bento-pano-title">{t.pano360Titulo}</span>
                    <span className="bento-pano-hint">{t.pano360Dica}</span>
                  </div>
                  <div className="bento-pano-frame">
                    <DelayedMount delay={800}>
                      <PanoramaViewer idioma={idioma} />
                    </DelayedMount>
                  </div>
                </div>
              ))
            )}
          </AnimatePresence>

          {/* SITES — quarto card expansível. Mesma mecânica do avatar/
              projects/phone: casca + SVG desenha a forma + gaveta nasce
              do lado que o card encosta. */}
          <motion.div
            ref={bind("github", "head")}
            {...cardMotion}
            {...headMotion("github")}
            onClick={() => setOpenCard((v) => (v === "github" ? null : "github"))}
            aria-expanded={openCard === "github"}
            className={`${cardMotion.className} ${p.github} bento-sites lshape-shell`}
          >
            <Code2 className="bento-social-icon" strokeWidth={1.5} />
            {renderChip("github")}
          </motion.div>

          {/* Gaveta dos sites: rolar o mouse aqui dentro desce a coluna
              pro próximo site (ver handleWheelSites), deixando a
              pontinha dele espiando embaixo antes de rolar — como o
              catálogo da Netflix. Todos os sites ficam montados o
              tempo todo (não só o atual): é a coluna inteira que
              desliza, cortada pelo overflow:hidden do
              .bento-case-scroll. */}
          <AnimatePresence>
            {openCard === "github" && openSides.map((side) =>
              renderDrawer("github", side, (
                <div
                  className={`bento-case-scroll${ehMobile ? ' bento-case-scroll--rolavel' : ''}`}
                  // No celular a paginação sai de cena: `wheel` é evento de
                  // MOUSE, um dedo nunca dispara — era por isso que o
                  // segundo site ficava inalcançável (medido: 1304px de
                  // conteúdo dentro de 814px de altura, com overflow
                  // escondido). Lá o scroll nativo do toque assume.
                  onWheel={ehMobile ? undefined : handleWheelSites}
                >
                  <motion.div
                    ref={sitesTrackRef}
                    className="bento-case-track"
                    // Sem deslocamento no celular: quem rola é o container
                    // acima. Manter o transform aqui brigaria com ele.
                    animate={{ y: ehMobile ? 0 : -siteIndex * sitesStep }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {profileData.sites.map((site, i) => (
                      <div
                        key={site.nome}
                        ref={i === 0 ? sitesItemRef : null}
                        className="bento-case-track-item"
                      >
                        <SiteCase site={site} idioma={idioma} />
                      </div>
                    ))}
                  </motion.div>

                  {/* Só aparece quando há mais de um site: com um só,
                      não existe "role para trocar". No celular some — o
                      indicador de página não faz sentido quando a lista
                      inteira rola de uma vez. */}
                  {!ehMobile && profileData.sites.length > 1 && (
                    <div className="bento-case-pager" aria-hidden="true">
                      <div className="bento-case-pager-dots">
                        {profileData.sites.map((site, i) => (
                          <span
                            key={site.nome}
                            className={`bento-case-pager-dot ${i === siteIndex ? 'esta-ativo' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ), 'bento-drawer-flush')
            )}
          </AnimatePresence>

          {/* PROCESSO — quinto card expansível. Era um <a href="#"> sem
              destino; virou casca + gaveta, mesma mecânica dos outros. */}
          <motion.div
            ref={bind("dribbble", "head")}
            {...cardMotion}
            {...headMotion("dribbble")}
            onClick={() => setOpenCard((v) => (v === "dribbble" ? null : "dribbble"))}
            aria-expanded={openCard === "dribbble"}
            className={`${cardMotion.className} ${p.dribbble} bento-work lshape-shell`}
          >
            <ClipboardList className="bento-social-icon" strokeWidth={1.5} />
            {renderChip("dribbble")}
          </motion.div>

          {/* Gaveta do processo: as etapas numeradas de como eu trabalho. */}
          <AnimatePresence>
            {openCard === "dribbble" && openSides.map((side) =>
              renderDrawer("dribbble", side, (
                <div className="bento-processo">
                  <div className="bento-pano-head">
                    <span className="bento-pano-title">{t.processoTitulo}</span>
                    <span className="bento-pano-hint">{t.processoDica}</span>
                  </div>
                  <ol className="bento-processo-lista">
                    {t.processoEtapas.map((etapa, i) => (
                      <li key={etapa.titulo} className="bento-processo-item">
                        <span className="bento-processo-num" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="bento-processo-corpo">
                          <h3 className="bento-processo-titulo">{etapa.titulo}</h3>
                          <p className="bento-processo-texto">{etapa.texto}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))
            )}
          </AnimatePresence>

          {/* LOCALIZAÇÃO. No preset 2 o card é grande e mostra a cidade
              escrita; nos outros ele é pequeno e a cidade vem no balão. */}
          <motion.a
            {...cardMotion}
            href={profileData.mapa}
            target="_blank"
            rel="noreferrer"
            className={`${cardMotion.className} ${p.location} bento-place hover:bg-[#1a1a1a]`}
            aria-label={t.mapaVer(profileData.cidade, profileData.estado)}
          >
            {layoutIndex === 2 ? (
              <>
                <div className="bento-map-scrim"></div>
                <div className="bento-map-content">
                  <MapPin className="bento-map-pin" strokeWidth={1.5} />
                  <span className="bento-map-label">{profileData.cidade}</span>
                </div>
              </>
            ) : (
              <>
                <MapPin className="bento-social-icon" strokeWidth={1.5} />
                <span className="bento-place-tip" aria-hidden="true">
                  <span className="bento-place-tip-city">{profileData.cidade}</span>
                  <span className="bento-place-tip-state">{profileData.estado}</span>
                </span>
              </>
            )}
          </motion.a>

          {/* E-MAIL: o card inteiro abre o cliente de e-mail; o botãozinho
              no canto copia o endereço sem sair da página. */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.mail} bento-mail hover:bg-[#1a1a1a]`}>
            <a
              href={`mailto:${profileData.email}`}
              className="bento-mail-link"
              aria-label={t.mailEnviarPara(profileData.email)}
            >
              <Mail className="bento-social-icon" strokeWidth={1.5} />
            </a>

            <button
              type="button"
              onClick={copiarEmail}
              className="bento-mail-copy"
              aria-label={t.mailCopiarEndereco(profileData.email)}
            >
              {emailCopiado ? <Check className="bento-mail-copy-icon" /> : <Copy className="bento-mail-copy-icon" />}
            </button>

            <span className="bento-mail-tip" aria-hidden="true">
              {emailCopiado ? t.mailCopiado : profileData.email}
            </span>
          </motion.div>

          {/* CELULAR — terceiro card expansível. Mesma mecânica do avatar e
              do projects: o card vira casca, o SVG desenha a forma, e a
              gaveta nasce do lado que ele encosta. */}
          <motion.div
            ref={bind("phone", "head")}
            {...cardMotion}
            {...headMotion("phone")}
            onClick={() => setOpenCard((v) => (v === "phone" ? null : "phone"))}
            aria-expanded={openCard === "phone"}
            className={`${cardMotion.className} ${p.phone} bento-phone lshape-shell`}
          >
            <Smartphone className="bento-social-icon" strokeWidth={1.5} />
            {renderChip("phone")}
          </motion.div>

          {/* Gaveta do celular: o iPhone 3D girando com o botão na tela. */}
          <AnimatePresence>
            {openCard === "phone" && openSides.map((side) =>
              renderDrawer("phone", side, (
                <div className="bento-fone">
                  <div className="bento-pano-head">
                    <span className="bento-pano-title">{t.panoCartaoTitulo}</span>
                    <span className="bento-pano-hint">{t.panoCartaoDica}</span>
                  </div>
                  <div className="bento-fone-palco">
                    <DelayedMount delay={400}>
                      <IphoneContato
                        whatsapp={profileData.whatsapp}
                        mensagem={t.whatsappMensagemInicial}
                        titulo={t.iphoneTitulo}
                        textoBotao={t.iphoneTextoBotao}
                        textoCarregando={t.iphoneCarregando}
                        mensagensChat={t.iphoneMensagensChat}
                      />
                    </DelayedMount>
                  </div>
                </div>
              ))
            )}
          </AnimatePresence>

          {/* PROJECTS — segundo card expansível. Mesma mecânica do avatar:
              vira casca, o SVG desenha, e a gaveta nasce do lado que ele
              encosta. Aqui o clique ABRE A GAVETA; quem abre o modal passou a
              ser a setinha, que era o único jeito de ter as duas ações. */}
          <motion.div
            ref={bind("projects", "head")}
            {...cardMotion}
            {...headMotion("projects")}
            onClick={() => setOpenCard((v) => (v === "projects" ? null : "projects"))}
            aria-expanded={openCard === "projects"}
            className={`${cardMotion.className} ${p.projects} bento-card--projects lshape-shell`}
          >
            {openCard === "projects" ? (
              <div className="bento-projects-nav" onClick={e => e.stopPropagation()}>
                <div className="bento-projects-titles">
                  <h2 className="bento-projects-title">{t.projectsTituloLinha1}<br />{t.projectsTituloLinha2}</h2>
                  <span className="bento-projects-sub">{ehMobile ? t.projectsSubMobile : t.projectsSub}</span>
                </div>
              </div>
            ) : (
              <div className="bento-projects-head">
                <h2 className="bento-projects-title">{t.projectsTituloLinha1}<br />{t.projectsTituloLinha2}</h2>
                <span className="bento-projects-sub">{ehMobile ? t.projectsSubMobile : t.projectsSub}</span>
              </div>
            )}

            {/* Mini-cards arrastáveis dos projetos — empilhados como um deck */}
            <div className="bento-deck">
              <div className="bento-deck-area">
                {profileData.projects.map((proj, i, arr) => {
                  // Stack mais espaçado e bagunçado
                  const total = arr.length;
                  const mid = (total - 1) / 2;
                  const offsetX = (i - mid) * 12 + (i % 2 === 0 ? 4 : -4);
                  const offsetY = (i - mid) * -5 + (i % 2 === 0 ? -2 : 2);
                  const rot = (i - mid) * 5 + (i % 2 === 0 ? -4 : 4);
                  return (
                    <DraggableCard
                      key={proj.name}
                      title={proj.name}
                      tag={proj.tag}
                      year={proj.year}
                      // `thumb` explícito (quando existe, ex.: Mili) tem
                      // prioridade; senão cai na regra padrão — sempre a
                      // PRIMEIRA foto de `imagens` vira a thumb do
                      // cardzinho automaticamente, sem precisar cadastrar
                      // capa separada. Projetos sem `imagens`/`thumb` (ou
                      // cujo 1º item é vídeo, não foto) caem no ícone
                      // placeholder — só string vira <img>.
                      imageUrl={proj.thumb || (typeof proj.imagens?.[0] === "string" ? proj.imagens[0] : undefined)}
                      initialX={offsetX}
                      initialY={offsetY}
                      rotation={rot}
                      // `total - 1 - i`, não `i`: o z-index do card (em
                      // DraggableTag) é `20000 + stackIndex` — MAIOR
                      // número fica NA FRENTE. Com `i` puro, o ÚLTIMO
                      // item da lista (maior índice) que aparecia na
                      // frente da pilha, não o primeiro — contrário do
                      // que o array sugere. Invertido aqui, o primeiro
                      // projeto da lista é sempre o card visível no topo.
                      stackIndex={total - 1 - i}
                      totalCards={total}
                      allowedSides={EXPANDABLE["projects"][layoutIndex]?.sides || []}
                      onDrop={(side) => handleProjectDrop(side, proj.name)}
                      onClick={(simulateThrow) => {
                        const allowed = EXPANDABLE["projects"][layoutIndex]?.sides || [];
                        // Se houver mais de um lado permitido, alterna entre eles usando o index
                        const sideToOpen = allowed.length > 1 ? allowed[i % allowed.length] : (allowed[0] || "left");

                        // Executa a animação física de "jogar" o card para o lado certo
                        simulateThrow(sideToOpen);

                        // Abre a gaveta e faz o scroll
                        handleProjectDrop(sideToOpen, proj.name);
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {renderChip("projects")}
          </motion.div>

          {/* Gavetas do Projects. No preset 1 são DUAS (uma de cada lado) — é
              disso que nasce o "H", sem nenhum código específico para ele. */}
          <AnimatePresence>
            {openCard === "projects" && (() => {
              // Resolve os DOIS lados de uma vez (não cada um isolado):
              // calcular o padrão de um lado sem saber o que o outro já
              // recebeu é o que causava os dois mostrando "Payandeh"
              // juntos (ex.: abrindo os dois lados sem arrastar nada
              // ainda, ambos caíam no mesmo primeiro projeto da lista).
              const nomesResolvidos = {};
              const usados = new Set();
              openSides.forEach((side) => {
                const nome = activeDrawerProject[side];
                if (nome && profileData.projects.some(p => p.name === nome)) {
                  nomesResolvidos[side] = nome;
                  usados.add(nome);
                }
              });
              openSides.forEach((side) => {
                if (!nomesResolvidos[side]) {
                  const proximo = profileData.projects.find(p => !usados.has(p.name)) || profileData.projects[0];
                  nomesResolvidos[side] = proximo?.name;
                  usados.add(nomesResolvidos[side]);
                }
              });

              return openSides.map((side) => {
                const proj = profileData.projects.find(p => p.name === nomesResolvidos[side]) || profileData.projects[0];

                // Vira card de projeto no formato que o SiteCase espera.
                const paraCase = (pr) => ({
                  nome: pr.name,
                  tag: pr.tag,
                  year: pr.year,
                  descricao: pr.descricao || t.descricaoEmBreve,
                  link: pr.link,
                  imagens: pr.imagens || [],
                });

                return renderDrawer("projects", side, (
                  <div
                    id={`drawer-projects-${side}`}
                    className={`bento-case-scroll${ehMobile ? ' bento-case-scroll--rolavel' : ''}`}
                  >
                    {ehMobile ? (
                      // CELULAR: lista TODOS os projetos, um embaixo do
                      // outro, com rolagem nativa. No desktop quem escolhe
                      // qual projeto aparece é o arraste dos mini-cards do
                      // baralho para as laterais — gesto que não existe no
                      // toque, e que deixava a gaveta presa num projeto só,
                      // sem nenhuma forma de chegar nos outros.
                      <div className="bento-case-track">
                        {profileData.projects.map((pr) => (
                          <div key={pr.name} className="bento-case-track-item">
                            <SiteCase variant="poster" idioma={idioma} site={paraCase(pr)} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        {/* Mesmo componente da gaveta de Sites (carrossel de
                          fotos + tag/título/descrição) — reaproveitado aqui
                          porque é exatamente o mesmo formato de card. Projetos
                          sem `imagens` (os placeholders ainda não preenchidos)
                          caem sozinhos no estado "Em construção" do SiteCase. */}
                        <motion.div
                          key={proj.name}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="bento-case-single"
                        >
                          <SiteCase variant="poster" idioma={idioma} site={paraCase(proj)} />
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                ), 'bento-drawer-flush'); // sem respiro: o scroll cola nas bordas da gaveta
              });
            })()}
          </AnimatePresence>

          {/* SERVICES */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.services} bento-card--static bento-card--services`}>
            <h2 className="bento-services-label">{t.servicesTitulo}</h2>
            <div className="bento-services-area">
              {profileData.services.map((servico) => (
                <span key={servico} className="bento-service-chip">
                  {servico}
                </span>
              ))}
            </div>
          </motion.div>

          {/* TOOLS */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.tools} bento-card--static bento-card--stack bento-card--tools`}>
            <h2 className="bento-tools-label">{t.toolsTitulo}</h2>
            <div className="bento-tools-grid">
              {profileData.tools.map((tool) => (
                <div
                  key={tool.name}
                  className="bento-tool"
                  tabIndex={0}
                  aria-label={`${tool.name}: ${t.nivelLabel} ${tool.nivel}`}
                >
                  {/* O quadradinho colorido virou um elemento PRÓPRIO: a
                      célula agora empilha ícone + nível, então quem carrega
                      o fundo/borda/proporção quadrada é ele, não a célula. */}
                  <span className="bento-tool-quadro">
                    <span className="bento-tool-text" style={{ color: tool.cor }}>
                      {tool.sigla}
                    </span>
                  </span>

                  {/* Nível SEMPRE visível, embaixo do ícone. */}
                  <span className="bento-tool-nivel">{tool.nivel}</span>

                  {/* Balão de hover — continua existindo porque é o único
                      lugar onde cabe o nome COMPLETO da ferramenta
                      ("DaVinci Resolve" não caberia embaixo do quadradinho).
                      Some por opacity, não por display, para poder animar; é
                      aria-hidden porque o aria-label da célula já diz o mesmo. */}
                  <span className="bento-tool-tip" aria-hidden="true">
                    <span className="bento-tool-tip-name">{tool.name}</span>
                    <span className="bento-tool-tip-level">{tool.nivel}</span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CREDENCIAIS — certificados, formação e áreas de estudo.
              Ocupa o slot `collab` do grid (mesma posição/tamanho de antes).

              Chips + balão de hover, mesmo padrão do Services/Tools: era
              uma lista de 2 colunas com bullet + nome em negrito + detalhe
              embaixo, e ficou "poluído" — 6 blocos de 2 linhas competindo
              por atenção. Com chip só do título e o detalhe (instituição/
              status) no hover, sobra o mesmo tanto de informação com uma
              fração da densidade visual. */}
          <motion.div {...cardMotion} className={`${cardMotion.className} ${p.collab} bento-card--static bento-card--stack bento-credentials`}>
            <h2 className="bento-credentials-title">{t.credenciaisTitulo}</h2>
            <div className="bento-credentials-list">
              {profileData.credenciais.map((c) => (
                <span
                  key={c.titulo}
                  className="bento-credentials-chip"
                  tabIndex={0}
                  aria-label={`${c.titulo}: ${c.detalhe}`}
                >
                  {c.titulo}
                  <span className="bento-credentials-tip" aria-hidden="true">{c.detalhe}</span>
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
