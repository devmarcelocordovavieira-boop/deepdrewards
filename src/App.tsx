/// <reference types="vite/client" />
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { 
  Trophy, Gift, Camera, Shield, LogIn, LogOut, 
  Star, ChevronRight, CheckCircle2, XCircle, AlertCircle,
  Cpu, Crown, Medal, Ticket, ArrowRight, Heart, ArrowLeft, GripVertical, Lock, Info, Mail, Eye, EyeOff, Target, Volume2, VolumeX,
  Copy, Bird, BarChart3, PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// --- SUPABASE CLIENT ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const formatPoints = (points: number) => {
    return (points || 0).toLocaleString('pt-BR');
  };

  const [activeTab, setActiveTab] = useState<'placar' | 'enviar' | 'recompensas' | 'admin' | 'mural' | 'relatorios'>('recompensas');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [submissoes, setSubmissoes] = useState<any[]>([]);
  const [penalizacoes, setPenalizacoes] = useState<any[]>([]);
  const [bonificacoes, setBonificacoes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: 'success'|'error'}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadOlder, setLoadOlder] = useState(false);

  // Report States
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportUserId, setReportUserId] = useState<string>('all');
  const [reportTarefaId, setReportTarefaId] = useState<string>('all');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Form states
  const [selectedTarefa, setSelectedTarefa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resgates, setResgates] = useState<any[]>([]);
  const [editingTarefa, setEditingTarefa] = useState<any | null>(null);
  const [editTarefaData, setEditTarefaData] = useState({ nome: '', descricao: '', regras: '', pontos: 0, imagem_url: '' });
  const [editingProduto, setEditingProduto] = useState<any | null>(null);
  const [editProdutoData, setEditProdutoData] = useState({ nome: '', descricao: '', regras: '', preco_pontos: 0, estoque: 0, imagem_url: '' });
  const [draggedProdutoId, setDraggedProdutoId] = useState<string | null>(null);
  const [draggedTarefaId, setDraggedTarefaId] = useState<string | null>(null);

  // Global paste handler for images
  React.useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files?.length) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          if (activeTab === 'enviar' && selectedTarefa) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeTab, selectedTarefa]);

  // Admin forms state
  const [newTarefa, setNewTarefa] = useState({ nome: '', descricao: '', regras: '', pontos: 0, imagem_url: '' });
  const [newTarefaFile, setNewTarefaFile] = useState<File | null>(null);
  const [newTarefaPreview, setNewTarefaPreview] = useState<string | null>(null);
  const [newProduto, setNewProduto] = useState({ nome: '', descricao: '', regras: '', preco_pontos: 0, estoque: 0, imagem_url: '' });
  const [newProdutoFile, setNewProdutoFile] = useState<File | null>(null);
  const [newProdutoPreview, setNewProdutoPreview] = useState<string | null>(null);

  // Debounce search state
  const [searchUser, setSearchUser] = useState('');
  const [debouncedSearchUser, setDebouncedSearchUser] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchUser(searchUser), 300);
    return () => clearTimeout(timer);
  }, [searchUser]);

  // Auth forms state
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password' | 'update_password' | 'email_sent'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authName, setAuthName] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showRankingsModal, setShowRankingsModal] = useState(false);
  const [confirmResgate, setConfirmResgate] = useState<any | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');
  
  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = React.useRef(0);

  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled.toString());
  }, [soundEnabled]);

  const playSound = (type: 'success' | 'error' | 'coin') => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio();
      if (type === 'success') audio.src = 'https://cdn.freesound.org/previews/320/320655_527080-lq.mp3'; // soft chime
      if (type === 'error') audio.src = 'https://cdn.freesound.org/previews/142/142608_1840011-lq.mp3'; // error beep
      if (type === 'coin') audio.src = 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3'; // coin sound
      audio.volume = 0.3;
      audio.play().catch(() => {}); // catch autoplay restrictions
    } catch (e) {}
  };

  const showNotification = (msg: string, type: 'success'|'error', sound?: 'success' | 'error' | 'coin' | 'none') => {
    if (sound !== 'none') {
      playSound(sound || type);
    }
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const getUserTier = (pontos: number) => {
    if (pontos >= 50000) return { name: 'Diamante', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', icon: '💎' };
    if (pontos >= 10000) return { name: 'Ouro', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: '🏆' };
    if (pontos >= 5000) return { name: 'Prata', color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/20', icon: '🥈' };
    if (pontos >= 1000) return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', icon: '🥉' };
    return { name: 'Iniciante', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10', icon: '🌱' };
  };

  const getRankProgress = (pontos: number) => {
    const tiers = [
      { name: 'Iniciante', min: 0, max: 999, icon: '🌱' },
      { name: 'Bronze', min: 1000, max: 4999, icon: '🥉' },
      { name: 'Prata', min: 5000, max: 9999, icon: '🥈' },
      { name: 'Ouro', min: 10000, max: 49999, icon: '🏆' },
      { name: 'Diamante', min: 50000, max: Infinity, icon: '💎' }
    ];

    const currentTierIndex = tiers.findIndex(t => pontos >= t.min && pontos <= t.max);
    const currentTier = tiers[currentTierIndex];
    const nextTier = tiers[currentTierIndex + 1];

    if (!nextTier) {
      return { percentage: 100, text: 'Nível Máximo', nextTierName: '' };
    }

    const pointsInCurrentTier = pontos - currentTier.min;
    const pointsNeededForNextTier = nextTier.min - currentTier.min;
    const percentage = Math.min(100, Math.max(0, (pointsInCurrentTier / pointsNeededForNextTier) * 100));
    const pointsRemaining = nextTier.min - pontos;

    return {
      percentage,
      text: `Faltam ${pointsRemaining} pts para o nível ${nextTier.name}`,
      nextTierName: nextTier.name,
      nextTierIcon: nextTier.icon
    };
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteCode(invite);
      setAuthMode('register');
    }

    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update_password');
      }
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissoes',
          filter: `usuario_id=eq.${currentUser.id}`
        },
        (payload) => {
          if (payload.new.status === 'aprovado' && payload.old.status === 'pendente') {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#10B981', '#FFFFFF']
            });
            showNotification(`Sua missão foi aprovada! Você ganhou pontos!`, 'success');
            fetchUserData(currentUser.id);
          } else if (payload.new.status === 'rejeitado' && payload.old.status === 'pendente') {
            showNotification(`Sua missão foi rejeitada. Verifique com o admin.`, 'error');
            fetchUserData(currentUser.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserData(session.user.id);
    } else {
      setIsLoading(false);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Optimization: Select only necessary fields
      const { data, error } = await supabase.from('usuarios').select('id, nome, email, avatar, pontos, pontos_acumulados, cargo, oculto_ranking').eq('id', userId).single();
      if (error) {
        // If user is not found in the database (e.g., deleted), sign them out
        await supabase.auth.signOut();
        throw error;
      }
      setCurrentUser({
        ...data,
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nome}`
      });
      fetchAllData(false);
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReportData = async () => {
    setIsReportLoading(true);
    try {
      // Create dates for the first and last day of the selected month
      const startDate = new Date(reportYear, reportMonth, 1).toISOString();
      const endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59).toISOString();

      let query = supabase
        .from('submissoes')
        .select('id, usuario_id, tarefa_id, status, data_envio, usuarios(nome), tipos_tarefas(pontos)')
        .gte('data_envio', startDate)
        .lte('data_envio', endDate);

      if (reportUserId !== 'all') {
        query = query.eq('usuario_id', reportUserId);
      }
      
      if (reportTarefaId !== 'all') {
        query = query.eq('tarefa_id', reportTarefaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReportData(data || []);
    } catch (error) {
      console.error("Error fetching report data:", error);
      showNotification("Erro ao carregar relatórios", "error");
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'relatorios' && currentUser?.cargo === 'admin') {
      fetchReportData();
    }
  }, [activeTab, reportMonth, reportYear, reportUserId, reportTarefaId]);

  const fetchAllData = async (forceRefresh = true, fetchOlder = loadOlder) => {
    // Cache Check
    if (!forceRefresh && !fetchOlder) {
      const cached = sessionStorage.getItem('deepgame_cache');
      if (cached) {
        try {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < 1000 * 60 * 5) { // 5 minutes cache
            setUsers(data.users);
            setProducts(data.products);
            setTarefas(data.tarefas);
            setSubmissoes(data.submissoes);
            setResgates(data.resgates);
            setPenalizacoes(data.penalizacoes);
            setBonificacoes(data.bonificacoes);
            return;
          }
        } catch (e) {
          console.error('Error parsing cache', e);
        }
      }
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = fetchOlder ? null : thirtyDaysAgo.toISOString();
    const limit = fetchOlder ? 1000 : 100;

    // Fetch users (Ranking based on pontos_acumulados) - Optimization: Select only necessary fields
    const { data: usersData } = await supabase.from('usuarios').select('id, nome, email, avatar, pontos, pontos_acumulados, cargo, oculto_ranking').order('pontos_acumulados', { ascending: false });
    const mappedUsers = usersData ? usersData.map(u => ({ ...u, avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.nome}` })) : [];
    if (usersData) setUsers(mappedUsers);

    // Fetch products
    const { data: productsData } = await supabase.from('produtos').select('id, nome, descricao, regras, preco_pontos, estoque, imagem_url, ordem, ativo').eq('ativo', true).order('ordem', { ascending: true }).order('created_at', { ascending: false });
    if (productsData) setProducts(productsData);

    // Fetch tasks
    const { data: tarefasData } = await supabase.from('tipos_tarefas').select('id, nome, descricao, regras, pontos, imagem_url, ordem, ativo').eq('ativo', true).order('ordem', { ascending: true }).order('created_at', { ascending: false });
    if (tarefasData) setTarefas(tarefasData);

    // Fetch submissions
    let subQuery = supabase
      .from('submissoes')
      .select('id, usuario_id, tarefa_id, descricao, url_prova, status, data_envio, motivo_rejeicao, usuarios(nome, avatar), tipos_tarefas(nome, pontos)')
      .order('data_envio', { ascending: false });
    if (dateFilter) subQuery = subQuery.gte('data_envio', dateFilter);
    const { data: subData } = await subQuery.limit(limit);
      
    let mappedSubmissoes: any[] = [];
    if (subData) {
      mappedSubmissoes = subData.map((s: any) => ({
        id: s.id,
        usuario_id: s.usuario_id,
        usuario_nome: s.usuarios?.nome || 'Desconhecido',
        usuario_avatar: s.usuarios?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.usuarios?.nome || 'Desconhecido'}`,
        tarefa_id: s.tarefa_id,
        tarefa_nome: s.tipos_tarefas?.nome || 'Tarefa',
        pontos: s.tipos_tarefas?.pontos || 0,
        descricao: s.descricao,
        url_prova: s.url_prova,
        status: s.status,
        data_envio: s.data_envio,
        motivo_rejeicao: s.motivo_rejeicao
      }));
      setSubmissoes(mappedSubmissoes);
    }

    // Fetch resgates
    let resgatesQuery = supabase
      .from('resgates')
      .select('id, usuario_id, produto_id, data_resgate, usado, status, usuarios(nome), produtos(nome, preco_pontos)')
      .order('data_resgate', { ascending: false });
    if (dateFilter) resgatesQuery = resgatesQuery.gte('data_resgate', dateFilter);
    const { data: resgatesData } = await resgatesQuery.limit(limit);
    let mappedResgates: any[] = [];
    if (resgatesData) {
      mappedResgates = resgatesData.map((r: any) => ({
        id: r.id,
        usuario_id: r.usuario_id,
        usuario_nome: r.usuarios?.nome || 'Desconhecido',
        produto_id: r.produto_id,
        produto_nome: r.produtos?.nome || 'Produto',
        preco_pontos: r.produtos?.preco_pontos || 0,
        data_resgate: r.data_resgate,
        usado: r.usado,
        status: r.status
      }));
      setResgates(mappedResgates);
    }

    // Fetch penalizacoes
    const { data: penalizacoesData } = await supabase.from('penalizacoes').select('id, usuario_id, pontos, motivo, lida, created_at').eq('lida', false);
    if (penalizacoesData) setPenalizacoes(penalizacoesData);

    // Fetch bonificacoes
    let bonificacoesQuery = supabase.from('bonificacoes').select('id, usuario_id, pontos, motivo, lida, created_at').order('created_at', { ascending: false });
    if (dateFilter) bonificacoesQuery = bonificacoesQuery.gte('created_at', dateFilter);
    const { data: bonificacoesData } = await bonificacoesQuery.limit(limit);
    if (bonificacoesData) setBonificacoes(bonificacoesData);

    // Save to cache
    if (!fetchOlder) {
      sessionStorage.setItem('deepgame_cache', JSON.stringify({
        timestamp: Date.now(),
        data: {
          users: mappedUsers,
          products: productsData,
          tarefas: tarefasData,
          submissoes: mappedSubmissoes,
          resgates: mappedResgates,
          penalizacoes: penalizacoesData,
          bonificacoes: bonificacoesData
        }
      }));
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'update_password') {
      if (!authPassword) return showNotification('Digite a nova senha.', 'error');
      try {
        const { error } = await supabase.auth.updateUser({ password: authPassword });
        if (error) throw error;
        showNotification('Senha atualizada com sucesso!', 'success');
        setAuthMode('login');
        setAuthPassword('');
      } catch (error: any) {
        showNotification(error.message || 'Erro ao atualizar senha', 'error');
      }
      return;
    }

    if (authMode === 'forgot_password') {
      if (!authEmail) return showNotification('Preencha seu e-mail.', 'error');
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setAuthMode('email_sent');
      } catch (error: any) {
        showNotification(error.message || 'Erro ao enviar e-mail', 'error');
      }
      return;
    }

    if (!authEmail || !authPassword || (authMode === 'register' && !authName)) {
      return showNotification('Preencha todos os campos.', 'error');
    }
    
    try {
      if (authMode === 'register') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (authError) throw authError;
        
        if (authData.user) {
          const { error: profileError } = await supabase.from('usuarios').insert([
            { id: authData.user.id, nome: authName, email: authEmail }
          ]);
          if (profileError) throw profileError;
          
          // Log the user in automatically after profile creation
          await fetchUserData(authData.user.id);
        }
        showNotification('Conta criada com sucesso!', 'success');
        
        // Clear invite from URL
        if (inviteCode) {
          const url = new URL(window.location.href);
          url.searchParams.delete('invite');
          window.history.replaceState({}, '', url.toString());
          setInviteCode(null);
        }
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        
        // Check if user exists in our database
        if (authData.user) {
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('id')
            .eq('id', authData.user.id)
            .single();
            
          if (userError || !userData) {
            await supabase.auth.signOut();
            throw new Error('Esta conta foi removida pelo administrador.');
          }
        }
        
        showNotification('Login efetuado!', 'success');
      }
    } catch (error: any) {
      showNotification(error.message || 'Erro na autenticação', 'error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;
    if (diff > 0 && diff < 150) {
      setPullDistance(diff);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance > 80) {
      setIsRefreshing(true);
      await fetchAllData();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  const handleResgate = async (produto: any) => {
    if (!currentUser) return showNotification('Faça login para resgatar.', 'error');
    if (currentUser.pontos < produto.preco_pontos) return showNotification('Pontos insuficientes.', 'error');
    if (produto.estoque <= 0) return showNotification('Poxa, esgotou!', 'error');

    try {
      const { error } = await supabase.rpc('realizar_resgate', {
        p_usuario_id: currentUser.id,
        p_produto_id: produto.id
      });
      if (error) throw error;
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFFFFF', '#EA1D2C', '#FFFFFF']
      });
      
      showNotification(`Eba! ${produto.nome} resgatado com sucesso!`, 'success', 'coin');
      fetchAllData();
      fetchUserData(currentUser.id);
    } catch (error: any) {
      showNotification(`Erro ao resgatar: ${error.message}`, 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      let finalUrl = '';
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${currentUser.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('provas_midia').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('provas_midia').getPublicUrl(fileName);
        finalUrl = publicUrlData.publicUrl;
      } else {
        finalUrl = URL.createObjectURL(file);
      }

      const { error: updateError } = await supabase.from('usuarios').update({ avatar: finalUrl }).eq('id', currentUser.id);
      if (updateError) throw updateError;

      setCurrentUser({ ...currentUser, avatar: finalUrl });
      showNotification('Foto de perfil atualizada!', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao atualizar foto: ${error.message}`, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return showNotification('Faça login primeiro.', 'error');
    if (!selectedTarefa || !descricao || !selectedFile) return showNotification('Preencha tudo e envie uma foto.', 'error');

    setIsUploading(true);

    try {
      let finalUrl = '';
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('provas_midia').upload(fileName, selectedFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('provas_midia').getPublicUrl(fileName);
        finalUrl = publicUrlData.publicUrl;
      } else {
        finalUrl = previewUrl || '';
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Usuário não autenticado.');

      const { error: insertError } = await supabase.from('submissoes').insert([{
        usuario_id: session.user.id,
        tarefa_id: selectedTarefa,
        descricao,
        url_prova: finalUrl
      }]);
      
      if (insertError) {
        if (insertError.message.includes('row-level security') || insertError.code === '42501') {
          throw new Error('Você já enviou esta missão ou não tem permissão.');
        }
        throw insertError;
      }

      setSelectedTarefa('');
      setDescricao('');
      setSelectedFile(null);
      setPreviewUrl(null);
      showNotification('Missão enviada! Aguarde a avaliação.', 'success');
      fetchAllData();
      setActiveTab('placar');
    } catch (error: any) {
      showNotification(`Erro ao enviar: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAprovar = async (submissao: any) => {
    try {
      const { error } = await supabase.rpc('aprovar_submissao', {
        p_submissao_id: submissao.id
      });
      if (error) throw error;
      
      showNotification(`Aprovado! +${submissao.pontos} pts para ${submissao.usuario_nome}`, 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao aprovar: ${error.message}`, 'error');
    }
  };

  const handleRejeitar = async (submissao: any) => {
    const motivo = window.prompt('Motivo da rejeição (opcional):');
    if (motivo === null) return; // Cancelled

    try {
      const { error } = await supabase.from('submissoes').update({ 
        status: 'rejeitado',
        motivo_rejeicao: motivo || 'Sem motivo especificado'
      }).eq('id', submissao.id);
      if (error) throw error;
      showNotification('Missão rejeitada.', 'error');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleAprovarResgate = async (resgate: any) => {
    try {
      const { error } = await supabase.from('resgates').update({ status: 'aprovado' }).eq('id', resgate.id);
      if (error) throw error;
      showNotification(`Resgate de ${resgate.produto_nome} aprovado!`, 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao aprovar: ${error.message}`, 'error');
    }
  };

  const handleRejeitarResgate = async (resgate: any) => {
    try {
      const { error } = await supabase.rpc('rejeitar_resgate', {
        p_resgate_id: resgate.id,
        p_usuario_id: resgate.usuario_id,
        p_pontos: resgate.preco_pontos
      });
      if (error) throw error;
      showNotification(`Resgate de ${resgate.produto_nome} rejeitado. Pontos devolvidos.`, 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao rejeitar: ${error.message}`, 'error');
    }
  };

  const handleCreateTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarefa.nome || newTarefa.pontos <= 0) return showNotification('Preencha nome e pontos válidos.', 'error');
    
    try {
      let finalImageUrl = newTarefa.imagem_url || `https://picsum.photos/seed/${newTarefa.nome}/600/400`;
      
      if (newTarefaFile && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const fileExt = newTarefaFile.name.split('.').pop();
        const fileName = `tarefa-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('provas_midia').upload(fileName, newTarefaFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('provas_midia').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('tipos_tarefas').insert([{
        nome: newTarefa.nome,
        descricao: newTarefa.descricao,
        pontos: newTarefa.pontos,
        regras: newTarefa.regras,
        imagem_url: finalImageUrl,
        ordem: tarefas.length
      }]);
      if (error) throw error;
      
      setNewTarefa({ nome: '', descricao: '', regras: '', pontos: 0, imagem_url: '' });
      setNewTarefaFile(null);
      setNewTarefaPreview(null);
      showNotification('Missão criada com sucesso!', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleCreateProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduto.nome || newProduto.preco_pontos <= 0 || newProduto.estoque <= 0) {
      return showNotification('Preencha os campos obrigatórios.', 'error');
    }
    
    try {
      let finalImageUrl = newProduto.imagem_url || `https://picsum.photos/seed/${newProduto.nome}/600/400`;
      
      if (newProdutoFile && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const fileExt = newProdutoFile.name.split('.').pop();
        const fileName = `prod-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('provas_midia').upload(fileName, newProdutoFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('provas_midia').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('produtos').insert([{
        nome: newProduto.nome,
        descricao: newProduto.descricao,
        regras: newProduto.regras,
        preco_pontos: newProduto.preco_pontos,
        estoque: newProduto.estoque,
        imagem_url: finalImageUrl,
        ordem: products.length
      }]);
      if (error) throw error;

      setNewProduto({ nome: '', descricao: '', regras: '', preco_pontos: 0, estoque: 0, imagem_url: '' });
      setNewProdutoFile(null);
      setNewProdutoPreview(null);
      showNotification('Prêmio adicionado ao catálogo!', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleUpdateTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarefaData.nome || editTarefaData.pontos <= 0 || !editingTarefa) return showNotification('Preencha nome e pontos válidos.', 'error');
    
    try {
      let finalImageUrl = editTarefaData.imagem_url;
      
      if (newTarefaFile && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const fileExt = newTarefaFile.name.split('.').pop();
        const fileName = `tarefa-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('provas_midia').upload(fileName, newTarefaFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('provas_midia').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('tipos_tarefas').update({
        nome: editTarefaData.nome,
        descricao: editTarefaData.descricao,
        pontos: editTarefaData.pontos,
        regras: editTarefaData.regras,
        imagem_url: finalImageUrl
      }).eq('id', editingTarefa.id);
      if (error) throw error;
      
      setEditingTarefa(null);
      setEditTarefaData({ nome: '', descricao: '', regras: '', pontos: 0, imagem_url: '' });
      setNewTarefaFile(null);
      setNewTarefaPreview(null);
      showNotification('Missão atualizada com sucesso!', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleUpdateProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProdutoData.nome || editProdutoData.preco_pontos <= 0 || !editingProduto) return showNotification('Preencha os dados corretamente.', 'error');
    
    try {
      let finalImageUrl = editProdutoData.imagem_url;
      
      if (newProdutoFile && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const fileExt = newProdutoFile.name.split('.').pop();
        const fileName = `prod-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('provas_midia').upload(fileName, newProdutoFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('provas_midia').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('produtos').update({
        nome: editProdutoData.nome,
        descricao: editProdutoData.descricao,
        regras: editProdutoData.regras,
        preco_pontos: editProdutoData.preco_pontos,
        estoque: editProdutoData.estoque,
        imagem_url: finalImageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2000&auto=format&fit=crop'
      }).eq('id', editingProduto.id);
      
      if (error) throw error;
      
      setEditingProduto(null);
      setEditProdutoData({ nome: '', descricao: '', regras: '', preco_pontos: 0, estoque: 0, imagem_url: '' });
      setNewProdutoFile(null);
      setNewProdutoPreview(null);
      showNotification('Prêmio atualizado com sucesso!', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleDeleteTarefa = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta missão?')) return;
    try {
      const { error } = await supabase.from('tipos_tarefas').update({ ativo: false }).eq('id', id);
      if (error) throw error;
      showNotification('Missão excluída!', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleDeleteProduto = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este prêmio?')) return;
    try {
      const { error } = await supabase.from('produtos').update({ ativo: false }).eq('id', id);
      if (error) throw error;
      showNotification('Prêmio excluído!', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleReorderTarefas = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const draggedIndex = tarefas.findIndex(t => t.id === draggedId);
    const targetIndex = tarefas.findIndex(t => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTarefas = [...tarefas];
    const [draggedItem] = newTarefas.splice(draggedIndex, 1);
    newTarefas.splice(targetIndex, 0, draggedItem);

    // Optimistic update
    setTarefas(newTarefas);

    try {
      // Update 'ordem' for all affected items
      for (let i = 0; i < newTarefas.length; i++) {
        const t = newTarefas[i];
        if (t.ordem !== i) {
          await supabase.from('tipos_tarefas').update({ ordem: i }).eq('id', t.id);
        }
      }
    } catch (error) {
      console.error('Error reordering tarefas:', error);
      fetchAllData(); // Revert on error
    }
  };

  const handleReorderProdutos = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const draggedIndex = products.findIndex(p => p.id === draggedId);
    const targetIndex = products.findIndex(p => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newProducts = [...products];
    const [draggedItem] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(targetIndex, 0, draggedItem);

    // Optimistic update
    setProducts(newProducts);

    try {
      // Update 'ordem' for all affected items
      for (let i = 0; i < newProducts.length; i++) {
        const p = newProducts[i];
        if (p.ordem !== i) {
          await supabase.from('produtos').update({ ordem: i }).eq('id', p.id);
        }
      }
    } catch (error: any) {
      showNotification('Erro ao reordenar prêmios.', 'error');
      fetchAllData(); // Revert on error
    }
  };

  const handleMarkUsado = async (resgateId: string) => {
    try {
      const { error } = await supabase.from('resgates').update({ usado: true }).eq('id', resgateId);
      if (error) throw error;
      showNotification('Resgate marcado como usado!', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleBonificar = async (userId: string) => {
    const pontosStr = window.prompt('Quantos pontos deseja adicionar a este usuário?');
    if (!pontosStr) return;
    const pontos = parseInt(pontosStr, 10);
    if (isNaN(pontos) || pontos <= 0) return showNotification('Valor inválido.', 'error');

    const motivo = window.prompt('Motivo da bonificação (opcional):');
    if (motivo === null) return; // Cancelled

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newPontos = (user.pontos || 0) + pontos;
      const newAcumulados = (user.pontos_acumulados || 0) + pontos;

      const { error } = await supabase.from('usuarios').update({
        pontos: newPontos,
        pontos_acumulados: newAcumulados
      }).eq('id', userId);

      if (error) throw error;

      // Register bonus notification
      await supabase.from('bonificacoes').insert([{
        usuario_id: userId,
        pontos: pontos,
        motivo: motivo || 'Sem motivo especificado'
      }]);

      showNotification(`Usuário bonificado em ${pontos} pontos.`, 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao bonificar: ${error.message}`, 'error');
    }
  };

  const handlePenalizar = async (userId: string) => {
    const pontosStr = window.prompt('Quantos pontos deseja remover deste usuário?');
    if (!pontosStr) return;
    const pontos = parseInt(pontosStr, 10);
    if (isNaN(pontos) || pontos <= 0) return showNotification('Valor inválido.', 'error');

    const motivo = window.prompt('Motivo da penalização (opcional):');
    if (motivo === null) return; // Cancelled

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newPontos = Math.max(0, (user.pontos || 0) - pontos);
      const newAcumulados = Math.max(0, (user.pontos_acumulados || 0) - pontos);

      const { error } = await supabase.from('usuarios').update({
        pontos: newPontos,
        pontos_acumulados: newAcumulados
      }).eq('id', userId);

      if (error) throw error;

      // Register penalty notification
      await supabase.from('penalizacoes').insert([{
        usuario_id: userId,
        pontos: pontos,
        motivo: motivo || 'Sem motivo especificado'
      }]);

      showNotification(`Usuário penalizado em ${pontos} pontos.`, 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao penalizar: ${error.message}`, 'error');
    }
  };

  const handleRemoverUsuario = async (userId: string) => {
    const confirm = window.confirm('Tem certeza absoluta que deseja remover este usuário? Esta ação não pode ser desfeita e removerá todo o histórico dele.');
    if (!confirm) return;

    try {
      // Delete associated records first to avoid foreign key constraint errors
      await supabase.from('submissoes').delete().eq('usuario_id', userId);
      await supabase.from('resgates').delete().eq('usuario_id', userId);
      await supabase.from('penalizacoes').delete().eq('usuario_id', userId);
      await supabase.from('bonificacoes').delete().eq('usuario_id', userId);

      const { data, error } = await supabase.from('usuarios').delete().eq('id', userId).select();
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Bloqueado pelas políticas de segurança (RLS) do Supabase.');
      }
      
      showNotification('Usuário removido com sucesso.', 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao remover usuário: ${error.message}`, 'error');
    }
  };

  const handleToggleVisibilidadeRanking = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('usuarios').update({ oculto_ranking: !currentStatus }).eq('id', userId);
      if (error) throw error;
      
      showNotification(`Usuário ${!currentStatus ? 'ocultado' : 'visível'} no ranking.`, 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao alterar visibilidade: ${error.message}`, 'error');
    }
  };

  const handleCloseBonificacao = async (bonificacaoId: string) => {
    try {
      await supabase.from('bonificacoes').update({ lida: true }).eq('id', bonificacaoId);
      setBonificacoes(prev => prev.filter(p => p.id !== bonificacaoId));
    } catch (error) {
      console.error('Erro ao fechar notificação de bonificação', error);
    }
  };

  const handleClosePenalizacao = async (penalizacaoId: string) => {
    try {
      await supabase.from('penalizacoes').update({ lida: true }).eq('id', penalizacaoId);
      setPenalizacoes(prev => prev.filter(p => p.id !== penalizacaoId));
    } catch (error) {
      console.error('Erro ao fechar notificação de penalização', error);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}?invite=deeprewards2024`;
    navigator.clipboard.writeText(link);
    showNotification('Link de convite copiado!', 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Skeleton (Desktop) */}
        <div className="hidden md:flex w-72 bg-[#0A0A0A] border-r border-white/5 flex-col p-6 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse"></div>
            <div className="w-32 h-6 rounded-lg bg-white/5 animate-pulse"></div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-full h-24 rounded-2xl bg-white/5 animate-pulse"></div>
            <div className="w-full h-12 rounded-xl bg-white/5 animate-pulse"></div>
            <div className="w-full h-12 rounded-xl bg-white/5 animate-pulse"></div>
            <div className="w-full h-12 rounded-xl bg-white/5 animate-pulse"></div>
            <div className="w-full h-12 rounded-xl bg-white/5 animate-pulse"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col p-4 md:p-8 gap-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div className="w-48 h-8 rounded-lg bg-white/5 animate-pulse"></div>
            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse"></div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="w-full h-40 rounded-3xl bg-white/5 animate-pulse"></div>
            <div className="w-full h-40 rounded-3xl bg-white/5 animate-pulse"></div>
            <div className="w-full h-40 rounded-3xl bg-white/5 animate-pulse"></div>
          </div>

          {/* List Skeleton */}
          <div className="flex flex-col gap-4 mt-4">
            <div className="w-full h-24 rounded-2xl bg-white/5 animate-pulse"></div>
            <div className="w-full h-24 rounded-2xl bg-white/5 animate-pulse"></div>
            <div className="w-full h-24 rounded-2xl bg-white/5 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || authMode === 'update_password') {
    return (
      <div className="min-h-screen flex bg-[#050505] text-white font-sans relative overflow-hidden">
        {/* GLOBAL GRID BACKGROUND */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff0a_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>
        
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 bg-[#050505]/80 backdrop-blur-sm">
          
          {/* NOTIFICATION */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 flex flex-col gap-2">
            {notifications.map(notification => (
              <div key={notification.id} className="animate-in slide-in-from-top-4 fade-in duration-300">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl relative overflow-hidden bg-[#121212] ${
                  notification.type === 'success' ? 'border-[#EA1D2C]/30 text-white' : 'border-red-500/30 text-white'
                }`}>
                  <div className={`absolute bottom-0 left-0 h-1 opacity-30 animate-[shrink_3s_linear_forwards] ${
                    notification.type === 'success' ? 'bg-[#EA1D2C]' : 'bg-red-500'
                  }`} />
                  {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#EA1D2C]" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
                  <p className="text-sm font-medium">{notification.msg}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-16 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} />
                <Cpu className="w-8 h-8 text-[#EA1D2C] hidden" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                DEEP GAME
              </h1>
            </div>

            <div className="mb-10">
              <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                {authMode === 'login' ? 'Bem-vindo de volta' : authMode === 'register' ? 'Junte-se ao time' : authMode === 'update_password' ? 'Nova Senha' : authMode === 'email_sent' ? 'E-mail Enviado!' : 'Recuperar Senha'}
              </h2>
              <p className="text-gray-400 font-medium text-lg">
                {authMode === 'login' ? 'Faça login para acessar suas missões e resgatar prêmios.' : authMode === 'register' ? 'Crie sua conta e comece a ser reconhecido pelo seu trabalho.' : authMode === 'update_password' ? 'Digite sua nova senha abaixo.' : authMode === 'email_sent' ? 'Enviamos um link de recuperação para o seu e-mail. Ao clicar nele, você será redirecionado para criar uma nova senha.' : 'Digite seu e-mail para receber um link de redefinição de senha.'}
              </p>
            </div>
            
            {authMode === 'email_sent' ? (
              <div className="space-y-6">
                <div className="p-6 bg-[#EA1D2C]/10 text-[#EA1D2C] rounded-2xl font-bold border border-[#EA1D2C]/20 flex items-start gap-3">
                  <Mail className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <p>Verifique sua caixa de entrada e também a pasta de spam. O link expira em algumas horas.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Voltar para o Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-5">
              {authMode === 'register' && !inviteCode ? (
                <div className="p-8 bg-[#121212] rounded-3xl border border-white/5 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-400 mb-2">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Acesso Restrito</h3>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                      O cadastro na plataforma é feito exclusivamente através de um <strong className="text-white">link de convite oficial</strong> enviado pela sua empresa.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Nome Completo</label>
                      <input 
                        type="text" 
                        value={authName}
                        onChange={e => setAuthName(e.target.value)}
                        className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] transition-all placeholder-gray-500"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                  )}
                  
                  {authMode !== 'update_password' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">E-mail Corporativo</label>
                      <input 
                        type="email" 
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] transition-all placeholder-gray-500"
                        placeholder="voce@empresa.com"
                      />
                    </div>
                  )}

                  {authMode !== 'forgot_password' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-gray-300">
                          {authMode === 'update_password' ? 'Nova Senha' : 'Senha'}
                        </label>
                        {authMode === 'login' && (
                          <button 
                            type="button" 
                            onClick={() => setAuthMode('forgot_password')}
                            className="text-xs font-bold text-[#EA1D2C] hover:text-[#C81824] transition-colors"
                          >
                            Esqueceu a senha?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 pr-12 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] transition-all placeholder-gray-500"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-4 mt-4 bg-[#EA1D2C] text-white rounded-2xl font-bold text-lg hover:bg-[#C81824] transition-all shadow-lg shadow-[#EA1D2C]/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
                  >
                    {authMode === 'login' ? 'Entrar na Plataforma' : authMode === 'register' ? 'Criar Minha Conta' : authMode === 'update_password' ? 'Salvar Nova Senha' : 'Enviar Link de Recuperação'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}

              <div className="mt-8 pt-6 border-t border-white/10">
                {authMode === 'update_password' ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthPassword('');
                    }}
                    className="text-sm font-bold text-gray-400 hover:text-[#EA1D2C] transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Cancelar e ir para o painel
                  </button>
                ) : authMode === 'login' && !inviteCode ? (
                  <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Novo por aqui?</h4>
                      <p className="text-gray-400 text-xs">Você precisa de um convite para criar sua conta.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setAuthEmail('');
                        setAuthPassword('');
                        setAuthName('');
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                    >
                      Tenho um convite
                    </button>
                  </div>
                ) : authMode === 'forgot_password' ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthName('');
                    }}
                    className="text-sm font-bold text-gray-400 hover:text-[#EA1D2C] transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar para o login
                  </button>
                ) : !inviteCode ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthName('');
                    }}
                    className="text-sm font-bold text-gray-400 hover:text-[#EA1D2C] transition-colors flex items-center gap-2"
                  >
                    Já tem uma conta? Faça login
                  </button>
                ) : null}
              </div>
            </form>
            )}
          </div>
        </div>

        {/* Right Side - Image/Gamification Vibe */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#EA1D2C]/90 to-[#A0131D]/90 mix-blend-multiply z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" 
            alt="Equipe colaborando" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex relative overflow-hidden">
      {/* GLOBAL GRID BACKGROUND */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      {/* SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#050505] border-r border-white/5 z-40 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex items-center gap-3 mb-2">
          <div className="h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} />
            <Cpu className="w-6 h-6 text-white hidden" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-white uppercase font-sans">
            DEEP GAME
          </h1>
        </div>

        <div className="px-4 mb-8">
          <div className="flex flex-col gap-3 p-3 bg-transparent relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative group cursor-pointer flex-shrink-0">
                <img src={currentUser.avatar} alt="Avatar" className={`w-10 h-10 rounded-full bg-black/50 object-cover`} />
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Bird className="w-3.5 h-3.5 text-[#FFFFFF] fill-[#FFFFFF]" />
                  <span className="text-sm font-medium text-white">{formatPoints(currentUser.pontos)}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm font-medium text-white">{formatPoints(currentUser.pontos_acumulados)}</span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            {getRankProgress(currentUser.pontos_acumulados || 0).nextTierName && (
              <div className="relative z-10">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ 
                      width: `${getRankProgress(currentUser.pontos_acumulados || 0).percentage}%`,
                      backgroundColor: 'currentColor',
                      color: getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '') === 'white/60' ? '#9ca3af' : 
                             getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '').split('-')[0] === 'cyan' ? '#22d3ee' :
                             getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '').split('-')[0] === 'yellow' ? '#facc15' :
                             getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '').split('-')[0] === 'gray' ? '#d1d5db' :
                             getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '').split('-')[0] === 'orange' ? '#fb923c' : '#ffffff'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <SidebarNavButton active={activeTab === 'recompensas'} onClick={() => setActiveTab('recompensas')} icon={<Gift className="w-4 h-4" />} text="Prêmios" />
          <SidebarNavButton active={activeTab === 'enviar'} onClick={() => setActiveTab('enviar')} icon={<Camera className="w-4 h-4" />} text="Missões" />
          <SidebarNavButton active={activeTab === 'placar'} onClick={() => setActiveTab('placar')} icon={<Trophy className="w-4 h-4" />} text="Ranking" />
          {currentUser?.cargo === 'admin' && (
            <>
              <SidebarNavButton active={activeTab === 'mural'} onClick={() => setActiveTab('mural')} icon={<Star className="w-4 h-4" />} text="Mural" />
              <SidebarNavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Shield className="w-4 h-4" />} text="Admin" />
              <SidebarNavButton active={activeTab === 'relatorios'} onClick={() => setActiveTab('relatorios')} icon={<BarChart3 className="w-4 h-4" />} text="Relatórios" />
            </>
          )}
        </nav>

        <div className="p-3 mt-auto space-y-1">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium text-sm">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {soundEnabled ? 'Som Ativado' : 'Som Desativado'}
          </button>
          <a href="/" className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar para o Hub
          </a>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium text-sm">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 px-4 py-3 flex flex-col gap-3 shadow-[0_4px_24px_rgba(0,163,255,0.05)]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <a href="/" className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors cursor-pointer" title="Voltar para o Hub">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} />
                <Cpu className="w-5 h-5 text-[#EA1D2C] hidden" />
              </div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                DEEP GAME
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 -m-2 text-gray-500 hover:text-white transition-colors cursor-pointer" title={soundEnabled ? 'Desativar som' : 'Ativar som'}>
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button type="button" onClick={() => setShowRankingsModal(true)} className="p-2 -m-2 text-gray-500 hover:text-white transition-colors cursor-pointer" title="Ver todos os rankings">
                <Info className="w-5 h-5" />
              </button>
              <div className="relative group cursor-pointer">
                <img src={currentUser.avatar} alt="Avatar" className={`w-8 h-8 rounded-full bg-black/50 border-2 ${getUserTier(currentUser.pontos_acumulados || 0).border} object-cover`} />
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-3 h-3 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>
          </div>
          
          {/* Progress Bar Mobile */}
          <div className="w-full mt-2">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-black/20 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Corujitas</span>
                <div className="flex items-center gap-1">
                  <Bird className="w-3 h-3 text-[#FFFFFF] fill-[#FFFFFF]" />
                  <span className="text-sm font-black text-white">{formatPoints(currentUser.pontos)}</span>
                </div>
              </div>
              <div className="bg-black/20 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Ranking</span>
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span className="text-sm font-black text-white">{formatPoints(currentUser.pontos_acumulados)}</span>
                </div>
              </div>
            </div>
            
            {getRankProgress(currentUser.pontos_acumulados || 0).nextTierName && (
              <>
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-medium">
                  <div className={`flex items-center gap-1 font-bold ${getUserTier(currentUser.pontos_acumulados || 0).color}`}>
                    <span>{getUserTier(currentUser.pontos_acumulados || 0).icon}</span>
                    <span>{getUserTier(currentUser.pontos_acumulados || 0).name}</span>
                  </div>
                  <span>{getRankProgress(currentUser.pontos_acumulados || 0).text}</span>
                </div>
                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ 
                      width: `${getRankProgress(currentUser.pontos_acumulados || 0).percentage}%`,
                      backgroundColor: 'currentColor',
                      color: getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '') === 'white/60' ? '#9ca3af' : 
                             getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '').split('-')[0] === 'cyan' ? '#22d3ee' :
                             getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '').split('-')[0] === 'yellow' ? '#facc15' :
                             getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '').split('-')[0] === 'gray' ? '#d1d5db' :
                             getUserTier(currentUser.pontos_acumulados || 0).color.replace('text-', '').split('-')[0] === 'orange' ? '#fb923c' : '#ffffff'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20"></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* NOTIFICATION */}
        <div className="fixed top-4 right-4 z-50 w-[90%] md:w-auto max-w-md flex flex-col gap-2">
          {notifications.map(notification => (
            <div key={notification.id} className="animate-in slide-in-from-right-4 fade-in duration-300">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl relative overflow-hidden bg-[#121212] ${
                notification.type === 'success' ? 'border-[#EA1D2C]/30 text-white' : 'border-red-500/30 text-white'
              }`}>
                <div className={`absolute bottom-0 left-0 h-1 opacity-30 animate-[shrink_3s_linear_forwards] ${
                  notification.type === 'success' ? 'bg-[#EA1D2C]' : 'bg-red-500'
                }`} />
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#EA1D2C]" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
                <p className="text-sm font-medium">{notification.msg}</p>
              </div>
            </div>
          ))}
        </div>

        {/* PENALIZAÇÕES NOTIFICATIONS */}
        {penalizacoes.filter(p => p.usuario_id === currentUser.id).map(penalizacao => (
          <div key={penalizacao.id} className="fixed top-20 right-4 z-40 w-[90%] md:w-auto max-w-md animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="flex items-start gap-4 p-5 rounded-2xl shadow-2xl border border-white/10 bg-[#121212]/95 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
              <div className="p-2 bg-white/5 rounded-xl text-red-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-lg mb-1">Penalidade Aplicada</h3>
                <p className="text-gray-300 text-sm font-medium mb-2">Você perdeu <span className="text-red-400 font-bold">{penalizacao.pontos} pontos</span>.</p>
                <div className="bg-white/5 border border-white/5 rounded-lg p-3 mb-3">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Motivo:</p>
                  <p className="text-gray-300 text-sm italic">"{penalizacao.motivo}"</p>
                </div>
                <button 
                  onClick={() => handleClosePenalizacao(penalizacao.id)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors border border-white/10"
                >
                  Estou ciente
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* BONIFICAÇÕES NOTIFICATIONS */}
        {bonificacoes.filter(p => p.usuario_id === currentUser.id && !p.lida).map(bonificacao => (
          <div key={bonificacao.id} className="fixed top-20 right-4 z-40 w-[90%] md:w-auto max-w-md animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="flex items-start gap-4 p-5 rounded-2xl shadow-2xl border border-white/10 bg-[#121212]/95 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FFFFFF]/50"></div>
              <div className="p-2 bg-white/5 rounded-xl text-[#FFFFFF] shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-lg mb-1">Bonificação Recebida</h3>
                <p className="text-gray-300 text-sm font-medium mb-2">Você ganhou <span className="text-[#FFFFFF] font-bold">{bonificacao.pontos} pontos</span>!</p>
                <div className="bg-white/5 border border-white/5 rounded-lg p-3 mb-3">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Motivo:</p>
                  <p className="text-gray-300 text-sm italic">"{bonificacao.motivo}"</p>
                </div>
                <button 
                  onClick={() => handleCloseBonificacao(bonificacao.id)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors border border-white/10"
                >
                  Estou ciente
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* SCROLLABLE CONTENT */}
        <main 
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull to refresh indicator */}
          <div 
            className="md:hidden absolute left-0 right-0 flex justify-center items-center overflow-hidden transition-all duration-200 z-50 pointer-events-none"
            style={{ 
              height: `${pullDistance}px`,
              opacity: pullDistance / 100
            }}
          >
            <div className={`bg-[#121212] border border-white/10 rounded-full p-2 shadow-lg ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }}>
              <ArrowRight className="w-5 h-5 text-[#EA1D2C] rotate-90" />
            </div>
          </div>
          <div className="max-w-5xl mx-auto">
            
            {/* RECOMPENSAS TAB (LOJA) */}
            {activeTab === 'recompensas' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Hero Banner Section */}
            <div className="bg-gradient-to-r from-[#EA1D2C] to-[#A0131D] rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-24 -right-10 w-80 h-80 bg-black/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
              </div>
              <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                <Gift className="w-64 h-64" />
              </div>
              <div className="relative z-10 space-y-2 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Troque seus pontos</h1>
                <p className="text-white/90 font-medium text-lg">Os melhores prêmios estão aqui.</p>
              </div>
              <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/30">
                <div className="bg-white rounded-full p-2">
                  <Star className="w-6 h-6 text-[#FFFFFF] fill-[#FFFFFF]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Seu Saldo</p>
                  <p className="text-2xl font-black">{formatPoints(currentUser?.pontos)}</p>
                </div>
              </div>
            </div>

            {(() => {
              const availableProducts = products.filter(p => currentUser && currentUser.pontos >= p.preco_pontos && p.estoque > 0);
              const lockedProducts = products.filter(p => !currentUser || currentUser.pontos < p.preco_pontos || p.estoque <= 0);

              return (
                <div className="space-y-12">
                  {/* AVAILABLE PRODUCTS */}
                  {availableProducts.length === 0 && lockedProducts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-medium bg-[#121212]/50 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF]/5 to-transparent pointer-events-none"></div>
                      <div className="w-20 h-20 bg-[#FFFFFF]/10 rounded-full flex items-center justify-center mb-2 relative">
                        <div className="absolute inset-0 bg-[#FFFFFF]/20 rounded-full blur-xl animate-pulse"></div>
                        <Gift className="w-10 h-10 text-[#FFFFFF] relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight relative z-10">Loja em reabastecimento...</h3>
                      <p className="text-sm text-gray-400 max-w-sm relative z-10">Nenhum prêmio disponível no momento. Continue juntando pontos enquanto preparamos novidades!</p>
                    </div>
                  ) : (
                    <>
                      {availableProducts.length > 0 && (
                        <div>
                          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-[#EA1D2C]" /> Resgate Agora
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableProducts.map(produto => {
                          const isPremium = produto.preco_pontos >= 1000;
                          return (
                          <div key={produto.id} className={`bg-[#121212] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border ${isPremium ? 'border-amber-500/50 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]' : 'border-[#EA1D2C]/30 hover:border-[#EA1D2C]'}`}>
                            <div className="aspect-[4/3] w-full bg-[#0A0A0A] relative overflow-hidden">
                              <img 
                                src={produto.imagem_url} 
                                alt={produto.nome}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className={`absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border ${isPremium ? 'border-amber-400/50' : 'border-[#FFFFFF]/30'}`}>
                                <Star className={`w-3.5 h-3.5 ${isPremium ? 'text-amber-400 fill-amber-400' : 'text-[#FFFFFF] fill-[#FFFFFF]'}`} />
                                <span className={`font-bold text-sm ${isPremium ? 'text-amber-400' : 'text-[#FFFFFF]'}`}>{formatPoints(produto.preco_pontos)}</span>
                              </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                              <h3 className="text-lg font-bold text-white leading-tight mb-1">{produto.nome}</h3>
                              <p className="text-sm text-gray-400 mb-2 line-clamp-2">{produto.descricao}</p>
                              {produto.regras && <p className="text-xs text-[#EA1D2C] mb-4 font-medium">Regras: {produto.regras}</p>}
                              
                              <div className="flex items-center gap-2 mb-6">
                                <span className="text-xs font-bold px-2.5 py-1 bg-white/5 text-gray-400 rounded-md border border-white/5">
                                  {produto.estoque} {produto.estoque === 1 ? 'disponível' : 'disponíveis'}
                                </span>
                              </div>
                              
                              <div className="mt-auto">
                                <button 
                                  onClick={() => setConfirmResgate(produto)}
                                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-[#EA1D2C] text-white hover:bg-[#C81824] shadow-md shadow-[#EA1D2C]/20 active:scale-[0.98]"
                                >
                                  Resgatar Prêmio
                                </button>
                              </div>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}

                  {/* LOCKED PRODUCTS */}
                  {lockedProducts.length > 0 && (
                    <div>
                      <h2 className="text-xl font-black text-gray-400 mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5" /> Continue Juntando
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lockedProducts.map(produto => {
                          const isOutOfStock = produto.estoque <= 0;
                          const progress = Math.min(100, ((currentUser?.pontos || 0) / produto.preco_pontos) * 100);
                          const pointsNeeded = produto.preco_pontos - (currentUser?.pontos || 0);
                          const isPremium = produto.preco_pontos >= 1000;

                          return (
                            <div key={produto.id} className={`bg-[#121212] rounded-3xl overflow-hidden shadow-sm transition-all duration-300 flex flex-col border ${isPremium && !isOutOfStock ? 'border-amber-500/20' : 'border-white/5'} ${isOutOfStock ? 'opacity-70' : ''}`}>
                              <div className="aspect-[4/3] w-full bg-[#0A0A0A] relative overflow-hidden">
                                <img 
                                  src={produto.imagem_url} 
                                  alt={produto.nome}
                                  className="w-full h-full object-cover grayscale-[30%]"
                                  referrerPolicy="no-referrer"
                                />
                                {isOutOfStock && (
                                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-white font-black text-lg px-6 py-2 bg-black/50 border border-white/10 rounded-full shadow-md">Esgotado</span>
                                  </div>
                                )}
                                <div className={`absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border ${isPremium && !isOutOfStock ? 'border-amber-500/30' : 'border-white/10'}`}>
                                  <Star className={`w-3.5 h-3.5 ${isPremium && !isOutOfStock ? 'text-amber-500/50' : 'text-gray-400'}`} />
                                  <span className={`font-bold text-sm ${isPremium && !isOutOfStock ? 'text-amber-500/50' : 'text-gray-400'}`}>{formatPoints(produto.preco_pontos)}</span>
                                </div>
                              </div>
                              <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-lg font-bold text-gray-300 leading-tight mb-1">{produto.nome}</h3>
                                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{produto.descricao}</p>
                                {produto.regras && <p className="text-xs text-[#EA1D2C]/70 mb-4 font-medium">Regras: {produto.regras}</p>}
                                
                                <div className="flex items-center gap-2 mb-4">
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/5 text-gray-500 rounded-md border border-white/5 uppercase tracking-wider">
                                    {produto.estoque} {produto.estoque === 1 ? 'disponível' : 'disponíveis'}
                                  </span>
                                </div>

                                {!isOutOfStock && (
                                  <div className="mb-6 space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                      <span className="text-gray-400">Progresso</span>
                                      <span className="text-[#FFFFFF]">Faltam {formatPoints(pointsNeeded)} pts</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                      <div className="bg-[#EA1D2C] h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="mt-auto">
                                  <button 
                                    disabled
                                    className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                  >
                                    {isOutOfStock ? 'Indisponível' : 'Pontos Insuficientes'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

            {/* MEUS RESGATES */}
            {currentUser && resgates.filter(r => r.usuario_id === currentUser.id).length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-[#EA1D2C]" /> Meus Prêmios Resgatados
                </h2>
                <div className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {resgates.filter(r => r.usuario_id === currentUser.id).map(resgate => (
                      <div key={resgate.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 transition-colors">
                        <div className="min-w-0 flex-1 w-full">
                          <p className="font-bold text-white text-lg truncate">{resgate.produto_nome}</p>
                          <p className="text-sm text-gray-400">Resgatado em {new Date(resgate.data_resgate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          {resgate.usado ? (
                            <span className="px-4 py-2 bg-white/5 text-gray-500 rounded-xl text-sm font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Já Utilizado
                            </span>
                          ) : (
                            <span className="px-4 py-2 bg-[#EA1D2C]/10 text-[#EA1D2C] rounded-xl text-sm font-bold flex items-center gap-2 border border-[#EA1D2C]/20">
                              <Ticket className="w-4 h-4" /> Disponível para Uso
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ENVIAR PROVA TAB (MISSÕES) */}
        {activeTab === 'enviar' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-xl mx-auto">
            {!selectedTarefa ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-black text-white tracking-tight">Missões Disponíveis</h1>
                  <p className="text-gray-400 mt-2 font-medium">Escolha uma missão, envie a prova e ganhe pontos!</p>
                </div>
                
                <div className="space-y-4">
                  {tarefas.filter(t => t.ativo !== false).length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-medium bg-[#121212]/50 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#EA1D2C]/5 to-transparent pointer-events-none"></div>
                      <div className="w-20 h-20 bg-[#EA1D2C]/10 rounded-full flex items-center justify-center mb-2 relative">
                        <div className="absolute inset-0 bg-[#EA1D2C]/20 rounded-full blur-xl animate-pulse"></div>
                        <Target className="w-10 h-10 text-[#EA1D2C] relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight relative z-10">Nenhuma missão no momento</h3>
                      <p className="text-sm text-gray-400 max-w-sm relative z-10">Fique de olho! Novas missões podem aparecer a qualquer momento para você ganhar mais pontos.</p>
                    </div>
                  ) : (
                    tarefas.filter(t => t.ativo !== false).map(tarefa => (
                      <div 
                        key={tarefa.id} 
                        onClick={() => setSelectedTarefa(tarefa.id)}
                        className="bg-[#121212] p-5 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#EA1D2C]/50 hover:bg-white/5 transition-all group overflow-hidden relative active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4 z-10">
                          {tarefa.imagem_url ? (
                            <img src={tarefa.imagem_url} alt={tarefa.nome} loading="lazy" className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-16 h-16 bg-[#EA1D2C]/20 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform border border-[#EA1D2C]/30 shrink-0">
                              <Cpu className="w-8 h-8 text-[#FFFFFF]" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-white text-lg">{tarefa.nome}</h3>
                            {tarefa.descricao && <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{tarefa.descricao}</p>}
                            {tarefa.regras && <p className="text-xs text-[#EA1D2C] mt-1 font-medium">Regras: {tarefa.regras}</p>}
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-4 h-4 text-[#FFFFFF] fill-[#FFFFFF]" />
                              <span className="text-sm font-black text-[#FFFFFF]">+{formatPoints(tarefa.pontos)} pts</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-[#FFFFFF] transition-colors z-10" />
                      </div>
                    ))
                  )}
                </div>

                {/* MINHAS MISSÕES */}
                <div className="mt-12">
                  <h2 className="text-2xl font-black text-white tracking-tight mb-6">Minhas Missões</h2>
                  {submissoes.filter(s => s.usuario_id === currentUser.id).length === 0 ? (
                    <div className="p-10 text-center text-gray-500 font-medium bg-[#121212]/50 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2 relative">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
                        <Camera className="w-8 h-8 text-gray-400 relative z-10" />
                      </div>
                      <h3 className="text-xl font-bold text-white relative z-10">Nenhuma missão enviada</h3>
                      <p className="text-sm text-gray-400 max-w-xs relative z-10">Escolha uma missão acima, envie sua evidência e comece a ganhar pontos!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissoes.filter(s => s.usuario_id === currentUser.id).map(sub => (
                        <div key={sub.id} className="p-4 bg-[#121212] rounded-2xl border border-white/5 flex flex-col gap-3 w-full overflow-hidden">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0 flex-1 w-full">
                              <h3 className="font-bold text-white truncate">{sub.tarefa_nome}</h3>
                              <p className="text-xs text-gray-400 mt-1">{new Date(sub.data_envio).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                              sub.status === 'aprovado' ? 'bg-[#EA1D2C]/10 text-[#EA1D2C] border-[#EA1D2C]/20' :
                              sub.status === 'rejeitado' ? 'bg-white/5 text-gray-400 border-white/10' :
                              'bg-white/5 text-gray-300 border-white/10'
                            }`}>
                              {sub.status.toUpperCase()}
                            </div>
                          </div>
                          {sub.url_prova && (
                            <div 
                              className="w-full h-24 rounded-xl overflow-hidden border border-white/10 relative cursor-pointer group mt-2"
                              onClick={() => setLightboxImage(sub.url_prova)}
                            >
                              {sub.url_prova.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) ? (
                                <video src={sub.url_prova} className="w-full h-full object-cover" />
                              ) : (
                                <img src={sub.url_prova} alt="Evidência" loading="lazy" className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm">
                                Ampliar
                              </div>
                            </div>
                          )}
                          {sub.status === 'rejeitado' && sub.motivo_rejeicao && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-2">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Motivo da Rejeição:</p>
                              <p className="text-sm text-gray-300 italic break-words whitespace-pre-wrap w-full overflow-y-auto max-h-32">"{sub.motivo_rejeicao}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                  <button 
                    onClick={() => { setSelectedTarefa(''); setDescricao(''); setSelectedFile(null); setPreviewUrl(null); }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-400" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">{tarefas.find(t => t.id === selectedTarefa)?.nome}</h2>
                    <p className="text-sm text-[#FFFFFF] font-bold">Valendo {formatPoints(tarefas.find(t => t.id === selectedTarefa)?.pontos)} pts</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">Conta mais detalhes</label>
                    <textarea 
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      rows={3}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors resize-none placeholder-gray-600"
                      placeholder="Ex: Pedi um lanche ontem a noite..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white mb-3">Envie a foto ou vídeo da prova</label>
                    <div className="relative border-2 border-dashed border-white/20 rounded-3xl bg-[#0A0A0A] p-8 text-center cursor-pointer hover:bg-white/5 hover:border-[#EA1D2C]/50 transition-colors min-h-[200px] flex flex-col items-center justify-center overflow-hidden group">
                      <input 
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      {previewUrl ? (
                        <div className="absolute inset-0 w-full h-full">
                          {selectedFile?.type.startsWith('video/') ? (
                            <video src={previewUrl} className="w-full h-full object-cover" controls />
                          ) : (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-[#121212] text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-lg border border-white/10">Trocar arquivo</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 pointer-events-none">
                          <div className="w-16 h-16 rounded-full bg-[#121212] shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5">
                            <Camera className="w-7 h-7 text-[#FFFFFF]" />
                          </div>
                          <div>
                            <span className="block font-bold text-gray-300">Toque para abrir a galeria</span>
                            <span className="block text-gray-500 text-xs mt-1 font-medium">JPG, PNG, MP4 ou WEBM</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isUploading}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      isUploading 
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#EA1D2C] text-white hover:bg-[#C81824] shadow-lg shadow-[#EA1D2C]/20 active:scale-[0.98]'
                    }`}
                  >
                    {isUploading ? 'Enviando...' : 'Enviar Missão'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* PLACAR TAB (RANKING) */}
        {activeTab === 'placar' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto pb-20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white tracking-tight">Mais Ativos</h1>
              <p className="text-gray-400 mt-2 font-medium">Os mais ativos do time.</p>
            </div>

            {(() => {
              const sortedUsers = [...users].filter(u => !u.oculto_ranking).sort((a, b) => (b.pontos_acumulados || b.pontos || 0) - (a.pontos_acumulados || a.pontos || 0));
              const top3 = sortedUsers.slice(0, 3);
              const currentUserRank = sortedUsers.findIndex(u => u.id === currentUser?.id) + 1;

              return (
                <div className="flex-1 flex flex-col justify-center min-h-[60vh]">
                  {/* PODIUM */}
                  {top3.length > 0 && (
                    <div className="flex justify-center items-end gap-4 sm:gap-10 px-2 w-full max-w-4xl mx-auto">
                      {/* 2nd Place */}
                      {top3[1] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500 delay-100 flex-1">
                          <div className="relative mb-4">
                            <img src={top3[1].avatar} alt={top3[1].nome} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#7DD3FC] object-cover bg-[#0A0A0A]" />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#7DD3FC] text-black w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-4 border-[#121212]">2</div>
                          </div>
                          <span className="font-bold text-white text-lg sm:text-xl truncate max-w-[120px] sm:max-w-[160px] text-center">{top3[1].nome}</span>
                          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getUserTier(top3[1].pontos_acumulados || 0).color}`}>
                            <span>{getUserTier(top3[1].pontos_acumulados || 0).icon}</span>
                            <span>{getUserTier(top3[1].pontos_acumulados || 0).name}</span>
                          </div>
                          <span className="text-base font-bold text-[#FFFFFF] mt-2">{formatPoints(top3[1].pontos_acumulados || top3[1].pontos)} pts</span>
                          <div className="w-full max-w-[120px] sm:max-w-[160px] h-32 sm:h-48 bg-gradient-to-t from-[#7DD3FC]/20 to-transparent mt-4 rounded-t-2xl border-t-2 border-[#7DD3FC]/30"></div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {top3[0] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-500 z-10 flex-1">
                          <Crown className="w-12 h-12 text-[#FFFFFF] fill-[#FFFFFF] drop-shadow-lg mb-3 animate-bounce" />
                          <div className="relative mb-4">
                            <img src={top3[0].avatar} alt={top3[0].nome} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#FFFFFF] object-cover bg-[#0A0A0A] shadow-[0_0_40px_rgba(255,255,255,0.3)]" />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FFFFFF] text-black w-10 h-10 rounded-full flex items-center justify-center font-black text-base border-4 border-[#121212]">1</div>
                          </div>
                          <span className="font-black text-white text-xl sm:text-2xl truncate max-w-[140px] sm:max-w-[180px] text-center">{top3[0].nome}</span>
                          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getUserTier(top3[0].pontos_acumulados || 0).color}`}>
                            <span>{getUserTier(top3[0].pontos_acumulados || 0).icon}</span>
                            <span>{getUserTier(top3[0].pontos_acumulados || 0).name}</span>
                          </div>
                          <span className="text-lg font-black text-[#FFFFFF] mt-2">{formatPoints(top3[0].pontos_acumulados || top3[0].pontos)} pts</span>
                          <div className="w-full max-w-[140px] sm:max-w-[180px] h-40 sm:h-64 bg-gradient-to-t from-[#FFFFFF]/20 to-transparent mt-4 rounded-t-2xl border-t-2 border-[#FFFFFF]/30"></div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {top3[2] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 delay-200 flex-1">
                          <div className="relative mb-4">
                            <img src={top3[2].avatar} alt={top3[2].nome} className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-[#0284C7] object-cover bg-[#0A0A0A]" />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#0284C7] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-4 border-[#121212]">3</div>
                          </div>
                          <span className="font-bold text-white text-base sm:text-lg truncate max-w-[100px] sm:max-w-[140px] text-center">{top3[2].nome}</span>
                          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${getUserTier(top3[2].pontos_acumulados || 0).color}`}>
                            <span>{getUserTier(top3[2].pontos_acumulados || 0).icon}</span>
                            <span>{getUserTier(top3[2].pontos_acumulados || 0).name}</span>
                          </div>
                          <span className="text-sm font-bold text-[#FFFFFF] mt-2">{formatPoints(top3[2].pontos_acumulados || top3[2].pontos)} pts</span>
                          <div className="w-full max-w-[100px] sm:max-w-[140px] h-24 sm:h-36 bg-gradient-to-t from-[#0284C7]/20 to-transparent mt-4 rounded-t-2xl border-t-2 border-[#0284C7]/30"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* MURAL TAB */}
        {activeTab === 'mural' && currentUser?.cargo === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto pb-20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white tracking-tight">Mural de Atividades</h1>
              <p className="text-gray-400 mt-2 font-medium">Veja o que a galera está conquistando!</p>
            </div>

            {(() => {
              const atividades = [
                ...submissoes.filter(s => s.status === 'aprovado').map(s => ({
                  id: `sub-${s.id}`,
                  type: 'missao',
                  date: new Date(s.data_envio),
                  user: users.find(u => u.id === s.usuario_id),
                  data: s
                })),
                ...resgates.map(r => ({
                  id: `res-${r.id}`,
                  type: 'resgate',
                  date: new Date(r.data_resgate),
                  user: users.find(u => u.id === r.usuario_id),
                  data: r
                })),
                ...bonificacoes.map(b => ({
                  id: `bon-${b.id}`,
                  type: 'bonificacao',
                  date: new Date(b.created_at),
                  user: users.find(u => u.id === b.usuario_id),
                  data: b
                }))
              ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50); // Últimas 50 atividades

              if (atividades.length === 0) {
                return (
                  <div className="p-12 text-center text-gray-500 font-medium bg-[#121212]/50 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#EA1D2C]/5 to-transparent pointer-events-none"></div>
                    <div className="w-20 h-20 bg-[#EA1D2C]/10 rounded-full flex items-center justify-center mb-2 relative">
                      <div className="absolute inset-0 bg-[#EA1D2C]/20 rounded-full blur-xl animate-pulse"></div>
                      <Star className="w-10 h-10 text-[#EA1D2C] relative z-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight relative z-10">O mural está silencioso...</h3>
                    <p className="text-sm text-gray-400 max-w-sm relative z-10">Ninguém completou missões ou resgatou prêmios recentemente. Seja o primeiro a quebrar o gelo!</p>
                    <button 
                      onClick={() => setActiveTab('enviar')}
                      className="mt-4 px-6 py-3 bg-[#EA1D2C] hover:bg-[#C81824] text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(0,163,255,0.3)] hover:shadow-[0_0_25px_rgba(0,163,255,0.5)] relative z-10"
                    >
                      Fazer uma Missão
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                  {atividades.map((atividade) => (
                    <div key={atividade.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Timeline dot */}
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#0A0A0A] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${
                        atividade.type === 'missao' ? 'bg-amber-500/20 text-amber-400' : 
                        atividade.type === 'bonificacao' ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]' : 'bg-[#EA1D2C]/20 text-[#FFFFFF]'
                      }`}>
                        {atividade.type === 'missao' ? <Star className="w-5 h-5 fill-current" /> : 
                         atividade.type === 'bonificacao' ? <CheckCircle2 className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                      </div>
                      
                      {/* Content Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl bg-[#121212] border border-white/5 shadow-sm hover:border-white/10 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative group/card">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        <div className="flex items-center gap-3 mb-2">
                          <img src={atividade.user?.avatar} alt={atividade.user?.nome} className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{atividade.user?.nome}</p>
                            <p className="text-xs text-gray-500">{atividade.date.toLocaleDateString('pt-BR')} às {atividade.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        
                        {atividade.type === 'missao' ? (
                          <p className="text-sm text-gray-300 break-words">
                            Completou uma missão e ganhou <span className="text-emerald-400 font-bold whitespace-nowrap">+{formatPoints(atividade.data.pontos)} pts</span>!
                          </p>
                        ) : atividade.type === 'bonificacao' ? (
                          <p className="text-sm text-gray-300 break-words">
                            Recebeu uma bonificação de <span className="text-[#FFFFFF] font-bold whitespace-nowrap">+{formatPoints(atividade.data.pontos)} pts</span>!
                          </p>
                        ) : (
                          <p className="text-sm text-gray-300 break-words">
                            Resgatou uma recompensa por <span className="text-[#FFFFFF] font-bold whitespace-nowrap">{formatPoints(atividade.data.preco_pontos)} pts</span>!
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Load older button for Mural */}
            {!loadOlder && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => {
                    setLoadOlder(true);
                    fetchAllData(true, true);
                  }}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10"
                >
                  Carregar atividades antigas
                </button>
              </div>
            )}
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && currentUser?.cargo === 'admin' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <Shield className="w-8 h-8 text-[#EA1D2C]" /> Painel de Comando
                </h1>
                <p className="text-gray-400 mt-2 font-medium">Aprove missões e gerencie o catálogo.</p>
              </div>
              <button 
                onClick={copyInviteLink}
                className="px-5 py-3 bg-gradient-to-r from-[#EA1D2C] to-[#C81824] text-white rounded-xl font-bold hover:from-[#FFFFFF] hover:to-[#EA1D2C] transition-all shadow-[0_0_15px_rgba(0,163,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                Copiar Link de Convite
              </button>
            </div>

            {/* FILA DE APROVAÇÃO DE MISSÕES */}
            <section className="bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden mb-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-[#EA1D2C]/10 blur-[50px] pointer-events-none"></div>
              <div className="p-6 border-b border-white/10 bg-transparent relative z-10">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#FFFFFF]" /> Fila de Avaliação de Missões
                </h2>
              </div>
              
              <div className="p-4 relative z-10">
                {submissoes.filter(s => s.status === 'pendente').length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium bg-[#121212]/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#EA1D2C]/5 to-transparent pointer-events-none"></div>
                    <div className="w-16 h-16 bg-[#EA1D2C]/10 rounded-full flex items-center justify-center mb-2 relative">
                      <div className="absolute inset-0 bg-[#EA1D2C]/20 rounded-full blur-xl"></div>
                      <CheckCircle2 className="w-8 h-8 text-[#EA1D2C] relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white relative z-10">Tudo limpo! ✨</h3>
                    <p className="text-sm text-gray-400 relative z-10">Nenhuma missão pendente de avaliação no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissoes.filter(s => s.status === 'pendente').map(sub => (
                      <div key={sub.id} className="p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center bg-[#121212]/80 hover:bg-white/5 rounded-2xl transition-all border border-white/5 hover:border-[#EA1D2C]/30 hover:shadow-[0_0_15px_rgba(0,163,255,0.1)] w-full overflow-hidden">
                        <div className="space-y-2 flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-3">
                            <img src={sub.usuario_avatar} alt={sub.usuario_nome} loading="lazy" className="w-8 h-8 rounded-full bg-[#0A0A0A] border border-white/10 object-cover shrink-0" />
                            <span className="font-bold text-white text-lg truncate select-text selection:bg-[#EA1D2C]/30 selection:text-white">{sub.usuario_nome}</span>
                            <span className="px-2.5 py-1 bg-[#EA1D2C]/20 text-[#FFFFFF] text-xs font-bold rounded-lg border border-[#EA1D2C]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)] whitespace-nowrap">+{sub.pontos} pts</span>
                          </div>
                          <div className="text-sm font-bold text-gray-300 truncate select-text selection:bg-[#EA1D2C]/30 selection:text-white">{sub.tarefa_nome}</div>
                          <div className="relative group/desc">
                            <p className="text-sm text-gray-400 bg-[#050505] p-3 rounded-xl border border-white/5 break-words whitespace-pre-wrap overflow-y-auto max-h-32 w-full select-text selection:bg-[#EA1D2C]/30 selection:text-white">{sub.descricao}</p>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(sub.descricao);
                                showNotification('Texto copiado!', 'success', 'none');
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg opacity-0 group-hover/desc:opacity-100 transition-opacity"
                              title="Copiar texto"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-36 h-36 bg-[#0A0A0A] rounded-2xl border border-white/10 relative flex-shrink-0 group overflow-hidden">
                          {sub.url_prova.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) ? (
                            <video src={sub.url_prova} className="w-full h-full object-cover" controls />
                          ) : (
                            <div className="w-full h-full relative cursor-pointer" onClick={() => setLightboxImage(sub.url_prova)}>
                              <img src={sub.url_prova} alt="Evidência" loading="lazy" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm">
                                Ampliar
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 w-full md:w-auto md:flex-col">
                          <button 
                            onClick={() => handleAprovar(sub)}
                            className="flex-1 md:flex-none px-5 py-3 bg-white/5 text-emerald-400 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar
                          </button>
                          <button 
                            onClick={() => handleRejeitar(sub)}
                            className="flex-1 md:flex-none px-5 py-3 bg-white/5 text-red-400 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                          >
                            <XCircle className="w-4 h-4" /> Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* FILA DE APROVAÇÃO DE PRÊMIOS */}
            <section className="bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden mb-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-[#EA1D2C]/10 blur-[50px] pointer-events-none"></div>
              <div className="p-6 border-b border-white/10 bg-transparent relative z-10">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#FFFFFF]" /> Fila de Avaliação de Prêmios
                </h2>
              </div>
              
              <div className="p-4 relative z-10">
                {resgates.filter(r => r.status === 'pendente').length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium bg-[#121212]/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#EA1D2C]/5 to-transparent pointer-events-none"></div>
                    <div className="w-16 h-16 bg-[#EA1D2C]/10 rounded-full flex items-center justify-center mb-2 relative">
                      <div className="absolute inset-0 bg-[#EA1D2C]/20 rounded-full blur-xl"></div>
                      <CheckCircle2 className="w-8 h-8 text-[#EA1D2C] relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white relative z-10">Tudo limpo! ✨</h3>
                    <p className="text-sm text-gray-400 relative z-10">Nenhum resgate pendente de aprovação no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resgates.filter(r => r.status === 'pendente').map(resgate => (
                      <div key={resgate.id} className="p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center bg-[#121212]/80 hover:bg-white/5 rounded-2xl transition-all border border-white/5 hover:border-[#EA1D2C]/30 hover:shadow-[0_0_15px_rgba(0,163,255,0.1)] w-full overflow-hidden">
                        <div className="space-y-2 flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg truncate select-text selection:bg-[#EA1D2C]/30 selection:text-white">{resgate.usuario_nome}</span>
                            <span className="px-2.5 py-1 bg-[#EA1D2C]/20 text-[#FFFFFF] text-xs font-bold rounded-lg border border-[#EA1D2C]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)] whitespace-nowrap">-{resgate.preco_pontos} pts</span>
                          </div>
                          <div className="text-sm font-bold text-gray-300 truncate select-text selection:bg-[#EA1D2C]/30 selection:text-white">{resgate.produto_nome}</div>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto md:flex-col">
                          <button 
                            onClick={() => handleAprovarResgate(resgate)}
                            className="flex-1 md:flex-none px-5 py-3 bg-white/5 text-emerald-400 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar
                          </button>
                          <button 
                            onClick={() => handleRejeitarResgate(resgate)}
                            className="flex-1 md:flex-none px-5 py-3 bg-white/5 text-red-400 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                          >
                            <XCircle className="w-4 h-4" /> Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* GERENCIAMENTO DE CATÁLOGO E MISSÕES */}
            <div className="flex flex-col gap-8">
              {/* GERENCIAR MISSÕES */}
              <section className="bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 flex flex-col shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#EA1D2C]/10 blur-[40px] pointer-events-none"></div>
                <h2 className="text-lg font-black text-white flex items-center gap-2 mb-6 flex-shrink-0 relative z-10">
                  <Cpu className="w-5 h-5 text-[#FFFFFF]" /> Gerenciar Missões
                </h2>
                
                {/* Lista de Missões Existentes */}
                <div className="max-h-[400px] overflow-y-auto pr-2 mb-6 space-y-3 custom-scrollbar">
                  {tarefas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhuma missão cadastrada.</p>
                  ) : (
                    tarefas.map(tarefa => (
                      <div 
                        key={tarefa.id} 
                        draggable
                        onDragStart={(e) => {
                          setDraggedTarefaId(tarefa.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setTimeout(() => {
                            if (e.target instanceof HTMLElement) {
                              e.target.classList.add('opacity-50');
                            }
                          }, 0);
                        }}
                        onDragEnd={(e) => {
                          setDraggedTarefaId(null);
                          if (e.target instanceof HTMLElement) {
                            e.target.classList.remove('opacity-50');
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedTarefaId && draggedTarefaId !== tarefa.id) {
                            handleReorderTarefas(draggedTarefaId, tarefa.id);
                          }
                        }}
                        className={`flex items-center justify-between p-4 bg-[#121212]/80 rounded-2xl border border-white/5 group hover:border-[#EA1D2C]/30 transition-all hover:shadow-[0_0_15px_rgba(0,163,255,0.1)] w-full overflow-hidden ${draggedTarefaId === tarefa.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-[#EA1D2C] transition-colors shrink-0">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          {tarefa.imagem_url ? (
                            <img src={tarefa.imagem_url} alt={tarefa.nome} loading="lazy" className="w-12 h-12 rounded-xl object-cover bg-[#050505] border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#050505] border border-white/10 flex items-center justify-center shrink-0">
                              <Camera className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-sm truncate">{tarefa.nome}</p>
                            <p className="text-xs text-[#FFFFFF] font-bold">{tarefa.pontos} pts</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button 
                            onClick={() => {
                              setEditingTarefa(tarefa);
                              setEditTarefaData({ 
                                nome: tarefa.nome, 
                                descricao: tarefa.descricao || '',
                                regras: tarefa.regras || '',
                                pontos: tarefa.pontos, 
                                imagem_url: tarefa.imagem_url || '' 
                              });
                              setNewTarefaPreview(tarefa.imagem_url || null);
                              setNewTarefaFile(null);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteTarefa(tarefa.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                            title="Excluir"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulário de Criação/Edição */}
                <div className="border-t border-white/10 pt-4 flex-shrink-0">
                  <h3 className="text-sm font-bold text-white mb-3">
                    {editingTarefa ? 'Editar Missão' : 'Nova Missão'}
                  </h3>
                  <form onSubmit={editingTarefa ? handleUpdateTarefa : handleCreateTarefa} className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        value={editingTarefa ? editTarefaData.nome : newTarefa.nome}
                        onChange={e => editingTarefa ? setEditTarefaData({...editTarefaData, nome: e.target.value}) : setNewTarefa({...newTarefa, nome: e.target.value})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Nome da Missão"
                      />
                    </div>
                    <div>
                      <textarea 
                        value={editingTarefa ? editTarefaData.descricao : newTarefa.descricao}
                        onChange={e => editingTarefa ? setEditTarefaData({...editTarefaData, descricao: e.target.value}) : setNewTarefa({...newTarefa, descricao: e.target.value})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600 min-h-[80px] resize-none"
                        placeholder="Descrição da Missão"
                      />
                    </div>
                    <div>
                      <textarea 
                        value={editingTarefa ? editTarefaData.regras : newTarefa.regras}
                        onChange={e => editingTarefa ? setEditTarefaData({...editTarefaData, regras: e.target.value}) : setNewTarefa({...newTarefa, regras: e.target.value})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600 min-h-[80px] resize-none"
                        placeholder="Regras"
                      />
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        value={editingTarefa ? (editTarefaData.pontos || '') : (newTarefa.pontos || '')}
                        onChange={e => editingTarefa ? setEditTarefaData({...editTarefaData, pontos: Number(e.target.value)}) : setNewTarefa({...newTarefa, pontos: Number(e.target.value)})}
                        className="w-1/3 bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Pontos"
                      />
                      <div className="flex-1 flex items-center gap-3">
                        {newTarefaPreview && (
                          newTarefaFile?.type.startsWith('video/') ? (
                            <video src={newTarefaPreview} className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" controls />
                          ) : (
                            <img src={newTarefaPreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                          )
                        )}
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewTarefaFile(file);
                                setNewTarefaPreview(URL.createObjectURL(file));
                                if (editingTarefa) {
                                  setEditTarefaData({...editTarefaData, imagem_url: ''});
                                } else {
                                  setNewTarefa({...newTarefa, imagem_url: ''});
                                }
                              }
                            }}
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#EA1D2C]/10 file:text-[#FFFFFF] hover:file:bg-[#EA1D2C]/20 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 py-3 bg-[#EA1D2C] text-white rounded-xl font-bold hover:bg-[#FFFFFF] hover:text-[#0A0A0A] transition-colors text-sm shadow-[0_0_15px_rgba(0,163,255,0.3)]">
                        {editingTarefa ? 'Salvar' : 'Adicionar'}
                      </button>
                      {editingTarefa && (
                        <button 
                          type="button" 
                          onClick={() => { 
                            setEditingTarefa(null); 
                            setEditTarefaData({nome: '', descricao: '', regras: '', pontos: 0, imagem_url: ''}); 
                            setNewTarefaFile(null);
                            setNewTarefaPreview(null);
                          }}
                          className="px-4 py-3 bg-white/5 text-gray-400 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm border border-white/10"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </section>

              {/* GERENCIAR PRÊMIOS */}
              <section className="bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 flex flex-col shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#EA1D2C]/10 blur-[40px] pointer-events-none"></div>
                <h2 className="text-lg font-black text-white flex items-center gap-2 mb-6 flex-shrink-0 relative z-10">
                  <Gift className="w-5 h-5 text-[#FFFFFF]" /> Gerenciar Prêmios
                </h2>
                
                {/* Lista de Prêmios Existentes */}
                <div className="max-h-[400px] overflow-y-auto pr-2 mb-6 space-y-3 custom-scrollbar">
                  {products.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum prêmio cadastrado.</p>
                  ) : (
                    products.map(produto => (
                      <div 
                        key={produto.id} 
                        draggable
                        onDragStart={(e) => {
                          setDraggedProdutoId(produto.id);
                          e.dataTransfer.effectAllowed = 'move';
                          // Make it slightly transparent while dragging
                          setTimeout(() => {
                            if (e.target instanceof HTMLElement) {
                              e.target.classList.add('opacity-50');
                            }
                          }, 0);
                        }}
                        onDragEnd={(e) => {
                          setDraggedProdutoId(null);
                          if (e.target instanceof HTMLElement) {
                            e.target.classList.remove('opacity-50');
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedProdutoId && draggedProdutoId !== produto.id) {
                            handleReorderProdutos(draggedProdutoId, produto.id);
                          }
                        }}
                        className={`flex items-center justify-between p-4 bg-[#121212]/80 rounded-2xl border border-white/5 group hover:border-[#EA1D2C]/30 transition-all hover:shadow-[0_0_15px_rgba(0,163,255,0.1)] w-full overflow-hidden ${draggedProdutoId === produto.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-[#EA1D2C] transition-colors shrink-0">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <img src={produto.imagem_url} alt={produto.nome} loading="lazy" className="w-12 h-12 rounded-xl object-cover bg-[#050505] border border-white/10 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-sm truncate">{produto.nome}</p>
                            <p className="text-xs text-[#FFFFFF] font-bold">{produto.preco_pontos} pts • {produto.estoque} em estoque</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button 
                            onClick={() => {
                              setEditingProduto(produto);
                              setEditProdutoData({ 
                                nome: produto.nome, 
                                descricao: produto.descricao || '', 
                                regras: produto.regras || '',
                                preco_pontos: produto.preco_pontos, 
                                estoque: produto.estoque, 
                                imagem_url: produto.imagem_url 
                              });
                              setNewProdutoPreview(produto.imagem_url);
                              setNewProdutoFile(null);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteProduto(produto.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                            title="Excluir"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulário de Criação/Edição */}
                <div className="border-t border-white/10 pt-4 flex-shrink-0">
                  <h3 className="text-sm font-bold text-white mb-3">
                    {editingProduto ? 'Editar Prêmio' : 'Novo Prêmio'}
                  </h3>
                  <form onSubmit={editingProduto ? handleUpdateProduto : handleCreateProduto} className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        value={editingProduto ? editProdutoData.nome : newProduto.nome}
                        onChange={e => editingProduto ? setEditProdutoData({...editProdutoData, nome: e.target.value}) : setNewProduto({...newProduto, nome: e.target.value})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Nome do Prêmio"
                      />
                    </div>
                    <div>
                      <textarea 
                        value={editingProduto ? editProdutoData.descricao : newProduto.descricao}
                        onChange={e => editingProduto ? setEditProdutoData({...editProdutoData, descricao: e.target.value}) : setNewProduto({...newProduto, descricao: e.target.value})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600 min-h-[80px] resize-none"
                        placeholder="Descrição do Prêmio"
                      />
                    </div>
                    <div>
                      <textarea 
                        value={editingProduto ? editProdutoData.regras : newProduto.regras}
                        onChange={e => editingProduto ? setEditProdutoData({...editProdutoData, regras: e.target.value}) : setNewProduto({...newProduto, regras: e.target.value})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600 min-h-[80px] resize-none"
                        placeholder="Regras"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="number" 
                        value={editingProduto ? (editProdutoData.preco_pontos || '') : (newProduto.preco_pontos || '')}
                        onChange={e => editingProduto ? setEditProdutoData({...editProdutoData, preco_pontos: Number(e.target.value)}) : setNewProduto({...newProduto, preco_pontos: Number(e.target.value)})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Preço (Pontos)"
                      />
                      <input 
                        type="number" 
                        value={editingProduto ? (editProdutoData.estoque || '') : (newProduto.estoque || '')}
                        onChange={e => editingProduto ? setEditProdutoData({...editProdutoData, estoque: Number(e.target.value)}) : setNewProduto({...newProduto, estoque: Number(e.target.value)})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Estoque"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        {newProdutoPreview && (
                          newProdutoFile?.type.startsWith('video/') ? (
                            <video src={newProdutoPreview} className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" controls />
                          ) : (
                            <img src={newProdutoPreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                          )
                        )}
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewProdutoFile(file);
                                setNewProdutoPreview(URL.createObjectURL(file));
                                if (editingProduto) {
                                  setEditProdutoData({...editProdutoData, imagem_url: ''});
                                } else {
                                  setNewProduto({...newProduto, imagem_url: ''});
                                }
                              }
                            }}
                            className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#F5F5DC] file:text-[#EA1D2C] hover:file:bg-[#E8E8C8] transition-colors cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="mt-2 mb-2 flex items-center gap-2">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">OU URL</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                      </div>
                      <input 
                        type="text" 
                        value={editingProduto ? editProdutoData.imagem_url : newProduto.imagem_url}
                        onChange={e => {
                          if (editingProduto) {
                            setEditProdutoData({...editProdutoData, imagem_url: e.target.value});
                          } else {
                            setNewProduto({...newProduto, imagem_url: e.target.value});
                          }
                          setNewProdutoFile(null);
                          setNewProdutoPreview(null);
                        }}
                        className="w-full bg-[#121212] border border-white/5 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#EA1D2C]/20 focus:bg-[#1A1A1A] transition-colors text-sm"
                        placeholder="URL da Imagem"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 py-3 bg-[#EA1D2C] text-white rounded-xl font-bold hover:bg-[#FFFFFF] hover:text-[#0A0A0A] transition-colors text-sm shadow-[0_0_15px_rgba(0,163,255,0.3)]">
                        {editingProduto ? 'Salvar' : 'Adicionar'}
                      </button>
                      {editingProduto && (
                        <button 
                          type="button" 
                          onClick={() => { 
                            setEditingProduto(null); 
                            setEditProdutoData({nome: '', descricao: '', regras: '', preco_pontos: 0, estoque: 0, imagem_url: ''}); 
                            setNewProdutoPreview(null);
                            setNewProdutoFile(null);
                          }}
                          className="px-4 py-3 bg-white/5 text-gray-400 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm border border-white/10"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </section>
            </div>

            {/* GERENCIAMENTO DE RESGATES */}
            <section className="bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden mt-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-[#EA1D2C]/10 blur-[50px] pointer-events-none"></div>
              <div className="p-6 border-b border-white/10 bg-transparent relative z-10">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#FFFFFF]" /> Histórico de Resgates
                </h2>
              </div>
              
              <div className="p-4 relative z-10">
                {resgates.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium bg-[#121212]/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4">
                    <Ticket className="w-12 h-12 text-[#EA1D2C]/30" />
                    Nenhum resgate realizado ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resgates.map(resgate => (
                      <div key={resgate.id} className={`p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center rounded-2xl transition-all border w-full overflow-hidden ${resgate.usado ? 'bg-[#050505] border-white/5 opacity-75' : 'bg-[#121212]/80 border-white/5 hover:border-[#EA1D2C]/30 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(0,163,255,0.1)]'}`}>
                        <div className="space-y-1 flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg truncate select-text selection:bg-[#EA1D2C]/30 selection:text-white">{resgate.usuario_nome}</span>
                            <span className="text-sm text-gray-500 shrink-0">• {new Date(resgate.data_resgate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="text-sm font-bold text-[#FFFFFF] select-text selection:bg-[#EA1D2C]/30 selection:text-white">{resgate.produto_nome}</div>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                          {resgate.usado ? (
                            <span className="flex-1 md:flex-none px-5 py-3 bg-white/5 text-gray-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-white/5">
                              <CheckCircle2 className="w-4 h-4" /> Usado
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleMarkUsado(resgate.id)}
                              className="flex-1 md:flex-none px-5 py-3 bg-white/5 text-emerald-400 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Marcar como Usado
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* GERENCIAMENTO DE USUÁRIOS (PENALIZAÇÕES) */}
            <section className="bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden mt-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-[#EA1D2C]/10 blur-[50px] pointer-events-none"></div>
              <div className="p-6 border-b border-white/10 bg-transparent relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#FFFFFF]" /> Gerenciar Usuários
                </h2>
                <input 
                  type="text" 
                  placeholder="Buscar usuário..." 
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full sm:w-64 bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#EA1D2C]/50 transition-colors"
                />
              </div>
              
              <div className="p-4 relative z-10">
                <div className="space-y-3">
                  {users
                    .filter(u => u.nome.toLowerCase().includes(debouncedSearchUser.toLowerCase()) || u.email.toLowerCase().includes(debouncedSearchUser.toLowerCase()))
                    .sort((a, b) => (b.pontos || 0) - (a.pontos || 0))
                    .slice(0, debouncedSearchUser ? undefined : (loadOlder ? undefined : 20))
                    .map(user => (
                    <div key={user.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#121212]/80 hover:bg-white/5 rounded-2xl transition-all border border-white/5 hover:border-[#EA1D2C]/30 hover:shadow-[0_0_15px_rgba(0,163,255,0.1)] gap-4 w-full overflow-hidden">
                      <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                        <img src={user.avatar} alt={user.nome} loading="lazy" className="w-10 h-10 rounded-full bg-[#0A0A0A] border border-white/10 object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">{user.nome}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#FFFFFF]">{user.pontos} pts atuais</p>
                          <p className="text-xs text-gray-500">{user.pontos_acumulados} pts total</p>
                        </div>
                        <div className="flex gap-2 ml-auto sm:ml-0 flex-wrap justify-end">
                          <button 
                            onClick={() => handleToggleVisibilidadeRanking(user.id, user.oculto_ranking)}
                            className={`px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10 ${user.oculto_ranking ? 'text-gray-400' : 'text-white'}`}
                            title={user.oculto_ranking ? "Mostrar no Ranking" : "Ocultar do Ranking"}
                          >
                            {user.oculto_ranking ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {user.oculto_ranking ? "Oculto" : "Visível"}
                          </button>
                          <button 
                            onClick={() => handleBonificar(user.id)}
                            className="px-4 py-2 bg-white/5 text-[#FFFFFF] hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                            title="Adicionar pontos"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Bonificar
                          </button>
                          <button 
                            onClick={() => handlePenalizar(user.id)}
                            className="px-4 py-2 bg-white/5 text-orange-400 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                            title="Remover pontos"
                          >
                            <AlertCircle className="w-4 h-4" /> Penalizar
                          </button>
                          <button 
                            onClick={() => handleRemoverUsuario(user.id)}
                            className="px-4 py-2 bg-white/5 text-red-400 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                            title="Excluir usuário"
                          >
                            <XCircle className="w-4 h-4" /> Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="p-8 text-center text-gray-500 font-medium bg-[#0A0A0A] rounded-2xl m-2 border border-white/5">Nenhum usuário encontrado.</div>
                  )}
                  {users.length > 0 && users.filter(u => u.nome.toLowerCase().includes(debouncedSearchUser.toLowerCase()) || u.email.toLowerCase().includes(debouncedSearchUser.toLowerCase())).length === 0 && (
                    <div className="p-8 text-center text-gray-500 font-medium bg-[#0A0A0A] rounded-2xl m-2 border border-white/5">Nenhum usuário corresponde à busca.</div>
                  )}
                  {!loadOlder && !debouncedSearchUser && users.length > 20 && (
                    <div className="flex justify-center mt-4">
                      <button 
                        onClick={() => {
                          setLoadOlder(true);
                          fetchAllData(true, true);
                        }}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10"
                      >
                        Carregar todos os usuários
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* RELATORIOS TAB */}
        {activeTab === 'relatorios' && currentUser?.cargo === 'admin' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-[#EA1D2C]" /> Relatórios e Métricas
              </h1>
              <p className="text-gray-400 mt-2">Acompanhe o engajamento da equipe e o status das missões.</p>
            </div>

            {/* Filters */}
            <div className="bg-[#0A0A0A]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mês</label>
                <select 
                  value={reportMonth} 
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EA1D2C]/50 transition-colors"
                >
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ano</label>
                <select 
                  value={reportYear} 
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EA1D2C]/50 transition-colors"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Usuário</label>
                <select 
                  value={reportUserId} 
                  onChange={(e) => setReportUserId(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EA1D2C]/50 transition-colors"
                >
                  <option value="all">Toda a Equipe</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Missão</label>
                <select 
                  value={reportTarefaId} 
                  onChange={(e) => setReportTarefaId(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EA1D2C]/50 transition-colors"
                >
                  <option value="all">Todas as Missões</option>
                  {tarefas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {isReportLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-[#EA1D2C]/20 border-t-[#EA1D2C] rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#0A0A0A]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <p className="text-sm text-gray-400 font-medium mb-1">Total de Missões</p>
                    <p className="text-3xl font-black text-white">{reportData.length}</p>
                  </div>
                  <div className="bg-[#0A0A0A]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <p className="text-sm text-gray-400 font-medium mb-1">Aprovadas</p>
                    <p className="text-3xl font-black text-emerald-400">{reportData.filter(d => d.status === 'aprovado').length}</p>
                  </div>
                  <div className="bg-[#0A0A0A]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <p className="text-sm text-gray-400 font-medium mb-1">Rejeitadas</p>
                    <p className="text-3xl font-black text-red-400">{reportData.filter(d => d.status === 'rejeitado').length}</p>
                  </div>
                  <div className="bg-[#0A0A0A]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#EA1D2C]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <p className="text-sm text-gray-400 font-medium mb-1">Pontos Distribuídos</p>
                    <p className="text-3xl font-black text-[#FFFFFF]">{formatPoints(reportData.filter(d => d.status === 'aprovado').reduce((acc, curr) => acc + (curr.tipos_tarefas?.pontos || 0), 0))}</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bar Chart */}
                  <div className="lg:col-span-2 bg-[#0A0A0A]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <h3 className="text-lg font-bold text-white mb-6">Missões por Usuário (Top 10)</h3>
                    <div className="h-[300px] w-full">
                      {reportData.length > 0 ? (() => {
                        const userMissionsMap = reportData.reduce((acc, curr) => {
                          const userName = curr.usuarios?.nome || 'Desconhecido';
                          if (!acc[userName]) acc[userName] = 0;
                          acc[userName]++;
                          return acc;
                        }, {} as Record<string, number>);
                        const barChartData = Object.keys(userMissionsMap).map(name => ({ name, missoes: userMissionsMap[name] })).sort((a, b) => b.missoes - a.missoes).slice(0, 10);

                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                              <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip 
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{ backgroundColor: '#121212', borderColor: '#ffffff10', borderRadius: '12px', color: '#fff' }}
                              />
                              <Bar dataKey="missoes" fill="#EA1D2C" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })() : (
                        <div className="h-full flex items-center justify-center text-gray-500">Nenhum dado para exibir.</div>
                      )}
                    </div>
                  </div>

                  {/* Donut Chart */}
                  <div className="bg-[#0A0A0A]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <h3 className="text-lg font-bold text-white mb-6">Status das Missões</h3>
                    <div className="h-[300px] w-full">
                      {reportData.length > 0 ? (() => {
                        const pieChartData = [
                          { name: 'Aprovadas', value: reportData.filter(d => d.status === 'aprovado').length, color: '#10B981' },
                          { name: 'Pendentes', value: reportData.filter(d => d.status === 'pendente').length, color: '#EA1D2C' },
                          { name: 'Rejeitadas', value: reportData.filter(d => d.status === 'rejeitado').length, color: '#EF4444' },
                        ].filter(d => d.value > 0);

                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#121212', borderColor: '#ffffff10', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        );
                      })() : (
                        <div className="h-full flex items-center justify-center text-gray-500">Nenhum dado para exibir.</div>
                      )}
                    </div>
                    {/* Custom Legend */}
                    {reportData.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                          <span className="text-xs text-gray-400">Aprovadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#EA1D2C]"></div>
                          <span className="text-xs text-gray-400">Pendentes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
                          <span className="text-xs text-gray-400">Rejeitadas</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="md:hidden fixed bottom-0 w-full bg-[#121212] border-t border-white/5 pb-safe z-50">
          <div className="flex justify-around items-center h-16 px-2">
            <MobileNavButton active={activeTab === 'recompensas'} onClick={() => setActiveTab('recompensas')} icon={<Gift />} text="Prêmios" />
            <MobileNavButton active={activeTab === 'enviar'} onClick={() => setActiveTab('enviar')} icon={<Camera />} text="Missões" />
            <MobileNavButton active={activeTab === 'placar'} onClick={() => setActiveTab('placar')} icon={<Trophy />} text="Ranking" />
            {currentUser?.cargo === 'admin' && (
              <>
                <MobileNavButton active={activeTab === 'mural'} onClick={() => setActiveTab('mural')} icon={<Star />} text="Mural" />
                <MobileNavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Shield />} text="Admin" />
                <MobileNavButton active={activeTab === 'relatorios'} onClick={() => setActiveTab('relatorios')} icon={<BarChart3 />} text="Relatórios" />
              </>
            )}
          </div>
        </nav>

      </div>
      
      {/* Rankings Modal */}
      {/* Confirm Resgate Modal */}
      {confirmResgate && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setConfirmResgate(null)}
        >
          <div 
            className="w-full max-w-sm bg-[#121212] rounded-[32px] border border-white/10 p-6 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-[#EA1D2C]/10 rounded-full flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-[#EA1D2C]/20 rounded-full blur-xl"></div>
              <Gift className="w-10 h-10 text-[#EA1D2C] relative z-10" />
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Confirmar Resgate</h3>
            
            <p className="text-gray-400 mb-6">
              Deseja realmente resgatar <strong className="text-white">{confirmResgate.nome}</strong> por <strong className="text-[#FFFFFF]">{formatPoints(confirmResgate.preco_pontos)} pts</strong>?
            </p>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setConfirmResgate(null)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleResgate(confirmResgate);
                  setConfirmResgate(null);
                }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-[#EA1D2C] text-white hover:bg-[#C81824] shadow-md shadow-[#EA1D2C]/20 transition-all active:scale-[0.98]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rankings Modal */}
      {showRankingsModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowRankingsModal(false)}
        >
          <div 
            className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#EA1D2C]/20 to-transparent pointer-events-none"></div>
            
            <div className="p-6 relative z-10 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#FFFFFF]" />
                Níveis do Ranking
              </h2>
              <button 
                onClick={() => setShowRankingsModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 relative z-10">
              {[
                { name: 'Iniciante', min: 0, max: 999, icon: '🌱', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' },
                { name: 'Bronze', min: 1000, max: 4999, icon: '🥉', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
                { name: 'Prata', min: 5000, max: 9999, icon: '🥈', color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/20' },
                { name: 'Ouro', min: 10000, max: 49999, icon: '🏆', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
                { name: 'Diamante', min: 50000, max: '∞', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' }
              ].map((tier, index) => {
                const isCurrent = currentUser?.pontos_acumulados >= tier.min && (tier.max === '∞' || currentUser?.pontos_acumulados <= tier.max);
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isCurrent 
                        ? `${tier.bg} ${tier.border} shadow-[0_0_15px_rgba(0,163,255,0.1)]` 
                        : 'bg-[#121212] border-white/5 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-black/50 border ${tier.border}`}>
                        {tier.icon}
                      </div>
                      <div>
                        <h3 className={`font-bold ${isCurrent ? tier.color : 'text-gray-300'}`}>
                          {tier.name}
                          {isCurrent && <span className="ml-2 text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Você</span>}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {tier.min} {tier.max !== '∞' ? `- ${tier.max}` : '+'} pontos
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-10"
          >
            <XCircle className="w-8 h-8" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Fullscreen" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
}

// Helper components for Navigation
function SidebarNavButton({ active, onClick, icon, text }: { active: boolean, onClick: () => void, icon: React.ReactNode, text: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
        active 
          ? 'bg-[#EA1D2C] text-white' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-gray-400'}`}>
        {icon}
      </div>
      {text}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, text }: { active: boolean, onClick: () => void, icon: React.ReactNode, text: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 active:scale-90 relative ${
        active ? 'text-[#FFFFFF]' : 'text-gray-500 hover:text-gray-200'
      }`}
    >
      <div className={`transition-all duration-300 [&>svg]:w-[22px] [&>svg]:h-[22px] ${active ? '[&>svg]:fill-[#FFFFFF]/20 -translate-y-1' : 'hover:-translate-y-0.5'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold transition-all duration-300 ${active ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>{text}</span>
      {active && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FFFFFF] rounded-full shadow-[0_0_8px_#FFFFFF]" />
      )}
    </button>
  );
}
