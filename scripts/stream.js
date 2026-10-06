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

function spawnFfmpeg(args, label) {
  return new Promise((resolve, reject) => {
    console.log(`Starting ${label} FFmpeg stream...`);
    const ffmpeg = spawn("ffmpeg", args);

    ffmpeg.on("error", (error) => {
      console.error(`Failed to start ${label} FFmpeg: ${error.message}`);
      reject(error);
    });

    ffmpeg.stdout.on("data", (data) => process.stdout.write(data));
    ffmpeg.stderr.on("data", (data) => process.stderr.write(data));

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log(`${label} FFmpeg process finished successfully.`);
        resolve();
        return;
      }

      const message = `${label} FFmpeg process finished with code ${code}.`;
      console.error(message);
      reject(new Error(message));
    });
  });
}

async function streamVideo() {
  const passthroughArgs = [
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

  const fallbackArgs = [
    "-re",
    "-i",
    videoPath,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-b:a",
    "128k",
    "-f",
    "flv",
    rtmpUrl,
  ];

  try {
    await spawnFfmpeg(passthroughArgs, "passthrough");
  } catch (error) {
    console.warn(
      "Passthrough stream failed. Retrying with a YouTube-compatible H.264/AAC transcode...",
    );
    try {
      await spawnFfmpeg(fallbackArgs, "transcoded");
    } catch (fallbackError) {
      console.error("Streaming failed even after transcode fallback.");
      console.error(fallbackError.message);
      process.exit(1);
    }
  }
}

streamVideo();
