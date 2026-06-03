import { useState, useEffect } from 'react'

function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}

const TABS = [
  { key: 'clinica',   label: 'Clínica',    icon: '🏢' },
  { key: 'whatsapp',  label: 'WhatsApp',   icon: '💬' },
  { key: 'perfil',    label: 'Meu Perfil', icon: '👤' },
  { key: 'equipe',    label: 'Equipe',     icon: '👥' },
]

/* ── ABA CLÍNICA ── */
function TabClinica() {
  const [dados, setDados] = useState(() => load('config_clinica', {
    nome: 'Dra. Amanda Lima', cep: '75800-138',
    endereco: 'Rua Benjamim Constant, 1970', cidade: 'Jataí', estado: 'Goiás',
  }))
  const [salvo, setSalvo] = useState(false)

  const set = (campo, val) => setDados(d => ({ ...d, [campo]: val }))
  const salvar = () => {
    localStorage.setItem('config_clinica', JSON.stringify(dados))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">🏢 Dados da Clínica</h2>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie as informações da sua clínica</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome da Clínica <span className="text-red-400">*</span></label>
          <input value={dados.nome} onChange={e => set('nome', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">CEP</label>
          <input value={dados.cep} onChange={e => set('cep', e.target.value)}
            placeholder="00000-000"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Endereço</label>
        <input value={dados.endereco} onChange={e => set('endereco', e.target.value)}
          placeholder="Rua, número, bairro..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cidade</label>
          <input value={dados.cidade} onChange={e => set('cidade', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Estado</label>
          <input value={dados.estado} onChange={e => set('estado', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
      </div>

      <button onClick={salvar}
        className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
        {salvo ? '✓ Salvo!' : 'Salvar Alterações'}
      </button>
    </div>
  )
}

/* ── ABA WHATSAPP ── */
function TabWhatsApp() {
  const [dados, setDados] = useState(() => load('config_whatsapp', { numero: '', linkBio: '', mensagemBoasvindas: '' }))
  const [salvo, setSalvo] = useState(false)

  const set = (campo, val) => setDados(d => ({ ...d, [campo]: val }))
  const salvar = () => {
    localStorage.setItem('config_whatsapp', JSON.stringify(dados))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">💬 Configurações de WhatsApp</h2>
        <p className="text-sm text-gray-400 mt-0.5">Número e mensagens automáticas</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Número do WhatsApp</label>
          <input value={dados.numero} onChange={e => set('numero', e.target.value)}
            placeholder="(64) 99999-9999"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Link da Bio</label>
          <input value={dados.linkBio} onChange={e => set('linkBio', e.target.value)}
            placeholder="https://wa.me/..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mensagem de Boas-vindas</label>
        <textarea value={dados.mensagemBoasvindas} onChange={e => set('mensagemBoasvindas', e.target.value)}
          placeholder="Olá! Bem-vindo(a) à clínica..."
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 resize-none" />
        <p className="text-xs text-gray-400 mt-1">Usada como modelo no primeiro contato com novos leads.</p>
      </div>

      <button onClick={salvar}
        className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
        {salvo ? '✓ Salvo!' : 'Salvar Alterações'}
      </button>
    </div>
  )
}

/* ── ABA MEU PERFIL ── */
function TabPerfil() {
  const [dados, setDados] = useState(() => load('config_perfil', { nome: 'Dra. Amanda Lima', email: '', cargo: 'Dentista', crm: '' }))
  const [salvo, setSalvo] = useState(false)

  const set = (campo, val) => setDados(d => ({ ...d, [campo]: val }))
  const salvar = () => {
    localStorage.setItem('config_perfil', JSON.stringify(dados))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">👤 Meu Perfil</h2>
        <p className="text-sm text-gray-400 mt-0.5">Suas informações pessoais e profissionais</p>
      </div>

      <div className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-2xl font-bold flex-shrink-0">
          {dados.nome ? dados.nome.charAt(0).toUpperCase() : '?'}
        </div>
        <div>
          <p className="font-bold text-gray-800">{dados.nome || 'Sem nome'}</p>
          <p className="text-sm text-gray-400">{dados.cargo}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome Completo</label>
          <input value={dados.nome} onChange={e => set('nome', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail</label>
          <input type="email" value={dados.email} onChange={e => set('email', e.target.value)}
            placeholder="seu@email.com"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cargo / Especialidade</label>
          <input value={dados.cargo} onChange={e => set('cargo', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">CRM / CRO</label>
          <input value={dados.crm} onChange={e => set('crm', e.target.value)}
            placeholder="GO-00000"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
      </div>

      <button onClick={salvar}
        className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
        {salvo ? '✓ Salvo!' : 'Salvar Alterações'}
      </button>
    </div>
  )
}

/* ── ABA EQUIPE ── */
function TabEquipe() {
  const [membros, setMembros] = useState(() => load('config_equipe', [
    { id: 1, nome: 'Dra. Amanda Lima', cargo: 'Dentista', whatsapp: '' },
  ]))
  const [novoNome, setNovoNome] = useState('')
  const [novoCargo, setNovoCargo] = useState('')
  const [novoWhats, setNovoWhats] = useState('')
  const [salvo, setSalvo] = useState(false)

  const salvar = (lista) => {
    localStorage.setItem('config_equipe', JSON.stringify(lista))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  const adicionar = () => {
    if (!novoNome.trim()) return
    const novo = { id: Date.now(), nome: novoNome.trim(), cargo: novoCargo.trim(), whatsapp: novoWhats.trim() }
    const lista = [...membros, novo]
    setMembros(lista)
    salvar(lista)
    setNovoNome(''); setNovoCargo(''); setNovoWhats('')
  }

  const remover = (id) => {
    const lista = membros.filter(m => m.id !== id)
    setMembros(lista)
    salvar(lista)
  }

  const atualizar = (id, campo, val) => {
    setMembros(prev => prev.map(m => m.id === id ? { ...m, [campo]: val } : m))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">👥 Equipe</h2>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie os membros da sua equipe</p>
      </div>

      {/* Lista de membros */}
      <div className="space-y-3">
        {membros.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-sm flex-shrink-0">
              {m.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              <input value={m.nome} onChange={e => atualizar(m.id, 'nome', e.target.value)}
                placeholder="Nome"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400" />
              <input value={m.cargo} onChange={e => atualizar(m.id, 'cargo', e.target.value)}
                placeholder="Cargo"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400" />
              <input value={m.whatsapp} onChange={e => atualizar(m.id, 'whatsapp', e.target.value)}
                placeholder="WhatsApp"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </div>
            <button onClick={() => { const lista = membros.map(x => x.id === m.id ? m : x); salvar(lista) }}
              className="text-xs text-amber-500 font-semibold px-3 py-1.5 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors">
              Salvar
            </button>
            <button onClick={() => remover(m.id)}
              className="text-gray-300 hover:text-red-400 text-lg leading-none ml-1">✕</button>
          </div>
        ))}
      </div>

      {/* Adicionar novo membro */}
      <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
        <p className="text-sm font-semibold text-gray-600">Adicionar membro</p>
        <div className="grid grid-cols-3 gap-3">
          <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
            placeholder="Nome *"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
          <input value={novoCargo} onChange={e => setNovoCargo(e.target.value)}
            placeholder="Cargo"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
          <input value={novoWhats} onChange={e => setNovoWhats(e.target.value)}
            placeholder="WhatsApp"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
        </div>
        <button onClick={adicionar} disabled={!novoNome.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-40">
          + Adicionar
        </button>
      </div>

      {salvo && <p className="text-sm text-green-600 font-medium">✓ Equipe salva!</p>}
    </div>
  )
}

/* ── PÁGINA PRINCIPAL ── */
export default function Configuracoes() {
  const [aba, setAba] = useState('clinica')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setAba(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-xl border transition-colors ${
              aba === tab.key
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {aba === 'clinica'  && <TabClinica />}
        {aba === 'whatsapp' && <TabWhatsApp />}
        {aba === 'perfil'   && <TabPerfil />}
        {aba === 'equipe'   && <TabEquipe />}
      </div>
    </div>
  )
}
