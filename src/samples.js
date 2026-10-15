/** Optional local audition bank. Missing or undecodable files keep the synths. */
export class SampleBank {
  constructor(fetcher = (...args) => fetch(...args)) {
    this.fetcher = fetcher;
    this.ready = new Map();
    this.loading = null;
    this.url = new URL('../assets/audio-local/bank.json', import.meta.url);
  }

  load(ctx) {
    if (typeof ctx?.decodeAudioData !== 'function') return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const response = await this.fetcher(this.url);
      if (!response.ok) return;
      const bank = await response.json();
      if (bank.version !== 1 || !bank.voices) return;
      await Promise.allSettled(Object.entries(bank.voices).map(async ([name, records]) => {
        const loaded = await Promise.all(records.map(async record => {
          if (!/^[a-z0-9-]+\.mp3$/.test(record.file) || !(record.hz > 20)) return null;
          try {
            const response = await this.fetcher(new URL(record.file, this.url));
            if (!response.ok) return null;
            const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
            return { hz: record.hz, buffer };
          } catch { return null; }
        }));
        const available = loaded.filter(Boolean);
        if (available.length) this.ready.set(name, available);
      }));
    })().catch(() => {});
    return this.loading;
  }

  play(profile, ctx, bus, hz, time, level) {
    const records = this.ready.get(profile.bank);
    if (!records?.length) return false;
    const record = records.reduce((best, item) => Math.abs(Math.log(item.hz / hz)) < Math.abs(Math.log(best.hz / hz)) ? item : best);
    const source = ctx.createBufferSource(), env = ctx.createGain();
    source.buffer = record.buffer;
    source.playbackRate.value = hz / record.hz;
    const [attack, hold, release] = profile.envelope;
    const top = time + attack, fall = top + hold, end = fall + release;
    const peak = level * profile.level;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(peak, top);
    env.gain.setValueAtTime(peak, fall);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    let filter;
    source.connect(env);
    if (profile.cutoff) {
      filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = 0.45;
      filter.frequency.value = profile.cutoff;
      env.connect(filter); filter.connect(bus);
    } else env.connect(bus);
    source.start(time); source.stop(end + 0.03);
    source.onended = () => {
      for (const node of [source, env, filter]) { try { node?.disconnect(); } catch {} }
    };
    return true;
  }
}

export const samples = new SampleBank();
