export default function Stars({ value }: { value: number }) {
  return <span aria-label={`Rating ${value} dari 5`} className="text-brand-accent">{"★".repeat(Math.round(value))}<span className="text-brand-cyan">{"★".repeat(5 - Math.round(value))}</span></span>;
}
