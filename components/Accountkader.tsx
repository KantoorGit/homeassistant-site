// Gemeenschappelijke omlijsting van de accountschermen.
export default function Accountkader({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="accountkader">
      <h1>{titel}</h1>
      {children}
    </div>
  );
}

export function Laden() {
  return (
    <p className="laden" aria-busy="true">
      …
    </p>
  );
}
