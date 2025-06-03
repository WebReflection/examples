/*! (c) Andrea Giammarchi - MIT Style License */

import { BarcodeFormat, BrowserMultiFormatReader } from 'https://esm.run/@zxing/library';

console.log(BarcodeFormat);

class Listeners extends Map {
  add(target, ...rest) {
    for (const [type, value] of this)
      target.addEventListener(type, value, ...rest);
    return this;
  }
  remove(target, ...rest) {
    for (const [type, value] of this)
      target.removeEventListener(type, value, ...rest);
    return this;
  }
}

export const scan = async ({
  facingMode = 'environment'
} = {}) => {
  let
    reader = new BrowserMultiFormatReader,
    { resolve, reject, promise } = Promise.withResolvers(),
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } }),
    dialog = document.createElement('dialog'),
    video = dialog.appendChild(document.createElement('video')),
    button = dialog.appendChild(Object.assign(
      document.createElement('button'),
      { textContent: 'CLOSE' }
    )),
    listeners = new Listeners([
      ['loadedmetadata', async function detect() {
        try {
          const result = await reader.decodeFromVideoElement(video);
          if (result?.rawBytes) {
            resolve({
              format: BarcodeFormat[result.format],
              text: result.text,
              bytes: result.rawBytes,
            });
          }
          else {
            reader.stopAsyncDecode();
            timer = setTimeout(detect, 250);
          }
        }
        catch (error) {
          reject(error);
        }
      }],
      ['stalled', reject],
      ['error', reject],
      ['pause', reject]
    ]).add(video, { once: true }),
    done = result => {
      clearTimeout(timer);
      reader.stopAsyncDecode();
      listeners.remove(video);
      video.remove();
      dialog.close();
      return result;
    },
    timer = 0
  ;

  dialog.style.cssText = 'padding:0;border-radius:16px';
  video.style.cssText = `width:100%;object-fit:contain`;
  button.style.cssText = 'width:100%;min-height:32px;border:0;font-weight:bold';
  button.addEventListener('click', () => resolve(null), { once: true });

  document.body.appendChild(dialog);
  dialog.showModal();

  video.srcObject = stream;

  return promise.then(done, failure => done(Promise.reject(failure)));
};
