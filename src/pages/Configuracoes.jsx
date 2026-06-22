import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useLeads } from '../context/LeadsContext'
import { usePacientes } from '../context/PacientesContext'
import { useVendas } from '../context/VendasContext'
import * as XLSX from 'xlsx'

function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}

const TABS = [
  { key: 'clinica',   label: 'Clínica',    icon: '🏢' },
  { key: 'whatsapp',  label: 'WhatsApp',   icon: '💬' },
  { key: 'perfil',    label: 'Meu Perfil', icon: '👤' },
  { key: 'equipe',    label: 'Equipe',     icon: '👥' },
  { key: 'importar',  label: 'Importar',   icon: '📥' },
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

const TIPOS_WA = ['Leads Novos', 'Leads Recorrentes', 'Indicação', 'Suporte', 'Geral']

function TokenInput({ label, value, onChange, optional }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label} {optional ? <span className="text-gray-400 font-normal">(opcional)</span> : <span className="text-red-400">*</span>}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          placeholder="Ex: 3F1A2B3C4D5E"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-amber-400 font-mono" />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  )
}

const EMPTY_CONTA = { nome: '', tipo: 'Leads Novos', instanciaId: '', instanciaToken: '', clientToken: '' }

const ZAPI_BASE = 'https://api.z-api.io'

