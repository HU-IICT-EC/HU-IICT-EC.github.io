# HU-IICT-EC GitHub Pages

Deze repository host de HU-IICT-EC GitHub Pages site met tools voor de Examencommissie IICT van Hogeschool Utrecht.

## Projectstructuur

```
HU-IICT-EC.github.io/
├── _includes/tools/           # Jekyll includes voor individuele tools
│   ├── Examinator_Excel_Download.html
│   └── Steekproef.html
├── assets/
│   ├── styles/
│   │   └── main.css          # CSS-stijlen voor de webapplicatie
│   └── tools/
│       ├── pyscript.json     # PyScript configuratie
│       ├── steekproef.py     # Python-code voor steekproef tool
│       └── examinator_excel_download.py
├── .devcontainer/            # Development container configuratie
├── .github/
│   └── instructions/         # Coding standards en instructies
├── _config.yml               # Jekyll configuratie
├── index.html                # Hoofddocument van de site
├── Gemfile                   # Ruby dependencies
├── .gitignore               # Git ignore regels
└── README.md                # Deze documentatie
```

## Technische Stack

- **Jekyll**: Static site generator voor GitHub Pages
- **Bootstrap 5**: CSS framework voor responsive design
- **PyScript**: Client-side Python uitvoering in de browser
- **Python Libraries**: pandas, openpyxl, beautifulsoup4 voor data processing

## Installatie-instructies

### Lokale Ontwikkeling

1. Clone de repository:
   ```bash
   git clone https://github.com/HU-IICT-EC/HU-IICT-EC.github.io.git
   cd HU-IICT-EC.github.io
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

3. Start de Jekyll development server:
   ```bash
   bundle exec jekyll serve
   ```

4. Open http://localhost:4000 in je browser.

### Development Container

Voor een consistente ontwikkelomgeving kun je de dev container gebruiken:

1. Open het project in VS Code
2. Klik op "Reopen in Container" wanneer gevraagd
3. De container wordt automatisch gebouwd met alle benodigde dependencies

## Beschikbare Tools

### Steekproef
- Voegt willekeurige nummers toe aan Excel-sheets voor steekproeftrekking
- Ondersteunt multiple sheets met behoud van een Setup sheet

### Examinator Excel Download
- Converteert Osiris HTML rapporten naar gestructureerde Excel bestanden
- Extraheert examinator-cursus relaties voor verdere analyse

## Nieuwe Tool Toevoegen

1. Maak een nieuwe HTML file in `_includes/tools/`
2. Voeg eventuele Python-code toe in `assets/tools/`
3. Update `_config.yml` om de nieuwe tool toe te voegen aan de `tools` lijst
4. Test lokaal voordat je commit

## Bijdragen

Dit is een intern project van de HU-IICT-EC organisatie. 

### Voor Organisatieleden

1. Fork de repository
2. Maak een feature branch
3. Volg de coding standards in `.github/instructions/`
4. Test je wijzigingen lokaal
5. Maak een pull request

### Coding Standards

- Volg de richtlijnen in `.github/instructions/general-coding.instructions.md`
- Use semantic HTML elements
- Write clear, self-documenting code
- Add comments voor complexe logica
- Test alle functionaliteit voordat je commit

## Deployment

De site wordt automatisch gedeployed naar GitHub Pages bij elke push naar de main branch.

Live URL: https://hu-iict-ec.github.io