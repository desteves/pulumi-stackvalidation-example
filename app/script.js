const fs = require('fs');

document.getElementById('update').addEventListener('click', function () {
    const timestamp = Math.floor(Date.now() / 1000);
    fs.writeFileSync('latest-unix-timestamp.txt', timestamp.toString());
    document.getElementById('fileContents').textContent = timestamp;
});
