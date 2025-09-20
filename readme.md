# Photobooth app

## Step-by-step Plan

1. **Project Setup**
   - Initialize a new web project (keep it simple and use HTML/JS).
   - Set up basic folder structure: `/src`, `/public`, etc.

2. **Camera Access**
   - Use the WebRTC `getUserMedia` API to access the device camera.
   - Display the live camera feed on the webpage.

3. **Photo Capture Sequence**
   - Implement logic to capture four photos in sequence (with a timer or button).
   - Store the captured images in memory.

4. **Image Processing**
   - Use the HTML5 Canvas API to apply visual filters (a sepia/vintage filter).

5. **Photo Sheet Composition**
   - Arrange the four filtered photos onto a single virtual photo sheet using Canvas.
   - Add optional text (e.g., date, custom message) to appear at the bottom of the sheet in a stylized cursive font.

6. **Export & Download**
   - Provide a button to download the composed photo sheet as an image file (e.g., PNG).

7. **UI/UX Enhancements**
   - Style the app for usability and aesthetics (CSS, frameworks optional).

8. **(Optional) PWA Support**
   - Add Progressive Web App features for offline use and installability.

---

**Technologies:**
- HTML, CSS, JavaScript
- WebRTC (`getUserMedia`), Canvas API


---

hosted at https://github.com/PatrickFarley/photobooth-app/settings/pages