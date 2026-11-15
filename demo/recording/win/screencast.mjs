// The camera of the hidden recorder: no screen, no window, no OBS.
//
// Each page that can be on camera sends its frames over the browser's own
// debugging channel (Page.startScreencast). One page at a time is "on stage"
// (show(page)); a clock writes that page's newest frame to ffmpeg at a fixed
// rate, so the video keeps real time while a still page sends nothing.
// pause() stops the clock (a page load is not filmed); resume() starts it.
//
//   const cam = new Screencast({ ffmpeg, fps: 15, width: 1920, height: 1080 });
//   await cam.show(page);            // this page is the picture from now on
//   await cam.start('N18.mp4');      // rolling
//   await cam.pause(); await cam.resume();
//   cam.position()                   // seconds of video written so far
//   await cam.stop();                // -> the .mp4
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

export function findFfmpeg() {
  if (process.env.FFMPEG && fs.existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  try { const f = execFileSync('where', ['ffmpeg'], { encoding: 'utf8', windowsHide: true }).split(/\r?\n/).find((x) => x.trim()); if (f) return f.trim(); } catch {}
  throw new Error('ffmpeg not found: install it (winget install Gyan.FFmpeg) or set FFMPEG');
}

export class Screencast {
  constructor({ ffmpeg = null, fps = 15, width = 1920, height = 1080, quality = 92, log = () => {} } = {}) {
    Object.assign(this, { ffmpeg, fps, width, height, quality, log });
    this.pages = new Map();     // page -> { cdp, frame }
    this.front = null; this.proc = null; this.timer = null; this.paused = true; this.frames = 0; this.file = null; this.last = null;
  }

  async attach(page) {
    if (this.pages.has(page)) return this.pages.get(page);
    const cdp = await page.context().newCDPSession(page);
    const st = { cdp, frame: null };
    cdp.on('Page.screencastFrame', (f) => {
      st.frame = Buffer.from(f.data, 'base64');
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: this.quality, everyNthFrame: 1, maxWidth: this.width, maxHeight: this.height });
    page.once('close', () => { this.pages.delete(page); if (this.front === page) this.front = null; });
    this.pages.set(page, st);
    return st;
  }

  // Put a page on stage. Its first frame is taken as a screenshot, so the
  // picture changes at once even when the page is still (no new frame sent).
  async show(page) {
    if (!page || page.isClosed()) throw new Error('camera: no page to show');
    const st = await this.attach(page);
    await page.bringToFront().catch(() => {});
    try { st.frame = await page.screenshot({ type: 'jpeg', quality: this.quality, timeout: 15000 }); } catch (e) { this.log(`camera: first frame: ${e.message.split('\n')[0]}`); }
    this.front = page;
  }
  get onStage() { return this.front && !this.front.isClosed() ? this.front : null; }

  async start(file) {
    if (this.proc) throw new Error('camera: already recording');
    this.ffmpeg ||= findFfmpeg();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.file = file; this.frames = 0;
    const vf = `scale=${this.width}:${this.height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${this.width}:${this.height}:(ow-iw)/2:(oh-ih)/2:color=0x0d1117`;
    this.proc = spawn(this.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(this.fps), '-c:v', 'mjpeg', '-i', '-',
      '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(this.fps), '-movflags', '+faststart', file], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
    let err = ''; this.proc.stderr.on('data', (d) => { err += d; });
    this.done = new Promise((resolve, reject) => this.proc.on('close', (code) => (code === 0 ? resolve(file) : reject(new Error(`ffmpeg: ${err.trim().split('\n').pop() || `exit ${code}`}`)))));
    this.proc.stdin.on('error', () => {});
    this.paused = false;
    // A fixed clock: the frame count IS the video's time, whatever the load.
    const t0 = Date.now(); let ticks = 0;
    this.timer = setInterval(() => {
      const due = Math.floor((Date.now() - t0) * this.fps / 1000);
      for (; ticks < due; ticks++) {
        if (this.paused) continue;
        const f = this.onStage && this.pages.get(this.front)?.frame;
        if (f) this.last = f;
        if (this.last && this.proc?.stdin.writable) { this.proc.stdin.write(this.last); this.frames++; }
      }
    }, Math.round(1000 / this.fps / 2));
    this.log(`camera: rolling -> ${path.basename(file)}`);
  }
  get rolling() { return !!this.proc && !this.paused; }
  async pause() { this.paused = true; }
  async resume() { if (this.proc) this.paused = false; }
  position() { return this.frames / this.fps; }

  async stop() {
    if (!this.proc) return null;
    clearInterval(this.timer); this.timer = null; this.paused = true;
    const p = this.proc; this.proc = null;
    p.stdin.end();
    const f = await this.done;
    this.log(`camera: saved ${path.basename(f)} (${this.position().toFixed(1)} s)`);
    return f;
  }
  async close() { await this.stop().catch(() => {}); for (const [, st] of this.pages) await st.cdp.detach().catch(() => {}); this.pages.clear(); }
}
