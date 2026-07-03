export default function Ajuda() {
  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Central de Ajuda</h1>
        <p className="text-sm text-gray-400 mt-1">Entenda como funcionam os indicadores e melhore a gestão da sua clínica</p>
      </div>

      {/* ORIGEM DOS ANÚNCIOS */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-1">📣 De onde vêm os leads?</h2>
        <p className="text-xs text-gray-400 mb-5">Entenda os dois tipos de anúncio usados pela clínica e como identificar a origem de cada lead</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Instagram Impulsionar */}
          <div className="rounded-2xl border border-pink-200 bg-pink-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📸</span>
              <div>
                <p className="text-sm font-bold text-gray-800">Instagram — Impulsionar</p>
                <p className="text-xs text-pink-500 font-semibold">Direto pelo Instagram</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              São posts ou reels impulsionados diretamente pelo app do Instagram. O lead chega pelo botão de contato da publicação.
            </p>
            <p className="text-xs font-semibold text-gray-600 mb-2">De onde vêm:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-pink-100">
                <span className="text-base">🔗</span>
                <div>
                  <p className="text-xs font-bold text-gray-700">Link da Bio</p>
                  <p className="text-xs text-gray-400">Lead clicou no link da bio do perfil</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-pink-100">
                <span className="text-base">📖</span>
                <div>
                  <p className="text-xs font-bold text-gray-700">Link dos Stories</p>
                  <p className="text-xs text-gray-400">Lead clicou no link direto do story</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tráfego — Gerenciador */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-bold text-gray-800">Tráfego — Gerenciador</p>
                <p className="text-xs text-purple-500 font-semibold">Meta Ads Manager</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Campanha de mensagens criada no Gerenciador de Anúncios da Meta. Quando o lead clica, abre direto o WhatsApp.
            </p>
            <p className="text-xs font-semibold text-gray-600 mb-2">Como identificar o anúncio:</p>
            <div className="bg-white rounded-xl px-3 py-3 border border-purple-100">
              <p className="text-xs text-gray-500 mb-2">Os anúncios sempre têm no nome:</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">emoji</span>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">❤️ coração</span>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">🔵 bolinha</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Ex: ❤️ Botox Dra Amanda 🔵</p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-amber-50 rounded-xl p-4 flex gap-3 border border-amber-100">
          <span className="text-amber-500 text-lg flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Como aparece no Inbox?</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Quando um lead chega pelo anúncio do Gerenciador, aparece um badge roxo no topo da conversa mostrando o nome e imagem do anúncio — assim você sabe exatamente qual campanha gerou aquele contato.
            </p>
          </div>
        </div>
      </div>

      {/* FUNIL DE CONVERSÃO */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-5">Funil de Conversão</h2>
        <p className="text-xs text-gray-400 mb-6">O funil representa a jornada do paciente desde o primeiro contato até a fidelização</p>

        <div className="flex items-start gap-2 mb-6">
          {[
            { icon: '👥', label: 'Seguidores', desc: 'Base de audiência nas redes sociais', color: 'bg-brand-100 text-brand-600' },
            { icon: '🔗', label: 'Leads', desc: 'Contatos interessados na consulta', color: 'bg-purple-100 text-purple-600' },
            { icon: '📅', label: 'Agendamentos', desc: 'Consultas marcadas na clínica', color: 'bg-orange-100 text-orange-600' },
            { icon: '✅', label: 'Vendas', desc: 'Pacientes que fecharam tratamento', color: 'bg-green-100 text-green-600' },
            { icon: '🔄', label: 'Recorrência', desc: 'Pacientes que retornam para novos tratamentos', color: 'bg-teal-100 text-teal-600' },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex-1 text-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mx-auto mb-2 ${step.color}`}>{step.icon}</div>
                <p className="text-xs font-bold text-gray-700">{step.label}</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{step.desc}</p>
              </div>
              {i < arr.length - 1 && <span className="text-gray-300 text-lg flex-shrink-0 mb-6">→</span>}
            </div>
          ))}
        </div>

        <div className="bg-amber-50 rounded-xl p-4 flex gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Como interpretar o funil?</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              O funil mostra o caminho natural que um potencial paciente percorre. Cada etapa representa uma conversão importante. Quanto maior a taxa de conversão entre etapas, mais eficiente é seu processo comercial.
            </p>
          </div>
        </div>
      </div>

      {/* GLOSSÁRIO */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-7">
        <div>
          <h2 className="text-base font-bold text-gray-800">📖 Glossário de Indicadores</h2>
          <p className="text-xs text-gray-400 mt-0.5">Conheça os principais indicadores monitorados pelo Favo e seus benchmarks de mercado</p>
        </div>

        {/* Social Media */}
        <Section titulo="📱 Social Media" cor="bg-brand-50 border-brand-100" indicadores={[
          { nome: 'Conversão Seguidores → Leads', bench: '10%', benchColor: 'text-amber-600', desc: 'Percentual de seguidores que se tornam leads qualificados', formula: 'Fórmula: (Leads / Seguidores) × 100' },
          { nome: 'Custo por Seguidor', bench: 'R$ 6,00', benchColor: 'text-amber-600', desc: 'Investimento médio para conquistar um novo seguidor', formula: 'Fórmula: Investimento em Tráfego / Novos Seguidores' },
          { nome: 'Custo por Lead (CPL)', bench: 'R$ 100,00', benchColor: 'text-amber-600', desc: 'Investimento médio para gerar um lead qualificado', formula: 'Fórmula: Investimento em Tráfego / Total de Leads' },
        ]} />

        {/* Comercial */}
        <Section titulo="🏢 Comercial" cor="bg-blue-50 border-blue-100" indicadores={[
          { nome: 'Conversão Leads → Agendamentos', bench: '15%', benchColor: 'text-amber-600', desc: 'Percentual de leads que agendam uma consulta', formula: 'Fórmula: (Agendamentos / Leads) × 100' },
          { nome: 'Conversão Agendamentos → Vendas', bench: '80%', benchColor: 'text-amber-600', desc: 'Percentual de consultas que resultam em tratamentos', formula: 'Fórmula: (Vendas / Agendamentos) × 100' },
          { nome: 'Custo por Venda (CAC)', bench: 'R$ 400,00', benchColor: 'text-amber-600', desc: 'Investimento total para conquistar um novo paciente', formula: 'Fórmula: Investimento Total / Número de Vendas' },
        ]} />

        {/* Recorrência */}
        <Section titulo="🔄 Recorrência" cor="bg-teal-50 border-teal-100" indicadores={[
          { nome: 'Conversão Contatos → Recorrência', bench: '15%', benchColor: 'text-amber-600', desc: 'Percentual de contatos que retornam para novos tratamentos', formula: 'Fórmula: (Retornos / Contatos) × 100' },
        ]} />

        {/* Faturamento */}
        <Section titulo="💰 Faturamento" cor="bg-green-50 border-green-100" indicadores={[
          { nome: 'Ticket Médio Novos Pacientes', bench: 'Varia por clínica', benchColor: 'text-gray-500', desc: 'Valor médio do tratamento de pacientes novos', formula: 'Fórmula: Receita Novos / Quantidade de Novos Pacientes' },
          { nome: 'Ticket Médio Pacientes Recorrentes', bench: 'Varia por clínica', benchColor: 'text-gray-500', desc: 'Valor médio do tratamento de pacientes recorrentes', formula: 'Fórmula: Receita Recorrência / Quantidade de Pacientes Recorrentes' },
          { nome: 'Ticket Médio Diário', bench: 'Varia por clínica', benchColor: 'text-gray-500', desc: 'Faturamento médio por dia de atendimento', formula: 'Fórmula: Faturamento Total / Dias de Atendimento' },
        ]} />
      </div>

      {/* DICAS DE GESTÃO */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-1">💡 Dicas de Gestão</h2>
        <p className="text-xs text-gray-400 mb-5">Boas práticas para melhorar os resultados da sua clínica</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🎯', titulo: 'Defina metas mensais', desc: 'Configure suas metas na página de Metas para acompanhar o progresso diário e ajustar estratégias.', cor: 'bg-amber-50 border-amber-100' },
            { icon: '📊', titulo: 'Monitore o funil completo', desc: 'Acompanhe cada etapa do funil para identificar gargalos e oportunidades de melhoria.', cor: 'bg-blue-50 border-blue-100' },
            { icon: '📈', titulo: 'Foque na conversão', desc: 'Taxas de conversão baixas indicam oportunidades de otimização no processo comercial.', cor: 'bg-purple-50 border-purple-100' },
            { icon: '🔄', titulo: 'Invista na recorrência', desc: 'Pacientes recorrentes têm menor custo de aquisição. Mantenha um relacionamento ativo com sua base.', cor: 'bg-teal-50 border-teal-100' },
          ].map((dica, i) => (
            <div key={i} className={`rounded-xl p-4 border flex gap-3 ${dica.cor}`}>
              <span className="text-2xl flex-shrink-0">{dica.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">{dica.titulo}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{dica.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BENCHMARKS */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="text-amber-500">🎯</span> Referência Rápida de Benchmarks
        </h2>
        <div className="mt-5">
          <div className="grid grid-cols-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
            <span>Indicador</span>
            <span className="text-right">Benchmark</span>
          </div>
          {[
            { label: 'Conversão Seguidores → Leads', valor: '10%' },
            { label: 'Custo por Lead (CPL)', valor: 'R$ 100' },
            { label: 'Custo por Seguidor', valor: 'R$ 6' },
            { label: 'Custo por Venda (CAC)', valor: 'R$ 400' },
            { label: 'Conversão Leads → Agendamentos', valor: '15%' },
            { label: 'Conversão Agendamentos → Vendas', valor: '80%' },
            { label: 'Conversão Contatos → Recorrência', valor: '15%' },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-2 py-3 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className="text-sm font-bold text-amber-500 text-right">{row.valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Section({ titulo, cor, indicadores }) {
  return (
    <div>
      <p className={`text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 px-3 py-1.5 rounded-lg border inline-block ${cor}`}>{titulo}</p>
      <div className="grid grid-cols-2 gap-3">
        {indicadores.map((ind, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm font-semibold text-gray-700">{ind.nome}</p>
              <span className={`text-sm font-bold ml-3 flex-shrink-0 ${ind.benchColor}`}>{ind.bench}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2 leading-relaxed">{ind.desc}</p>
            <p className="text-xs text-gray-300 font-mono">{ind.formula}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
