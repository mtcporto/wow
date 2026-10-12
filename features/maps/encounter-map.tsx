"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { assetPath } from "@/lib/paths";

type Names = Partial<Record<"en_US" | "pt_BR", string>>;
interface Pin {
  encounterId: number;
  name: Names;
  x: number;
  y: number;
  order: number;
}
interface Floor {
  uiMapId: number;
  name: Names;
  image: string;
  width: number;
  height: number;
  pins: Pin[];
}
interface Instance {
  name: Names;
  floors: Floor[];
  source: { url: string };
}
interface Catalogue {
  instances: Record<string, Instance>;
}

export function EncounterMap() {
  const params = useSearchParams(),
    { locale } = useLocale();
  const encounterId = Number(params.get("encounter")),
    instanceId = params.get("instance");
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [floorId, setFloorId] = useState<number | null>(null),
    [zoom, setZoom] = useState(1),
    [showPins, setShowPins] = useState(true),
    [chosen, setChosen] = useState<number | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const text = (pt: string, en: string) => (locale === "pt_BR" ? pt : en);
  const name = (names: Names) => names[locale] || names.en_US || "";
  useEffect(() => {
    if (!encounterId && !instanceId) return;
    const controller = new AbortController();
    fetch(assetPath("/data/instance-maps.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw Error("No map catalogue");
        return response.json();
      })
      .then(setCatalogue)
      .catch(() => {});
    return () => controller.abort();
  }, [encounterId, instanceId]);
  const instance = instanceId
    ? catalogue?.instances[instanceId]
    : Object.values(catalogue?.instances || {}).find((value) =>
        value.floors.some((floor) =>
          floor.pins.some((pin) => pin.encounterId === encounterId),
        ),
      );
  if (!instance) return null;
  const floor =
    instance.floors.find((value) => value.uiMapId === floorId) ||
    instance.floors.find((value) =>
      value.pins.some((pin) => pin.encounterId === encounterId),
    ) ||
    instance.floors[0];
  const selected = floor.pins.find(
    (pin) => pin.encounterId === (chosen ?? encounterId),
  );
  function reset() {
    setZoom(1);
    if (viewport.current) {
      viewport.current.scrollLeft = 0;
      viewport.current.scrollTop = 0;
    }
  }
  function pick(pin: Pin) {
    setChosen(pin.encounterId);
    const box = viewport.current;
    if (box && zoom > 1) {
      box.scrollLeft = pin.x * box.scrollWidth - box.clientWidth / 2;
      box.scrollTop = pin.y * box.scrollHeight - box.clientHeight / 2;
    }
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest("button")
    )
      return;
    const box = event.currentTarget;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: box.scrollLeft,
      top: box.scrollTop,
    };
    box.setPointerCapture(event.pointerId);
    setDragging(true);
    event.preventDefault();
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const point = drag.current;
    if (!point || event.pointerId !== point.pointerId) return;
    event.currentTarget.scrollLeft = point.left + point.x - event.clientX;
    event.currentTarget.scrollTop = point.top + point.y - event.clientY;
  }
  function endDrag(event: PointerEvent<HTMLDivElement>) {
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return (
    <section
      className="instance-map explorer-section"
      aria-labelledby="instance-map-title"
    >
      <h2 id="instance-map-title">
        {text("Mapa: ", "Map: ") + name(instance.name)}
      </h2>
      <div className="instance-map-toolbar">
        {instance.floors.length > 1 ? (
          <label>
            {text("Andar", "Floor")}
            <select
              value={floor.uiMapId}
              onChange={(event) => {
                setFloorId(Number(event.target.value));
                setChosen(null);
                reset();
              }}
            >
              {instance.floors.map((value) => (
                <option key={value.uiMapId} value={value.uiMapId}>
                  {name(value.name)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          className="back-btn"
          onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
          disabled={zoom === 1}
          aria-label={text("Diminuir zoom", "Zoom out")}
        >
          −
        </button>
        <output aria-label="Zoom">{Math.round(zoom * 100)}%</output>
        <button
          className="back-btn"
          onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
          disabled={zoom === 3}
          aria-label={text("Aumentar zoom", "Zoom in")}
        >
          +
        </button>
        <button className="back-btn" onClick={reset}>
          {text("Ajustar mapa", "Fit map")}
        </button>
        <button
          className="back-btn"
          aria-pressed={showPins}
          onClick={() => setShowPins((value) => !value)}
        >
          {showPins
            ? text("Ocultar marcadores", "Hide pins")
            : text("Mostrar marcadores", "Show pins")}
        </button>
      </div>
      <div
        className={"instance-map-viewport" + (dragging ? " is-dragging" : "")}
        ref={viewport}
        style={{ aspectRatio: floor.width + "/" + floor.height }}
        tabIndex={0}
        aria-label={text(
          "Mapa com rolagem e marcadores dos chefes",
          "Scrollable map with boss markers",
        )}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="instance-map-canvas"
          style={{ width: zoom * 100 + "%" }}
        >
          <img
            className="instance-map-image"
            src={assetPath(floor.image)}
            alt={name(floor.name)}
            width={floor.width}
            height={floor.height}
            draggable={false}
          />
          {showPins
            ? floor.pins.map((pin) => (
                <button
                  key={pin.encounterId}
                  className="instance-map-pin"
                  data-encounter={pin.encounterId}
                  style={{ left: pin.x * 100 + "%", top: pin.y * 100 + "%" }}
                  aria-label={name(pin.name)}
                  aria-pressed={selected?.encounterId === pin.encounterId}
                  title={name(pin.name)}
                  onClick={() => pick(pin)}
                >
                  {pin.order}
                </button>
              ))
            : null}
        </div>
      </div>
      <div className="instance-map-legend">
        {floor.pins.map((pin) => (
          <button
            key={pin.encounterId}
            className="map-legend-pin"
            aria-pressed={selected?.encounterId === pin.encounterId}
            onClick={() => pick(pin)}
          >
            <span>{pin.order}</span>
            {name(pin.name)}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="instance-map-selection" aria-live="polite">
          <strong>{name(selected.name)}</strong>
          {selected.encounterId === encounterId ? (
            <span>{text("Encontro atual", "Current encounter")}</span>
          ) : (
            <a href={assetPath("/explore?encounter=" + selected.encounterId)}>
              {text("Abrir encontro", "Open encounter")} →
            </a>
          )}
        </div>
      ) : null}
      <p className="instance-map-credit">
        {text(
          "Mapa © Blizzard. Dados do cliente via ",
          "Map © Blizzard. Client data via ",
        )}
        <a href={instance.source.url} target="_blank" rel="noopener noreferrer">
          Wago.tools
        </a>
        .{" "}
        {text(
          "Use o zoom e arraste para explorar.",
          "Zoom and drag to explore.",
        )}
      </p>
    </section>
  );
}
