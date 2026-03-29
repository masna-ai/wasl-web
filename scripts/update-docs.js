import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.join(__dirname, '../src/docs');

const newFontLink = `<link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet" />`;

const navStructure = [
  {
    title: 'Getting Started',
    links: [
      { href: './index.html', text: 'Introduction', match: ['index.html', './'] },
      { href: './quickstart.html', text: 'Quickstart', match: ['quickstart.html'] }
    ]
  },
  {
    title: 'Platform Architecture',
    links: [
      { href: './api-gateway.html', text: 'API Gateway', match: ['api-gateway.html'] },
      { href: './ai-gateway.html', text: 'AI Gateway', match: ['ai-gateway.html'] },
      { href: './flow-runtime.html', text: 'Flow Runtime', match: ['flow-runtime.html'] }
    ]
  },
  {
    title: 'Operations & Logic',
    links: [
      { href: './policies.html', text: 'Policies', match: ['policies.html'] },
      { href: './adapters.html', text: 'Adapters', match: ['adapters.html'] },
      { href: './deployments.html', text: 'Deployments', match: ['deployments.html'] }
    ]
  },
  {
    title: 'Reference',
    links: [
      { href: './security.html', text: 'Security', match: ['security.html'] },
      { href: './troubleshooting.html', text: 'Troubleshooting', match: ['troubleshooting.html'] }
    ]
  }
];

function generateSidebar(currentFile) {
  let sidebar = `      <aside class="docs-sidebar">\n`;
  for (const group of navStructure) {
    sidebar += `        <div class="docs-nav-group">\n`;
    sidebar += `          <h4>${group.title}</h4>\n`;
    sidebar += `          <nav class="docs-nav">\n`;
    for (const link of group.links) {
      const isActive = link.match.includes(currentFile);
      const activeAttr = isActive ? ' class="active"' : '';
      sidebar += `            <a href="${link.href}"${activeAttr}>${link.text}</a>\n`;
    }
    sidebar += `          </nav>\n`;
    sidebar += `        </div>\n`;
  }
  sidebar += `      </aside>`;
  return sidebar;
}

const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace Font Link
  content = content.replace(
    /<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600;700;800&family=JetBrains\+Mono:wght@400;500&display=swap"\s+rel="stylesheet"\s*\/>/g,
    newFontLink
  );

  // Replace Sidebar
  // This Regex matches from <aside class="docs-sidebar"> to </aside>
  content = content.replace(/<aside class="docs-sidebar">[\s\S]*?<\/aside>/i, generateSidebar(file));

  // Small detail: Ensure Introduction in href matches correctly
  content = content.replace(/href="\.\/"/g, 'href="./index.html"');

  // Remove Marketing Site button
  content = content.replace(/<a class="docs-btn" href="\/">Marketing Site<\/a>\s*/g, '');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});

console.log('All docs aligned to premium structural standard.');
