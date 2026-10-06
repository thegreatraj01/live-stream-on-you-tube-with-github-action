const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");

const YOUTUBE_STREAM_KEY = process.env.YOUTUBE_STREAM_KEY?.trim();
if (!YOUTUBE_STREAM_KEY) {
  console.error(
    "Error: YOUTUBE_STREAM_KEY is missing from Repository Secrets.",
  );
  process.exit(1);
}

const videoPath = path.join(__dirname, "..", "video.mp4");
if (!fs.existsSync(videoPath)) {
  console.error(
    `Error: Video file not found at ${videoPath}. Add a valid video.mp4 in the repository root.`,
  );
  process.exit(1);
}

const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${YOUTUBE_STREAM_KEY}`;

// Stream copy (-c copy) passes video without heavy CPU encoding.
// If the source file is not compatible with YouTube's RTMP input, FFmpeg will fail
// clearly instead of crashing silently or starting with a misleading setup.
const ffmpegArgs = [
  "-re",
  "-i",
  videoPath,
  "-c:v",
  "copy",
  "-c:a",
  "copy",
  "-f",
  "flv",
  rtmpUrl,
];

console.log("Starting live stream to YouTube...");
const ffmpeg = spawn("ffmpeg", ffmpegArgs);

ffmpeg.on("error", (error) => {
  console.error(`Failed to start FFmpeg: ${error.message}`);
  process.exit(1);
});

ffmpeg.stdout.on("data", (data) => process.stdout.write(data));
ffmpeg.stderr.on("data", (data) => process.stderr.write(data));

ffmpeg.on("close", (code) => {
  if (code === 0) {
    console.log("FFmpeg process finished successfully.");
    return;
  }

  console.error(`FFmpeg process finished with code ${code}.`);
  process.exit(code || 1);
});
