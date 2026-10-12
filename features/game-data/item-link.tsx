"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { assetPath } from "@/lib/paths";
import { useResource } from "./use-resource";
import {
  label,
  list,
  money,
  num,
  obj,
  quality,
  str,
  type RecordValue,
} from "./data";
import { useText } from "./common";
export function ItemLink({
  item,
  region = "us",
  preview: equipped,
  icon: suppliedIcon,
}: {
  item: RecordValue;
  region?: string;
  preview?: RecordValue;
  icon?: string;
}) {
  const id = num(item.id),
    t = useText(),
    tooltipId = useId(),
    anchor = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false),
    [open, setOpen] = useState(false),
    [position, setPosition] = useState({ left: 8, top: 8 });
  const icon = useResource(
      visible && !suppliedIcon ? "media/item/" + id : null,
      region,
    ),
    detail = useResource(
      (open || (visible && !suppliedIcon)) && !equipped ? "item/" + id : null,
      region,
    );
  useEffect(() => {
    const element = anchor.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const image = list(icon.data?.assets).find((asset) => asset.key === "icon"),
    preview = equipped || obj(detail.data?.preview_item);
  const color = quality(
    preview.quality || detail.data?.quality || item.quality,
  );
  function show() {
    const rect = anchor.current?.getBoundingClientRect();
    if (rect)
      setPosition({
        left: Math.max(8, Math.min(rect.left, innerWidth - 308)),
        top: Math.max(8, Math.min(rect.bottom + 8, innerHeight - 340)),
      });
    setOpen(true);
  }
  return (
    <>
      <a
        ref={anchor}
        className="native-item-link"
        href={assetPath("/explore?item=" + id)}
        onPointerEnter={show}
        onPointerLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        aria-describedby={open ? tooltipId : undefined}
      >
        <span className="wow-item-icon" style={{ borderColor: color }}>
          {str(suppliedIcon || image?.value).startsWith("https://") ? (
            <img
              src={str(suppliedIcon || image?.value)}
              alt=""
              width="48"
              height="48"
            />
          ) : null}
        </span>
        <span style={{ color }}>{label(item.name) || String(id)}</span>
      </a>
      {open
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className="wow-tooltip native-item-tooltip"
              style={position}
            >
              {detail.loading ? (
                t("Carregando…", "Loading…")
              ) : detail.error ? (
                t("Informações indisponíveis.", "Information unavailable.")
              ) : (
                <>
                  <div className="wow-tooltip-title" style={{ color }}>
                    {label(preview.name || detail.data?.name)}
                  </div>
                  <div className="wow-tooltip-gold">
                    {str(obj(preview.level).display_string)}
                  </div>
                  <div>{label(preview.binding)}</div>
                  <div className="wow-tooltip-line">
                    <span>{label(preview.inventory_type)}</span>
                    <span>{label(preview.item_subclass)}</span>
                  </div>
                  <div className="wow-tooltip-line">
                    <span>
                      {str(obj(obj(preview.weapon).damage).display_string)}
                    </span>
                    <span>
                      {str(
                        obj(obj(preview.weapon).attack_speed).display_string,
                      )}
                    </span>
                  </div>
                  <div>{str(obj(obj(preview.weapon).dps).display_string)}</div>
                  {list(preview.stats).map((stat, index) => (
                    <div
                      key={index}
                      className={
                        stat.is_negated
                          ? "wow-tooltip-muted"
                          : stat.is_equip_bonus
                            ? "wow-tooltip-green"
                            : ""
                      }
                    >
                      {str(obj(stat.display).display_string)}
                    </div>
                  ))}
                  {list(preview.spells).map((spell, index) => (
                    <div className="wow-tooltip-green" key={index}>
                      {str(spell.description)}
                    </div>
                  ))}
                  <div>{str(obj(preview.durability).display_string)}</div>
                  <div>
                    {str(obj(obj(preview.requirements).level).display_string)}
                  </div>
                  <div>
                    {str(
                      obj(obj(preview.requirements).playable_classes)
                        .display_string,
                    )}
                  </div>
                  {num(obj(preview.sell_price).value) > 0 ? (
                    <div>
                      {t("Preço de venda: ", "Sell Price: ") +
                        money(num(obj(preview.sell_price).value))}
                    </div>
                  ) : null}
                </>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
