let selectedBg = 'images/bg1.jpg';
let message = '';
let textColor = '#ffffff';
let textSize = 48;
let recordedBlob = null;

// Step navigation
document.querySelectorAll('.bg-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.bg-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    selectedBg = el.dataset.bg;
  });
});

document.getElementById('next1').onclick = () => showStep(2);
document.getElementById('back2').onclick = () => showStep(1);
document.getElementById('next2').onclick = () => {
  message = document.getElementById('message').value.trim() || 'Buon Natale!';
  textColor = document.getElementById('textColor').value;
  textSize = parseInt(document.getElementById('textSize').value);
  showStep(3);
  drawPreview();
};
document.getElementById('back3').onclick = () => showStep(2);

function showStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + n).classList.add('active');
}

// Canvas preview
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const videoEl = document.getElementById('previewVideo');

function drawPreview() {
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawText();
    drawSnowParticles(0);
    drawChristmasLights(0);
  };
  img.src = selectedBg;
}

function drawText() {
  ctx.fillStyle = textColor;
  ctx.font = `bold ${textSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = wrapText(ctx, message, canvas.width * 0.85);
  const lineHeight = textSize * 1.3;
  const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });
}

// Better snow system
const snowflakes = Array.from({length: 80}, () => ({
  x: Math.random() * 720,
  y: Math.random() * 1280,
  r: Math.random() * 3 + 1,
  speed: Math.random() * 1.5 + 0.5,
  drift: Math.random() * 0.5 - 0.25
}));

function drawSnowParticles(frame) {
  snowflakes.forEach(s => {
    s.y = (s.y + s.speed) % canvas.height;
    s.x = (s.x + s.drift + Math.sin(frame * 0.01 + s.y) * 0.3) % canvas.width;
    
    ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Christmas lights
function drawChristmasLights(frame) {
  const colors = ['#ff4444', '#44ff44', '#ffff44', '#4444ff', '#ff44ff'];
  const yPositions = [80, 160, 240];
  
  yPositions.forEach((baseY, row) => {
    for (let i = 0; i < 12; i++) {
      const x = (i * 60 + 30) % canvas.width;
      const phase = frame * 0.15 + i * 0.4 + row;
      const brightness = 0.5 + Math.sin(phase) * 0.5;
      const color = colors[i % colors.length];
      
      // Glow
      ctx.shadowBlur = 15 * brightness;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = brightness;
      ctx.beginPath();
      ctx.arc(x, baseY + Math.sin(phase) * 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSnow() {
  // kept for compatibility, replaced by better system
}

// Generate video with MediaRecorder
document.getElementById('generateBtn').onclick = async () => {
  const status = document.getElementById('status');
  status.textContent = 'Generazione video in corso...';
  
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  const chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    recordedBlob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(recordedBlob);
    videoEl.src = url;
    videoEl.style.display = 'block';
    canvas.style.display = 'none';
    document.getElementById('downloadBtn').disabled = false;
    document.getElementById('shareBtn').disabled = false;
    status.textContent = 'Video pronto!';
  };

  recorder.start();
  
  // Animate for ~6 seconds
  let frame = 0;
  const totalFrames = 180; // 6s at 30fps
  const img = new Image();
  img.src = selectedBg;
  
  const animate = () => {
    if (frame >= totalFrames) {
      recorder.stop();
      return;
    }
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fade in text
    const alpha = Math.min(1, frame / 40);
    ctx.globalAlpha = alpha;
    drawText();
    ctx.globalAlpha = 1;

    // Animated snow + lights
    drawSnowParticles(frame);
    drawChristmasLights(frame);

    frame++;
    requestAnimationFrame(animate);
  };
  
  img.onload = () => animate();
};

// Download
document.getElementById('downloadBtn').onclick = () => {
  if (!recordedBlob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(recordedBlob);
  a.download = 'auguri-natale.webm';
  a.click();
};

// Share (Web Share API)
document.getElementById('shareBtn').onclick = async () => {
  if (!recordedBlob) return;
  const file = new File([recordedBlob], 'auguri-natale.webm', { type: 'video/webm' });
  if (navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Auguri di Natale',
        text: message
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    // Fallback download
    document.getElementById('downloadBtn').click();
  }
};

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Initial preview
drawPreview();