const socket = new WebSocket('ws://localhost:8080');  // 替换为你的 WebSocket 服务器地址
socket.onopen = () => {
    console.log('WebSocket 已连接');
};

// 连接关闭时触发
socket.onclose = function (event) {
    console.log('WebSocket connection closed:', event);
};

// 发生错误时触发
socket.onerror = function (error) {
    console.log('WebSocket error:', error);
};

const constraints = {
    audio: {
        sampleRate: 16000,  // 设置采样率为16kHz
        channelCount: 1, // 单声道
        bitDepth: 16   
    }
};
let mediaStream;
let mediaRecorder;
const beginButton = document.getElementById('begin');
beginButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        mediaStream=stream;
        const options = { mimeType: 'audio/webm' };
        mediaRecorder = new MediaRecorder(stream,options);
        mediaRecorder.ondataavailable=(event)=>{
            if (socket.readyState === WebSocket.OPEN) {
                // 将音频数据发送到后端
                socket.send(event.data);
            }
        }
        mediaRecorder.start(10000);       
})
});
document.getElementById('close').addEventListener('click', () => {
    mediaRecorder.stop();
    mediaStream.getTracks().forEach(track => track.stop());
    socket.close();
    console.log('音频关闭');
});