const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPOSITORY = "thegreatraj01/live-stream-on-you-tube-with-github-action";
const RELEASE_TAG = "daily-stream";
const MAX_RELEASE_ASSET_SIZE = 2 * 1024 ** 3;
const allowedVideos = new Set(["video.mp4", "video2.mp4"]);
const selectedVideos = process.argv.slice(2);
const rootDirectory = path.resolve(__dirname, "..");
const checkerPath = path.join(__dirname, "check-video.js");

if (
  selectedVideos.length === 0 ||
  selectedVideos.some((video) => !allowedVideos.has(video)) ||
  new Set(selectedVideos).size !== selectedVideos.length
) {
  console.error(
    "Usage: node scripts/upload-release.js <video.mp4> [video2.mp4]",
  );
  process.exit(1);
}

const videoPaths = selectedVideos.map((video) =>
  path.join(rootDirectory, "videos", video),
);
let validationFailed = false;

for (const videoPath of videoPaths) {
  let videoStats;

  try {
    videoStats = fs.statSync(videoPath);
  } catch (error) {
    console.error(`Error: Could not access "${videoPath}": ${error.message}`);
    validationFailed = true;
    continue;
  }

  if (!videoStats.isFile()) {
    console.error(`Error: "${videoPath}" is not a file.`);
    validationFailed = true;
    continue;
  }

  if (videoStats.size >= MAX_RELEASE_ASSET_SIZE) {
    console.error(
      `Error: "${videoPath}" must be smaller than 2 GiB to upload as a GitHub Release asset.`,
    );
    validationFailed = true;
    continue;
  }

  console.log(`\nValidating ${path.basename(videoPath)} before upload...`);
  const validation = spawnSync(
    process.execPath,
    [checkerPath, videoPath],
    { stdio: "inherit", windowsHide: true },
  );

  if (validation.error) {
    console.error(
      `Error: Could not run the video format check: ${validation.error.message}`,
    );
    validationFailed = true;
    continue;
  }
  if (validation.status !== 0) {
    validationFailed = true;
  }
}

if (validationFailed) {
  process.exit(1);
}

function runGh(args, label) {
  const result = spawnSync("gh", args, {
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.error) {
    console.error(`Error: Could not start GitHub CLI: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status ?? "unknown"}.`);
    process.exit(result.status ?? 1);
  }
}

runGh(["auth", "status"], "GitHub CLI authentication check");

const releaseCheck = spawnSync(
  "gh",
  ["release", "view", RELEASE_TAG, "--repo", REPOSITORY],
  { encoding: "utf8", windowsHide: true },
);

if (releaseCheck.error) {
  console.error(
    `Error: Could not start GitHub CLI: ${releaseCheck.error.message}`,
  );
  process.exit(1);
}

const releaseExists = releaseCheck.status === 0;
const releaseDiagnostic = `${releaseCheck.stderr ?? ""}\n${releaseCheck.stdout ?? ""}`;
const releaseMissing = /release not found|HTTP 404|404 Not Found/i.test(
  releaseDiagnostic,
);

if (!releaseExists && !releaseMissing) {
  if (releaseCheck.stderr) {
    process.stderr.write(releaseCheck.stderr);
  }
  if (releaseCheck.stdout) {
    process.stdout.write(releaseCheck.stdout);
  }
  console.error(
    `Error: Could not check the "${RELEASE_TAG}" release (exit code ${releaseCheck.status ?? "unknown"}).`,
  );
  process.exit(releaseCheck.status ?? 1);
}

if (releaseExists) {
  runGh(
    [
      "release",
      "upload",
      RELEASE_TAG,
      ...videoPaths,
      "--repo",
      REPOSITORY,
      "--clobber",
    ],
    "GitHub Release upload",
  );
} else {
  runGh(
    [
      "release",
      "create",
      RELEASE_TAG,
      ...videoPaths,
      "--repo",
      REPOSITORY,
      "--title",
      "Daily Streaming Video",
      "--notes",
      "Video assets used by the daily YouTube stream workflow.",
    ],
    "GitHub Release creation",
  );
}
