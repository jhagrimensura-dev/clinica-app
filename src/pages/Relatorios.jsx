import { useMemo, useCallback, useState, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, reconnectEdge, useNodesState, useEdgesState,
  Panel, Handle, Position, useReactFlow, ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useVendas } from '../context/VendasContext'
import { useLeads } from '../context/LeadsContext'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtK(v) {
  if (v === 0) return 'R$ 0'
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return `R$ ${v}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.dataKey}</span>
          <span className="font-bold text-gray-900 ml-1">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// Nó customizado editável com duplo clique
function NodoLead({ id, data, selected }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(data.label)

  const confirmar = () => {
    setEditando(false)
    data.onLabelChange?.(id, texto)
  }

  return (
    <div
      className="rounded-2xl border-2 px-5 py-3 text-center min-w-[120px] cursor-grab active:cursor-grabbing transition-all"
      style={{
        borderColor: selected ? '#3b82f6' : data.borda,
        backgroundColor: selected ? '#dbeafe' : data.bg,
        boxShadow: selected ? '0 0 0 3px #93c5fd' : '0 2px 6px rgba(0,0,0,0.08)',
      }}
      onDoubleClick={() => setEditando(true)}
    >
      <Handle id="t" type="target" position={Position.Top} className="!bg-gray-300 !w-3 !h-3 !border-2 !border-white" />
      <Handle id="l" type="target" position={Position.Left} className="!bg-gray-300 !w-3 !h-3 !border-2 !border-white" />
      {data.emoji && <div className="text-xl mb-0.5">{data.emoji}</div>}
      {editando ? (
        <input
          autoFocus
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={e => { if (e.key === 'Enter') confirmar() }}
          onClick={e => e.stopPropagation()}
          className="text-xs font-bold text-gray-600 text-center bg-transparent border-b border-gray-400 outline-none w-full"
        />
      ) : (
        <div className="text-xs font-bold text-gray-600">{texto}</div>
      )}
      {data.count != null && (
        <div className="text-2xl font-black mt-1" style={{ color: data.cor }}>{data.count}</div>
      )}
      {!editando && <div className="text-[9px] text-gray-300 mt-1">duplo clique para editar</div>}
      <Handle id="b" type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white" />
      <Handle id="r" type="source" position={Position.Right} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white" />
    </div>
  )
}

const nodeTypes = { lead: NodoLead }

function criarNosIniciais(funil, labelChangeRef) {
  const mk = (id, label, pos, extra = {}) => ({
    id, type: 'lead', position: pos,
    data: { label, onLabelChange: (id, v) => labelChangeRef.current?.(id, v), ...extra },
  })
  return [
    mk('em_aberto',   'Em Aberto',   { x: 0,   y: 0   }, { count: funil.em_aberto,   cor: '#6b7280', bg: '#f9fafb', borda: '#e5e7eb' }),
    mk('conversando', 'Conversando', { x: 180, y: 0   }, { count: funil.conversando, cor: '#9333ea', bg: '#faf5ff', borda: '#e9d5ff' }),
    mk('follow1',     'Follow #1',   { x: 360, y: 0   }, { count: funil.follow1,     cor: '#f97316', bg: '#fff7ed', borda: '#fed7aa' }),
    mk('follow2',     'Follow #2',   { x: 540, y: 0   }, { count: funil.follow2,     cor: '#ca8a04', bg: '#fefce8', borda: '#fde68a' }),
    mk('follow3',     'Follow #3',   { x: 720, y: 0   }, { count: funil.follow3,     cor: '#b45309', bg: '#fffbeb', borda: '#fcd34d' }),
    mk('agendado',    'Agendado',    { x: 720, y: 180 }, { count: funil.agendado,    cor: '#3b82f6', bg: '#eff6ff', borda: '#bfdbfe', emoji: '📅' }),
    mk('fechado',     'Fechado',     { x: 720, y: 360 }, { count: funil.fechado,     cor: '#16a34a', bg: '#f0fdf4', borda: '#bbf7d0', emoji: '✅' }),
    mk('perdido',     'Perdido',     { x: 480, y: 360 }, { count: funil.perdido,     cor: '#ef4444', bg: '#fef2f2', borda: '#fecaca', emoji: '❌' }),
  ]
}

const estilo = (cor = '#d1d5db') => ({ stroke: cor, strokeWidth: 2.5 })

const arestasIniciais = [
  { id: 'e1', source: 'em_aberto',   target: 'conversando', style: estilo() },
  { id: 'e2', source: 'conversando', target: 'follow1',     style: estilo() },
  { id: 'e3', source: 'follow1',     target: 'follow2',     style: estilo() },
  { id: 'e4', source: 'follow2',     target: 'follow3',     style: estilo() },
  { id: 'e5', source: 'follow3',     target: 'agendado',    animated: true,  style: estilo('#3b82f6') },
  { id: 'e6', source: 'agendado',    target: 'fechado',     animated: true,  style: estilo('#16a34a') },
  { id: 'e7', source: 'agendado',    target: 'perdido',     style: estilo('#ef4444'), label: 'não fechou' },
  { id: 'e8', source: 'perdido',     target: 'follow1',     style: { stroke: '#f97316', strokeWidth: 2.5, strokeDasharray: '6 3' }, label: 'retoma follow' },
]

function QuadroBranco({ funil }) {
  const labelChangeRef = useRef(null)
  const nosIniciais = useMemo(() => criarNosIniciais(funil, labelChangeRef), [])
  const [nos, setNos, onNosChange] = useNodesState(nosIniciais)
  const [arestas, setArestas, onArestasChange] = useEdgesState(arestasIniciais)

  const onConnect = useCallback((params) => setArestas(eds => addEdge({ ...params, style: { stroke: '#d1d5db', strokeWidth: 2.5 } }, eds)), [])
  const onReconnect = useCallback((oldEdge, newConnection) => setArestas(eds => reconnectEdge(oldEdge, newConnection, eds)), [])

  const onEdgeClick = useCallback((_, edge) => {
    setArestas(eds => eds.map(e => ({
      ...e,
      style: { ...e.style, stroke: e.id === edge.id ? '#3b82f6' : (e.style?._base || e.style?.stroke || '#d1d5db'), strokeWidth: e.id === edge.id ? 3 : 2.5 },
    })))
  }, [])

  const onLabelChange = useCallback((id, novoLabel) => {
    setNos(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, label: novoLabel } } : n))
  }, [])
  labelChangeRef.current = onLabelChange

  const { deleteElements } = useReactFlow()

  const apagarSelecionados = useCallback(() => {
    const nosSel = nos.filter(n => n.selected)
    const arestasSel = arestas.filter(e => e.selected)
    deleteElements({ nodes: nosSel, edges: arestasSel })
  }, [nos, arestas, deleteElements])

  const adicionarNo = () => {
    const id = `no_${Date.now()}`
    setNos(prev => [...prev, {
      id, type: 'lead',
      position: { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 },
      data: { label: 'Novo passo', cor: '#6b7280', bg: '#f9fafb', borda: '#e5e7eb', onLabelChange: (id, v) => labelChangeRef.current?.(id, v) },
    }])
  }

  const resetar = () => {
    setNos(criarNosIniciais(funil, labelChangeRef))
    setArestas(arestasIniciais)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800">Fluxo de Leads</h2>
          <p className="text-xs text-gray-400 mt-0.5">Arraste os blocos · conecte puxando as bolinhas · scroll para zoom</p>
        </div>
        <div className="flex gap-2">
          <button onClick={adicionarNo} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
            + Novo bloco
          </button>
          <button onClick={apagarSelecionados} className="text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-400 transition-colors">
            🗑 Apagar selecionado
          </button>
          <button onClick={resetar} className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            Resetar
          </button>
        </div>
      </div>
      <div style={{ height: 520 }}>
        <ReactFlow
          nodes={nos}
          edges={arestas}
          onNodesChange={onNosChange}
          onEdgesChange={onArestasChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          edgesReconnectable
          onReconnect={onReconnect}
          onEdgeClick={onEdgeClick}
          deleteKeyCode={['Delete', 'Backspace']}
        >
          <Background color="#f3f4f6" gap={20} size={1} />
          <Controls />
          <MiniMap nodeColor={(n) => n.data?.borda || '#e5e7eb'} maskColor="rgba(255,255,255,0.7)" />
          <Panel position="top-right">
            <div className="bg-white/90 backdrop-blur text-[10px] text-gray-400 rounded-lg px-2 py-1 border border-gray-100 shadow-sm">
              Delete para apagar · arrastar borda para conectar
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}

export default function Relatorios() {
  const { lancamentos } = useVendas()
  const { leads } = useLeads()

  const novos = leads.filter(l => l.origem === 'leads_novos')
  const c = (s) => novos.filter(l => l.status === s).length
  const funil = {
    em_aberto: c('em_aberto'), conversando: c('conversando'),
    follow1: c('follow1'), follow2: c('follow2'), follow3: c('follow3'),
    agendado: c('agendado'), fechado: c('fechado'), perdido: c('perdido'),
  }

  const dados = useMemo(() => {
    return MESES.map((mes, i) => {
      const total = (ano) => {
        const prefix = `${ano}-${String(i + 1).padStart(2, '0')}`
        return lancamentos
          .filter(l => l.data && l.data.startsWith(prefix) && l.tipo !== 'Paciente Modelo')
          .reduce((acc, l) => acc + (l.valorTratamento || 0) + (l.valorTaxa || 0), 0)
      }
      return { mes, '2025': total(2025), '2026': total(2026) }
    })
  }, [lancamentos])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
      </div>

      <ReactFlowProvider>
        <QuadroBranco funil={funil} />
      </ReactFlowProvider>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-6">Faturamento</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={dados} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad2025" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ color: '#6b7280', fontSize: 12 }}>{v}</span>} iconType="circle" iconSize={8} />
            <Area type="monotone" dataKey="2025" stroke="#6b7280" strokeWidth={2} fill="url(#grad2025)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="2026" stroke="#C9A96E" strokeWidth={2} fill="url(#grad2026)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
