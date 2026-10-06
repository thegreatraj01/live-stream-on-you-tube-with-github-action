# 🚀 Automated Daily YouTube Live Streamer

An automated, serverless solution to stream pre-recorded videos live to YouTube using **GitHub Actions**, **Node.js**, and **FFmpeg**. This setup runs completely in the cloud without keeping your computer or mobile device powered on.

---

## 📌 Features

- **0% Local CPU/Bandwidth Usage:** Streaming happens on GitHub's cloud runners.
- **Git LFS Video Storage:** Large video files are stored with Git LFS; FFmpeg is installed by the cloud workflow.
- **Pass-Through Streaming (`-c copy`):** Streams fast and efficiently without quality loss or heavy re-encoding delay.
- **Flexible Scheduling:** Run streams automatically every day at a specific time or trigger them manually on demand.
- **GitHub Actions Streaming:** Runs in the cloud; Git LFS storage and bandwidth limits depend on your GitHub plan.

---

## 📂 Project Directory Structure

Your GitHub repository must be organized exactly like this:

```text
youtube-live-streamer/
├── .github/
│   └── workflows/
│       └── stream.yml     # GitHub Actions workflow configuration
├── scripts/
│   └── stream.js          # Node.js script executing FFmpeg
├── video.mp4              # The pre-recorded video file to stream
└── README.md              # Documentation
```

---

## 🔑 Step 1: Getting & Storing Your YouTube Stream Key

> **CRITICAL:** NEVER place your Stream Key directly into your code or public files!

### 1. Get your Stream Key from YouTube Studio

1. Go to [YouTube Studio](https://studio.youtube.com).
2. Click **Create** (top right) ➔ **Go Live**.
3. Under the **Stream Settings** tab, locate **Stream Key (Paste in encoder)**.
4. Click **Copy**.

### Large video files / compatibility tips

- If your `video.mp4` is very large or uses a codec/format that YouTube doesn't accept for direct pass-through, the stream can fail.
- The script first tries a fast `-c copy` stream, then automatically retries with a YouTube-compatible `H.264` + `AAC` transcode.
- For best results, use a single MP4 file encoded as `H.264` video and `AAC` audio, ideally at 1080p/30fps or 60fps.

### 2. Add the Stream Key to GitHub Secrets

1. Open your repository on GitHub.
2. Go to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Click the green **New repository secret** button.
4. Set **Name** to: `YOUTUBE_STREAM_KEY`
5. Paste your YouTube stream key into **Secret**.
6. Click **Add secret**.

---

## 🎬 Step 2: How to Change Your Video Daily

The video is stored with Git LFS because it is larger than GitHub's 100 MB regular Git file limit. Git LFS has separate storage and bandwidth quotas, so check your GitHub plan before uploading or streaming large files frequently.

To update the video that will go live on your next scheduled stream:

1. Install Git LFS from [git-lfs.com](https://git-lfs.com/) if it is not already installed, then run `git lfs install` once.
2. Replace `video.mp4` in the repository root.
3. Commit and push the updated video:
   ```bash
   git lfs track "video.mp4"
   git add video.mp4
   git add .gitattributes
   git commit -m "Update video for today's stream"
   git push origin main
   ```
   The workflow checks out Git LFS files so the runner receives the real video, not just the LFS pointer.

### Fixing the current rejected push

The existing commit contains `video.mp4` as a regular Git blob, so adding LFS tracking alone will not fix its push. After committing the LFS configuration and any pending changes, rewrite the local history to convert the video:

```bash
git lfs install
git lfs migrate import --include="video.mp4" --include-ref=refs/heads/main
git push -u origin main
```

This rewrites local commit IDs. The push command above is suitable when the GitHub repository has no commits yet. If the remote already has commits, coordinate before pushing rewritten history.

---

## ⏰ Step 3: Changing the Daily Stream Time

The stream timing is managed using a **Cron Schedule** inside `.github/workflows/stream.yml`.

Use [`timezone-converter.html`](./timezone-converter.html) to convert a local date and time to UTC and generate a GitHub Actions cron expression. The current workflow runs daily at **16:15 UTC / 21:45 IST**.

GitHub Actions scheduled workflows use UTC and are not guaranteed to start at the exact minute: GitHub may delay them (sometimes by up to an hour), and under heavy load a scheduled event can be dropped. The workflow must also be present on the repository's default branch. Check the **Actions** tab for a run whose event is `schedule`; manual runs appear as `workflow_dispatch`. The workflow logs the trigger type and runner's UTC time to help distinguish them.

### How to Edit the Schedule:

Open `.github/workflows/stream.yml` and modify the `cron` line:

```yaml
on:
  schedule:
    - cron: "15 16 * * *" # Runs daily at 16:15 UTC / 21:45 IST
```

### Understanding Cron syntax in UTC:

- GitHub Actions operates on **UTC time** (Coordinated Universal Time).
- Format: `minute hour day month day-of-week`

| Desired Local Time | UTC Equivalent       | Cron Syntax            |
| :----------------- | :------------------- | :--------------------- |
| **2:00 PM UTC**    | 14:00 UTC            | `- cron: '0 14 * * *'` |
| **8:00 PM EST**    | 01:00 UTC (Next Day) | `- cron: '0 1 * * *'`  |
| **9:45 PM IST**    | 16:15 UTC            | `- cron: '15 16 * * *'` |

_Tip: You can use [crontab.guru](https://crontab.guru/) to calculate cron timings easily._

---

## 📝 Step 4: Changing Stream Details (Title, Description, Thumbnail)

When streaming via custom RTMP stream keys, **YouTube handles video details on YouTube Studio**, not inside FFmpeg.

### Where to edit details on YouTube:

1. Go to [YouTube Live Control Room](https://studio.youtube.com/channel/uc/livestreaming).
2. Click **Edit** in the top right corner.
3. From here, you can change:
   - **Stream Title**
   - **Description & Tags**
   - **Thumbnail Image**
   - **Category & Visibility** (Public, Unlisted, or Private)
   - **Monetization & Chat Settings**

_Note: Changes made in YouTube Studio apply instantly to whichever video is currently streaming via your stream key._

---

## ⚡ How to Trigger a Stream Manually

You don't have to wait for the scheduled time to test or launch a stream:

1. Go to the **Actions** tab in your GitHub repository.
2. Select **Daily YouTube Stream** from the left sidebar.
3. Click the **Run workflow** dropdown button on the right.
4. Click **Run workflow** to start the stream immediately.

---

## 💡 Important Best Practices & Tips

1. **Video Format Recommendations:**
   - **Container:** `.mp4`
   - **Video Codec:** `H.264` (AAC Audio)
   - **Resolution:** 1080p (1920x1080) at 30fps or 60fps
2. **First-Time YouTube Channel Verification:**
   - If live streaming has never been enabled on your channel, YouTube requires phone verification and up to a **24-hour waiting period** before your first broadcast.
3. **GitHub Private vs. Public Repositories:**
   - **Public Repositories:** GitHub Actions provides **unlimited free runner minutes**.
   - **Private Repositories:** Accounts receive 2,000 free minutes per month (sufficient for ~16 days of 2-hour daily streams).
