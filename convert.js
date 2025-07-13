/* ---------- DOM refs ---------- */
const fileInput   = document.getElementById('fileInput');
const dropZone    = document.getElementById('dropZone');
const preview     = document.getElementById('preview');
const formatSel   = document.getElementById('formatSelect');
const qualityIn   = document.getElementById('qualityInput');
const qualityVal  = document.getElementById('qualityValue');
const form        = document.getElementById('controls');
const qualityWrapper = document.getElementById('qualityWrapper');

/* ---------- helpers ---------- */
const needsQualitySlider = type =>
  ['image/jpeg','image/webp','image/avif'].includes(type);

/* ---------- live quality label ---------- */
qualityIn.addEventListener('input', () => qualityVal.textContent = qualityIn.value);

/* ---------- dynamic select ---------- */
function hideOption(value) {
  [...formatSel.options].forEach(opt => {
    opt.hidden = opt.value === value;
    if (opt.hidden && opt.selected) {
      // pick first visible option
      formatSel.value = [...formatSel.options].find(o => !o.hidden)?.value || '';
    }
  });
}

/* ---------- load & preview ---------- */
let currentMime = null;   // store detected mime

function loadFile(file) {
  if (!file.type.startsWith('image/')) return alert('Please drop an image.');

  currentMime = file.type;               // e.g. image/png, image/x-icon
  hideOption(currentMime);               // remove from list
  qualityWrapper.style.display = needsQualitySlider(currentMime) ? 'block' : 'none';

  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.classList.remove('hidden');
  preview.onload = () => URL.revokeObjectURL(url);
}

fileInput.addEventListener('change', e => loadFile(e.target.files[0]));

/* ---------- drag & drop ---------- */
['dragenter','dragover'].forEach(evt =>
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    dropZone.classList.add('border-sky-400','bg-slate-700/40');
  })
);
['dragleave','drop'].forEach(evt =>
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    dropZone.classList.remove('border-sky-400','bg-slate-700/40');
  })
);
dropZone.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

/* ---------- convert & download ---------- */
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!preview.src) return;

  const targetMime = formatSel.value;
  const quality = parseFloat(qualityIn.value);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width  = preview.naturalWidth;
  canvas.height = preview.naturalHeight;
  ctx.drawImage(preview, 0, 0);

  // check browser support
  const testCanvas = document.createElement('canvas');
  const supported = testCanvas.toDataURL(targetMime).startsWith('data:' + targetMime);

  if (!supported) {
    alert(`Sorry, your browser cannot encode images as ${targetMime.split('/')[1].toUpperCase()}.`);
    return;
  }

  const blob = await new Promise(resolve => canvas.toBlob(resolve, targetMime, quality));

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const ext = targetMime === 'image/x-icon' ? 'ico' : targetMime.split('/')[1];
  link.download = `converted.${ext}`;
  link.click();
  URL.revokeObjectURL(link.href);
});
