import { Github } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="w-full">
      <div className="max-w-[1320px] mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-4 py-6">
        {/* Left Section: Logo + Description */}
        <div className="flex items-center gap-4">
          <span className="text-foreground text-lg font-semibold leading-5">
            Ciénaga
          </span>
          <span className="hidden md:block h-4 w-px bg-border" />
          <p className="text-foreground/70 text-sm font-medium text-left">
            Películas y cines en Buenos Aires
          </p>
        </div>

        {/* Right Section: Contact + GitHub */}
        <div className="flex items-center gap-4">
          <a
            href="mailto:brandon7.7porcel@gmail.com"
            className="text-foreground text-sm font-medium leading-5 hover:underline"
          >
            brandon7.7porcel@gmail.com
          </a>
          <a
            href="https://github.com/brandonporcel/"
            aria-label="GitHub"
            className="w-5 h-5 flex items-center justify-center"
            target="_blank"
          >
            <Github className="w-full h-full text-foreground/70 hover:text-foreground transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
}
