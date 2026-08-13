import { encode } from 'https://esm.sh/@jsquash/webp@1.5.0';

self.addEventListener('message', async event => {
    const { id, width, height, rgbaBuffer, options } = event.data;
    try {
        const imageData = new ImageData(new Uint8ClampedArray(rgbaBuffer), width, height);
        const encoded = await encode(imageData, options);
        const buffer = encoded instanceof ArrayBuffer
            ? encoded
            : encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
        self.postMessage({ id, buffer }, [buffer]);
    } catch (error) {
        self.postMessage({ id, error: error?.message || String(error) });
    }
});
