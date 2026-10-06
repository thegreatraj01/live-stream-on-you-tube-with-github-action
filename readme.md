# 🚀 Automated Daily YouTube Live Streamer

An automated, serverless solution to stream pre-recorded videos live to YouTube using **GitHub Actions**, **Node.js**, and **FFmpeg**. This setup runs completely in the cloud without keeping your computer or mobile device powered on.

---

## 📌 Features

- **0% Local CPU/Bandwidth Usage:** Streaming happens on GitHub's cloud runners.
- **No Binary Uploads Required:** FFmpeg is automatically installed on runtime by the cloud environment.
- **Pass-Through Streaming (`-c copy`):** Streams fast and efficiently without quality loss or heavy re-encoding delay.
- **Flexible Scheduling:** Run streams automatically every day at a specific time or trigger them manually on demand.
- **Zero Cost Setup:** Completely free using GitHub Actions.

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

### 2. Add the Stream Key to GitHub Secrets

1. Open your repository on GitHub.
2. Go to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Click the green **New repository secret** button.
4. Set **Name** to: `YOUTUBE_STREAM_KEY`
5. Paste your YouTube stream key into **Secret**.
6. Click **Add secret**.

---

## 🎬 Step 2: How to Change Your Video Daily

To update the video that will go live on your next scheduled stream:

1. Delete or overwrite the existing `video.mp4` in the root folder of your repository.
2. Upload your new video file and ensure it is named exactly `video.mp4`.
3. Commit and push your changes to GitHub:
   ```bash
   git add video.mp4
   git commit -m "Update video for today's stream"
   git push origin main
   ```
   _The next time the GitHub Action runs, it will stream the newly uploaded `video.mp4`._

---

## ⏰ Step 3: Changing the Daily Stream Time

The stream timing is managed using a **Cron Schedule** inside `.github/workflows/stream.yml`.

### How to Edit the Schedule:

Open `.github/workflows/stream.yml` and modify the `cron` line:

```yaml
on:
  schedule:
    - cron: "0 14 * * *" # Runs daily at 14:00 UTC
```

### Understanding Cron syntax in UTC:

- GitHub Actions operates on **UTC time** (Coordinated Universal Time).
- Format: `minute hour day month day-of-week`

| Desired Local Time | UTC Equivalent       | Cron Syntax            |
| :----------------- | :------------------- | :--------------------- |
| **2:00 PM UTC**    | 14:00 UTC            | `- cron: '0 14 * * *'` |
| **8:00 PM EST**    | 01:00 UTC (Next Day) | `- cron: '0 1 * * *'`  |
| **5:30 PM IST**    | 12:00 UTC            | `- cron: '0 12 * * *'` |

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
