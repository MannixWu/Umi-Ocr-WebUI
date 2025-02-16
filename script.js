document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('dropArea');

    // 阻止默认行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 高亮拖拽区域
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    // 处理拖拽文件
    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length) {
            handleFiles(files);
        }
    }

    // 处理粘贴文件
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                handleFiles([file]);
            }
        }
    });

    // 点击拖拽区域打开文件选择器
    dropArea.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const files = e.target.files;
            if (files.length) {
                handleFiles(files);
            }
        };
        input.click();
    });

    function handleFiles(files) {
        const file = files[0];
        if (!file) {
            alert('请选择一张图片');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Image = event.target.result;
            
            // 显示上传的图片在拖拽区域
            const imgElement = document.getElementById('uploadedImage');
            imgElement.src = base64Image;
            imgElement.style.display = 'block';

            sendToOCR(base64Image.split(',')[1]); // 发送Base64编码
        };

        reader.readAsDataURL(file); // 将文件读取为Data URL
    }
});

function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    contents.forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function captureScreenshot() {
    const canvas = document.getElementById('screenshotCanvas');
    const context = canvas.getContext('2d');
    const video = document.createElement('video');

    navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const base64Image = canvas.toDataURL('image/png');
            
            // 显示截图的图片
            const imgElement = document.getElementById('uploadedImage');
            imgElement.src = base64Image;
            imgElement.style.display = 'block';

            sendToOCR(base64Image.split(',')[1]); // 发送Base64编码

            // 停止视频流
            stream.getTracks().forEach(track => track.stop());
        };
    }).catch(error => {
        console.error('Error capturing screenshot:', error);
        alert('无法捕获屏幕截图');
    });
}

function sendToOCR(base64Image) {
    const url = 'http://127.0.0.1:1224/api/ocr';
    const data = {
        base64: base64Image,
        options: {
            "data.format": "text"
        }
    };

    console.log('请求数据:', data);

    fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"},
    })
    .then(response => {
        console.log('响应状态:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('响应数据:', data);
        if (data.data) {
            document.getElementById('result').innerText = `${data.data}`;
            
            // 保存到历史记录
            const history = document.getElementById('history');
            const historyItem = document.createElement('div');
            historyItem.style.border = '1px solid #ccc';
            historyItem.style.marginBottom = '10px';
            historyItem.style.padding = '10px';
            historyItem.style.borderRadius = '5px';
            historyItem.style.backgroundColor = '#f9f9f9';

            const timestamp = new Date().toLocaleString();
            const timeElement = document.createElement('div');
            timeElement.style.fontSize = '0.9em';
            timeElement.style.color = '#888';
            timeElement.textContent = `识别时间: ${timestamp}`;

            const contentElement = document.createElement('div');
            contentElement.textContent = `${data.data}`;

            historyItem.appendChild(timeElement);
            historyItem.appendChild(contentElement);
            history.appendChild(historyItem);
        } else {
            document.getElementById('result').innerText = '未能识别出文本';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('识别失败，请重试');
    });
} 