import { getLlama, resolveModelFile } from 'node-llama-cpp';
import path from 'path';
import { app } from 'electron';
import { EventEmitter } from 'events';

export class ModelManager extends EventEmitter {
  constructor() {
    super();
    this.llama = null;
    this.model = null;
    this.status = { status: 'initializing', progress: 0, message: '' };
  }

  getStatus() {
    return { ...this.status };
  }

  _setStatus(status, progress = 0, message = '') {
    this.status = { status, progress, message };
    this.emit('status', this.status);
  }

  async init() {
    try {
      this._setStatus('initializing', 0, 'Starting llama engine...');
      this.llama = await getLlama();

      const modelsDir = path.join(app.getPath('userData'), 'models');

      this._setStatus('downloading', 0, 'Resolving model...');

      // resolveModelFile will download if not cached, and return the path
      const modelPath = await resolveModelFile(
        'hf:bartowski/Meta-Llama-3-8B-Instruct-GGUF/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf',
        {
          directory: modelsDir,
          onProgress: (status) => {
            if (status.totalSize > 0) {
              const pct = Math.round((status.downloadedSize / status.totalSize) * 100);
              this._setStatus('downloading', pct, `Downloading model... ${pct}%`);
            }
          },
        }
      );

      this._setStatus('loading', 0, 'Loading model into memory...');

      this.model = await this.llama.loadModel({
        modelPath,
      });

      this._setStatus('ready', 100, 'Model ready');
      return this.model;
    } catch (err) {
      this._setStatus('error', 0, err.message);
      throw err;
    }
  }

  async createContext() {
    if (!this.model) throw new Error('Model not loaded');
    return await this.model.createContext();
  }

  async dispose() {
    if (this.model) {
      await this.model.dispose();
      this.model = null;
    }
    if (this.llama) {
      await this.llama.dispose();
      this.llama = null;
    }
  }
}
