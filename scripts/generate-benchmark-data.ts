// Dev-only dataset generator for performance testing
// Generates an array of mock contacts with realistic fields for 1k/5k/10k/20k sizes

import { Contact, ContactStatus } from '../src/types';

const randomItem = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n: number) => n.toString().padStart(2, '0');

function generateContacts(count: number): Contact[] {
  const firstNames = ['Jean', 'Marie', 'Luc', 'Sophie', 'Paul', 'Claire', 'Hugo', 'Léa', 'Nina', 'Leo'];
  const lastNames = ['Durand', 'Dupont', 'Martin', 'Bernard', 'Petit', 'Robert', 'Richard', 'Moreau'];
  const sources = ['Web', 'Formulaire', 'Salon', 'Référencement', 'Partenaire'];
  const types = ['Prospect', 'Client', 'Lead', 'VIP'];
  const qualites = ['A', 'B', 'C'];

  const out: Contact[] = [];
  for (let i = 0; i < count; i++) {
    const prenom = randomItem(firstNames);
    const nom = randomItem(lastNames);
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}`;
    const d = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    out.push({
      id,
      prenom,
      nom,
      telephone: `+33${Math.floor(100000000 + Math.random() * 899999999)}`,
      email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@example.com`,
      source: randomItem(sources),
      type: randomItem(types),
      qualite: randomItem(qualites),
      lien: '',
      statut: randomItem(Object.values(ContactStatus)),
      commentaire: '',
      dateRappel: '',
      heureRappel: '',
      dateRDV: '',
      heureRDV: '',
      dateAppel: date,
      heureAppel: `${pad(Math.floor(Math.random() * 24))}:${pad(Math.floor(Math.random() * 60))}`,
      dureeAppel: `${Math.floor(Math.random() * 15)}:${pad(Math.floor(Math.random() * 60))}`,
      sexe: Math.random() > 0.5 ? 'M' as any : 'F' as any,
      don: '',
      date,
      uid: ''
    } as Contact);
  }
  return out;
}

function main() {
  const sizes = [1000, 5000, 10000, 20000];
  const fs = require('fs');
  const path = require('path');
  const outDir = path.resolve(process.cwd(), 'dev-bench-data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  for (const size of sizes) {
    const data = generateContacts(size);
    const file = path.join(outDir, `contacts_${size}.json`);
    fs.writeFileSync(file, JSON.stringify(data));
    console.log(`✅ Generated: ${file}`);
  }
}

if (require.main === module) {
  // Only run in Node
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  main();
}

export { generateContacts };
