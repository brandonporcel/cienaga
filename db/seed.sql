-- Solo los cines con scraper implementado quedan habilitados.
-- Malba y Lumiton (Cine York) tienen scraper; el resto está pendiente.
insert into
    public.cinemas (name, url, image_url, slug, enabled)
values
    (
        'Malba',
        'https://malba.org.ar/cine',
        'https://malba.org.ar/wp-content/uploads/2025/08/Marca-en-negro.svg',
        'malba',
        true
    ),
    (
        'Sala Lugones',
        'https://complejoteatral.gob.ar/cine',
        'https://complejoteatral.gob.ar/img/icons/ctba-animado.gif',
        'sala-lugones',
        false
    ),
    (
        'Cine York',
        'https://lumiton.ar',
        'https://lumiton.ar/wp-content/uploads/2023/05/lumiton_logo.svg',
        'lumiton',
        true
    ),
    (
        'Palacio Libertad',
        'https://palaciolibertad.gob.ar/cine/',
        'https://palaciolibertad.gob.ar/wp-content/uploads/2019/12/PL_logo-02.svg',
        'cck',
        false
    ),
    (
        'Gaumont',
        'https://www.cinegaumont.ar/',
        'https://www.cinegaumont.ar/templates/vac/images/GAUMONT-2025.png',
        'gaumont',
        false
    ),
    (
        'Cine Lorca',
        'https://www.lanacion.com.ar/cartelera-de-cine/sala/lorca-sa110',
        null,
        'lorca',
        false
    ),
    (
        'Cine Cosmos',
        'https://www.cinecosmos.uba.ar/',
        'https://www.cinecosmos.uba.ar/img/logo.svg',
        'cosmos',
        false
    ),
    (
        'Web Cartelera Sigilio',
        'https://sigiliosello.com/cartelera/',
        'https://sigiliosello.com/wp-content/uploads/2023/08/cropped-cropped-SILIGIO-tipo-blanca-fondo-negro-1-146x49.jpg',
        'sigilio',
        false
    );