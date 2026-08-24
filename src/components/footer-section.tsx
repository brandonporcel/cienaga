import { Github } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="w-full max-w-[1320px] mx-auto px-5 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0 py-10 md:py-[70px]">
      {/* Left Section: Logo, Description, Social Links */}
      <div className="flex flex-col justify-start items-start gap-8 p-4 md:p-8">
        <div className="flex gap-3 items-stretch justify-center">
          <div className="text-center text-foreground text-xl font-semibold leading-4">
            Ciénaga
          </div>
        </div>
        <p className="text-foreground/90 text-sm font-medium leading-[18px] text-left">
          Películas y cines en Buenos Aires
        </p>
        <div className="flex justify-start items-start gap-3">
          <a
            href="https://github.com/brandonporcel/"
            aria-label="GitHub"
            className="w-4 h-4 flex items-center justify-center"
            target="_blank"
          >
            <Github className="w-full h-full text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Right Section: Links */}
      <div className="flex flex-col justify-start items-start gap-3 p-4 md:p-8">
        <a
          href="https://github.com/brandonporcel/"
          className="text-foreground text-sm font-normal leading-5 hover:underline"
          target="_blank"
        >
          GitHub
        </a>
        <a
          href="https://letterboxd.com/"
          className="text-foreground text-sm font-normal leading-5 hover:underline"
          target="_blank"
        >
          Letterboxd
        </a>
      </div>
    </footer>
  );
}
