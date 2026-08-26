export default function UploadInstructions() {
  return (
    <div className="space-y-1 text-sm text-muted-foreground mt-3">
      <p>
        1. Descarga tus datos desde{" "}
        <a
          href="https://letterboxd.com/settings/data"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline font-semibold"
        >
          letterboxd.com/settings/data
        </a>
        .
      </p>
      <p>
        2. Subí el <code className="text-green-700 dark:text-[#00ff41] font-semibold">.zip</code> que te
        descargó, o los archivos{" "}
        <code className="text-green-700 dark:text-[#00ff41] font-semibold">watched.csv</code> y/o{" "}
        <code className="text-green-700 dark:text-[#00ff41] font-semibold">ratings.csv</code> individuales.
      </p>
      <p>3. Procesá y revisá la lista de directores.</p>
    </div>
  );
}
