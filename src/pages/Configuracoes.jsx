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
function gerarId() {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('')
}

const TIPOS_WA = ['Comercial', 'Recorrência', 'Indicação', 'Suporte', 'Outro']

function TabWhatsApp() {
  const defaultContas = [
    { id: gerarId(), nome: 'Comercial',   tipo: 'Comercial'   },
    { id: gerarId(), nome: 'Recorrência', tipo: 'Recorrência' },
  ]
  const [contas, setContas] = useState(() => load('config_whatsapp_contas', defaultContas))
  const [modal, setModal] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTipo, setNovoTipo] = useState('Comercial')
  const [editando, setEditando] = useState(null)
  const [copiado, setCopiado] = useState(null)

  const salvarContas = (lista) => {
    localStorage.setItem('config_whatsapp_contas', JSON.stringify(lista))
    setContas(lista)
  }

  const adicionar = () => {
    if (!novoNome.trim()) return
    salvarContas([...contas, { id: gerarId(), nome: novoNome.trim(), tipo: novoTipo }])
    setNovoNome(''); setNovoTipo('Comercial'); setModal(false)
  }

  const remover = (id) => salvarContas(contas.filter(c => c.id !== id))

  const salvarEdicao = (id, nome, tipo) => {
    salvarContas(contas.map(c => c.id === id ? { ...c, nome, tipo } : c))
    setEditando(null)
  }

  const copiarWebhook = (id) => {
    navigator.clipboard.writeText(id).catch(() => {})
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">💬 Contas WhatsApp</h2>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie as contas WhatsApp conectadas à sua clínica</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          + Adicionar WhatsApp
        </button>
      </div>

      <div className="space-y-3">
        {contas.map(conta => (
          editando?.id === conta.id ? (
            <EditarConta key={conta.id} conta={conta} onSalvar={salvarEdicao} onCancelar={() => setEditando(null)} />
          ) : (
            <div key={conta.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0 text-lg">
                💬
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{conta.nome}</p>
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{conta.tipo}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {conta.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => copiarWebhook(conta.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copiado === conta.id ? 'Copiado!' : 'Webhook'}
                </button>
                <button onClick={() => setEditando(conta)}
                  className="text-gray-300 hover:text-amber-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => remover(conta.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )
        ))}

        {contas.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm">Nenhuma conta conectada. Clique em "+ Adicionar WhatsApp".</p>
          </div>
        )}
      </div>

      {/* Modal adicionar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Adicionar WhatsApp</h3>
              <button onClick={() => setModal(false)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome da Conta</label>
              <input autoFocus value={novoNome} onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionar()}
                placeholder="Ex: Comercial"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
              <select value={novoTipo} onChange={e => setNovoTipo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white">
                {TIPOS_WA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={adicionar} disabled={!novoNome.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditarConta({ conta, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(conta.nome)
  const [tipo, setTipo] = useState(conta.tipo)
  return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <div className="flex-1 grid grid-cols-2 gap-3">
        <input value={nome} onChange={e => setNome(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
          {TIPOS_WA.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <button onClick={() => onSalvar(conta.id, nome, tipo)}
        className="text-xs bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-600">Salvar</button>
      <button onClick={onCancelar} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
    </div>
  )
}

/* ── ABA MEU PERFIL ── */
function TabPerfil() {
  const [dados, setDados] = useState(() => load('config_perfil', {
    nome: 'João Henrique', apelido: 'João', email: 'jhagrimensura@gmail.com', cargo: 'Gestor',
  }))
  const [salvo, setSalvo] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirma, setMostrarConfirma] = useState(false)
  const [senhaMsg, setSenhaMsg] = useState('')

  const set = (campo, val) => setDados(d => ({ ...d, [campo]: val }))

  const salvar = () => {
    localStorage.setItem('config_perfil', JSON.stringify(dados))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  const atualizarSenha = () => {
    if (senha.length < 6) { setSenhaMsg('A senha deve ter pelo menos 6 caracteres'); return }
    if (senha !== confirma) { setSenhaMsg('As senhas não conferem'); return }
    setSenhaMsg('✓ Senha atualizada!')
    setSenha(''); setConfirma('')
    setTimeout(() => setSenhaMsg(''), 2500)
  }

  return (
    <div className="space-y-8">
      {/* Seção dados pessoais */}
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">👤 Meu Perfil</h2>
          <p className="text-sm text-gray-400 mt-0.5">Atualize suas informações pessoais</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome Completo <span className="text-red-400">*</span></label>
            <input value={dados.nome} onChange={e => set('nome', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Apelido</label>
            <input value={dados.apelido} onChange={e => set('apelido', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail</label>
          <input value={dados.email} disabled
            className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cargo</label>
            <input value={dados.cargo} onChange={e => set('cargo', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Função no Sistema</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-red-500 text-white font-semibold px-3 py-1 rounded-full">Administrador</span>
              <span className="text-xs text-gray-400">(não pode ser alterado)</span>
            </div>
          </div>
        </div>

        <button onClick={salvar}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
          {salvo ? '✓ Salvo!' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="border-t border-gray-100 pt-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Alterar Senha</h2>
          <p className="text-sm text-gray-400 mt-0.5">Atualize sua senha de acesso ao sistema</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nova Senha <span className="text-red-400">*</span></label>
          <div className="relative">
            <input type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="Digite sua nova senha"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-amber-400" />
            <button onClick={() => setMostrarSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {mostrarSenha ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">A senha deve ter pelo menos 6 caracteres</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirmar Nova Senha <span className="text-red-400">*</span></label>
          <div className="relative">
            <input type={mostrarConfirma ? 'text' : 'password'} value={confirma} onChange={e => setConfirma(e.target.value)}
              placeholder="Confirme sua nova senha"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-amber-400" />
            <button onClick={() => setMostrarConfirma(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {mostrarConfirma ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {senhaMsg && (
          <p className={`text-sm font-medium ${senhaMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{senhaMsg}</p>
        )}

        <button onClick={atualizarSenha}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
          Atualizar Senha
        </button>
      </div>
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
