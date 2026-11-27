/*
 * Camera & H.265 troubleshooting page.
 *
 * 1. Detects local codec support (WebRTC receiver capabilities, MSE, <video>, MediaCapabilities).
 * 2. Plays a Homey camera stream via the dashboard backend:
 *    browser SDP offer -> POST /api/troubleshooting/videos/:id/offer -> Homey ManagerVideos (go2rtc)
 *    -> SDP answer; media then flows directly from Homey (port 8555) to this browser.
 *
 * Plain ES2017 without a build step so it runs on older kiosk browsers.
 */
(function () {
  "use strict";

  var KEEP_ALIVE_MS = 5000;
  var STATS_INTERVAL_MS = 1000;
  var ICE_GATHERING_TIMEOUT_MS = 2000;
  var DECODE_GRACE_MS = 8000;

  var report = {
    generatedAt: null,
    page: location.origin + location.pathname,
    userAgent: navigator.userAgent,
    secureContext: Boolean(window.isSecureContext),
    capabilities: {},
    liveTests: []
  };
  var session = null;

  function $(id) { return document.getElementById(id); }
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function badge(kind, text) { return '<span class="badge ' + kind + '">' + escapeHtml(text) + "</span>"; }
  function yesNo(value) {
    if (value === null || value === undefined) return badge("info", "unknown");
    return value ? badge("ok", "yes") : badge("fail", "no");
  }
  function setRows(table, rows) {
    table.innerHTML = rows.map(function (row) {
      return "<tr><th>" + escapeHtml(row[0]) + "</th><td>" + row[1] + "</td></tr>";
    }).join("");
  }
  function setVerdict(element, kind, text) {
    element.className = "verdict " + kind;
    element.textContent = text;
  }
  function updateReport() {
    report.generatedAt = new Date().toISOString();
    $("report").value = JSON.stringify(report, null, 2);
  }

  // ---------------------------------------------------------------- 1. Codec support

  function receiverCodecs() {
    if (!window.RTCRtpReceiver || typeof RTCRtpReceiver.getCapabilities !== "function") return null;
    var caps = RTCRtpReceiver.getCapabilities("video");
    return caps && caps.codecs ? caps.codecs : [];
  }

  function hasCodec(codecs, name) {
    return codecs.some(function (codec) { return codec.mimeType.toLowerCase() === "video/" + name.toLowerCase(); });
  }

  function mseSupport(type) {
    try { return window.MediaSource && typeof MediaSource.isTypeSupported === "function" ? MediaSource.isTypeSupported(type) : null; }
    catch (error) { return null; }
  }

  function canPlay(type) {
    try { return document.createElement("video").canPlayType(type) || "no"; }
    catch (error) { return "unknown"; }
  }

  function mediaCapabilitiesWebRtc(contentType) {
    if (!navigator.mediaCapabilities || typeof navigator.mediaCapabilities.decodingInfo !== "function") return Promise.resolve(null);
    return navigator.mediaCapabilities.decodingInfo({
      type: "webrtc",
      video: { contentType: contentType, width: 1920, height: 1080, bitrate: 4000000, framerate: 25 }
    }).then(function (info) {
      return { supported: info.supported, smooth: info.smooth, powerEfficient: info.powerEfficient };
    }).catch(function (error) { return { error: error.message }; });
  }

  function describeMediaCapabilities(info) {
    if (!info) return badge("info", "API unavailable");
    if (info.error) return badge("info", "error") + " " + escapeHtml(info.error);
    return yesNo(info.supported) + " smooth: " + escapeHtml(info.smooth) + ", power efficient: " + escapeHtml(info.powerEfficient);
  }

  function detectCapabilities() {
    var codecs = receiverCodecs();
    var webrtc = typeof window.RTCPeerConnection === "function";
    var caps = {
      webrtcAvailable: webrtc,
      receiverCodecs: codecs ? codecs.map(function (codec) {
        return codec.mimeType + (codec.sdpFmtpLine ? " [" + codec.sdpFmtpLine + "]" : "");
      }) : null,
      webrtcH265: codecs ? hasCodec(codecs, "H265") : null,
      webrtcH264: codecs ? hasCodec(codecs, "H264") : null,
      mseHevc: mseSupport('video/mp4; codecs="hvc1.1.6.L120.B0"'),
      mseAvc: mseSupport('video/mp4; codecs="avc1.640028"'),
      videoElementHevc: canPlay('video/mp4; codecs="hvc1.1.6.L120.B0"')
    };
    report.capabilities = caps;

    return Promise.all([mediaCapabilitiesWebRtc("video/h265"), mediaCapabilitiesWebRtc("video/h264")]).then(function (results) {
      caps.mediaCapabilitiesWebRtcH265 = results[0];
      caps.mediaCapabilitiesWebRtcH264 = results[1];
      var uniqueCodecs = caps.receiverCodecs ? caps.receiverCodecs.filter(function (value, index, all) { return all.indexOf(value) === index; }) : null;
      setRows($("capabilities"), [
        ["WebRTC (RTCPeerConnection)", yesNo(webrtc)],
        ["WebRTC receive H.265", yesNo(caps.webrtcH265)],
        ["WebRTC receive H.264", yesNo(caps.webrtcH264)],
        ["MediaCapabilities WebRTC H.265 1080p", describeMediaCapabilities(caps.mediaCapabilitiesWebRtcH265)],
        ["MediaCapabilities WebRTC H.264 1080p", describeMediaCapabilities(caps.mediaCapabilitiesWebRtcH264)],
        ["Media Source Extensions HEVC", yesNo(caps.mseHevc)],
        ["&lt;video&gt; canPlayType HEVC", escapeHtml(caps.videoElementHevc)],
        ["All WebRTC receive codecs", uniqueCodecs ? "<pre>" + escapeHtml(uniqueCodecs.join("\n")) + "</pre>" : badge("info", "getCapabilities unavailable")]
      ]);
      var verdict = $("capability-verdict");
      verdict.classList.remove("hidden");
      if (!webrtc) setVerdict(verdict, "fail", "This browser has no WebRTC support. Live camera streams cannot work here.");
      else if (caps.webrtcH265) setVerdict(verdict, "ok", "This browser advertises H.265 for WebRTC. Confirm with the live test below.");
      else if (caps.webrtcH264) setVerdict(verdict, "warn", "No H.265 for WebRTC in this browser. H.265 cameras will not play; H.264 cameras will.");
      else setVerdict(verdict, "fail", "Neither H.265 nor H.264 is advertised for WebRTC.");
      updateReport();
    });
  }

  // ---------------------------------------------------------------- API helpers

  function api(method, path, body) {
    return fetch(path, {
      method: method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (error) { data = { error: text }; }
        if (!response.ok) {
          var failure = new Error((data && data.error) || ("HTTP " + response.status));
          failure.status = response.status;
          throw failure;
        }
        return data;
      });
    });
  }

  // ---------------------------------------------------------------- PIN and camera list

  function showPinForm() {
    $("pin-form").classList.remove("hidden");
    $("camera-controls").classList.add("hidden");
    $("camera-message").textContent = "";
  }

  function loadCameras() {
    $("camera-message").textContent = "Loading Homey cameras…";
    return api("GET", "/api/troubleshooting/cameras").then(function (data) {
      $("pin-form").classList.add("hidden");
      var select = $("camera");
      select.innerHTML = "";
      data.cameras.forEach(function (camera) {
        var option = document.createElement("option");
        option.value = camera.deviceId;
        option.textContent = camera.name + (camera.videos.length ? " (" + camera.videos[0].type + ")" : " (snapshot only)") + (camera.available ? "" : " – unavailable");
        option.dataset.videoId = camera.videos.length ? camera.videos[0].id : "";
        option.dataset.snapshot = camera.snapshot ? "1" : "";
        select.appendChild(option);
      });
      report.cameras = data.cameras.map(function (camera) {
        return { name: camera.name, available: camera.available, videoTypes: camera.videos.map(function (v) { return v.type; }), snapshot: Boolean(camera.snapshot) };
      });
      updateReport();
      if (!data.cameras.length) {
        $("camera-message").textContent = "Homey reports no devices with camera video or snapshots.";
        return;
      }
      $("camera-controls").classList.remove("hidden");
      $("camera-message").textContent = "";
      updateCameraButtons();
    }).catch(function (error) {
      if (error.status === 401) return showPinForm();
      $("camera-message").textContent = "Cameras could not be loaded: " + error.message;
    });
  }

  function selectedCamera() {
    var option = $("camera").selectedOptions[0];
    return option ? { deviceId: option.value, name: option.textContent, videoId: option.dataset.videoId, snapshot: option.dataset.snapshot === "1" } : null;
  }

  function updateCameraButtons() {
    var camera = selectedCamera();
    $("start").disabled = Boolean(session) || !camera || !camera.videoId;
    $("snapshot-button").disabled = !camera || !camera.snapshot;
  }

  $("pin-form").addEventListener("submit", function (event) {
    event.preventDefault();
    $("pin-error").classList.add("hidden");
    api("POST", "/api/settings/unlock", { pin: $("pin").value }).then(function () {
      $("pin").value = "";
      return loadCameras();
    }).catch(function (error) {
      $("pin-error").textContent = error.message;
      $("pin-error").classList.remove("hidden");
    });
  });

  // ---------------------------------------------------------------- Snapshot

  $("snapshot-button").addEventListener("click", function () {
    var camera = selectedCamera();
    if (!camera) return;
    var started = Date.now();
    var image = $("snapshot");
    $("snapshot-caption").textContent = "Loading snapshot…";
    image.onload = function () {
      $("snapshot-caption").textContent = "Snapshot " + image.naturalWidth + "×" + image.naturalHeight + " in " + (Date.now() - started) + " ms";
      report.snapshot = { camera: camera.name, ok: true, width: image.naturalWidth, height: image.naturalHeight, ms: Date.now() - started };
      updateReport();
    };
    image.onerror = function () {
      $("snapshot-caption").textContent = "Snapshot failed (session expired or Homey unavailable).";
      report.snapshot = { camera: camera.name, ok: false };
      updateReport();
    };
    image.src = "/api/troubleshooting/cameras/" + encodeURIComponent(camera.deviceId) + "/snapshot?t=" + Date.now();
  });

  // ---------------------------------------------------------------- Live WebRTC test

  function applyCodecPreference(transceiver, mode) {
    var codecs = receiverCodecs();
    if (!codecs || typeof transceiver.setCodecPreferences !== "function") {
      if (mode !== "auto") throw new Error("This browser cannot restrict codecs (setCodecPreferences unavailable).");
      return;
    }
    var isMode = function (codec, name) { return codec.mimeType.toLowerCase() === "video/" + name.toLowerCase(); };
    var helpers = codecs.filter(function (codec) { return /\/(rtx|red|ulpfec)$/i.test(codec.mimeType); });
    var ordered;
    if (mode === "auto") {
      var h265 = codecs.filter(function (codec) { return isMode(codec, "H265"); });
      ordered = h265.concat(codecs.filter(function (codec) { return !isMode(codec, "H265"); }));
    } else {
      var wanted = codecs.filter(function (codec) { return isMode(codec, mode); });
      if (!wanted.length) throw new Error("This browser does not support " + mode + " for WebRTC.");
      ordered = wanted.concat(helpers);
    }
    transceiver.setCodecPreferences(ordered);
  }

  function waitForIceGathering(pc) {
    if (pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise(function (resolve) {
      var timer = setTimeout(resolve, ICE_GATHERING_TIMEOUT_MS);
      pc.addEventListener("icegatheringstatechange", function () {
        if (pc.iceGatheringState === "complete") { clearTimeout(timer); resolve(); }
      });
    });
  }

  function negotiatedVideoCodec(sdp) {
    var lines = sdp.split(/\r?\n/);
    var inVideo = false;
    var payload = null;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.indexOf("m=") === 0) {
        inVideo = line.indexOf("m=video") === 0;
        if (inVideo) payload = line.split(" ")[3];
        continue;
      }
      if (inVideo && payload && line.indexOf("a=rtpmap:" + payload + " ") === 0) return line.split(" ")[1];
    }
    return null;
  }

  function collectStats(pc) {
    return pc.getStats().then(function (stats) {
      var result = { video: null, audio: null, path: null };
      var byId = {};
      stats.forEach(function (entry) { byId[entry.id] = entry; });
      stats.forEach(function (entry) {
        if (entry.type === "inbound-rtp") {
          var kind = entry.kind || entry.mediaType;
          var codec = entry.codecId && byId[entry.codecId] ? byId[entry.codecId].mimeType : null;
          var data = {
            codec: codec,
            packetsReceived: entry.packetsReceived || 0,
            packetsLost: entry.packetsLost || 0,
            bytesReceived: entry.bytesReceived || 0
          };
          if (kind === "video") {
            data.framesDecoded = entry.framesDecoded || 0;
            data.framesDropped = entry.framesDropped || 0;
            data.framesPerSecond = entry.framesPerSecond || 0;
            data.frameWidth = entry.frameWidth || 0;
            data.frameHeight = entry.frameHeight || 0;
            data.decoderImplementation = entry.decoderImplementation || null;
            data.powerEfficientDecoder = entry.powerEfficientDecoder === undefined ? null : entry.powerEfficientDecoder;
            result.video = data;
          } else if (kind === "audio") {
            result.audio = data;
          }
        }
        if (entry.type === "transport" && entry.selectedCandidatePairId && byId[entry.selectedCandidatePairId]) {
          var pair = byId[entry.selectedCandidatePairId];
          var local = byId[pair.localCandidateId] || {};
          var remote = byId[pair.remoteCandidateId] || {};
          result.path = {
            protocol: remote.protocol || local.protocol || null,
            remote: (remote.address || remote.ip || "?") + ":" + remote.port,
            localType: local.candidateType || null,
            remoteType: remote.candidateType || null,
            rttMs: pair.currentRoundTripTime ? Math.round(pair.currentRoundTripTime * 1000) : null
          };
        }
      });
      return result;
    });
  }

  function renderLive(test) {
    var v = test.stats && test.stats.video;
    var a = test.stats && test.stats.audio;
    var p = test.stats && test.stats.path;
    setRows($("live-stats"), [
      ["Camera", escapeHtml(test.camera)],
      ["Requested codec mode", escapeHtml(test.codecMode)],
      ["Connection state", escapeHtml(test.connectionState || "new")],
      ["Negotiated video codec (SDP)", escapeHtml(test.negotiatedCodec || "–")],
      ["Time to connected", test.connectedAfterMs !== null ? test.connectedAfterMs + " ms" : "–"],
      ["Time to first frame", test.firstFrameAfterMs !== null ? test.firstFrameAfterMs + " ms" : "–"],
      ["Video", v ? escapeHtml(v.frameWidth + "×" + v.frameHeight + " @ " + v.framesPerSecond + " fps, decoded " + v.framesDecoded + ", dropped " + v.framesDropped) : "–"],
      ["Video decoder", v ? escapeHtml((v.decoderImplementation || "unknown") + (v.powerEfficientDecoder === null ? "" : v.powerEfficientDecoder ? " (hardware)" : " (software)")) : "–"],
      ["Video packets / lost / bytes", v ? escapeHtml(v.packetsReceived + " / " + v.packetsLost + " / " + Math.round(v.bytesReceived / 1024) + " KiB") : "–"],
      ["Audio", a ? escapeHtml((a.codec || "?") + ", " + a.packetsReceived + " packets") : "–"],
      ["Network path", p ? escapeHtml(p.protocol + " " + p.remote + " (" + p.localType + " → " + p.remoteType + (p.rttMs !== null ? ", RTT " + p.rttMs + " ms" : "") + ")") : "–"],
      ["Keep-alive", escapeHtml(test.keepAliveOk + " ok, " + test.keepAliveErrors + " failed")],
      ["Error", test.error ? badge("fail", test.error) : "–"]
    ]);
  }

  function evaluate(test) {
    var v = test.stats && test.stats.video;
    var verdict = $("live-verdict");
    verdict.classList.remove("hidden");
    if (test.error) {
      var codecHint = /codecs not matched/i.test(test.error)
        ? " The camera codec does not match the codecs this browser offered."
        : "";
      test.verdict = "fail";
      setVerdict(verdict, "fail", "Failed: " + test.error + codecHint);
    } else if (v && v.framesDecoded > 0) {
      test.verdict = "ok";
      setVerdict(verdict, "ok", "Success: this browser decodes " + (v.codec || test.negotiatedCodec) + " " + v.frameWidth + "×" + v.frameHeight + " from Homey.");
    } else if (test.connectionState === "failed") {
      test.verdict = "fail";
      setVerdict(verdict, "fail", "WebRTC connection failed. Check that this device can reach Homey on port 8555 (UDP preferred, TCP fallback).");
    } else if (v && v.packetsReceived > 0 && test.connectedAt && Date.now() - test.connectedAt > DECODE_GRACE_MS) {
      test.verdict = "fail";
      setVerdict(verdict, "fail", "Video packets arrive but no frames are decoded. The browser negotiated " + (test.negotiatedCodec || "a codec") + " but cannot decode it.");
    } else if (test.connectedAt && Date.now() - test.connectedAt > DECODE_GRACE_MS && (!v || v.packetsReceived === 0)) {
      test.verdict = "fail";
      setVerdict(verdict, "fail", "Connected, but Homey sends no video. The camera probably does not deliver the negotiated codec (" + (test.negotiatedCodec || "unknown") + ").");
    } else {
      test.verdict = "pending";
      setVerdict(verdict, "warn", "Testing…");
    }
  }

  function stopLive(reason) {
    if (!session) return;
    var current = session;
    session = null;
    clearInterval(current.keepAliveTimer);
    clearInterval(current.statsTimer);
    try { current.pc.close(); } catch (error) { /* already closed */ }
    $("video").srcObject = null;
    current.test.stoppedAt = new Date().toISOString();
    current.test.stopReason = reason;
    $("stop").disabled = true;
    updateCameraButtons();
    updateReport();
  }

  $("start").addEventListener("click", function () {
    var camera = selectedCamera();
    if (!camera || !camera.videoId || session) return;
    var mode = $("codec").value;
    var started = Date.now();
    var test = {
      camera: camera.name, codecMode: mode, startedAt: new Date().toISOString(),
      connectionState: "new", negotiatedCodec: null, connectedAfterMs: null, firstFrameAfterMs: null,
      keepAliveOk: 0, keepAliveErrors: 0, stats: null, error: null, verdict: "pending"
    };
    report.liveTests.push(test);
    var pc;
    try {
      pc = new RTCPeerConnection();
    } catch (error) {
      test.error = "RTCPeerConnection unavailable: " + error.message;
      renderLive(test); evaluate(test); updateReport();
      return;
    }
    session = { pc: pc, test: test, keepAliveTimer: null, statsTimer: null };
    $("stop").disabled = false;
    updateCameraButtons();

    var stream = new MediaStream();
    $("video").srcObject = stream;
    pc.addEventListener("track", function (event) { stream.addTrack(event.track); });
    pc.addEventListener("connectionstatechange", function () {
      test.connectionState = pc.connectionState;
      if (pc.connectionState === "connected" && !test.connectedAt) {
        test.connectedAt = Date.now();
        test.connectedAfterMs = Date.now() - started;
      }
      renderLive(test); evaluate(test); updateReport();
    });
    $("video").onloadeddata = function () {
      if (test.firstFrameAfterMs === null) test.firstFrameAfterMs = Date.now() - started;
    };

    var streamId = null;
    Promise.resolve().then(function () {
      var videoTransceiver = pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
      applyCodecPreference(videoTransceiver, mode);
      return pc.createOffer();
    }).then(function (offer) {
      return pc.setLocalDescription(offer);
    }).then(function () {
      return waitForIceGathering(pc);
    }).then(function () {
      return api("POST", "/api/troubleshooting/videos/" + encodeURIComponent(camera.videoId) + "/offer", { offer: pc.localDescription.sdp });
    }).then(function (answer) {
      if (!session || session.pc !== pc) return;
      streamId = answer.streamId;
      test.negotiatedCodec = negotiatedVideoCodec(answer.answerSdp);
      return pc.setRemoteDescription({ type: "answer", sdp: answer.answerSdp }).then(function () {
        session.keepAliveTimer = setInterval(function () {
          api("POST", "/api/troubleshooting/videos/" + encodeURIComponent(camera.videoId) + "/keep-alive", { streamId: streamId })
            .then(function () { test.keepAliveOk++; })
            .catch(function () { test.keepAliveErrors++; });
        }, KEEP_ALIVE_MS);
        session.statsTimer = setInterval(function () {
          collectStats(pc).then(function (stats) {
            test.stats = stats;
            renderLive(test); evaluate(test); updateReport();
          });
        }, STATS_INTERVAL_MS);
      });
    }).catch(function (error) {
      test.error = error.message;
      if (error.status === 401) showPinForm();
      renderLive(test); evaluate(test);
      stopLive("error");
    });
    renderLive(test); evaluate(test); updateReport();
  });

  $("stop").addEventListener("click", function () { stopLive("user"); });
  $("camera").addEventListener("change", updateCameraButtons);
  window.addEventListener("pagehide", function () { stopLive("page closed"); });

  // ---------------------------------------------------------------- Report copy

  $("copy").addEventListener("click", function () {
    updateReport();
    var text = $("report").value;
    var done = function (message) { $("copy-result").textContent = message; };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done("Copied."); }, function () { done("Copy failed; select the text manually."); });
      return;
    }
    // navigator.clipboard is unavailable on plain-HTTP LAN origins.
    $("report").select();
    try { done(document.execCommand("copy") ? "Copied." : "Select the text and copy it manually."); }
    catch (error) { done("Select the text and copy it manually."); }
  });

  detectCapabilities();
  loadCameras();
})();
