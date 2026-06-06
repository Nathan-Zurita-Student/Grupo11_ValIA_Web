'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, RotateCcw, Check, Loader2, AlertCircle, Sparkles, ScanLine } from 'lucide-react';

// ── Extrai data AAAA-MM-DD de texto bruto de OCR ─────────────────────────────
function parseDate(text) {
  // Normaliza erros comuns de OCR: O→0, l/I→1, S→5, B→8
  const t = text
    .replace(/[oO]/g, '0')
    .replace(/[lI|]/g, '1')
    .replace(/S(?=\d|\s)/g, '5')
    .replace(/B(?=\d|\s)/g, '8');

  const patterns = [
    // Com palavra-chave
    /(?:val(?:idade)?|venc(?:imento)?|best\s*before|use\s*by|exp(?:iry|ires)?)[^\d]{0,6}(\d{1,2})[\/.\- ](\d{1,2})[\/.\- ](\d{2,4})/gi,
    // DD/MM/YYYY ou D/M/YYYY
    /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g,
    // MM/YYYY
    /\b(\d{2})[\/.\-](20\d{2})\b/g,
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(t)) !== null) {
      if (m.length === 4) {
        let [, dd, mm, yyyy] = m;
        if (yyyy.length === 2) yyyy = `20${yyyy}`;
        const d = Number(dd), mo = Number(mm), y = Number(yyyy);
        if (y < 2024 || y > 2040) continue;
        if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31)
          return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
        if (d >= 1 && d <= 12 && mo >= 1 && mo <= 31)
          return `${yyyy}-${dd.padStart(2,'0')}-${mm.padStart(2,'0')}`;
      } else if (m.length === 3) {
        const [, mm, yyyy] = m;
        const lastDay = new Date(Number(yyyy), Number(mm), 0).getDate();
        return `${yyyy}-${mm.padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
      }
    }
  }
  return null;
}

// ── Preprocessamento: escala de cinza + threshold adaptativo ─────────────────
function toBlackWhite(src, blockSize = 15, C = 8) {
  const dst = document.createElement('canvas');
  dst.width = src.width;
  dst.height = src.height;
  const ctx = dst.getContext('2d');
  ctx.drawImage(src, 0, 0);

  const img = ctx.getImageData(0, 0, dst.width, dst.height);
  const d = img.data;
  const w = dst.width, h = dst.height;

  // Converte para grayscale in-place
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    d[i] = d[i+1] = d[i+2] = g;
  }

  // Threshold adaptativo: compara cada pixel com a média local
  const half = Math.floor(blockSize / 2);
  const out = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            sum += d[(ny * w + nx) * 4];
            count++;
          }
        }
      }
      const mean = sum / count;
      const pixel = d[(y * w + x) * 4] < mean - C ? 0 : 255;
      const idx = (y * w + x) * 4;
      out[idx] = out[idx+1] = out[idx+2] = pixel;
      out[idx+3] = 255;
    }
  }

  ctx.putImageData(new ImageData(out, w, h), 0, 0);
  return dst;
}

// Escala para resolução ideal para OCR (mín 1200px de largura)
function scaleUp(src, minW = 1200) {
  if (src.width >= minW) return src;
  const scale = minW / src.width;
  const dst = document.createElement('canvas');
  dst.width = Math.round(src.width * scale);
  dst.height = Math.round(src.height * scale);
  dst.getContext('2d').drawImage(src, 0, 0, dst.width, dst.height);
  return dst;
}

// Recorta uma faixa horizontal do canvas
function cropStrip(src, startRatio, endRatio) {
  const y0 = Math.floor(src.height * startRatio);
  const y1 = Math.floor(src.height * endRatio);
  const dst = document.createElement('canvas');
  dst.width = src.width;
  dst.height = y1 - y0;
  dst.getContext('2d').drawImage(src, 0, y0, src.width, y1 - y0, 0, 0, src.width, y1 - y0);
  return dst;
}

// ── OCR com Tesseract — 3 passagens focadas ──────────────────────────────────
async function runTesseract(canvas, onProgress) {
  const { default: Tesseract } = await import('tesseract.js');

  const logger = (m) => {
    if (m.status === 'recognizing text')
      onProgress(`OCR local... ${Math.round(m.progress * 100)}%`);
  };

  // Tenta: imagem toda (PSM 11), faixa inferior (PSM 6), faixa superior (PSM 6)
  const attempts = [
    { img: scaleUp(canvas),                    psm: 11 },
    { img: scaleUp(cropStrip(canvas, 0.55, 1)), psm: 6  },
    { img: scaleUp(cropStrip(canvas, 0.0, 0.45)), psm: 6 },
  ];

  for (const { img, psm } of attempts) {
    try {
      const { data } = await Tesseract.recognize(img, 'por+eng', {
        tessedit_char_whitelist: '0123456789/.-: VALIDEvalide',
        tessedit_pageseg_mode: psm,
        logger,
      });
      const date = parseDate(data.text || '');
      if (date) return date;
    } catch { /* próxima tentativa */ }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CameraCapture({ onDateDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [phase, setPhase] = useState('starting');
  const [camError, setCamError] = useState('');
  const [preview, setPreview] = useState(null);
  const [detected, setDetected] = useState(null);
  const [ocrLog, setOcrLog] = useState('');
  const [usedAI, setUsedAI] = useState(false);

  useEffect(() => {
    startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCamError('');
    setPhase('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPhase('camera');
    } catch {
      setCamError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      setPhase('error');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0);
    stopCamera();
    setPreview(canvas.toDataURL('image/jpeg', 0.95));
    runOCR(canvas);
  }

  async function runOCR(canvas) {
    setPhase('processing');
    setUsedAI(false);

    // ── 1. Tenta via IA no backend ─────────────────────────────────────────
    setOcrLog('Analisando com inteligência artificial...');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('valia:token') : null;
      const imageData = canvas.toDataURL('image/jpeg', 0.88);
      const res = await fetch('/api/vision/extract-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (res.ok) {
        const { date } = await res.json();
        if (date) {
          setDetected(date);
          setUsedAI(true);
          setOcrLog('Data identificada pela IA!');
          setPhase('result');
          return;
        }
        // IA respondeu mas não encontrou — cai no Tesseract
      }
    } catch { /* cai no Tesseract */ }

    // ── 2. Fallback: Tesseract local com preprocessamento avançado ─────────
    setOcrLog('Processando localmente...');
    try {
      const date = await runTesseract(canvas, setOcrLog);
      setDetected(date);
      setOcrLog(date ? 'Data encontrada!' : 'Não foi possível identificar a data.');
    } catch {
      setDetected(null);
      setOcrLog('Falha no processamento da imagem.');
    }
    setPhase('result');
  }

  function retake() {
    setPreview(null);
    setDetected(null);
    setOcrLog('');
    setUsedAI(false);
    startCamera();
  }

  function confirm() {
    if (detected) onDateDetected(detected);
    onClose();
  }

  function fmtDate(iso) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-medium text-white/80">
          {phase === 'camera' && 'Aponte para a data de validade'}
          {phase === 'processing' && 'Analisando...'}
          {phase === 'result' && (detected ? 'Data encontrada' : 'Não identificado')}
          {phase === 'starting' && 'Iniciando câmera...'}
          {phase === 'error' && 'Erro de câmera'}
        </p>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {(phase === 'starting' || phase === 'camera') && (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        )}

        {preview && phase !== 'camera' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Foto capturada" className="h-full w-full object-contain" />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Guia de enquadramento */}
        {phase === 'camera' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="relative h-20 w-72 rounded-lg border-2 border-white/60">
              <span className="absolute -left-px -top-px h-5 w-5 border-l-2 border-t-2 border-brand-400 rounded-tl" />
              <span className="absolute -right-px -top-px h-5 w-5 border-r-2 border-t-2 border-brand-400 rounded-tr" />
              <span className="absolute -bottom-px -left-px h-5 w-5 border-b-2 border-l-2 border-brand-400 rounded-bl" />
              <span className="absolute -bottom-px -right-px h-5 w-5 border-b-2 border-r-2 border-brand-400 rounded-br" />
              {/* Linha de scan animada */}
              <span className="absolute left-0 h-px w-full bg-brand-400/60 animate-[scan_2s_ease-in-out_infinite]"
                style={{ top: '50%' }} />
            </div>
            <p className="text-xs font-medium text-white/70">centralize a data de validade aqui</p>
          </div>
        )}

        {phase === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/10 px-10 py-8 backdrop-blur">
              <div className="relative">
                <Loader2 size={40} className="animate-spin text-brand-400" />
                <Sparkles size={16} className="absolute -right-1 -top-1 text-yellow-400" />
              </div>
              <p className="text-sm font-medium text-white text-center max-w-[180px]">{ocrLog}</p>
            </div>
          </div>
        )}

        {phase === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 size={32} className="animate-spin text-white/60" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 px-6 py-6">
        {phase === 'camera' && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={capture}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition active:scale-90"
            >
              <Camera size={28} className="text-brand-600" />
            </button>
            <p className="text-xs text-white/50">toque para capturar</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm text-white/80">{camError}</p>
            <button
              onClick={() => { stopCamera(); onClose(); }}
              className="rounded-2xl bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/20"
            >
              Fechar
            </button>
          </div>
        )}

        {phase === 'result' && (
          <div className="w-full max-w-sm space-y-3">
            {detected ? (
              <div className="flex items-center gap-3 rounded-2xl bg-brand-600/90 px-5 py-4 backdrop-blur">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  {usedAI ? <Sparkles size={18} className="text-yellow-300" /> : <ScanLine size={18} className="text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-brand-200">
                    {usedAI ? 'Identificada pela IA' : 'Identificada por OCR'}
                  </p>
                  <p className="font-display text-2xl font-semibold text-white">{fmtDate(detected)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white">Data não encontrada</p>
                  <p className="mt-0.5 text-xs text-white/60">{ocrLog || 'Tente aproximar mais a câmera da data.'}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={retake}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                <RotateCcw size={16} /> Tentar novamente
              </button>
              {detected && (
                <button
                  onClick={confirm}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <Check size={16} /> Usar esta data
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
