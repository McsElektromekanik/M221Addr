import './style.css'
import { createDefinitions } from './util'

type OutputTab = 'plc' | 'property' | 'inline' | 'init' | 'enum'

const sampleInput = ``;

const tabs: { id: OutputTab; label: string; hint: string }[] = [
  { id: 'plc', label: 'PLC', hint: 'PLC değişken tanımları' },
  { id: 'property', label: 'Property', hint: 'Property tanımları' },
  { id: 'inline', label: 'Inline', hint: 'Inline eşlemeleri' },
  { id: 'init', label: 'Init', hint: 'Başlangıç değerleri' },
  { id: 'enum', label: 'Enum', hint: 'Enum karşılıkları' },
]

const outputPlaceholders: Record<OutputTab, string> = {
  plc: '// PLC çıktısı burada görünecek', property: '// Property çıktısı burada görünecek',
  inline: '// Inline çıktısı burada görünecek', init: '// Init çıktısı burada görünecek', enum: '// Enum çıktısı burada görünecek',
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="shell">
    <header class="topbar"><div class="brand"><span class="brand-mark">M</span><span>M221 <b>ADDR</b></span></div><div class="status"><span class="status-dot"></span> Generator online <span class="version">v0.1</span></div></header>
    <main>
      <section class="intro"><div class="eyebrow"><span></span> VARIABLE WORKBENCH</div><h1>PLC &amp; SCADA<br><em>değişken üretici</em></h1><p>Tanımlarınızı tek seferde girin, ihtiyacınız olan formatları anında oluşturun.</p></section>
      <section class="workspace">
        <div class="panel input-panel"><div class="panel-heading"><div><span class="step">01</span><div><h2>Girdi değişkenleri</h2><p>Her satıra bir değişken tanımlayın</p></div></div><span class="format-chip">NAME : TYPE</span></div><textarea id="input" spellcheck="false" aria-label="Girdi değişkenleri">${sampleInput}</textarea><div class="panel-footer"><span>Satır bazlı format</span><span id="input-count">4 değişken</span></div></div>
        <div class="connector" aria-hidden="true"><span></span><i>↓</i><span></span></div>
        <div class="panel output-panel"><div class="panel-heading output-heading"><div><span class="step">02</span><div><h2>Çıktılar</h2><p>İhtiyacınız olan formatı seçin</p></div></div><button id="generate" class="generate-button" type="button"><span>✦</span> Oluştur</button></div>
          <div class="tabs" role="tablist" aria-label="Çıktı formatları">${tabs.map((tab, index) => `<button class="tab ${index === 0 ? 'active' : ''}" id="tab-${tab.id}" role="tab" aria-selected="${index === 0}" aria-controls="output-${tab.id}" data-tab="${tab.id}">${tab.label}<small>${tab.hint}</small></button>`).join('')}</div>
          <div class="output-wrap">${tabs.map((tab, index) => `<textarea class="output ${index === 0 ? 'visible' : ''}" id="output-${tab.id}" data-output="${tab.id}" role="tabpanel" aria-labelledby="tab-${tab.id}" spellcheck="false" placeholder="${outputPlaceholders[tab.id]}" ${index !== 0 ? 'hidden' : ''}></textarea>`).join('')}</div>
          <div class="panel-footer"><span id="output-label">PLC çıktısı hazır</span><button id="copy" class="copy-button" type="button" title="Aktif çıktıyı kopyala">⧉ Kopyala</button></div>
        </div>
      </section>
    </main>
    <footer><span>ENGINEERING TOOLKIT</span><span>Designed for clean control systems</span></footer>
  </div>`

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="shell">
    <header class="topbar"><div class="brand"><span class="brand-mark">M</span><span>M221 <b>Adresle</b></span></div><div class="status"><span class="version">v1.0</span></div></header>
    <main>
      <section class="workspace">
        <div class="panel input-panel"><div class="panel-heading"><div><span class="step">01</span><div><h2>Girdi değişkenleri</h2><p>Her satıra bir değişken tanımlayın</p></div></div><span class="format-chip">AD : TİP : ETİKETLER : PLC ADI : OKU</span></div><textarea id="input" spellcheck="false" aria-label="Girdi değişkenleri">${sampleInput}</textarea><div class="panel-footer"><span>Satır bazlı format</span><span id="input-count">4 değişken</span></div></div>
        <div class="connector" aria-hidden="true"><span></span><i>↓</i><span></span></div>
        <div class="panel output-panel"><div class="panel-heading output-heading"><div><span class="step">02</span><div><h2>Çıktılar</h2><p>İhtiyacınız olan formatı seçin</p></div></div><button id="generate" class="generate-button" type="button"><span>✦</span> Oluştur</button></div>
          <div class="tabs" role="tablist" aria-label="Çıktı formatları">${tabs.map((tab, index) => `<button class="tab ${index === 0 ? 'active' : ''}" id="tab-${tab.id}" role="tab" aria-selected="${index === 0}" aria-controls="output-${tab.id}" data-tab="${tab.id}">${tab.label}<small>${tab.hint}</small></button>`).join('')}</div>
          <div class="output-wrap">${tabs.map((tab, index) => `<textarea class="output ${index === 0 ? 'visible' : ''}" id="output-${tab.id}" data-output="${tab.id}" role="tabpanel" aria-labelledby="tab-${tab.id}" spellcheck="false" placeholder="${outputPlaceholders[tab.id]}" ${index !== 0 ? 'hidden' : ''}></textarea>`).join('')}</div>
          <div class="panel-footer"><span id="output-label">PLC çıktısı hazır</span><button id="copy" class="copy-button" type="button" title="Aktif çıktıyı kopyala">⧉ Kopyala</button></div>
        </div>
      </section>
    </main>
   
  </div>`

const input = document.querySelector<HTMLTextAreaElement>('#input')!
const generateButton = document.querySelector<HTMLButtonElement>('#generate')!
const copyButton = document.querySelector<HTMLButtonElement>('#copy')!
let activeTab: OutputTab = 'plc'

function generateOutputs() {
  const definitions = createDefinitions(input.value)
  tabs.forEach(({ id }) => { document.querySelector<HTMLTextAreaElement>(`#output-${id}`)!.value = definitions[id] })
  const variableCount = input.value.split('\n').filter((line) => line.trim()).length
  document.querySelector('#output-label')!.textContent = `${variableCount} değişken oluşturuldu`
}

input.addEventListener('input', () => { document.querySelector('#input-count')!.textContent = `${input.value.split('\n').filter((line) => line.trim()).length} değişken` })
generateButton.addEventListener('click', generateOutputs)

document.querySelectorAll<HTMLButtonElement>('.tab').forEach((tab) => tab.addEventListener('click', () => {
  activeTab = tab.dataset.tab as OutputTab
  document.querySelectorAll('.tab').forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false') })
  document.querySelectorAll<HTMLTextAreaElement>('.output').forEach((item) => { item.classList.remove('visible'); item.hidden = true })
  tab.classList.add('active'); tab.setAttribute('aria-selected', 'true')
  const output = document.querySelector<HTMLTextAreaElement>(`#output-${activeTab}`)!
  output.hidden = false; output.classList.add('visible')
  document.querySelector('#output-label')!.textContent = `${tabs.find(({ id }) => id === activeTab)?.label} çıktısı hazır`
}))

copyButton.addEventListener('click', async () => {
  const output = document.querySelector<HTMLTextAreaElement>(`#output-${activeTab}`)!
  if (!output.value) generateOutputs()
  await navigator.clipboard?.writeText(output.value)
  copyButton.textContent = '✓ Kopyalandı'
  setTimeout(() => { copyButton.textContent = '⧉ Kopyala' }, 1600)
})

generateOutputs()
