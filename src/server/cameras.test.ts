import { describe, expect, it } from "vitest";
import { CameraRequestError, listCamerasFromDevices, validateSdpOffer, validateStreamId } from "./cameras.js";

const garage = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Camera garage",
  zone: "zone-1",
  available: true,
  images: [{
    type: "camera", id: "snapshot", title: "Camera garage",
    imageObj: { id: "0dc16783-a198-4bbe-bd2e-dafaebe8933c", url: "/api/image/0dc16783-a198-4bbe-bd2e-dafaebe8933c" },
  }],
  videos: [{
    type: "camera", id: "snapshot", title: "Camera garage Video",
    videoObj: { id: "c8ef9f29-2b74-4a89-9de5-0bf447d0ee9c", type: "rtsp" },
  }],
};

describe("listCamerasFromDevices", () => {
  it("returns devices with Homey videos and camera snapshots", () => {
    expect(listCamerasFromDevices({ [garage.id]: garage })).toEqual([{
      deviceId: garage.id,
      name: "Camera garage",
      zoneId: "zone-1",
      available: true,
      snapshot: { id: "0dc16783-a198-4bbe-bd2e-dafaebe8933c", title: "Camera garage" },
      videos: [{ id: "c8ef9f29-2b74-4a89-9de5-0bf447d0ee9c", title: "Camera garage Video", type: "rtsp" }],
    }]);
  });

  it("ignores media artwork and devices without camera media", () => {
    const speaker = {
      id: "speaker", name: "Chromecast", videos: [],
      images: [{ type: "media", id: "albumart", imageObj: { id: "x", url: "/api/image/x" } }],
    };
    const light = { id: "light", name: "Lamp", images: [], videos: [] };
    expect(listCamerasFromDevices({ speaker, light })).toEqual([]);
  });

  it("keeps snapshot-only camera devices and sorts by name", () => {
    const tablet = {
      id: "tablet", name: "A tablet", videos: [],
      images: [{ type: "camera", id: "front", title: "Live", imageObj: { id: "img", url: "/api/image/img" } }],
    };
    const result = listCamerasFromDevices({ [garage.id]: garage, tablet });
    expect(result.map((camera) => camera.name)).toEqual(["A tablet", "Camera garage"]);
    expect(result[0]).toMatchObject({ snapshot: { id: "img" }, videos: [] });
  });
});

describe("WebRTC input validation", () => {
  it("accepts SDP offers and rejects other input", () => {
    expect(validateSdpOffer("v=0\r\no=- 1 1 IN IP4 0.0.0.0\r\n")).toMatch(/^v=0/);
    for (const invalid of [undefined, 42, "", "hello", "v=0" + "x".repeat(100_001)]) {
      expect(() => validateSdpOffer(invalid)).toThrow(CameraRequestError);
    }
  });

  it("accepts Homey stream ids and rejects unsafe values", () => {
    expect(validateStreamId("video_c8ef9f29-2b74-4a89-9de5-0bf447d0ee9c")).toBe("video_c8ef9f29-2b74-4a89-9de5-0bf447d0ee9c");
    for (const invalid of [undefined, "", "a/b", "x".repeat(201)]) {
      expect(() => validateStreamId(invalid)).toThrow(CameraRequestError);
    }
  });
});