async function testarConexao(conta) {
  const ctParam = conta.clientToken ? `&ct=${encodeURIComponent(conta.clientToken)}` : ''
  const res = await fetch(`/api/zapi-status?i=${conta.instanciaId}&t=${conta.instanciaToken}${ctParam}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data?.value === 'connected' ? 'open' : (data?.value || 'desconhecido')
}

function TabWhatsApp() {
  const defaultContas = []
  const [contas, setContas] = useState(() => load('config_whatsapp_contas', defaultContas))

  // Supabase é a fonte da verdade — sempre sincroniza ao abrir
  useEffect(() => {
    supabase.from('configuracoes').select('valor').eq('chave', 'config_whatsapp_contas').single()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valor)) {
          // Supabase tem registro (mesmo array vazio) → ele manda
          setContas(data.valor)
          localStorage.setItem('config_whatsapp_contas', JSON.stringify(data.valor))
        } else if (error?.code === 'PGRST116') {
          // Sem registro no Supabase ainda → sobe o localStorage
          const local = load('config_whatsapp_contas', [])
          if (local.length > 0) {
            supabase.from('configuracoes').upsert({
              chave: 'config_whatsapp_contas',
              valor: local,
              updated_at: new Date().toISOString(),
            }).then(() => {})
          }
        }
      })
  }, [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_CONTA)
  const [editando, setEditando] = useState(null)
  const [copiado, setCopiado] = useState(null)
  const [testando, setTestando] = useState(null)
  const [statusConexao, setStatusConexao] = useState({})
  const [modalQR, setModalQR] = useState(null)
  const [qrStatus, setQrStatus] = useState('aguardando')
  const [qrValue, setQrValue] = useState(null)
  const [qrErro, setQrErro] = useState(null)
  const [qrContagem, setQrContagem] = useState(20)

  const setF = (campo, val) => setForm(f => ({ ...f, [campo]: val }))

  const salvarContas = (lista) => {
    localStorage.setItem('config_whatsapp_contas', JSON.stringify(lista))
    setContas(lista)
    supabase.from('configuracoes').upsert({
      chave: 'config_whatsapp_contas',
      valor: lista,
      updated_at: new Date().toISOString(),
    }).then(() => {})
  }

  const adicionar = () => {
    if (!form.nome.trim() || !form.instanciaId.trim() || !form.instanciaToken.trim()) return
    salvarContas([...contas, { ...form, id: gerarId(), nome: form.nome.trim() }])
    setForm(EMPTY_CONTA); setModal(false)
  }

  const remover = (id) => salvarContas(contas.filter(c => c.id !== id))

  const salvarEdicao = (id, nome, tipo, clientToken) => {
    salvarContas(contas.map(c => c.id === id ? { ...c, nome, tipo, clientToken } : c))
    setEditando(null)
  }

  const copiarWebhook = (id) => {
    navigator.clipboard.writeText(id).catch(() => {})
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  const handleTestarConexao = async (conta) => {
    if (!conta.instanciaId || !conta.instanciaToken) {
      setStatusConexao(s => ({ ...s, [conta.id]: 'sem_config' }))
      return
    }
    setTestando(conta.id)
    try {
      const state = await testarConexao(conta)
      setStatusConexao(s => ({ ...s, [conta.id]: state }))
    } catch (e) {
      setStatusConexao(s => ({ ...s, [conta.id]: 'erro' }))
    }
    setTestando(null)
  }

  const buscarQR = async (conta) => {
    setQrValue(null)
    setQrErro(null)
    setQrContagem(20)
    try {
      const ctParam = conta.clientToken ? `&ct=${encodeURIComponent(conta.clientToken)}` : ''
      const res = await fetch(`/api/zapi-qr?i=${conta.instanciaId}&t=${conta.instanciaToken}${ctParam}`)
      const data = await res.json()
      if (data?.connected === true) {
        setQrStatus('conectado')
      } else if (data?.value) {
        setQrValue(data.value)
      } else {
        setQrErro(JSON.stringify(data).slice(0, 300))
      }
    } catch (e) {
      setQrErro(e.message)
    }
  }

  const abrirQR = (conta) => {
    setModalQR(conta)
    setQrStatus('aguardando')
    buscarQR(conta)
  }

  const fecharQR = () => { setModalQR(null); setQrStatus('aguardando'); setQrValue(null); setQrErro(null) }

  // Countdown e auto-refresh do QR Code
  useEffect(() => {
    if (!modalQR || qrStatus === 'conectado') return
    const tick = setInterval(() => {
      setQrContagem(c => {
        if (c <= 1) {
          buscarQR(modalQR)
          return 20
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [modalQR, qrStatus])

  // Poll status enquanto QR está aberto
  useEffect(() => {
    if (!modalQR) return
    const poll = setInterval(async () => {
      try {
        const state = await testarConexao(modalQR)
        if (state === 'open') {
          setQrStatus('conectado')
          setStatusConexao(s => ({ ...s, [modalQR.id]: 'open' }))
          clearInterval(poll)
        }
      } catch {}
    }, 3000)
    return () => clearInterval(poll)
  }, [modalQR])

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
                  {statusConexao[conta.id] && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      statusConexao[conta.id] === 'open' ? 'bg-green-100 text-green-600'
                      : statusConexao[conta.id] === 'erro' ? 'bg-red-100 text-red-500'
                      : statusConexao[conta.id] === 'sem_config' ? 'bg-orange-100 text-orange-500'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                      {statusConexao[conta.id] === 'open' ? '● Conectado'
                        : statusConexao[conta.id] === 'erro' ? '● Erro'
                        : statusConexao[conta.id] === 'sem_config' ? '⚠ Sem config'
                        : `● ${statusConexao[conta.id]}`}
                    </span>
                  )}
                </div>
                {conta.instanciaId
                  ? <p className="text-xs text-gray-400 mt-0.5 font-mono">Z-API · {conta.instanciaId.slice(0, 16)}...</p>
                  : <p className="text-xs text-orange-400 mt-0.5">⚠ Instância não configurada</p>
                }
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => abrirQR(conta)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors">
                  📱 Conectar
                </button>
                <button onClick={() => handleTestarConexao(conta)} disabled={testando === conta.id}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 font-medium transition-colors disabled:opacity-40">
                  {testando === conta.id
                    ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <span>⚡</span>}
                  Testar
                </button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Adicionar Conta WhatsApp</h3>
                <p className="text-xs text-gray-400 mt-0.5">Conectado via Z-API</p>
              </div>
              <button onClick={() => { setModal(false); setForm(EMPTY_CONTA) }} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
            </div>

            {/* Passo a passo Z-API */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 space-y-1">
              <p className="font-semibold">Como obter as credenciais:</p>
              <p>1. Acesse <strong>z-api.io</strong> e crie uma conta gratuita</p>
              <p>2. Clique em <strong>"Criar instância"</strong></p>
              <p>3. Copie o <strong>ID da Instância</strong> e o <strong>Token</strong> do painel</p>
              <p>4. Clique em <strong>"QR Code"</strong> no painel Z-API e escaneie com o WhatsApp Business</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome da conta <span className="text-red-400">*</span></label>
              <input autoFocus value={form.nome} onChange={e => setF('nome', e.target.value)}
                placeholder="Ex: Comercial"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo <span className="text-red-400">*</span></label>
              <select value={form.tipo} onChange={e => setF('tipo', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 bg-white">
                {TIPOS_WA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">ID da Instância <span className="text-red-400">*</span></label>
              <input value={form.instanciaId} onChange={e => setF('instanciaId', e.target.value)}
                placeholder="Ex: 3D6F50ACA2288238F61C661707F5575A"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 font-mono" />
              <p className="text-xs text-gray-400 mt-1">Encontrado no painel Z-API → sua instância → "Instance ID"</p>
            </div>
            <TokenInput label="Token da Instância" value={form.instanciaToken} onChange={v => setF('instanciaToken', v)} />
            <TokenInput label="Security Token (Client Token)" value={form.clientToken} onChange={v => setF('clientToken', v)} optional />
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Como obter o Security Token:</p>
              <p>No painel Z-API → clique no seu nome (canto superior) → <strong>Segurança</strong> → <strong>Token de segurança da conta</strong> → <strong>Configurar agora</strong> → copie o token gerado.</p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => { setModal(false); setForm(EMPTY_CONTA) }} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={adicionar} disabled={!form.nome.trim() || !form.instanciaId.trim() || !form.instanciaToken.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {modalQR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Conectar WhatsApp</h3>
              <button onClick={fecharQR} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
            </div>

            {qrStatus === 'conectado' ? (
              <div className="py-8 space-y-3">
                <p className="text-5xl">✅</p>
                <p className="text-lg font-bold text-green-600">WhatsApp Conectado!</p>
                <p className="text-sm text-gray-400">A conta <strong>{modalQR.nome}</strong> está pronta para uso.</p>
                <button onClick={fecharQR}
                  className="mt-2 px-6 py-2.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Abra o <strong>WhatsApp Business</strong> no celular →<br />
                  3 pontos → <strong>Aparelhos conectados</strong> → <strong>Conectar aparelho</strong>
                </p>
                <div className="flex justify-center">
                  {qrValue ? (
                    <div className="p-3 bg-white border border-gray-100 rounded-xl">
                      <QRCodeSVG value={qrValue} size={210} />
                    </div>
                  ) : qrErro ? (
                    <div className="w-56 p-4 rounded-xl border border-red-100 bg-red-50 text-xs text-red-500 text-left">
                      <p className="font-semibold mb-1">Erro ao carregar QR Code:</p>
                      <p className="break-all">{qrErro}</p>
                    </div>
                  ) : (
                    <div className="w-56 h-56 rounded-xl border border-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Aguardando escaneamento...
                  <span className={`font-semibold ${qrContagem <= 5 ? 'text-orange-400' : 'text-gray-400'}`}>
                    {qrContagem}s
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EditarConta({ conta, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(conta.nome)
  const [tipo, setTipo] = useState(conta.tipo)
  const [clientToken, setClientToken] = useState(conta.clientToken || '')
  const [showToken, setShowToken] = useState(false)
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Nome da conta"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
          {TIPOS_WA.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="relative">
        <input type={showToken ? 'text' : 'password'} value={clientToken} onChange={e => setClientToken(e.target.value)}
          placeholder="Security Token (Client Token)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:border-amber-400 bg-white font-mono" />
        <button type="button" onClick={() => setShowToken(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
          {showToken ? '🙈' : '👁️'}
        </button>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onCancelar} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
        <button onClick={() => onSalvar(conta.id, nome, tipo, clientToken)}
          className="text-xs bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-600">Salvar</button>
      </div>
    </div>
  )
}

/* ── ABA MEU PERFIL ── */
function TabPerfil() {
  const { session, updatePassword } = useAuth()
  const emailReal = session?.user?.email || ''
  const [dados, setDados] = useState(() => load('config_perfil', { nome: '', apelido: '', cargo: '' }))
  const [salvo, setSalvo] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirma, setMostrarConfirma] = useState(false)
  const [senhaMsg, setSenhaMsg] = useState('')
  const [senhaLoading, setSenhaLoading] = useState(false)

  const set = (campo, val) => setDados(d => ({ ...d, [campo]: val }))

  const salvar = () => {
    localStorage.setItem('config_perfil', JSON.stringify(dados))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  const atualizarSenha = async () => {
    if (senha.length < 6) { setSenhaMsg('A senha deve ter pelo menos 6 caracteres'); return }
    if (senha !== confirma) { setSenhaMsg('As senhas não conferem'); return }
    setSenhaLoading(true)
    const { error } = await updatePassword(senha)
    setSenhaLoading(false)
    if (error) {
      setSenhaMsg('Erro ao atualizar senha. Tente novamente.')
    } else {
      setSenhaMsg('✓ Senha atualizada com sucesso!')
      setSenha(''); setConfirma('')
      setTimeout(() => setSenhaMsg(''), 3000)
    }
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
          <input value={emailReal} disabled
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

        <button onClick={atualizarSenha} disabled={senhaLoading}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
          {senhaLoading ? 'Salvando...' : 'Atualizar Senha'}
        </button>
      </div>
    </div>
  )
}

/* ── ABA EQUIPE ── */
const MEMBROS_DEFAULT = []

const TODAS_PAGINAS = [
  { id: 'dashboard',   label: 'Dashboard'      },
  { id: 'agenda',      label: 'Agenda'         },
  { id: 'metas',       label: 'Metas'          },
  { id: 'social',      label: 'Social Media'   },
  { id: 'comercial',   label: 'WhatsApp/Leads' },
  { id: 'faturamento', label: 'Vendas'         },
  { id: 'financeiro',  label: 'Financeiro'     },
  { id: 'pacientes',   label: 'Pacientes'      },
  { id: 'relatorios',  label: 'Relatórios'     },
]
const PERMISSOES_PADRAO = ['dashboard', 'agenda', 'metas', 'social', 'comercial', 'faturamento', 'pacientes', 'relatorios']

const EMPTY_MEMBRO = { nome: '', apelido: '', funcao: 'Funcionário', email: '', cargo: '', permissoes: PERMISSOES_PADRAO }

function ModalMembro({ membro, onSalvar, onFechar }) {
  const [form, setForm] = useState(() => membro ? { ...EMPTY_MEMBRO, ...membro, permissoes: membro.permissoes || PERMISSOES_PADRAO } : EMPTY_MEMBRO)
  const set = (campo, val) => setForm(f => ({ ...f, [campo]: val }))

  const togglePerm = (id, checked) => {
    const atual = form.permissoes || PERMISSOES_PADRAO
    set('permissoes', checked ? [...atual, id] : atual.filter(x => x !== id))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{membro ? 'Editar Membro' : 'Adicionar Membro'}</h3>
          <button onClick={onFechar} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Nome Completo <span className="text-red-400">*</span></label>
            <input autoFocus value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Nome completo"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Apelido</label>
            <input value={form.apelido} onChange={e => set('apelido', e.target.value)}
              placeholder="Como é chamado"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail</label>
          <input value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Cargo</label>
            <input value={form.cargo} onChange={e => set('cargo', e.target.value)}
              placeholder="Ex: Gestor, Doutora..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Função no Sistema</label>
            <select value={form.funcao}
              onChange={e => { set('funcao', e.target.value); if (e.target.value === 'Administrador') set('permissoes', null) }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
              <option>Administrador</option>
              <option>Funcionário</option>
            </select>
          </div>
        </div>

        {form.funcao === 'Funcionário' && (
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 mb-3">Telas que ela pode acessar</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {TODAS_PAGINAS.map(p => {
                const checked = (form.permissoes || PERMISSOES_PADRAO).includes(p.id)
                return (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="checkbox" checked={checked} onChange={e => togglePerm(p.id, e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500 flex-shrink-0" />
                    {p.label}
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={() => form.nome.trim() && onSalvar(form)} disabled={!form.nome.trim()}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
            {membro ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TabEquipe() {
  const { inviteUser } = useAuth()
  const [membros, setMembros] = useState(() => load('config_equipe', MEMBROS_DEFAULT))
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [convidando, setConvidando] = useState(null)
  const [feedbackConvite, setFeedbackConvite] = useState({})

  const salvarLista = (lista) => {
    localStorage.setItem('config_equipe', JSON.stringify(lista))
    setMembros(lista)
  }

  const adicionar = (form) => {
    salvarLista([...membros, { ...form, id: Date.now() }])
    setModal(false)
  }

  const salvarEdicao = (form) => {
    salvarLista(membros.map(m => m.id === editando.id ? { ...editando, ...form } : m))
    setEditando(null)
  }

  const remover = (id) => salvarLista(membros.filter(m => m.id !== id))

  const enviarConvite = async (membro) => {
    if (!membro.email) return
    setConvidando(membro.id)
    const perms = membro.funcao === 'Funcionário' ? (membro.permissoes || PERMISSOES_PADRAO) : null
    const { error } = await inviteUser(membro.email, membro.funcao, perms)
    setConvidando(null)
    if (error) {
      setFeedbackConvite(f => ({ ...f, [membro.id]: 'erro' }))
    } else {
      setFeedbackConvite(f => ({ ...f, [membro.id]: 'ok' }))
      const agora = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      salvarLista(membros.map(m => m.id === membro.id ? { ...m, convidadoEm: agora } : m))
    }
    setTimeout(() => setFeedbackConvite(f => ({ ...f, [membro.id]: null })), 4000)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">👥 Equipe</h2>
          <p className="text-sm text-gray-400 mt-0.5">Adicione colaboradoras e envie o link de acesso por e-mail</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          + Adicionar Membro
        </button>
      </div>

      <div className="space-y-3">
        {membros.map(m => (
          <div key={m.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
              {m.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-800">
                  {m.nome}{m.apelido ? ` (${m.apelido})` : ''}
                </p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  m.funcao === 'Administrador'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>{m.funcao}</span>
              </div>
              {m.email && <p className="text-xs text-gray-400 mt-0.5">{m.email}</p>}
              {m.cargo && <p className="text-xs text-gray-500 mt-0.5">{m.cargo}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {m.email && (
                feedbackConvite[m.id] === 'ok' ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    Link enviado!
                  </span>
                ) : feedbackConvite[m.id] === 'erro' ? (
                  <span className="text-xs text-red-400 font-semibold bg-red-50 px-3 py-1.5 rounded-lg">Erro ao enviar</span>
                ) : (
                  <button
                    onClick={() => enviarConvite(m)}
                    disabled={convidando === m.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40
                      border-amber-300 text-amber-600 hover:bg-amber-50">
                    {convidando === m.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {convidando === m.id ? 'Enviando...' : m.convidadoEm ? `Reenviar (${m.convidadoEm})` : 'Enviar Convite'}
                  </button>
                )
              )}
              <button onClick={() => setEditando(m)}
                className="text-gray-300 hover:text-amber-500 transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => remover(m.id)}
                className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {membros.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm">Nenhum membro cadastrado. Clique em "+ Adicionar Membro".</p>
          </div>
        )}
      </div>

      {modal && <ModalMembro onSalvar={adicionar} onFechar={() => setModal(false)} />}
      {editando && <ModalMembro membro={editando} onSalvar={salvarEdicao} onFechar={() => setEditando(null)} />}
    </div>
  )
}

/* ── ABA IMPORTAR CSV ── */
const CAMPOS_TIPO = {
  leads: [
    { id: 'nome',        label: 'Nome',                required: true  },
    { id: 'telefone',    label: 'Telefone',            required: false },
    { id: 'data',        label: 'Data',                required: false },
    { id: 'status',      label: 'Status',              required: false },
    { id: 'responsavel', label: 'Responsável',         required: false },
    { id: 'obs',         label: 'Observações',         required: false },
  ],
  pacientes: [
    { id: 'nome',           label: 'Nome',              required: true  },
    { id: 'telefone',       label: 'Telefone',          required: false },
    { id: 'email',          label: 'E-mail',            required: false },
    { id: 'dataNascimento', label: 'Data de Nascimento',required: false },
    { id: 'obs',            label: 'Observações',       required: false },
  ],
  agendamentos: [
    { id: 'paciente',    label: 'Nome do Paciente',    required: true  },
    { id: 'date',        label: 'Data',                required: true  },
    { id: 'time',        label: 'Horário (HH:MM)',     required: false },
    { id: 'procedimento',label: 'Procedimento',        required: false },
    { id: 'status',      label: 'Status',              required: false },
    { id: 'telefone',    label: 'Telefone',            required: false },
  ],
  vendas: [
    { id: 'paciente',       label: 'Paciente',          required: true  },
    { id: 'data',           label: 'Data',              required: true  },
    { id: 'valor',          label: 'Valor (R$)',        required: true  },
    { id: 'tipo',           label: 'Tipo',              required: false },
    { id: 'procedimento',   label: 'Procedimento',      required: false },
    { id: 'forma_pagamento',label: 'Forma de Pagamento',required: false },
  ],
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (!lines.length) return { headers: [], rows: [] }
  const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ','
  function splitLine(line) {
    const res = []; let f = '', q = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') q = !q
      else if (c === sep && !q) { res.push(f.trim().replace(/^"|"$/g, '')); f = '' }
      else f += c
    }
    res.push(f.trim().replace(/^"|"$/g, ''))
    return res
  }
  const hdrs = splitLine(lines[0])
  const rows = lines.slice(1).map(l => {
    const vals = splitLine(l)
    return Object.fromEntries(hdrs.map((h, i) => [h, vals[i] ?? '']))
  }).filter(r => Object.values(r).some(v => v))
  return { headers: hdrs, rows }
}

function parseData(val) {
  if (!val) return new Date().toISOString().split('T')[0]
  const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10)
  return new Date().toISOString().split('T')[0]
}

function parseValor(val) {
  if (!val) return 0
  return parseFloat(String(val).replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

function autoMapear(headers, campos) {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  const mapa = {}
  campos.forEach(c => {
    const match = headers.find(h => norm(h).includes(norm(c.label)) || norm(c.label).includes(norm(h)) || norm(h) === norm(c.id))
    if (match) mapa[c.id] = match
  })
  return mapa
}

function TabImportar() {
  const { addLead, leads }           = useLeads()
  const { addPaciente, pacientes }   = usePacientes()
  const { addLancamento, lancamentos } = useVendas()
  const inputRef = useRef(null)
  const [tipo, setTipo]         = useState('leads')
  const [headers, setHeaders]   = useState([])
  const [rows, setRows]         = useState([])
  const [mapa, setMapa]         = useState({})
  const [resultado, setResultado] = useState(null)
  const [importando, setImportando] = useState(false)
  const [drag, setDrag]         = useState(false)
  const [podeDesfazer, setPodeDesfazer] = useState(false)

  const campos = CAMPOS_TIPO[tipo]

  const carregarArquivo = (file) => {
    if (!file || !file.name.match(/\.(csv|txt|xls|xlsx)$/i)) return
    setResultado(null)
    const reader = new FileReader()
    if (file.name.match(/\.(xls|xlsx)$/i)) {
      reader.onload = e => {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!json.length) return
        const hdrs = Object.keys(json[0])
        setHeaders(hdrs)
        setRows(json.map(row => Object.fromEntries(hdrs.map(h => [h, String(row[h] ?? '')]))))
        setMapa(autoMapear(hdrs, CAMPOS_TIPO[tipo]))
      }
      reader.readAsArrayBuffer(file)
    } else {
      reader.onload = e => {
        const { headers: hdrs, rows: rs } = parseCSV(e.target.result)
        setHeaders(hdrs)
        setRows(rs)
        setMapa(autoMapear(hdrs, CAMPOS_TIPO[tipo]))
      }
      reader.readAsText(file, 'UTF-8')
    }
  }

  useEffect(() => {
    if (headers.length) setMapa(autoMapear(headers, CAMPOS_TIPO[tipo]))
  }, [tipo])

  const get = (row, campo) => { const col = mapa[campo]; return col ? (row[col] ?? '') : '' }

  const CHAVES = { leads: 'clinica_leads', pacientes: 'clinica_pacientes', agendamentos: 'agenda_agendamentos', vendas: 'clinica_vendas' }

  const importar = () => {
    setImportando(true)
    // Salva backup antes de importar
    const backupKey = `backup_import_${tipo}`
    const chave = CHAVES[tipo]
    localStorage.setItem(backupKey, localStorage.getItem(chave) || '[]')

    let ok = 0, err = 0
    const hoje = new Date().toISOString().split('T')[0]
    rows.forEach(row => {
      try {
        if (tipo === 'leads') {
          const nome = get(row, 'nome'); if (!nome) { err++; return }
          addLead({ nome, telefone: get(row, 'telefone'), data: parseData(get(row, 'data')) || hoje, status: 'em_aberto', responsavel: get(row, 'responsavel'), obs: get(row, 'obs'), origem: 'leads_novos', origemCustom: 'Importação CSV' })
          ok++
        } else if (tipo === 'pacientes') {
          const nome = get(row, 'nome'); if (!nome) { err++; return }
          addPaciente({ nome, telefone: get(row, 'telefone'), email: get(row, 'email'), dataNascimento: get(row, 'dataNascimento'), obs: get(row, 'obs') })
          ok++
        } else if (tipo === 'agendamentos') {
          const paciente = get(row, 'paciente'); const date = parseData(get(row, 'date'))
          if (!paciente || !date) { err++; return }
          const lista = JSON.parse(localStorage.getItem('agenda_agendamentos') || '[]')
          lista.push({ id: `imp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, paciente, date, time: get(row, 'time') || '08:00', procedimento: get(row, 'procedimento'), status: get(row, 'status') || 'agendado', telefone: get(row, 'telefone'), tipo: 'consulta' })
          localStorage.setItem('agenda_agendamentos', JSON.stringify(lista))
          ok++
        } else if (tipo === 'vendas') {
          const paciente = get(row, 'paciente'); if (!paciente) { err++; return }
          addLancamento({ paciente, data: parseData(get(row, 'data')) || hoje, valor: parseValor(get(row, 'valor')), tipo: get(row, 'tipo') || 'Consulta', procedimento: get(row, 'procedimento'), forma_pagamento: get(row, 'forma_pagamento') || '' })
          ok++
        }
      } catch { err++ }
    })
    setResultado({ ok, err })
    setImportando(false)
    setPodeDesfazer(true)
  }

  const desfazer = () => {
    const backupKey = `backup_import_${tipo}`
    const backup = localStorage.getItem(backupKey)
    if (backup === null) return
    localStorage.setItem(CHAVES[tipo], backup)
    localStorage.removeItem(backupKey)
    setPodeDesfazer(false)
    setResultado(null)
    window.location.reload()
  }

  const TIPOS = [
    { id: 'leads',        label: 'Leads',        icon: '🔗' },
    { id: 'pacientes',    label: 'Pacientes',    icon: '👤' },
    { id: 'agendamentos', label: 'Agendamentos', icon: '📅' },
    { id: 'vendas',       label: 'Vendas',       icon: '💰' },
  ]

  const temObrigatorios = campos.filter(c => c.required).every(c => mapa[c.id])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Importar CSV</h2>
        <p className="text-sm text-gray-400 mt-0.5">Exporte do Favo (ou qualquer sistema) e importe aqui em segundos</p>
      </div>

      {/* Tipo */}
      <div className="flex gap-2 flex-wrap">
        {TIPOS.map(t => (
          <button key={t.id} onClick={() => { setTipo(t.id); setResultado(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              tipo === t.id ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50'
            }`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); carregarArquivo(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          drag ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
        }`}>
        <input ref={inputRef} type="file" accept=".csv,.txt,.xls,.xlsx" className="hidden" onChange={e => carregarArquivo(e.target.files[0])} />
        <p className="text-3xl mb-2">📂</p>
        <p className="text-sm font-semibold text-gray-600">Arraste o arquivo aqui ou clique para selecionar</p>
        <p className="text-xs text-gray-400 mt-1">Formatos aceitos: .csv, .xls, .xlsx</p>
        {rows.length > 0 && <p className="text-xs text-green-600 font-semibold mt-2">{rows.length} linhas carregadas</p>}
      </div>

      {/* Mapeamento */}
      {headers.length > 0 && (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-700">Mapeamento de colunas</p>
            <p className="text-xs text-gray-400 mt-0.5">Para cada campo, selecione qual coluna do seu CSV corresponde</p>
          </div>
          <div className="divide-y divide-gray-50">
            {campos.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-44 flex-shrink-0">
                  <span className="text-sm text-gray-700 font-medium">{c.label}</span>
                  {c.required && <span className="text-red-400 ml-1 text-xs">*</span>}
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <select value={mapa[c.id] || ''}
                  onChange={e => setMapa(m => ({ ...m, [c.id]: e.target.value || undefined }))}
                  className={`flex-1 border rounded-xl px-3 py-2 text-sm outline-none bg-white transition-colors ${
                    c.required && !mapa[c.id] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-amber-400'
                  }`}>
                  <option value="">— não importar —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {mapa[c.id] && (
                  <span className="text-xs text-gray-400 w-32 truncate hidden lg:block">
                    ex: {rows[0]?.[mapa[c.id]] || '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-700">Pré-visualização — primeiras 3 linhas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {headers.map(h => <th key={h} className="px-4 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {headers.map(h => <td key={h} className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className={`rounded-2xl px-5 py-4 flex items-center justify-between gap-4 ${resultado.err === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center gap-4">
            <span className="text-2xl">{resultado.err === 0 ? '✅' : '⚠️'}</span>
            <div>
              <p className="text-sm font-bold text-gray-800">{resultado.ok} registro{resultado.ok !== 1 ? 's' : ''} importado{resultado.ok !== 1 ? 's' : ''} com sucesso</p>
              {resultado.err > 0 && <p className="text-xs text-amber-700 mt-0.5">{resultado.err} linha{resultado.err !== 1 ? 's' : ''} ignorada{resultado.err !== 1 ? 's' : ''} (campos obrigatórios ausentes)</p>}
            </div>
          </div>
          {podeDesfazer && (
            <button onClick={desfazer}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
              ↩ Desfazer importação
            </button>
          )}
        </div>
      )}

      {/* Botão */}
      {rows.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={importar}
            disabled={importando || !temObrigatorios}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
            {importando ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : '📥'}
            {importando ? 'Importando...' : `Importar ${rows.length} linhas`}
          </button>
          {!temObrigatorios && <p className="text-xs text-red-400">Mapeie todos os campos obrigatórios (*) para continuar</p>}
        </div>
      )}
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
        {aba === 'clinica'   && <TabClinica />}
        {aba === 'whatsapp'  && <TabWhatsApp />}
        {aba === 'perfil'    && <TabPerfil />}
        {aba === 'equipe'    && <TabEquipe />}
        {aba === 'importar'  && <TabImportar />}
      </div>
    </div>
  )
}
