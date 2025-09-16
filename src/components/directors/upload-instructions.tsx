export default function UploadInstructions() {
  return (
    <div className="space-y-1 text-sm text-muted-foreground mt-3">
      <p>
        1. Descarga tus datos desde{" "}
        <a
          href="https://letterboxd.com/settings/data"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          letterboxd.com/settings/data
        </a>
        .
      </p>
      <p>
        2. Sube los archivos:{" "}
        <code className="text-[#94f27f]">watched.csv</code> y/o{" "}
        <code className="text-[#94f27f]">ratings.csv</code>.
      </p>
      <p>3. Procesa y revisa la lista de directores.</p>
    </div>
  );
}
