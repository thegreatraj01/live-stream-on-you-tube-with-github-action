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

const videoFile = process.env.VIDEO_FILE?.trim() || "video.mp4";
if (!["video.mp4", "video2.mp4"].includes(videoFile)) {
  console.error(
    `Error: Unsupported video file "${videoFile}". Use video.mp4 or video2.mp4.`,
  );
  process.exit(1);
}

const videoPath = path.join(__dirname, "..", "release-assets", videoFile);
if (!fs.existsSync(videoPath)) {
  console.error(
    `Error: Release video asset not found at ${videoPath}. Add ${videoFile} to the daily-stream GitHub Release.`,
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
  const streamArgs = [
    "-re",
    "-i",
    videoPath,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-b:v",
    "6800k",
    "-minrate",
    "6800k",
    "-maxrate",
    "6800k",
    "-bufsize",
    "13600k",
    "-x264-params",
    "nal-hrd=cbr",
    "-force_key_frames",
    "expr:gte(t,n_forced*2)",
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
    await spawnFfmpeg(streamArgs, "transcoded");
  } catch (error) {
    console.error("Streaming failed.");
    console.error(error.message);
    process.exit(1);
  }
}

streamVideo();
