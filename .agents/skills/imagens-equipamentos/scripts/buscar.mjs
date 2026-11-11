import { mkdir, readFile, writeFile } from 'node:fs/promises';

const cachePath = 'imagens-trabalho/candidatos-pixabay.json';
const buscas = [
  'laptop on white desk', 'open laptop minimal desk', 'laptop closeup keyboard',
  'closed laptop on table', 'computer monitor on desk', 'monitor screen office desk',
  'black computer screen', 'hdmi cable', 'usb cable white background', 'ethernet cable',
  'webcam', 'compact camera on table',
];
const resultado = JSON.parse(await readFile(cachePath, 'utf8').catch(() => '[]'));
if (!Array.isArray(resultado)) throw new Error('Cache inválido.');
await mkdir('imagens-trabalho', { recursive: true });
for (const [index, busca] of buscas.entries()) {
  const patrimonio = `TI-${String(index + 1).padStart(4, '0')}`;
  const existing = resultado.find(item => item.patrimonio === patrimonio && item.provedor === 'pixabay' && item.busca === busca && Array.isArray(item.candidatos) && Date.now() - Date.parse(item.consultadoEm) < 24 * 60 * 60 * 1000);
  if (existing) continue;
  const key = (process.env.PIXABAY_API_KEY || await readFile('imagens-trabalho/pixabay.key', 'utf8').catch(() => '')).trim();
  if (!key) throw new Error('Defina PIXABAY_API_KEY ou salve a chave em imagens-trabalho/pixabay.key, sem registrá-la no repositório.');
  const url = new URL('https://pixabay.com/api/');
  url.search = new URLSearchParams({ key, q: busca, per_page: '20', orientation: 'horizontal', image_type: 'photo', safesearch: 'true' });
  const response = await fetch(url).catch(() => { throw new Error('Falha de conexão com Pixabay.'); });
  if (!response.ok) throw new Error(`Pixabay retornou ${response.status} para ${busca}`);
  const data = await response.json();
  const group = { patrimonio, busca, provedor: 'pixabay', consultadoEm: new Date().toISOString(),
    candidatos: data.hits.map(photo => ({ id: photo.id, pagina: photo.pageURL, fotografo: photo.user,
      fotografoUrl: `https://pixabay.com/users/${encodeURIComponent(photo.user)}-${photo.user_id}/`, download: photo.largeImageURL, licenca: 'https://pixabay.com/service/license-summary/' })) };
  const oldIndex = resultado.findIndex(item => item.patrimonio === patrimonio);
  if (oldIndex >= 0) resultado.splice(oldIndex, 1);
  resultado.push(group);
  await writeFile(cachePath, JSON.stringify(resultado, null, 2));
}
console.log('Candidatos obtidos. Revise visualmente e prepare selecionadas.json.');
