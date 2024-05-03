/**
 * The HTML canvas element.
 * @type {HTMLCanvasElement}
 */
const canvas = document.querySelector("canvas");

/**
 * All tool buttons.
 * @type {NodeList}
 */
const toolBtns = document.querySelectorAll(".tool");

/**
 * The fill color checkbox.
 * @type {HTMLInputElement}
 */
const fillColor = document.querySelector("#fill-color");

/**
 * The size slider input.
 * @type {HTMLInputElement}
 */
const sizeSlider = document.querySelector("#size-slider");

/**
 * All color buttons.
 * @type {NodeList}
 */
const colorBtns = document.querySelectorAll(".colors .option");

/**
 * The color picker input.
 * @type {HTMLInputElement}
 */
const colorPicker = document.querySelector("#color-picker");

/**
 * The clear canvas button.
 * @type {HTMLElement}
 */
const clearCanvas = document.querySelector(".clear-canvas");

/**
 * The save image button.
 * @type {HTMLElement}
 */
const saveImg = document.querySelector(".save-img");

/**
 * The canvas rendering context.
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// Global variables with default values
let prevMouseX, prevMouseY, snapshot, imageUrl,
    isDrawing = false,
    selectedTool = "brush",
    brushWidth = 5,
    selectedColor = "#000";
/**
 * Listens for messages from the Chrome extension.
 * @param {Object} request - The message object.
 */
chrome.runtime.onMessage.addListener(function (request) {
    if (request.msg === 'screenshot') {
        imageUrl = request.data;
    }
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    setCanvasBackground(imageUrl);
});

/**
 * Sets the canvas background.
 * @param {string} imageUrl - The URL of the image.
 */
const setCanvasBackground = (imageUrl) => {
    if (selectedTool === "brush")
        canvas.classList.add("cur-brush");
    const img = new Image();
    img.onload = function () {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;
        const offsetX = (canvas.width - newWidth) / 2;
        const offsetY = (canvas.height - newHeight) / 2;

        // Enable image smoothing
        ctx.imageSmoothingEnabled = true;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
    };
    img.src = imageUrl;
}

/**
 * Draws a rectangle on the canvas.
 * @param {MouseEvent} e - The mouse event.
 */
const drawRect = (e) => {
    if (!fillColor.checked) {
        return ctx.strokeRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
    }
    ctx.fillRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
}

/**
 * Draws a circle on the canvas.
 * @param {MouseEvent} e - The mouse event.
 */
const drawCircle = (e) => {
    ctx.beginPath();
    let radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2));
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    fillColor.checked ? ctx.fill() : ctx.stroke();
}

/**
 * Draws a triangle on the canvas.
 * @param {MouseEvent} e - The mouse event.
 */
const drawTriangle = (e) => {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
    ctx.closePath();
    fillColor.checked ? ctx.fill() : ctx.stroke();
}

/**
 * Draws a arraw on the canvas.
 * @param {MouseEvent} e - The mouse event.
 */
const drawArrow = (e) => {
    const headLength = 30;
    const angle = Math.atan2(e.offsetY - prevMouseY,
        e.offsetX - prevMouseX);
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(e.offsetX - headLength *
        Math.cos(angle - Math.PI / 6),
        e.offsetY - headLength *
        Math.sin(angle - Math.PI / 6));
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.lineTo(e.offsetX - headLength *
        Math.cos(angle + Math.PI / 6),
        e.offsetY - headLength *
        Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

/**
 * Initiates drawing.
 * @param {MouseEvent} e - The mouse event.
 */
const startDraw = (e) => {
    isDrawing = true;
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;
    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    saveState(); // Save state before drawing

}

/**
 * Draws on the canvas.
 * @param {MouseEvent} e - The mouse event.
 */
const drawing = (e) => {
    if (!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);

    if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (selectedTool === "rectangle") {
        drawRect(e);
    } else if (selectedTool === "circle") {
        drawCircle(e);
    } else if (selectedTool === "arrow") {
        drawArrow(e);
    } else if (selectedTool === "triangle") {
        drawTriangle(e);
    }
}

// Event listeners for tool buttons
toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .active").classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
        canvas.className = "";
        if (selectedTool === "brush") {
            canvas.classList.add("cur-brush");
        }
        if (selectedTool === "eraser") {
            canvas.classList.add("cur-eraser");
        }
    });
});

