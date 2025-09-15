import * as ort from 'onnxruntime-web';
import 'onnxruntime-web/webgpu';

// Minimal COCO class list (first 20 for mapping, extend if needed)
const COCO_CLASSES = [
  'person','bicycle','car','motorcycle','airplane','bus','train','truck','boat','traffic light',
  'fire hydrant','stop sign','parking meter','bench','bird','cat','dog','horse','sheep','cow',
  'elephant','bear','zebra','giraffe','backpack','umbrella','handbag','tie','suitcase','frisbee',
  'skis','snowboard','sports ball','kite','baseball bat','baseball glove','skateboard','surfboard','tennis racket','bottle',
  'wine glass','cup','fork','knife','spoon','bowl','banana','apple','sandwich','orange',
  'broccoli','carrot','hot dog','pizza','donut','cake','chair','couch','potted plant','bed',
  'dining table','toilet','tv','laptop','mouse','remote','keyboard','cell phone','microwave','oven',
  'toaster','sink','refrigerator','book','clock','vase','scissors','teddy bear','hair drier','toothbrush'
];

export type Detection = {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
};

export class YOLOv8Detector {
  private session: ort.InferenceSession | null = null;
  private inputName: string | null = null;
  private inputSize = 640; // 640x640

  async load(modelUrl: string) {
    try {
      // Configure ONNX Runtime for better browser compatibility
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
      
      console.log('Loading YOLOv8 model from:', modelUrl);
      
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        executionMode: 'sequential'
      });
      this.inputName = this.session.inputNames[0];
      
      console.log('YOLOv8 model loaded successfully:', {
        inputs: this.session.inputNames,
        outputs: this.session.outputNames,
        inputName: this.inputName
      });
    } catch (error) {
      console.error('Failed to load YOLOv8 model:', error);
      throw new Error(`Model loading failed: ${error.message}`);
    }
  }

  private toCHWFloat32(data: Uint8ClampedArray, width: number, height: number) {
    const size = width * height;
    const out = new Float32Array(size * 3);
    for (let i = 0; i < size; i++) {
      const r = data[i * 4] / 255;
      const g = data[i * 4 + 1] / 255;
      const b = data[i * 4 + 2] / 255;
      out[i] = r; // R
      out[i + size] = g; // G
      out[i + size * 2] = b; // B
    }
    return out;
  }

  private nms(boxes: Detection[], iouThreshold = 0.45) {
    // Sort by score desc
    boxes.sort((a, b) => b.score - a.score);
    const selected: Detection[] = [];

    const iou = (a: Detection, b: Detection) => {
      const x1 = Math.max(a.box.xmin, b.box.xmin);
      const y1 = Math.max(a.box.ymin, b.box.ymin);
      const x2 = Math.min(a.box.xmax, b.box.xmax);
      const y2 = Math.min(a.box.ymax, b.box.ymax);
      const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
      const areaA = (a.box.xmax - a.box.xmin) * (a.box.ymax - a.box.ymin);
      const areaB = (b.box.xmax - b.box.xmin) * (b.box.ymax - b.box.ymin);
      const union = areaA + areaB - inter;
      return union <= 0 ? 0 : inter / union;
    };

    for (const cand of boxes) {
      let keep = true;
      for (const sel of selected) {
        if (iou(cand, sel) > iouThreshold) {
          keep = false;
          break;
        }
      }
      if (keep) selected.push(cand);
    }
    return selected;
  }

  async detect(source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): Promise<Detection[]> {
    if (!this.session || !this.inputName) throw new Error('YOLOv8 session not initialized');

    // Draw to 640x640 canvas
    const inputCanvas = document.createElement('canvas');
    inputCanvas.width = this.inputSize;
    inputCanvas.height = this.inputSize;
    const ictx = inputCanvas.getContext('2d')!;
    ictx.drawImage(source as CanvasImageSource, 0, 0, this.inputSize, this.inputSize);

    const { data } = ictx.getImageData(0, 0, this.inputSize, this.inputSize);
    const chw = this.toCHWFloat32(data, this.inputSize, this.inputSize);
    const tensor = new ort.Tensor('float32', chw, [1, 3, this.inputSize, this.inputSize]);

    const outputs = await this.session.run({ [this.inputName]: tensor });
    const outputName = this.session.outputNames[0];
    const out = outputs[outputName] as ort.Tensor;

    const outData = out.data as Float32Array;
    const dims = out.dims; // expected [1, 84, N] or [1, N, 84]

    let rows: number, cols: number, getVal: (r: number, c: number) => number;
    if (dims.length === 3 && dims[1] === 84) {
      // [1, 84, N]
      rows = dims[2];
      cols = 84;
      getVal = (r, c) => outData[c * rows + r]; // channel-first
    } else if (dims.length === 3 && dims[2] === 84) {
      // [1, N, 84]
      rows = dims[1];
      cols = 84;
      getVal = (r, c) => outData[r * cols + c];
    } else {
      // Fallback assume [N,84]
      rows = dims[dims.length - 2] || 8400;
      cols = dims[dims.length - 1] || 84;
      getVal = (r, c) => outData[r * cols + c];
    }

    const detections: Detection[] = [];
    const wScale = (source as HTMLVideoElement).videoWidth
      ? (source as HTMLVideoElement).videoWidth / this.inputSize
      : (source as HTMLImageElement).naturalWidth
      ? (source as HTMLImageElement).naturalWidth / this.inputSize
      : (source as HTMLCanvasElement).width / this.inputSize;
    const hScale = (source as HTMLVideoElement).videoHeight
      ? (source as HTMLVideoElement).videoHeight / this.inputSize
      : (source as HTMLImageElement).naturalHeight
      ? (source as HTMLImageElement).naturalHeight / this.inputSize
      : (source as HTMLCanvasElement).height / this.inputSize;

    const confThreshold = 0.25;

    for (let r = 0; r < rows; r++) {
      const cx = getVal(r, 0);
      const cy = getVal(r, 1);
      const w = getVal(r, 2);
      const h = getVal(r, 3);

      // Find best class
      let bestScore = 0;
      let bestClass = -1;
      for (let c = 4; c < cols; c++) {
        const s = getVal(r, c);
        if (s > bestScore) {
          bestScore = s;
          bestClass = c - 4;
        }
      }
      if (bestScore < confThreshold) continue;

      const xmin = (cx - w / 2) * wScale;
      const ymin = (cy - h / 2) * hScale;
      const xmax = (cx + w / 2) * wScale;
      const ymax = (cy + h / 2) * hScale;

      const label = COCO_CLASSES[bestClass] || `cls_${bestClass}`;
      detections.push({ label, score: bestScore, box: { xmin, ymin, xmax, ymax } });
    }

    // Vehicle-only filter here, keep rest of pipeline simple
    const vehicleClasses = new Set(['car', 'truck', 'bus', 'motorcycle', 'bicycle']);
    const vehicleDetections = detections.filter(d => vehicleClasses.has(d.label));

    // NMS
    return this.nms(vehicleDetections);
  }
}
