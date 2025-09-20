// Entry point for the photobooth app
// Step 1: Project setup complete. Further logic will be added in next steps.

document.getElementById('app-root').innerHTML = `
  <div id="camera-section">
    <video id="video" autoplay playsinline width="400" height="300" style="background:#222; border-radius:8px;"></video>
    <div id="camera-error" style="color:red; margin-top:1em;"></div>
    <div style="margin-top:1.5em;">
      <button id="start-sequence" style="padding:0.7em 1.5em; font-size:1.1em;">Start Photo Sequence</button>
      <span id="countdown" style="margin-left:1.5em; font-size:1.2em; color:#555;"></span>
    </div>
    <div id="thumbnails" style="margin-top:1.5em; display:flex; gap:10px;"></div>
  </div>
`;

const video = document.getElementById('video');
const cameraError = document.getElementById('camera-error');
const startSequenceBtn = document.getElementById('start-sequence');
const countdownEl = document.getElementById('countdown');
const thumbnails = document.getElementById('thumbnails');

let capturedImages = [];

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    cameraError.textContent = '';
  } catch (err) {
    cameraError.textContent = 'Unable to access camera: ' + err.message;
  }
}

function capturePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

function applySepiaFilter(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    // Sepia filter formula with RGB custom scaling
    const scaleR = 1.0;
    const scaleG = 0.9;
    const scaleB = 0.95;
    data[i]   = Math.min((0.393*r + 0.769*g + 0.189*b) * scaleR, 255); // Red
    data[i+1] = Math.min((0.349*r + 0.686*g + 0.168*b) * scaleG, 255); // Green
    data[i+2] = Math.min((0.272*r + 0.534*g + 0.131*b) * scaleB, 255); // Blue

    // Apply S-curve contrast adjustment
    // Normalize RGB to [0,1], apply S-curve, then scale back to [0,255]
    // S-curve: y = 0.5 + 0.5 * Math.tanh(2 * (x - 0.5))
    function sCurve(v) {
      const x = v / 255;
      const y = 0.5 + 0.5 * Math.tanh(2 * (x - 0.5));
      return Math.max(0, Math.min(255, Math.round(y * 255)));
    }
    data[i]   = sCurve(data[i]);
    data[i+1] = sCurve(data[i+1]);
    data[i+2] = sCurve(data[i+2]);
    
    // Reduce saturation by blending with grayscale
    // Grayscale = 0.299*R + 0.587*G + 0.114*B
    const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    const sat = 0.7; // 1.0 = original, 0 = grayscale, <1 = less saturated
    data[i]   = Math.round(data[i]   * sat + gray * (1 - sat));
    data[i+1] = Math.round(data[i+1] * sat + gray * (1 - sat));
    data[i+2] = Math.round(data[i+2] * sat + gray * (1 - sat));
  }
  return imageData;
}

function getFilteredImageDataURL(imgDataUrl) {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      imageData = applySepiaFilter(imageData);
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imgDataUrl;
  });
}

async function runPhotoSequence() {
  capturedImages = [];
  thumbnails.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    countdownEl.textContent = `Get ready... ${3 - i}`;
    await new Promise(res => setTimeout(res, 1000));
    countdownEl.textContent = 'Smile!';
    await new Promise(res => setTimeout(res, 500));
    const imgData = capturePhoto();
    // Apply sepia filter to the captured image
    const filteredData = await getFilteredImageDataURL(imgData);
    capturedImages.push(filteredData);
    const img = document.createElement('img');
    img.src = filteredData;
    img.width = 80;
    img.height = 60;
    img.style.borderRadius = '4px';
    thumbnails.appendChild(img);
    countdownEl.textContent = '';
    await new Promise(res => setTimeout(res, 500));
  }
  countdownEl.textContent = 'Sequence complete!';
}

startSequenceBtn.addEventListener('click', runPhotoSequence);

startCamera();

// Add UI for composing and downloading the photo sheet
const appRoot = document.getElementById('app-root');
const photoSheetSection = document.createElement('div');
photoSheetSection.id = 'photo-sheet-section';
photoSheetSection.style.marginTop = '2em';
photoSheetSection.innerHTML = `
  <button id="compose-sheet" style="padding:0.7em 1.5em; font-size:1.1em;">Compose Photo Sheet</button>
  <div style="margin-top:1em;">
    <canvas id="photo-sheet-canvas" width="400" height="600" style="background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);"></canvas>
  </div>
  <div style="margin-top:1em;">
    <input id="sheet-text" type="text" placeholder="Add text (optional)" style="font-size:1em; padding:0.5em; width:60%;">
    <button id="download-sheet" style="padding:0.5em 1.2em; font-size:1em; margin-top:1em;">Download Sheet</button>
  </div>
`;
appRoot.appendChild(photoSheetSection);

const composeSheetBtn = document.getElementById('compose-sheet');
const photoSheetCanvas = document.getElementById('photo-sheet-canvas');
const sheetTextInput = document.getElementById('sheet-text');
const downloadSheetBtn = document.getElementById('download-sheet');

// Helper: crop image to square (centered)
function cropToSquare(img) {
  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = minSide;
  canvas.height = minSide;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, minSide, minSide);
  return canvas;
}

function drawPhotoSheet(text) {
  const ctx = photoSheetCanvas.getContext('2d');
  // Set new canvas size for 4 square photos + space for text
  const margin = 20;
  const imgSize = 320; // square size for each photo
  const sheetW = 400;
  const sheetH = margin + 4 * imgSize + 5 * margin + 60; // 4 images + 5 margins + text area
  photoSheetCanvas.width = sheetW;
  photoSheetCanvas.height = sheetH;
  ctx.clearRect(0, 0, sheetW, sheetH);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, sheetW, sheetH);
  for (let i = 0; i < 4; i++) {
    if (!capturedImages[i]) continue;
    const img = new window.Image();
    img.src = capturedImages[i];
    img.onload = function() {
      const square = cropToSquare(img);
      const x = (sheetW - imgSize) / 2;
      const y = margin + i * (imgSize + margin);
      ctx.drawImage(square, x, y, imgSize, imgSize);
    };
    if (img.complete) {
      const square = cropToSquare(img);
      const x = (sheetW - imgSize) / 2;
      const y = margin + i * (imgSize + margin);
      ctx.drawImage(square, x, y, imgSize, imgSize);
    }
  }
  // Draw text at the bottom
  if (text) {
    ctx.save();
    ctx.font = 'italic 2em Brush Script MT, cursive';
    ctx.fillStyle = '#7a5c2e';
    ctx.textAlign = 'center';
    ctx.fillText(text, sheetW / 2, sheetH - 30);
    ctx.restore();
  }
}

composeSheetBtn.addEventListener('click', () => {
  drawPhotoSheet(sheetTextInput.value);
});
sheetTextInput.addEventListener('input', () => {
  drawPhotoSheet(sheetTextInput.value);
});

downloadSheetBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'photobooth-sheet.png';
  link.href = photoSheetCanvas.toDataURL('image/png');
  link.click();
});
