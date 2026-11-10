"use client";
import { kingstonCrest } from "@/lib/kingston-crest";
import {
  useEffect,
  useRef,
  useId,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { X, ArrowRight, Compass } from "lucide-react";
import { displayDate, type State, type Meeting } from "@/lib/model";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "modal wide" : "modal"}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const fieldId = useId();
  const nativeControl =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  if (!nativeControl)
    return (
      <label className="field">
        <span>{label}</span>
        {children}
        {hint && <small>{hint}</small>}
      </label>
    );
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {cloneElement(
        children as ReactElement<{ id?: string; "aria-describedby"?: string }>,
        {
          id: fieldId,
          "aria-describedby": hint ? fieldId + "-hint" : undefined,
        },
      )}
      {hint && <small id={fieldId + "-hint"}>{hint}</small>}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Compass size={28} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Badge({
  children,
  kind = "",
}: {
  children: ReactNode;
  kind?: string;
}) {
  return <span className={"badge " + kind}>{children}</span>;
}
export function Avatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  return (
    <span className={"avatar " + (large ? "large" : "")}>
      {name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function SectionHead({
  title,
  action,
  onClick,
}: {
  title: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {action && (
        <button className="text-button" onClick={onClick}>
          {action}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
export function Paper({
  state,
  meeting,
  draft = true,
}: {
  state: State;
  meeting?: Meeting;
  draft?: boolean;
}) {
  if (!meeting)
    return (
      <Empty title="Plan your first meeting">
        Your summons will take shape here.
      </Empty>
    );
  const { lodge } = state,
    brand = lodge.brand;
  return (
    <article className={"paper " + brand.layout} style={{ color: brand.color }}>
      <div className="paper-top">
        {brand.logoId || brand.presetLogo === "kingston" ? (
          <img
            src={
              brand.logoId
                ? `/api/files?lodge=${lodge.id}&id=${brand.logoId}`
                : kingstonCrest
            }
            alt="Lodge crest"
          />
        ) : (
          <Compass size={42} strokeWidth={1.2} />
        )}
        <h2>{lodge.name}</h2>
        <p>
          No. {lodge.number} · {lodge.constitution} Constitution
        </p>
        <div className="paper-rule" />
        <small>{draft ? "DRAFT SUMMONS" : "SUMMONS"}</small>
        <h3>{meeting.title}</h3>
        <p>
          {displayDate(meeting.date)} at {meeting.time}
          <br />
          {meeting.venue}
        </p>
      </div>
      {brand.sections.map((section) => (
        <div key={section} className="paper-section">
          {section === "Notice" && <p>{brand.greeting}</p>}
          {section === "Agenda" && (
            <>
              <h4>Order of business</h4>
              <ol>
                {meeting.agenda.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
              {meeting.ceremonies.length > 0 && (
                <p className="scheduled-work">
                  Scheduled work:{" "}
                  {meeting.ceremonies
                    .map(
                      (c) =>
                        `${state.members.find((m) => m.id === c.memberId)?.name} — ${c.degree}`,
                    )
                    .join("; ")}
                </p>
              )}
            </>
          )}
          {section === "Officers" && (
            <>
              <h4>Officers of the Lodge</h4>
              <div className="paper-officers">
                {state.members
                  .filter((m) => m.office && m.status === "Active")
                  .map((m) => (
                    <div key={m.id}>
                      <span>{m.office}</span>
                      <b>{m.name}</b>
                    </div>
                  ))}
              </div>
            </>
          )}
          {section === "Notices" && (
            <p className="paper-footer">{brand.footer}</p>
          )}
        </div>
      ))}
    </article>
  );
}
export function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function pngFile(file: File): Promise<File> {
  if (file.size > 10_000_000) throw new Error("Choose an image up to 10 MB.");
  const bitmap = await createImageBitmap(file),
    ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)),
    canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("Unable to convert this image.")),
      "image/png",
    ),
  );
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".png", {
    type: "image/png",
  });
}
