// Variables to track gaze detection history
let gazeHistory = [];
const maxHistoryLength = 10;  // Number of frames to keep in history for smoothing
const sensitivityThreshold = 3;  // Increase to reduce sensitivity (try values like 0.05 to 0.15)

// Load Models
async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/eyecontact/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/eyecontact/models');
}

async function setupCamera() {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
}

// Function to check if user is looking at screen
function isLookingAtScreen(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();

    // Calculate the center of left and right eyes and nose
    const leftEyeCenterX = (leftEye[0].x + leftEye[3].x) / 2;
    const rightEyeCenterX = (rightEye[0].x + rightEye[3].x) / 2;
    const noseX = nose[0].x;

    // Calculate the average center position of the eyes
    const eyeCenterX = (leftEyeCenterX + rightEyeCenterX) / 2;

    // Determine if the user is looking at the screen based on alignment of eye center and nose
    return Math.abs(eyeCenterX - noseX) < sensitivityThreshold;
}

// Function to analyze video frames and detect gaze
async function analyzeFrames() {
    const video = document.getElementById('video');
    const options = new faceapi.TinyFaceDetectorOptions();

    video.addEventListener('play', () => {
        setInterval(async () => {
            const detections = await faceapi.detectSingleFace(video, options).withFaceLandmarks();
            if (detections && detections.landmarks) {
                const lookingAtScreen = isLookingAtScreen(detections.landmarks);

                // Maintain a history of gaze detections
                gazeHistory.push(lookingAtScreen);
                if (gazeHistory.length > maxHistoryLength) gazeHistory.shift();  // Keep history size manageable

                // Calculate the average of recent gaze detections
                const lookingAtScreenSmoothed = gazeHistory.filter(val => val).length / gazeHistory.length > 0.5;

                // Set background color based on smoothed detection result
                document.body.style.backgroundColor = lookingAtScreenSmoothed ? 'green' : 'red';
            }
        }, 5);  // Adjust interval as needed for performance
    });
}

// Main function to start the app
async function main() {
    await loadModels();
    await setupCamera();
    analyzeFrames();
}

main();
