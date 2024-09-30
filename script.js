// Function to check if the user is on a mobile device
function isMobileDevice() {
    // Enhanced detection for mobile devices using the user agent
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Execute this function as soon as the script loads
if (isMobileDevice()) {
    // Display a notification to the user if on mobile
    alert("Sorry, this app is not currently supported on mobile devices. Please visit from a desktop browser.");

    // Show a custom message on the page and stop further execution
    document.body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h1>Blakeroom</h1>
            <p>Sorry, this app is not supported on mobile devices at the moment.</p>
            <p>Please try again from a desktop browser.</p>
        </div>
    `;
} else {
    console.log("Not a mobile device. Proceeding with desktop initialization.");

    // Only execute the main logic if the device is not mobile
    // Variables to track gaze detection history
    let gazeHistory = [];
    const maxHistoryLength = 10;  // Number of frames to keep in history for smoothing
    const sensitivityThreshold = 3;  // Increase to reduce sensitivity (try values like 0.05 to 0.15)

    // Load Models
    async function loadModels() {
        try {
            console.log("Loading models...");
            await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
            console.log("Models loaded successfully.");
        } catch (error) {
            console.error("Error loading models:", error);
            document.body.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h1>Blakeroom</h1>
                    <p>Sorry, there was an error loading the models. Please check your internet connection or try again later.</p>
                    <p>Error: ${error.name} - ${error.message}</p>
                </div>
            `;
        }
    }

    // Setup Camera
    async function setupCamera() {
        const video = document.getElementById('video');

        const constraints = {
            video: {
                facingMode: 'user', // Use the front camera if available
                width: { ideal: 640 }, // Lower the resolution to make it more compatible
                height: { ideal: 480 }
            }
        };

        try {
            console.log("Setting up camera...");
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                console.log("Camera setup complete and video is playing.");
            };
        } catch (error) {
            console.error("Error accessing camera with constraints:", error);
            alert(`Camera access error: ${error.name} - ${error.message}. Please enable camera permissions in your device settings or try again from a desktop browser.`);
            
            document.body.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h1>Blakeroom</h1>
                    <p>Sorry, the app cannot access your camera. Please check your permissions and try again.</p>
                    <p>Error: ${error.name} - ${error.message}</p>
                    <p>If the problem persists, please try using a desktop browser instead.</p>
                </div>
            `;
        }
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
                try {
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
                } catch (error) {
                    console.error("Error during frame analysis:", error);
                }
            }, 100);  // Adjust interval as needed for performance
        });
    }

    // Main function to start the app
    async function main() {
        try {
            console.log("Initializing app...");
            await loadModels();
            await setupCamera();
            analyzeFrames();
        } catch (error) {
            console.error("Error initializing app:", error);
            document.body.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h1>Blakeroom</h1>
                    <p>Sorry, there was an error initializing the app. Please try again later.</p>
                    <p>Error: ${error.name} - ${error.message}</p>
                </div>
            `;
        }
    }

    // Run the main function only if not on a mobile device
    main();
}
