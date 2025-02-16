function uploadImage() {
    const input = document.getElementById('imageInput');
    const file = input.files[0];
    if (!file) {
        alert('请选择一张图片');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Image = event.target.result.split(',')[1]; // 获取base64编码

        const url = 'http://127.0.0.1:1224/api/ocr';
        const data = {
            base64: base64Image,
            options: {
                "data.format": "text"
            }
        };

        fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {"Content-Type": "application/json"},
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').innerText = `识别结果: ${data.text}`;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('识别失败，请重试');
        });
    };

    reader.readAsDataURL(file); // 将文件读取为Data URL
} 