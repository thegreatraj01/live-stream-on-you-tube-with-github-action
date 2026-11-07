const { spawnSync } = require("child_process");
const path = require("path");

const [videoPathArgument, ...extraArguments] = process.argv.slice(2);

if (!videoPathArgument || extraArguments.length > 0) {
  console.error("Usage: node scripts/check-video.js <video-file>");
  process.exit(1);
}

const videoPath = path.resolve(videoPathArgument);
const supportedFormats = new Map([
  ["mov", "MOV, MP4, MPEG4, or 3GPP"],
  ["avi", "AVI"],
  ["asf", "WMV"],
  ["mpeg", "MPEG-1, MPEG-2, MPG, or MPEGPS"],
  ["flv", "FLV"],
  ["webm", "WebM"],
]);
const supportedVideoCodecs = new Map([
  ["h264", "H.264"],
  ["hevc", "HEVC/H.265"],
  ["mpeg1video", "MPEG-1 Video"],
  ["mpeg2video", "MPEG-2 Video"],
  ["mpeg4", "MPEG-4 Part 2"],
  ["prores", "Apple ProRes"],
  ["dnxhd", "Avid DNxHR/DNxHD"],
  ["cfhd", "GoPro CineForm"],
  ["vp8", "VP8"],
  ["vp9", "VP9"],
]);
const supportedAudioCodecs = new Map([
  ["aac", "AAC-LC"],
  ["opus", "Opus"],
  ["iamf", "Eclipsa Audio (IAMF)"],
]);

const result = spawnSync(
  "ffprobe",
  [
    "-v",
    "error",
    "-show_entries",
    "format=format_name:stream=codec_type,codec_name,profile",
    "-of",
    "json",
    videoPath,
  ],
  {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  },
);

if (result.error) {
  console.error(`Error: Could not start ffprobe: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`Error: Could not inspect "${videoPath}" with ffprobe.`);
  if (result.stderr?.trim()) {
    console.error(result.stderr.trim());
  }
  process.exit(result.status ?? 1);
}

let metadata;
try {
  metadata = JSON.parse(result.stdout);
} catch (error) {
  console.error(`Error: Could not parse ffprobe output: ${error.message}`);
  process.exit(1);
}

const formatNames = metadata.format?.format_name?.split(",") ?? [];
const streams = metadata.streams ?? [];
const videoStreams = streams.filter((stream) => stream.codec_type === "video");
const audioStreams = streams.filter((stream) => stream.codec_type === "audio");
const formatLabels = [
  ...new Set(
    formatNames
      .filter((formatName) => supportedFormats.has(formatName))
      .map((formatName) => supportedFormats.get(formatName)),
  ),
];

if (
  formatNames.includes("mxf") &&
  videoStreams.some((stream) => stream.codec_name === "dnxhd")
) {
  formatLabels.push("DNxHR");
}

if (formatLabels.length === 0) {
  console.error(
    `Error: YouTube does not list this container as supported (${formatNames.join(", ") || "unknown"}).`,
  );
  process.exit(1);
}

if (videoStreams.length === 0) {
  console.error(`Error: No video stream was found in "${videoPath}".`);
  process.exit(1);
}

const unsupportedVideoCodecs = [
  ...new Set(
    videoStreams
      .filter((stream) => !supportedVideoCodecs.has(stream.codec_name))
      .map((stream) => stream.codec_name ?? "unknown"),
  ),
];

if (unsupportedVideoCodecs.length > 0) {
  console.error(
    `Error: YouTube compatibility check does not allow video codec(s): ${unsupportedVideoCodecs.join(", ")}.`,
  );
  process.exit(1);
}

const unsupportedAudioCodecs = [
  ...new Set(
    audioStreams
      .filter(
        (stream) =>
          !supportedAudioCodecs.has(stream.codec_name) ||
          (stream.codec_name === "aac" && stream.profile !== "LC"),
      )
      .map((stream) =>
        stream.codec_name === "aac"
          ? `${stream.codec_name} (${stream.profile ?? "unknown profile"})`
          : stream.codec_name ?? "unknown",
      ),
  ),
];

if (unsupportedAudioCodecs.length > 0) {
  console.error(
    `Error: YouTube compatibility check does not allow audio codec/profile(s): ${unsupportedAudioCodecs.join(", ")}.`,
  );
  process.exit(1);
}

const videoCodecLabels = [
  ...new Set(
    videoStreams.map((stream) => supportedVideoCodecs.get(stream.codec_name)),
  ),
];
const audioCodecLabels = [
  ...new Set(
    audioStreams.map((stream) => supportedAudioCodecs.get(stream.codec_name)),
  ),
];

console.log(`YouTube-listed format: ${formatLabels.join(", ")}`);
console.log(`Supported video codec(s): ${videoCodecLabels.join(", ")}`);
console.log(
  `Supported audio codec(s): ${
    audioCodecLabels.length > 0
      ? audioCodecLabels.join(", ")
      : "none (no audio stream)"
  }`,
);
console.log("Metadata check passed; the original video will be uploaded unchanged.");
