# 简介 | Introduction
这是一个基于 Vosk 实现的实时语音转文字的 Demo。  
This is a real-time speech-to-text demo based on Vosk.

Web 端录音，通过 WebSocket 将音频传递到后端，后端通过流式传输 FFmpeg 将音频编码转化为 WAV 格式，再传递给 Vosk 进行识别，在后台打印识别结果。  
The web front-end records audio, sends the audio to the backend through WebSocket. The backend transcodes the audio stream to WAV format via FFmpeg and sends it to Vosk for recognition. The recognition results are then printed in the backend.

# 运行环境 | Environment
* Node.js v18.19.1
* 需要在 Vosk 官网下载不同语音识别的模型 [下载](https://alphacephei.com/vosk/models)  
* Node.js v18.19.1  
* You need to download different speech recognition models from Vosk's official website [Download](https://alphacephei.com/vosk/models)

# 运行 | How to Run
安装依赖  
Install dependencies:  
`npm install`

运行 
Run
`npm start`
