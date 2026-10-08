# Upload or Replace Stream Videos on GitHub Releases

This guide explains how to upload the videos in the repository's `videos` folder to the GitHub Release used by the streaming workflow. The commands are written for Windows Command Prompt (CMD), like the `D:\...>` prompt. They also work in PowerShell.

## How the workflow uses the release

The workflow downloads video assets from the published release tagged `daily-stream`. The asset names must match exactly:

| Release asset | Used by |
| --- | --- |
| `video.mp4` | Noon IST stream and the default manual run |
| `video2.mp4` | Noon New York stream |

The files you upload are `videos\video.mp4` and `videos\video2.mp4` in your local repository. Keep those filenames unchanged. The release assets are separate from files committed to Git; do not commit the video files to the repository.

## 1. Replace the local videos

1. Open Command Prompt in the repository folder (the folder containing `.git`).
2. Replace the relevant file or files inside `videos`.
3. Keep the exact required filename or filenames from the table above. If your replacement video has a different name, rename it to the required name before uploading.
4. Check that the intended files exist and note their sizes:

   ```cmd
   dir videos\video*.mp4
   ```

   If you are replacing only one video, check only that file, for example:

   ```cmd
   dir videos\video.mp4
   ```

GitHub Release assets must each be smaller than 2 GiB. Keep a separate local copy of your videos; uploading them does not back up or modify your local files.

## 2. Check GitHub CLI access

Confirm that `gh` is installed and authenticated:

```cmd
gh --version
gh auth status
```

If you are not signed in, run:

```cmd
gh auth login
```

Choose **GitHub.com** and the authentication method you prefer, then sign in with an account that has permission to edit releases in this repository. No token needs to be pasted into the commands below.

Check that GitHub CLI can access the intended repository:

```cmd
gh repo view thegreatraj01/live-stream-on-you-tube-with-github-action
```

Check that the repository shown is the intended one before proceeding.

## 3. Upload the files

Run the command for the case that applies to you from the repository folder.

### First upload: the `daily-stream` release does not exist yet

Create and publish the release with both assets:

```cmd
gh release create daily-stream videos\video.mp4 videos\video2.mp4 --repo thegreatraj01/live-stream-on-you-tube-with-github-action --title "Daily Streaming Video" --notes "Video assets used by the daily YouTube stream workflow."
```

This creates a published release using the `daily-stream` tag and attaches both videos. Do not create a draft release: the workflow needs to download assets from a published release.

### Replace both videos on an existing release

```cmd
gh release upload daily-stream videos\video.mp4 videos\video2.mp4 --repo thegreatraj01/live-stream-on-you-tube-with-github-action --clobber
```

### Replace only one video

Run only the matching command so the other release asset stays unchanged:

```cmd
gh release upload daily-stream videos\video.mp4 --repo thegreatraj01/live-stream-on-you-tube-with-github-action --clobber
```

or:

```cmd
gh release upload daily-stream videos\video2.mp4 --repo thegreatraj01/live-stream-on-you-tube-with-github-action --clobber
```

`--clobber` replaces an existing release asset with the same filename. Without it, GitHub CLI will not overwrite an asset with a duplicate name. Use it only after checking that the local file is the version you want to publish.

### Replace a video for a daily stream

Repeat these steps on any day you want to stream a different video:

1. Replace the appropriate local file in the `videos` folder, keeping its required filename:
   - `videos\video.mp4` is used for the noon IST stream.
   - `videos\video2.mp4` is used for the noon New York stream.
2. Before that day's scheduled stream starts, upload the replacement to the existing release. Run the command for the video you changed:

   ```cmd
   gh release upload daily-stream videos\video.mp4 --repo thegreatraj01/live-stream-on-you-tube-with-github-action --clobber
   ```

   ```cmd
   gh release upload daily-stream videos\video2.mp4 --repo thegreatraj01/live-stream-on-you-tube-with-github-action --clobber
   ```

   If you replaced both videos, upload both:

   ```cmd
   gh release upload daily-stream videos\video.mp4 videos\video2.mp4 --repo thegreatraj01/live-stream-on-you-tube-with-github-action --clobber
   ```

3. Confirm the release asset listing if needed using the verification command below. Replacing the local file alone does not update GitHub; the scheduled workflow streams the release asset available when its run starts.

## 4. Verify the release assets

List the release and its assets:

```cmd
gh release view daily-stream --repo thegreatraj01/live-stream-on-you-tube-with-github-action
```

Confirm that the uploaded asset names are exactly `video.mp4` and `video2.mp4` (or the one you intended to replace), and that the release is published. If the expected asset is missing or the upload command reported an error, resolve that before starting a stream.

## 5. Run a stream with the updated video (optional)

Uploading or replacing an asset does not start a workflow run. To test a video manually, start the workflow from the repository's default branch:

```cmd
gh workflow run stream.yml --repo thegreatraj01/live-stream-on-you-tube-with-github-action -f video_file=video.mp4
```

To test the second video instead:

```cmd
gh workflow run stream.yml --repo thegreatraj01/live-stream-on-you-tube-with-github-action -f video_file=video2.mp4
```

Find the run and check its progress:

```cmd
gh run list --workflow stream.yml --repo thegreatraj01/live-stream-on-you-tube-with-github-action --limit 5
gh run watch 1234567890 --repo thegreatraj01/live-stream-on-you-tube-with-github-action
```

Replace `1234567890` with the actual run ID shown by `gh run list`. Do not type `$repo` or `RUN_ID` literally: `$repo` is PowerShell variable syntax, not a Command Prompt variable. A successful download step confirms that the workflow could retrieve the release asset. The workflow also needs the repository secret `YOUTUBE_STREAM_KEY` to stream to YouTube.

## Troubleshooting

- **`release not found`**: confirm that the release exists, is published, and uses the tag `daily-stream`. If this is the first upload, use the `gh release create` command above.
- **`asset not found` during a workflow run**: check that the release asset's spelling and capitalization exactly match the requested filename.
- **`HTTP 401` or `HTTP 403`**: run `gh auth status` and confirm your signed-in account has permission to edit releases in this repository.
- **Duplicate asset error**: when updating an existing asset, include `--clobber`.
- **Manual workflow does not show up**: make sure `stream.yml` with `workflow_dispatch` is on the repository's default branch and that Actions are enabled.
- **Video was added to a Git commit by mistake**: stop before pushing. The intended upload is a release asset, not a Git commit. Check `git status` and unstage any video file you did not intend to commit.
