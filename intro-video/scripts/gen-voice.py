"""Generates the Portuguese voice-over lines as WAVs with an offline neural TTS.

Requires: pip install sherpa-onnx numpy
Voice models (Piper, converted by sherpa-onnx), downloaded + extracted into VOICES_DIR:
  https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-dii-high.tar.bz2   (feminina)
  https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-faber-medium.tar.bz2 (masculina)

Optional: WHISPER_DIR=<sherpa-onnx-whisper-small dir> makes it generate several takes per
line and keep the one whose transcript best matches the intended text.
  https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2

Usage: python3 scripts/gen-voice.py <VOICES_DIR> [dii-high|faber-medium]
Writes public/vo/line_<i>_<hash>.wav and src/vo.json (start frame + duration of each line).
"""
import difflib, hashlib, json, os, re, sys, unicodedata, wave
import numpy as np
import sherpa_onnx

FPS = 30
# (start in seconds, text). Spelling is phonetic where the TTS needs help:
# "Uébi Búst" is read like "WebBoost", "dizáin" like "design", "Gúgol" like "Google".
LINES = [
    (0.35, "Sites que trabalham por você.", "sites que trabalham por você"),
    (2.7, "Com um dizáin que converte.", "com um design que converte"),
    (5.3, "Seu negócio, a um clique dos clientes.", "seu negócio a um clique dos clientes"),
    (8.3, "Do dizáin ao código, criamos tudo sob medida.", "do design ao código criamos tudo sob medida"),
    (12.8, "Rápido, seguro, e otimizado para o Gúgol.", "rápido seguro e otimizado para o google"),
    (16.3, "Perfeito no celular, no táblet e no computador.", "perfeito no celular no tablet e no computador"),
    (20.3, "Uébi Búst.", "webboost"),
    (21.5, "Sites que impulsionam, resultados.", "sites que impulsionam resultados"),
    (23.8, "Peça já o seu orçamento!", "peça já o seu orçamento"),
]

voices_dir = sys.argv[1]
voice = sys.argv[2] if len(sys.argv) > 2 else "dii-high"
speed = float(os.environ.get("VO_SPEED", "1.0"))
d = os.path.join(voices_dir, f"vits-piper-pt_BR-{voice}")
cfg = sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(
            model=f"{d}/pt_BR-{voice}.onnx",
            tokens=f"{d}/tokens.txt",
            data_dir=f"{d}/espeak-ng-data",
            noise_scale=0.5,
            length_scale=1.0,
        ),
        num_threads=4,
    )
)
tts = sherpa_onnx.OfflineTts(cfg)

root = os.path.join(os.path.dirname(__file__), "..")
out_dir = os.path.join(root, "public", "vo")
os.makedirs(out_dir, exist_ok=True)
for old in os.listdir(out_dir):
    os.remove(os.path.join(out_dir, old))
asr = None
if os.environ.get("WHISPER_DIR"):
    w = os.environ["WHISPER_DIR"]
    asr = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=f"{w}/small-encoder.int8.onnx", decoder=f"{w}/small-decoder.int8.onnx",
        tokens=f"{w}/small-tokens.txt", language="pt", task="transcribe", num_threads=4)


def norm(t):
    t = unicodedata.normalize("NFKD", t.lower())
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return re.sub(r"[^a-z ]", "", t.replace("web boost", "webboost")).split()


def score(samples, sr, target):
    st = asr.create_stream()
    st.accept_waveform(sr, samples)
    asr.decode_stream(st)
    heard = st.result.text
    return difflib.SequenceMatcher(None, norm(heard), norm(target)).ratio(), heard


meta = []
takes = int(os.environ.get("VO_TAKES", "8")) if asr else 1
for i, (start, text, target) in enumerate(LINES):
    best = None
    for k in range(takes):
        a = tts.generate(text, sid=0, speed=speed)
        x = np.array(a.samples, dtype=np.float32)
        if not asr:
            best = (1.0, "", a, x)
            break
        sc, heard = score(x, a.sample_rate, target)
        if best is None or sc > best[0]:
            best = (sc, heard, a, x)
        if sc == 1.0:
            break
    sc, heard, a, x = best
    if asr:
        print(f"   take score {sc:.2f}: {heard}")
    # trim leading/trailing silence
    idx = np.where(np.abs(x) > 0.01)[0]
    x = x[max(0, idx[0] - 200): idx[-1] + 2000]
    x = x / (np.abs(x).max() + 1e-9) * 0.89
    # short fades against clicks
    f = int(a.sample_rate * 0.01)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    pcm = (x * 32767).astype(np.int16).tobytes()
    # content hash in the name so renderers never serve a stale cached take
    name = f"line_{i}_{hashlib.sha1(pcm).hexdigest()[:8]}.wav"
    with wave.open(os.path.join(out_dir, name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(a.sample_rate)
        w.writeframes(pcm)
    dur = len(x) / a.sample_rate
    meta.append({"file": f"vo/{name}", "from": round(start * FPS), "frames": int(np.ceil(dur * FPS)), "text": target})
    print(f"{i} start {start:5.2f}s dur {dur:4.2f}s end {start + dur:5.2f}s  {text}")

with open(os.path.join(root, "src", "vo.json"), "w") as fh:
    json.dump({"voice": voice, "lines": meta}, fh, ensure_ascii=False, indent=2)
