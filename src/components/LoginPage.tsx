import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, enterAsGuest, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMessage('Email de redefinição enviado! Verifique sua caixa de entrada.');
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setError('Por favor, insira seu nome completo.');
          return;
        }
        await signUpWithEmail(email, password, displayName);
        setSuccessMessage('Conta criada com sucesso!');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Email ou senha inválidos.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso por outra conta.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(err.message);
      }
    }
  };

  const toggleMode = (newMode: 'login' | 'register' | 'reset') => {
    setError('');
    setSuccessMessage('');
    setMode(newMode);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-radial from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-black p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-sky-500/5 dark:bg-sky-500/10 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-xl bg-white dark:bg-[#0b0c10] border border-neutral-200 dark:border-[#1e2030] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10"
      >
        {/* App Logo / Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="w-16 h-16 rounded-3xl bg-white dark:bg-neutral-800 flex items-center justify-center mb-4 shadow-2xl border border-neutral-100 dark:border-neutral-700/50 overflow-hidden"
          >
            <Logo className="w-10 h-10" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Hub Organizador
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            {mode === 'register' 
              ? 'Crie sua conta para começar a organizar sua vida digital.' 
              : mode === 'reset' 
                ? 'Recupere o acesso à sua conta.' 
                : 'Acesso inteligente para sua vida digital.'}
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {mode === 'register' && (
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-neutral-950 dark:text-white"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-neutral-950 dark:text-white"
                required
              />
            </div>
            
            {mode !== 'reset' && (
              <>
                <div className="relative space-y-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 pr-12 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-neutral-950 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleMode('reset')}
                      className="text-[10px] text-neutral-500 hover:text-indigo-500 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}
              </>
            )}
            
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 text-emerald-500 text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all active:scale-[0.98] shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? 'Processando...' : (mode === 'reset' ? 'Enviar link de redefinição' : mode === 'register' ? 'Criar Conta' : 'Entrar')}
            </button>

            <div className="flex flex-col items-center gap-2">
              {mode === 'reset' ? (
                <button
                  type="button"
                  onClick={() => toggleMode('login')}
                  className="text-xs text-indigo-500 font-medium hover:underline"
                >
                  Voltar para o login
                </button>
              ) : mode === 'login' ? (
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode('register')}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    Cadastrar-se.
                  </button>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode('login')}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    Entrar.
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800"></div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">Ou continue com</span>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800"></div>
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 text-neutral-700 dark:text-neutral-200 font-medium text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={enterAsGuest}
              className="w-full h-12 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>Entrar sem login (Modo Visitante)</span>
            </button>
          </form>
        </div>

        {/* Footnote */}
        <div className="text-center mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-900">
          <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3 text-indigo-500" />
            Seu Hub Organizador seguro e privado.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
