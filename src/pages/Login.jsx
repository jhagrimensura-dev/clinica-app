import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function RedefinirSenha() {
  const { updatePassword } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    setErro('')
    setLoading(true)
    const { error } = await updatePassword(senha)
    if (error) {
      setErro('Erro ao redefinir senha. Tente novamente.')
    } else {
      setSucesso(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-pink-200 rounded-2xl flex items-center justify-center text-pink-600 font-bold text-2xl mx-auto mb-4">A</div>
          <h1 className="text-2xl font-bold text-gray-800">Clinical Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1">Dra. Amanda Lima</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {sucesso ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-semibold mb-1">Senha definida com sucesso!</p>
              <p className="text-xs text-gray-400">Você já pode usar o sistema.</p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-bold text-gray-800 mb-1">Definir nova senha</h2>
              <p className="text-xs text-gray-400 mb-5">Escolha uma senha para acessar o sistema.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  />
                </div>
                {erro && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  {loading ? 'Salvando...' : 'Salvar senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const { signIn, signInWithMagicLink, recoveryMode } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  if (recoveryMode) return <RedefinirSenha />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { error } = await signIn(email, senha)
    if (error) setErro(error.message || 'Email ou senha incorretos.')
    setLoading(false)
  }

  const handleMagicLink = async () => {
    if (!email) { setErro('Digite seu email primeiro.'); return }
    setErro('')
    setMagicLoading(true)
    const { error } = await signInWithMagicLink(email)
    if (error) setErro('Erro ao enviar link. Tente novamente.')
    else setMagicSent(true)
    setMagicLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-pink-200 rounded-2xl flex items-center justify-center text-pink-600 font-bold text-2xl mx-auto mb-4">A</div>
          <h1 className="text-2xl font-bold text-gray-800">Clinical Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1">Dra. Amanda Lima</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5">Entrar na conta</h2>

          {magicSent ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-2xl">📬</p>
              <p className="text-sm font-semibold text-gray-700">Link enviado para seu email!</p>
              <p className="text-xs text-gray-400">Abra o email e clique no link para entrar.</p>
              <button onClick={() => setMagicSent(false)} className="text-xs text-pink-400 hover:text-pink-600 mt-2">Voltar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenha ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {erro && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-gray-100" />
                <span className="text-xs text-gray-300">ou</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={magicLoading}
                className="w-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {magicLoading ? 'Enviando...' : 'Entrar com link no email'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
