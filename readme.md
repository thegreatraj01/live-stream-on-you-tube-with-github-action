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
├── video.mp4              # Video streamed at 12:00 PM IST
├── video2.mp4             # Video streamed at 12:00 PM New York time
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

## 🎬 Step 2: Add or Change the Stream Videos

The videos are stored with Git LFS because they may be larger than GitHub's 100 MB regular Git file limit. Git LFS has separate storage and bandwidth quotas, so check your GitHub plan before uploading or streaming large files frequently. The noon IST job streams `video.mp4`; the noon New York job streams `video2.mp4`.

To add or update either video:

1. Install Git LFS from [git-lfs.com](https://git-lfs.com/) if it is not already installed, then run `git lfs install` once.
2. Put the videos named `video.mp4` and `video2.mp4` in the repository root. To track both with Git LFS, run:
   ```bash
   git lfs track "video.mp4" "video2.mp4"
   ```
3. Commit and push the updated video:
   ```bash
   git add video.mp4 video2.mp4
   git add .gitattributes
   git commit -m "Update stream videos"
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

## ⏰ Step 3: Schedule Both Daily Streams with cron-job.org

GitHub Actions scheduled workflows may start late, so these streams are triggered by two cron-job.org jobs using GitHub's `repository_dispatch` API:

- Each cron-job.org job sends an HTTPS `POST` request to GitHub at noon in its configured timezone.
- Choose the timezone itself instead of converting noon to a fixed UTC time.
- The `America/New_York` timezone automatically follows daylight saving time.

### 1. Create a GitHub token for cron-job.org

- Before configuring cron-job.org:
  - Push this workflow to the repository's **default branch**.
  - Confirm GitHub Actions is enabled.
  - Ensure `video.mp4` and `video2.mp4` (including their Git LFS data, if used) are committed.
- On GitHub, open **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**, then create a token with:
  - A descriptive name, such as `cron-job.org YouTube streams`.
  - The repository owner as the resource owner.
  - Repository access restricted to `live-stream-on-you-tube-with-github-action`.
  - **Repository permissions → Contents** set to **Read and write**.
  - An expiration date appropriate for your use.
- Save the token securely when it is created; GitHub only displays it once.
- A classic personal access token with the `repo` scope also works, but a repository-restricted fine-grained token is preferred.
- Never put the token in the request URL, request body, workflow file, or README. Add it only as the cron-job.org `Authorization` header.
- Revoke the token if it is exposed or no longer needed, and replace it in both cron jobs before it expires.

### 2. Create the daily noon IST job

- Sign in at [cron-job.org](https://cron-job.org/) and create a new cron job.
- Name it **YouTube stream - noon IST**.
- Set the schedule to every day at **12:00 PM**.
- Set the timezone to **Asia/Kolkata**.
- If the service asks for a cron expression, enter `0 12 * * *` and still set the timezone to **Asia/Kolkata**.
- In the job's URL/HTTP request settings (labels may vary slightly), set:
  - **Request URL:** `https://api.github.com/repos/thegreatraj01/live-stream-on-you-tube-with-github-action/dispatches`
  - **Request method:** `POST`
  - **Request headers:** add each as a separate name/value pair:
    ```text
    Accept: application/vnd.github+json
    X-GitHub-Api-Version: 2022-11-28
    Content-Type: application/json
    ```
  - **Authorization header:** enter the word `Bearer`, one space, then your GitHub token. Do not include quotes or angle brackets.
- Choose raw JSON (or equivalent) for the request body/payload and enter:
    ```json
    {"event_type":"noon-ist"}
    ```
- Save and enable the job.

#### Import from cURL, wget, or crontab

In cron-job.org, choose **Import from cURL** and paste either the cURL command or full crontab line below. The importer can populate the request and schedule fields. Replace `YOUR_GITHUB_TOKEN` with your token before importing; never save or share a command containing the real token.

```bash
curl --request POST \
  --url 'https://api.github.com/repos/thegreatraj01/live-stream-on-you-tube-with-github-action/dispatches' \
  --header 'Accept: application/vnd.github+json' \
  --header 'Authorization: Bearer YOUR_GITHUB_TOKEN' \
  --header 'X-GitHub-Api-Version: 2022-11-28' \
  --header 'Content-Type: application/json' \
  --data '{"event_type":"noon-ist"}'
```

Alternatively, import this complete crontab line to populate the daily noon schedule as well as the request:

```cron
0 12 * * * curl --request POST --url 'https://api.github.com/repos/thegreatraj01/live-stream-on-you-tube-with-github-action/dispatches' --header 'Accept: application/vnd.github+json' --header 'Authorization: Bearer YOUR_GITHUB_TOKEN' --header 'X-GitHub-Api-Version: 2022-11-28' --header 'Content-Type: application/json' --data '{"event_type":"noon-ist"}'
```

If you prefer `wget`, the equivalent request is:

```bash
wget --method=POST \
  --header='Accept: application/vnd.github+json' \
  --header='Authorization: Bearer YOUR_GITHUB_TOKEN' \
  --header='X-GitHub-Api-Version: 2022-11-28' \
  --header='Content-Type: application/json' \
  --body-data='{"event_type":"noon-ist"}' \
  -O- 'https://api.github.com/repos/thegreatraj01/live-stream-on-you-tube-with-github-action/dispatches'
```

After importing, verify the URL, method, headers, body, and daily **12:00 PM** schedule. Set the timezone to **Asia/Kolkata** in cron-job.org; the crontab expression specifies the time but does not reliably carry a timezone setting through import.

### 3. Create the daily noon New York job

- Create a second cron job with the same URL, method, headers, and raw JSON content type.
- Name it **YouTube stream - noon New York**.
- Set the schedule to every day at **12:00 PM** and timezone to **America/New_York**.
- Set its request body to:
  ```json
  {"event_type":"noon-new-york"}
  ```
- To import this job, use the same cURL command or crontab line above, but change the request body to `{"event_type":"noon-new-york"}`. After importing, set the schedule to **12:00 PM** and timezone to **America/New_York**.
- The `noon-ist` event streams `video.mp4`; the `noon-new-york` event streams `video2.mp4`.
- Since each job uses its local timezone, both stay at noon year-round even though New York's equivalent UTC time changes with daylight saving time.

### 4. Confirm the jobs

- Before the next scheduled noon, use cron-job.org's **Run now** or test option for each job, if available.
- Open the repository's **Actions** tab and confirm a **Scheduled YouTube Live Stream** run starts for each event. The workflow logs the trigger and selected video file.
- Check cron-job.org's execution history. A successful GitHub dispatch normally returns HTTP **`204`** with an empty response body.
- If a request fails, check its HTTP status and response:
  - `401`: the token is usually invalid or expired.
  - `403`: the token may lack permission or repository access.
  - `404`: the repository URL may be incorrect, or the token may not have access.
  - `422`: the request body may be invalid.
- Confirm the event type is spelled exactly as shown and the body is valid JSON.
- After both tests pass, confirm both jobs are enabled and their next-run times show noon in the intended timezones.
- GitHub still needs to provision a runner after receiving the dispatch, so cron-job.org improves trigger timing but cannot guarantee the stream is live at the exact second.
- If a job is triggered but the broadcast does not appear, check YouTube Studio as well as the Actions run.

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
2. Select **Scheduled YouTube Live Stream** from the left sidebar.
3. Click the **Run workflow** dropdown button, choose `video.mp4` or `video2.mp4`, and click **Run workflow**.

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
