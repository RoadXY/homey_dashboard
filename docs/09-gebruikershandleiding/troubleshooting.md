# Troubleshooting Page

The dashboard has a separate troubleshooting area for checking that things work. It is meant for the person who manages the dashboard, not for everyday use.

## Opening the page

Open this address in a browser:

```
http://<dashboard-address>/troubleshooting
```

Use the same address and port as the dashboard itself. For example, if the dashboard runs at `http://192.168.1.50:5173`, open `http://192.168.1.50:5173/troubleshooting`.

The page shows:

- whether the dashboard server is running;
- whether the dashboard is connected to Homey;
- which browser you are using;
- a list of available tools.

The troubleshooting pages are only available in English.

## Camera & H.265 video test

Cameras in Homey often send their video in a format called **H.265** (also known as HEVC). Homey forwards that video unchanged, so the browser has to be able to play H.265 itself. Not every browser or tablet can.

Open the test in the browser you want to check. Usually this is Fully Kiosk on the wall tablet. Either choose **Camera & H.265 video** on the troubleshooting page, or go directly to:

```
http://<dashboard-address>/troubleshooting/camera
```

### Step 1 – Browser codec support

This part runs automatically and needs no PIN. The most important lines are:

- **WebRTC receive H.265** – "yes" means the browser says it can play H.265 live video.
- **WebRTC receive H.264** – the older, more widely supported format.

The coloured message below the table summarises the result.

### Step 2 – Live Homey camera test

1. Enter the dashboard **Settings PIN** and choose **Unlock**. Camera images are private, so the PIN is required.
2. Choose a camera.
3. Leave **Codec** set to *Automatic (prefer H.265)*.
4. Choose **Start live test**.

After a few seconds you should see live video. The coloured message tells you the result:

| Message | Meaning |
|---|---|
| Green: "Success: this browser decodes …" | Live camera video works in this browser. |
| "WebRTC connection failed" | The device cannot reach Homey over the network. Ask your network administrator to allow traffic from the tablet to Homey on port 8555. |
| "Video packets arrive but no frames are decoded" | The video reaches the browser, but the browser cannot play this format. |
| "codecs not matched" or "Homey sends no video" | The camera sends a format this browser does not support. |

**Load snapshot** shows a single still image from the camera. Snapshots work in every browser.

The live video is muted. Use the video controls to turn on the sound.

Choose **Stop** when you are done. The stream also stops when you leave the page.

### When H.265 does not work

If the test shows that the browser cannot play H.265, you have two options:

- Use a different browser or device that supports H.265.
- Switch the camera to H.264 in the camera's own app. For UniFi Protect cameras, change the encoding from "Enhanced" to "Standard". After that, run the test again with **Codec** set to *H.264 only*.

### Step 3 – Report

The report at the bottom summarises all results. Choose **Copy report** and paste it when you ask for help. The report contains no passwords or keys.
