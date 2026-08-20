export function ChapterMeta({ num, tag }: { num: string; tag: string }) {
  return (
    <div className="chapter__meta" data-reveal>
      <span className="chapter__num">{num}</span>
      <span className="chapter__rule" />
      <span className="chapter__tag">{tag}</span>
    </div>
  );
}
