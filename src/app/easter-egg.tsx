"use client";

import { useEffect } from "react";

function EasterEgg() {
  useEffect(() => {
    console.log(
      "%c brandonporcel",
      "font-family: Courier; font-size: 11px; color: white; background-color: #669;"
    );
    const comment = document.createComment(`
Pues ahuevo que si pinche mascatrapo
`);
    document.head.prepend(comment);
  }, []);

  return null;
}

export default EasterEgg;
