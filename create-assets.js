// Creates minimal valid PNG placeholder assets
const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeChunk(type, data) {
    const typeB = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcData = Buffer.concat([typeB, data]);
    const crcVal = crc32(crcData);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crcVal);
    return Buffer.concat([len, typeB, data, crcB]);
}

function createPNG(w, h, r, g, b) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // color type RGB

    // Raw image data (filter byte 0 + RGB pixels per row)
    const raw = Buffer.alloc(h * (1 + w * 3));
    for (let y = 0; y < h; y++) {
        const rowStart = y * (1 + w * 3);
        raw[rowStart] = 0; // filter none
        for (let x = 0; x < w; x++) {
            const px = rowStart + 1 + x * 3;
            raw[px] = r;
            raw[px + 1] = g;
            raw[px + 2] = b;
        }
    }

    const compressed = zlib.deflateSync(raw);

    return Buffer.concat([
        sig,
        writeChunk('IHDR', ihdr),
        writeChunk('IDAT', compressed),
        writeChunk('IEND', Buffer.alloc(0)),
    ]);
}

// Green color matching the app theme
const png = createPNG(100, 100, 22, 163, 74);

if (!fs.existsSync('assets')) fs.mkdirSync('assets');
fs.writeFileSync('assets/icon.png', png);
fs.writeFileSync('assets/splash-icon.png', png);
fs.writeFileSync('assets/adaptive-icon.png', png);
fs.writeFileSync('assets/favicon.png', png);

console.log('All placeholder assets created successfully!');
