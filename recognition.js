const WebSocket = require("ws"); // 使用 ws 模块
const http = require("http");
const fs = require("fs");
const vosk = require('vosk');
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { Readable, PassThrough } = require("stream"); // 使用 Readable stream 来处理音频数据

// 创建 HTTP 服务器
const server = http.createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

// 模型路径,修改为自己模型的路径
MODEL_PATH = "model";
if (!fs.existsSync(MODEL_PATH)) {
  console.log("模型路径不存在");
  process.exit();
}

// 加载模型
vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);
// 模型参数
const sampleRate = 16000;

// 定义音频数据的流式处理类
class AudioStream extends Readable {
  constructor(options, chunks) {
    super(options);
    this.chunks = chunks;
    this.reading = false;
  }

  _read(size) {
    if (this.chunks.length > 0) {
      console.log('chunks', this.chunks)
      const chunk = this.chunks.shift();
      this.push(chunk);
    } else {
      this.reading = false;
    }
  }

  // 手动触发读取数据
  triggerRead() {
    if (!this.reading && this.chunks.length > 0) {
      this.reading = true;
      this._read();  // 调用 _read 触发数据的推送
    }
  }

  // 在连接关闭时结束流
  endStream() {
    this.push(null);  // 结束流
  }
}

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
  const rec = new vosk.Recognizer({ model: model, sampleRate: sampleRate });
  rec.setMaxAlternatives(10);
  const audioChunks = [];
  const audioStream = new AudioStream({}, audioChunks);
  const pcmStream = new PassThrough();

  // 监听 WebSocket 的消息事件，将音频数据存入 `audioChunks` 数组
  ws.on("message", (message) => {
    console.log("Received message:", message);
    audioChunks.push(message); // 存储 WebSocket 音频数据
    audioStream.triggerRead();
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    audioStream.endStream();
  });

  ffmpeg()
    .input(audioStream)
    .inputFormat('webm') // 如果 WebSocket 是传输 WebM 格式的音频
    .audioCodec("pcm_s16le") // 使用 16-bit PCM 编码
    .audioFrequency(sampleRate) // 设置采样率
    .audioChannels(1) // 单声道音频
    .format("wav") // 输出为 wav 格式
    .on("end", () => {
      console.log("音频处理完成");
    })
    .on("error", (err) => {
      console.error("处理音频时出错:", err);
    })
    .pipe(pcmStream, { end: false }); // 将转换后的音频流传输到 pcmStream

  // 监听 pcmStream 的数据事件，并进行操作
  pcmStream.on("data", (chunk) => {
    const speech = rec.acceptWaveform(chunk);
    if (speech) {
      console.log("接收到音频数据：");
      console.log(JSON.stringify(rec.result(), null, 4));
    }
  });
});

// 启动 HTTP 服务器，监听指定端口
server.listen(8080, () => {
  console.log("WebSocket server is listening on ws://localhost:8080");
});
