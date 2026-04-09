export function MetadataLabel({ text }: { text: string }) {
  return (
    <span
      className="text-[9px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)]"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      {text}
    </span>
  )
}