// Event listener for size slider
sizeSlider.addEventListener("change", () => brushWidth = sizeSlider.value);

// Event listeners for color buttons
colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .selected").classList.remove("selected");
        btn.classList.add("selected");
        selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
    });
});

// Event listener for color picker
colorPicker.addEventListener("change", () => {
    colorPicker.parentElement.style.background = colorPicker.value;
    colorPicker.parentElement.click();
});

// Event listener for clear canvas button
clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redoStack = [];
    undoStack = [];
    setCanvasBackground(imageUrl);
});

// Event listener for save image button
saveImg.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = canvas.toDataURL();
    link.click();
});

/**
 * Copies the canvas image to the clipboard.
 */
const copyCanvasImage = () => {
    canvas.toBlob(blob => {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            .then(() => alert('Image copied to clipboard'))
            .catch(err => alert('Could not copy image to clipboard: ', err));
    }, 'image/png');
};

// Event listener for copy image button
document.querySelector(".copy-img").addEventListener("click", copyCanvasImage);

// Event listeners for mouse events
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => isDrawing = false);

// Initialize Cropper
let cropper;

/**
 * Activates or deactivates crop mode.
 */
const activateCropMode = () => {
    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();
        setCanvasBackground(croppedCanvas.toDataURL());
        cropper.destroy();
        cropper = undefined;
        return;
    }

    cropper = new Cropper(canvas, {
        dragMode: 'crop',
        aspectRatio: NaN,
        crop: function (event) {
            const croppedCanvas = cropper.getCroppedCanvas();
            setCanvasBackground(croppedCanvas.toDataURL());
        },
    });
};

// Event listener for crop tool button
document.getElementById("crop").addEventListener("click", activateCropMode);

// Initialize variables for undo and redo
let undoStack = [];
let redoStack = [];

// Function to save current state for undo
const saveState = () => {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
};

// Function to undo
const undo = () => {
    if (undoStack.length > 0) {
        redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        ctx.putImageData(undoStack.pop(), 0, 0);
    }
};

// Function to redo
const redo = () => {
    if (redoStack.length > 0) {
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        ctx.putImageData(redoStack.pop(), 0, 0);
    }
};

// Event listener for undo button
document.querySelector("#undo").addEventListener("click", undo);

// Event listener for redo button
document.querySelector("#redo").addEventListener("click", redo);

/**
 * Uploads the canvas image file to the server.
 */
const uploadCanvasImage = () => {
    const imageDataURL = canvas.toDataURL();
    fetch(imageDataURL)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], 'canvas_image.jpg', { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', file);

            fetch("https://url-shortener-ik5w.onrender.com/api/upload/image", {
                method: 'POST',
                body: formData,
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Failed to upload canvas image');
                }
                return response.json(); // Parse the JSON response
            }).then(data => {
                loader.style.display = "none";
                popupContent.style.display = "block";

                const linkInput = document.getElementById("linkInput");
                if (data && data.result) {
                    linkInput.value = data.result; // Set the value of linkInput
                    alert('Canvas image uploaded successfully');
                } else {
                    alert('Failed to get result key from response');
                }
            }).catch(error => {
                alert('Error handling response:', error);
                // Optionally handle errors or UI updates
            });
        }).catch(error => {
            alert('Error converting canvas image to file:', error);
            // Optionally handle errors or UI updates
        });
};




// Get the button that opens the popup
var shareBtn = document.getElementById("shareBtn");

// Get the popup
var sharePopup = document.getElementById("sharePopup");
var loader = document.getElementsByClassName("loader")[0];
var popupContent = document.getElementsByClassName("popup-content")[0];


// Get the <span> element that closes the popup
var closeBtn = document.getElementById("popupClose");

// When the user clicks the button, open the popup 
shareBtn.onclick = function () {
    sharePopup.style.display = "block";
    uploadCanvasImage();
}

// When the user clicks on <span> (x), close the popup
closeBtn.onclick = function () {
    sharePopup.style.display = "none";
}

// Function to copy the link
const copyLink = () => {
    var copyText = document.getElementById("linkInput");
    copyText.select();
    document.execCommand("copy");
    alert("Link copied to clipboard!");
}
document.querySelector("#copy-link").addEventListener("click", copyLink);
