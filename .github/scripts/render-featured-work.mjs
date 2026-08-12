import { mkdir, writeFile } from "node:fs/promises";

const owner = process.env.GITHUB_REPOSITORY_OWNER ?? "9luis7";
const token = process.env.GITHUB_TOKEN;
const apiVersion = "2026-03-10";

const projects = [
  {
    repo: "forzy-twinops",
    title: "Forzy TwinOps",
    label: "INDUSTRIAL INTELLIGENCE",
    summary: "Digital twin · telemetry · explainable operations",
  },
  {
    repo: "Sistema-Preditivo-de-Monitoramento-de-Cargas",
    title: "Predictive Cargo Monitoring",
    label: "RISK ENGINEERING",
    summary: "Geospatial risk · ensemble ML · live monitoring",
  },
  {
    repo: "fiap-rpa-wmdf",
    title: "Cross-Tab Data Fusion",
    label: "AUTOMATION & DATA",
    summary: "Web extraction · data fusion · LLM-ready outputs",
  },
];

const languageColors = {
  "C++": "#f34b7d",
  CSS: "#663399",
  HTML: "#e34c26",
  JavaScript: "#d4a900",
  "Jupyter Notebook": "#c85d13",
  Python: "#3572a5",
  Shell: "#6f9f45",
  TypeScript: "#3178c6",
};

const themes = {
  light: {
    background: "#f5f1e8",
    eyebrow: "#8a5a20",
    heading: "#17251b",
    text: "#34483a",
    muted: "#657368",
    rule: "#d9d2c3",
    track: "#e5ded0",
  },
  dark: {
    background: "#171e19",
    eyebrow: "#e3a857",
    heading: "#f0eadf",
    text: "#c6d1c8",
    muted: "#8fa095",
    rule: "#344239",
    track: "#29342d",
  },
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function github(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "9luis7-profile-visuals",
    "X-GitHub-Api-Version": apiVersion,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com${path}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }

  return response.json();
}

function languageMix(languages) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

  if (total === 0) {
    return [{ name: "No code detected", ratio: 1, percentage: 100 }];
  }

  const visible = entries.slice(0, 4);
  const hiddenBytes = entries.slice(4).reduce((sum, [, bytes]) => sum + bytes, 0);

  if (hiddenBytes > 0) {
    visible.push(["Other", hiddenBytes]);
  }

  return visible.map(([name, bytes]) => {
    const ratio = bytes / total;
    const percentage = ratio * 100;

    return {
      name,
      ratio,
      percentage:
        percentage < 1 ? percentage.toFixed(1) : String(Math.round(percentage)),
    };
  });
}

function monthYear(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

function render(projectData, themeName) {
  const theme = themes[themeName];
  const width = 900;
  const height = 476;
  const barWidth = 804;
  const rowStart = 132;
  const rowHeight = 104;
  const generated = new Date().toISOString().slice(0, 10);

  const rows = projectData
    .map((project, projectIndex) => {
      const y = rowStart + projectIndex * rowHeight;
      const mix = languageMix(project.languages);
      let offset = 48;

      const segments = mix
        .map((language, languageIndex) => {
          const segmentWidth = Math.max(2, barWidth * language.ratio);
          const color = languageColors[language.name] ?? "#8b948d";
          const segment = `<rect class="bar-segment" style="animation-delay:${
            projectIndex * 90 + languageIndex * 55
          }ms" x="${offset.toFixed(2)}" y="${y + 47}" width="${segmentWidth.toFixed(
            2,
          )}" height="10" fill="${color}" />`;
          offset += segmentWidth;
          return segment;
        })
        .join("");

      const legend = mix
        .map((language, languageIndex) => {
          const x = 48 + languageIndex * 158;
          const color = languageColors[language.name] ?? "#8b948d";
          return `<circle cx="${x + 4}" cy="${y + 76}" r="4" fill="${color}" />
            <text x="${x + 15}" y="${y + 80}" class="legend">${escapeXml(
              language.name,
            )} ${language.percentage}%</text>`;
        })
        .join("\n");

      return `<g>
        <text x="48" y="${y}" class="eyebrow">${escapeXml(project.label)}</text>
        <text x="48" y="${y + 28}" class="project">${escapeXml(project.title)}</text>
        <text x="360" y="${y + 28}" class="summary">${escapeXml(project.summary)}</text>
        <text x="852" y="${y + 28}" text-anchor="end" class="updated">updated ${escapeXml(
          monthYear(project.pushedAt),
        )}</text>
        <rect x="48" y="${y + 47}" width="${barWidth}" height="10" fill="${theme.track}" />
        ${segments}
        ${legend}
        <line x1="48" y1="${y + 95}" x2="852" y2="${y + 95}" stroke="${theme.rule}" />
      </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Selected systems, live from GitHub</title>
  <desc id="description">Language composition and latest public update for three selected repositories by Luis Fernando.</desc>
  <style>
    text { font-family: "Segoe UI", "Trebuchet MS", sans-serif; }
    .kicker { fill: ${theme.eyebrow}; font-size: 12px; font-weight: 700; letter-spacing: 2.4px; }
    .title { fill: ${theme.heading}; font-size: 28px; font-weight: 650; letter-spacing: -0.4px; }
    .caption { fill: ${theme.muted}; font-size: 13px; }
    .eyebrow { fill: ${theme.eyebrow}; font-size: 10px; font-weight: 700; letter-spacing: 1.6px; }
    .project { fill: ${theme.heading}; font-size: 18px; font-weight: 650; }
    .summary { fill: ${theme.text}; font-size: 13px; }
    .updated { fill: ${theme.muted}; font-size: 12px; }
    .legend { fill: ${theme.text}; font-size: 11px; }
    .footer { fill: ${theme.muted}; font-size: 10px; letter-spacing: 0.3px; }
    .bar-segment { transform-box: fill-box; transform-origin: left; animation: reveal 650ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes reveal { from { transform: scaleX(0); opacity: 0.65; } to { transform: scaleX(1); opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .bar-segment { animation: none; } }
  </style>
  <rect width="${width}" height="${height}" fill="${theme.background}" />
  <text x="48" y="38" class="kicker">PUBLIC CODE SIGNAL</text>
  <text x="48" y="72" class="title">Selected systems, live from GitHub</text>
  <text x="48" y="98" class="caption">Repository metadata and language bytes · selected public work only</text>
  ${rows}
  <text x="852" y="458" text-anchor="end" class="footer">GITHUB REST API · GENERATED ${generated}</text>
</svg>`;
}

const data = await Promise.all(
  projects.map(async (project) => {
    const [repository, languages] = await Promise.all([
      github(`/repos/${owner}/${project.repo}`),
      github(`/repos/${owner}/${project.repo}/languages`),
    ]);

    return {
      ...project,
      pushedAt: repository.pushed_at,
      languages,
    };
  }),
);

await mkdir("assets", { recursive: true });
await Promise.all(
  Object.keys(themes).map((themeName) =>
    writeFile(
      `assets/featured-work-${themeName}.svg`,
      render(data, themeName),
      "utf8",
    ),
  ),
);
