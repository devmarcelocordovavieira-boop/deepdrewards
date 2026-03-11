/// <reference types="vite/client" />
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { 
  Trophy, Gift, Camera, Shield, LogIn, LogOut, 
  Star, ChevronRight, CheckCircle2, XCircle, AlertCircle,
  Cpu, Crown, Medal, Ticket, ArrowRight, Heart, ArrowLeft, GripVertical, Lock
} from 'lucide-react';

// --- SUPABASE CLIENT ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState<'placar' | 'enviar' | 'recompensas' | 'admin'>('recompensas');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [submissoes, setSubmissoes] = useState<any[]>([]);
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [selectedTarefa, setSelectedTarefa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resgates, setResgates] = useState<any[]>([]);
  const [editingTarefa, setEditingTarefa] = useState<any | null>(null);
  const [editTarefaData, setEditTarefaData] = useState({ nome: '', pontos: 0 });
  const [editingProduto, setEditingProduto] = useState<any | null>(null);
  const [editProdutoData, setEditProdutoData] = useState({ nome: '', descricao: '', preco_pontos: 0, estoque: 0, imagem_url: '' });
  const [draggedProdutoId, setDraggedProdutoId] = useState<string | null>(null);

  // Admin forms state
  const [newTarefa, setNewTarefa] = useState({ nome: '', pontos: 0 });
  const [newProduto, setNewProduto] = useState({ nome: '', descricao: '', preco_pontos: 0, estoque: 0, imagem_url: '' });
  const [newProdutoFile, setNewProdutoFile] = useState<File | null>(null);
  const [newProdutoPreview, setNewProdutoPreview] = useState<string | null>(null);

  // Auth forms state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const showNotification = (msg: string, type: 'success'|'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteCode(invite);
      setAuthMode('register');
    }

    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      const { data, error } = await supabase.from('usuarios').select('*').eq('id', userId).single();
      if (error) throw error;
      setCurrentUser({
        ...data,
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nome}`
      });
      fetchAllData();
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    // Fetch users (Ranking based on pontos_acumulados)
    const { data: usersData } = await supabase.from('usuarios').select('*').order('pontos_acumulados', { ascending: false });
    if (usersData) {
      setUsers(usersData.map(u => ({ ...u, avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.nome}` })));
    }

    // Fetch products
    const { data: productsData } = await supabase.from('produtos').select('*').eq('ativo', true).order('ordem', { ascending: true }).order('created_at', { ascending: false });
    if (productsData) setProducts(productsData);

    // Fetch tasks
    const { data: tarefasData } = await supabase.from('tipos_tarefas').select('*').eq('ativo', true);
    if (tarefasData) setTarefas(tarefasData);

    // Fetch submissions
    const { data: subData } = await supabase
      .from('submissoes')
      .select('*, usuarios(nome), tipos_tarefas(nome, pontos)')
      .order('data_envio', { ascending: false });
      
    if (subData) {
      const mapped = subData.map((s: any) => ({
        id: s.id,
        usuario_id: s.usuario_id,
        usuario_nome: s.usuarios?.nome || 'Desconhecido',
        tarefa_id: s.tarefa_id,
        tarefa_nome: s.tipos_tarefas?.nome || 'Tarefa',
        pontos: s.tipos_tarefas?.pontos || 0,
        descricao: s.descricao,
        url_prova: s.url_prova,
        status: s.status
      }));
      setSubmissoes(mapped);
    }

    // Fetch resgates
    const { data: resgatesData } = await supabase
      .from('resgates')
      .select('*, usuarios(nome), produtos(nome)')
      .order('data_resgate', { ascending: false });
    if (resgatesData) {
      const mappedResgates = resgatesData.map((r: any) => ({
        id: r.id,
        usuario_id: r.usuario_id,
        usuario_nome: r.usuarios?.nome || 'Desconhecido',
        produto_id: r.produto_id,
        produto_nome: r.produtos?.nome || 'Produto',
        data_resgate: r.data_resgate,
        usado: r.usado
      }));
      setResgates(mappedResgates);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
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
        colors: ['#00F0FF', '#00A3FF', '#FFFFFF']
      });
      
      showNotification(`Eba! ${produto.nome} resgatado com sucesso!`, 'success');
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

      const { error: insertError } = await supabase.from('submissoes').insert([{
        usuario_id: currentUser.id,
        tarefa_id: selectedTarefa,
        descricao,
        url_prova: finalUrl
      }]);
      if (insertError) throw insertError;

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
    try {
      const { error } = await supabase.from('submissoes').update({ status: 'rejeitado' }).eq('id', submissao.id);
      if (error) throw error;
      showNotification('Missão rejeitada.', 'error');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  };

  const handleCreateTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarefa.nome || newTarefa.pontos <= 0) return showNotification('Preencha nome e pontos válidos.', 'error');
    
    try {
      const { error } = await supabase.from('tipos_tarefas').insert([{
        nome: newTarefa.nome,
        pontos: newTarefa.pontos
      }]);
      if (error) throw error;
      
      setNewTarefa({ nome: '', pontos: 0 });
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
        preco_pontos: newProduto.preco_pontos,
        estoque: newProduto.estoque,
        imagem_url: finalImageUrl,
        ordem: products.length
      }]);
      if (error) throw error;

      setNewProduto({ nome: '', descricao: '', preco_pontos: 0, estoque: 0, imagem_url: '' });
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
      const { error } = await supabase.from('tipos_tarefas').update({
        nome: editTarefaData.nome,
        pontos: editTarefaData.pontos
      }).eq('id', editingTarefa.id);
      if (error) throw error;
      
      setEditingTarefa(null);
      setEditTarefaData({ nome: '', pontos: 0 });
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
        preco_pontos: editProdutoData.preco_pontos,
        estoque: editProdutoData.estoque,
        imagem_url: finalImageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2000&auto=format&fit=crop'
      }).eq('id', editingProduto.id);
      
      if (error) throw error;
      
      setEditingProduto(null);
      setEditProdutoData({ nome: '', descricao: '', preco_pontos: 0, estoque: 0, imagem_url: '' });
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

      showNotification(`Usuário penalizado em ${pontos} pontos.`, 'success');
      fetchAllData();
    } catch (error: any) {
      showNotification(`Erro ao penalizar: ${error.message}`, 'error');
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}?invite=deeprewards2024`;
    navigator.clipboard.writeText(link);
    showNotification('Link de convite copiado!', 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A3FF]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex bg-[#0A0A0A] text-white font-sans">
        
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 bg-[#0A0A0A]">
          
          {/* NOTIFICATION */}
          {notification && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border ${
                notification.type === 'success' ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]' : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{notification.msg}</p>
              </div>
            </div>
          )}

          <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-16 h-16 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} />
                <Cpu className="w-8 h-8 text-[#00A3FF] hidden" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                Deep Rewards
              </h1>
            </div>

            <div className="mb-10">
              <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                {authMode === 'login' ? 'Bem-vindo de volta' : 'Junte-se ao time'}
              </h2>
              <p className="text-gray-400 font-medium text-lg">
                {authMode === 'login' ? 'Faça login para acessar suas missões e resgatar prêmios.' : 'Crie sua conta e comece a ser reconhecido pelo seu trabalho.'}
              </p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-5">
              {authMode === 'register' && !inviteCode ? (
                <div className="p-6 bg-red-500/10 text-red-400 rounded-2xl font-bold border border-red-500/20 flex items-start gap-3">
                  <Shield className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <p>O cadastro é restrito. Você precisa de um link de convite oficial da sua empresa para criar uma conta.</p>
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
                        className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/20 focus:border-[#00A3FF] transition-all placeholder-gray-500"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/20 focus:border-[#00A3FF] transition-all placeholder-gray-500"
                      placeholder="voce@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Senha</label>
                    <input 
                      type="password" 
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/20 focus:border-[#00A3FF] transition-all placeholder-gray-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 mt-4 bg-[#00A3FF] text-white rounded-2xl font-bold text-lg hover:bg-[#0077CC] transition-all shadow-lg shadow-[#00A3FF]/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
                  >
                    {authMode === 'login' ? 'Entrar na Plataforma' : 'Criar Minha Conta'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}

              <div className="mt-8 pt-6 border-t border-white/10">
                {authMode === 'login' && !inviteCode ? null : (
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthName('');
                    }}
                    className="text-sm font-bold text-gray-400 hover:text-[#00A3FF] transition-colors flex items-center gap-2"
                  >
                    {authMode === 'login' ? 'Possui um convite? Cadastre-se' : 'Já tem uma conta? Faça login'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Image/Gamification Vibe */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00A3FF]/90 to-[#005580]/90 mix-blend-multiply z-10"></div>
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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans flex relative">
      {/* Subtle background texture */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00F0FF 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      
      {/* SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#121212] border-r border-white/5 z-40 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 mb-6">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} />
            <Cpu className="w-6 h-6 text-[#00A3FF] hidden" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            Deep Rewards
          </h1>
        </div>

        <div className="px-4 mb-8">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="relative group cursor-pointer flex-shrink-0">
              <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full bg-black/50 border border-white/20 object-cover" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-gray-400 font-medium">Olá,</p>
              <p className="text-sm font-bold text-white truncate">{currentUser.nome}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarNavButton active={activeTab === 'recompensas'} onClick={() => setActiveTab('recompensas')} icon={<Gift className="w-5 h-5" />} text="Prêmios" />
          <SidebarNavButton active={activeTab === 'enviar'} onClick={() => setActiveTab('enviar')} icon={<Camera className="w-5 h-5" />} text="Missões" />
          <SidebarNavButton active={activeTab === 'placar'} onClick={() => setActiveTab('placar')} icon={<Trophy className="w-5 h-5" />} text="Ranking" />
          {currentUser?.cargo === 'admin' && (
            <SidebarNavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Shield className="w-5 h-5" />} text="Admin" />
          )}
        </nav>

        <div className="p-4 mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-bold text-sm">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden bg-[#121212] border-b border-white/5 sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} />
              <Cpu className="w-5 h-5 text-[#00A3FF] hidden" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">
              Deep Rewards
            </h1>
          </div>
          <div className="relative group cursor-pointer">
            <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-black/50 border border-white/20 object-cover" />
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
        </header>

        {/* NOTIFICATION */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 w-[90%] md:w-auto max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md ${
              notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{notification.msg}</p>
            </div>
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
            
            {/* RECOMPENSAS TAB (LOJA) */}
            {activeTab === 'recompensas' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Hero Banner Section */}
            <div className="bg-gradient-to-r from-[#00A3FF] to-[#005580] rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
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
                  <Star className="w-6 h-6 text-[#00F0FF] fill-[#00F0FF]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Seu Saldo</p>
                  <p className="text-2xl font-black">{currentUser?.pontos || 0}</p>
                </div>
              </div>
            </div>

            {(() => {
              const availableProducts = products.filter(p => currentUser && currentUser.pontos >= p.preco_pontos && p.estoque > 0);
              const lockedProducts = products.filter(p => !currentUser || currentUser.pontos < p.preco_pontos || p.estoque <= 0);

              return (
                <div className="space-y-12">
                  {/* AVAILABLE PRODUCTS */}
                  {availableProducts.length > 0 && (
                    <div>
                      <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[#00A3FF]" /> Resgate Agora
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableProducts.map(produto => (
                          <div key={produto.id} className="bg-[#121212] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-[#00A3FF]/30 hover:border-[#00A3FF]">
                            <div className="aspect-[4/3] w-full bg-[#0A0A0A] relative overflow-hidden">
                              <img 
                                src={produto.imagem_url} 
                                alt={produto.nome}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-[#00F0FF]/30">
                                <Star className="w-3.5 h-3.5 text-[#00F0FF] fill-[#00F0FF]" />
                                <span className="font-bold text-sm text-[#00F0FF]">{produto.preco_pontos}</span>
                              </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                              <h3 className="text-lg font-bold text-white leading-tight mb-1">{produto.nome}</h3>
                              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{produto.descricao}</p>
                              
                              <div className="flex items-center gap-2 mb-6">
                                <span className="text-xs font-bold px-2.5 py-1 bg-white/5 text-gray-400 rounded-md border border-white/5">
                                  {produto.estoque} {produto.estoque === 1 ? 'disponível' : 'disponíveis'}
                                </span>
                              </div>
                              
                              <div className="mt-auto">
                                <button 
                                  onClick={() => handleResgate(produto)}
                                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-[#00A3FF] text-white hover:bg-[#0077CC] shadow-md shadow-[#00A3FF]/20 active:scale-[0.98]"
                                >
                                  Resgatar Prêmio
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
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

                          return (
                            <div key={produto.id} className={`bg-[#121212] rounded-3xl overflow-hidden shadow-sm transition-all duration-300 flex flex-col border border-white/5 ${isOutOfStock ? 'opacity-70' : ''}`}>
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
                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/10">
                                  <Star className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="font-bold text-sm text-gray-300">{produto.preco_pontos}</span>
                                </div>
                              </div>
                              <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-lg font-bold text-gray-300 leading-tight mb-1">{produto.nome}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{produto.descricao}</p>
                                
                                {!isOutOfStock && (
                                  <div className="mb-6 space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                      <span className="text-gray-400">Progresso</span>
                                      <span className="text-[#00F0FF]">Faltam {pointsNeeded} pts</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                      <div className="bg-[#00A3FF] h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
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
                </div>
              );
            })()}

            {/* MEUS RESGATES */}
            {currentUser && resgates.filter(r => r.usuario_id === currentUser.id).length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-[#00A3FF]" /> Meus Prêmios Resgatados
                </h2>
                <div className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {resgates.filter(r => r.usuario_id === currentUser.id).map(resgate => (
                      <div key={resgate.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 transition-colors">
                        <div>
                          <p className="font-bold text-white text-lg">{resgate.produto_nome}</p>
                          <p className="text-sm text-gray-400">Resgatado em {new Date(resgate.data_resgate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          {resgate.usado ? (
                            <span className="px-4 py-2 bg-white/5 text-gray-500 rounded-xl text-sm font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Já Utilizado
                            </span>
                          ) : (
                            <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-500/20">
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
                  {tarefas.filter(t => t.ativo !== false).map(tarefa => (
                    <div 
                      key={tarefa.id} 
                      onClick={() => setSelectedTarefa(tarefa.id)}
                      className="bg-[#121212] p-5 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#00A3FF]/50 hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#00A3FF]/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-[#00A3FF]/30">
                          <Cpu className="w-7 h-7 text-[#00F0FF]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{tarefa.nome}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-[#00F0FF] fill-[#00F0FF]" />
                            <span className="text-sm font-bold text-[#00F0FF]">+{tarefa.pontos} pts</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-[#00F0FF] transition-colors" />
                    </div>
                  ))}
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
                    <p className="text-sm text-[#00F0FF] font-bold">Valendo {tarefas.find(t => t.id === selectedTarefa)?.pontos} pts</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">Conta mais detalhes</label>
                    <textarea 
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      rows={3}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/50 focus:border-transparent transition-colors resize-none placeholder-gray-600"
                      placeholder="Ex: Pedi um lanche ontem a noite..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white mb-3">Envie a foto ou vídeo da prova</label>
                    <div className="relative border-2 border-dashed border-white/20 rounded-3xl bg-[#0A0A0A] p-8 text-center cursor-pointer hover:bg-white/5 hover:border-[#00A3FF]/50 transition-colors min-h-[200px] flex flex-col items-center justify-center overflow-hidden group">
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
                            <Camera className="w-7 h-7 text-[#00F0FF]" />
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
                        : 'bg-[#00A3FF] text-white hover:bg-[#0077CC] shadow-lg shadow-[#00A3FF]/20 active:scale-[0.98]'
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
              const sortedUsers = [...users].sort((a, b) => (b.pontos_acumulados || b.pontos || 0) - (a.pontos_acumulados || a.pontos || 0));
              const top3 = sortedUsers.slice(0, 3);
              const rest = sortedUsers.slice(3);
              const currentUserRank = sortedUsers.findIndex(u => u.id === currentUser?.id) + 1;

              return (
                <>
                  {/* PODIUM */}
                  {top3.length > 0 && (
                    <div className="flex justify-center items-end gap-2 sm:gap-6 mb-12 mt-12 px-2">
                      {/* 2nd Place */}
                      {top3[1] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500 delay-100">
                          <div className="relative mb-3">
                            <img src={top3[1].avatar} alt={top3[1].nome} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#7DD3FC] object-cover bg-[#0A0A0A]" />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#7DD3FC] text-black w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-[#121212]">2</div>
                          </div>
                          <span className="font-bold text-white text-sm sm:text-base truncate max-w-[80px] sm:max-w-[100px] text-center">{top3[1].nome}</span>
                          <span className="text-xs font-bold text-[#00F0FF] mt-1">{top3[1].pontos_acumulados || top3[1].pontos || 0} pts</span>
                          <div className="w-16 sm:w-24 h-24 sm:h-32 bg-gradient-to-t from-[#7DD3FC]/20 to-transparent mt-3 rounded-t-lg border-t border-[#7DD3FC]/30"></div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {top3[0] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-500 z-10">
                          <Crown className="w-8 h-8 text-[#00F0FF] fill-[#00F0FF] drop-shadow-lg mb-2 animate-bounce" />
                          <div className="relative mb-3">
                            <img src={top3[0].avatar} alt={top3[0].nome} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#00F0FF] object-cover bg-[#0A0A0A] shadow-[0_0_30px_rgba(251,191,36,0.3)]" />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#00F0FF] text-black w-7 h-7 rounded-full flex items-center justify-center font-black text-sm border-2 border-[#121212]">1</div>
                          </div>
                          <span className="font-black text-white text-base sm:text-lg truncate max-w-[90px] sm:max-w-[120px] text-center">{top3[0].nome}</span>
                          <span className="text-sm font-black text-[#00F0FF] mt-1">{top3[0].pontos_acumulados || top3[0].pontos || 0} pts</span>
                          <div className="w-20 sm:w-28 h-32 sm:h-40 bg-gradient-to-t from-[#00F0FF]/20 to-transparent mt-3 rounded-t-lg border-t border-[#00F0FF]/30"></div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {top3[2] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 delay-200">
                          <div className="relative mb-3">
                            <img src={top3[2].avatar} alt={top3[2].nome} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#0284C7] object-cover bg-[#0A0A0A]" />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#0284C7] text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-[#121212]">3</div>
                          </div>
                          <span className="font-bold text-white text-sm truncate max-w-[70px] sm:max-w-[90px] text-center">{top3[2].nome}</span>
                          <span className="text-xs font-bold text-[#00F0FF] mt-1">{top3[2].pontos_acumulados || top3[2].pontos || 0} pts</span>
                          <div className="w-14 sm:w-20 h-16 sm:h-20 bg-gradient-to-t from-[#0284C7]/20 to-transparent mt-3 rounded-t-lg border-t border-[#0284C7]/30"></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* REST OF THE LIST */}
                  <div className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 overflow-hidden p-2">
                    <div className="divide-y divide-white/5">
                      {rest.map((user, index) => (
                        <div key={user.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentUser?.id === user.id ? 'bg-[#00A3FF]/10 border border-[#00A3FF]/20' : 'hover:bg-white/5'}`}>
                          <div className="w-8 flex justify-center">
                            <span className="font-bold text-gray-500 text-base">{index + 4}º</span>
                          </div>
                          
                          <img src={user.avatar} alt={user.nome} className="w-10 h-10 rounded-full bg-[#0A0A0A] border border-white/10 object-cover" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-base truncate">{user.nome}</span>
                              {user.cargo === 'admin' && (
                                <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-[10px] font-bold rounded-md uppercase tracking-wider shrink-0 border border-white/10">Admin</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right flex items-center gap-1.5 bg-[#0A0A0A] px-3 py-1.5 rounded-full border border-white/10">
                            <Star className="w-3.5 h-3.5 text-[#00F0FF] fill-[#00F0FF]" />
                            <span className="font-black text-white text-sm">{user.pontos_acumulados || user.pontos || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CURRENT USER STICKY BAR (if not in top 3 and not visible in the list easily) */}
                  {currentUser && currentUserRank > 3 && (
                    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-auto md:w-full md:max-w-2xl mx-auto bg-[#1A1A1A] border border-[#00A3FF]/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-2xl p-4 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-8">
                      <div className="w-8 flex justify-center">
                        <span className="font-black text-[#00F0FF] text-lg">{currentUserRank}º</span>
                      </div>
                      <img src={currentUser.avatar} alt={currentUser.nome} className="w-10 h-10 rounded-full border border-[#00A3FF]/50 object-cover" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-white text-base truncate">Você</span>
                      </div>
                      <div className="text-right flex items-center gap-1.5 bg-[#00A3FF]/20 px-3 py-1.5 rounded-full border border-[#00A3FF]/30">
                        <Star className="w-3.5 h-3.5 text-[#00F0FF] fill-[#00F0FF]" />
                        <span className="font-black text-[#00F0FF] text-sm">{currentUser.pontos_acumulados || currentUser.pontos || 0}</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && currentUser?.cargo === 'admin' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Painel de administração</h1>
                <p className="text-gray-400 mt-2 font-medium">Aprove missões e gerencie o catálogo.</p>
              </div>
              <button 
                onClick={copyInviteLink}
                className="px-5 py-3 bg-[#00A3FF] text-white rounded-xl font-bold hover:bg-[#0077CC] transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                Copiar Link de Convite
              </button>
            </div>

            {/* FILA DE APROVAÇÃO */}
            <section className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 overflow-hidden mb-8">
              <div className="p-6 border-b border-white/5 bg-[#121212]">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#00A3FF]" /> Fila de Avaliação
                </h2>
              </div>
              
              <div className="p-2">
                {submissoes.filter(s => s.status === 'pendente').length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium bg-[#0A0A0A] rounded-2xl m-2 border border-white/5">Nenhuma missão pendente. Tudo limpo! ✨</div>
                ) : (
                  <div className="space-y-2">
                    {submissoes.filter(s => s.status === 'pendente').map(sub => (
                      <div key={sub.id} className="p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center bg-[#121212] hover:bg-white/5 rounded-2xl transition-colors border border-transparent hover:border-white/10">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">{sub.usuario_nome}</span>
                            <span className="px-2.5 py-1 bg-[#00A3FF]/20 text-[#00F0FF] text-xs font-bold rounded-lg border border-[#00A3FF]/30">+{sub.pontos} pts</span>
                          </div>
                          <div className="text-sm font-bold text-gray-300">{sub.tarefa_nome}</div>
                          <p className="text-sm text-gray-400 bg-[#0A0A0A] p-3 rounded-xl border border-white/5">{sub.descricao}</p>
                        </div>
                        
                        <div className="w-full md:w-36 h-36 bg-[#0A0A0A] rounded-2xl border border-white/10 relative flex-shrink-0 group overflow-hidden">
                          {sub.url_prova.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) ? (
                            <video src={sub.url_prova} className="w-full h-full object-cover" controls />
                          ) : (
                            <img src={sub.url_prova} alt="Evidência" className="w-full h-full object-cover" />
                          )}
                          <a href={sub.url_prova} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm">
                            Ampliar
                          </a>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto md:flex-col">
                          <button 
                            onClick={() => handleAprovar(sub)}
                            className="flex-1 md:flex-none px-5 py-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar
                          </button>
                          <button 
                            onClick={() => handleRejeitar(sub)}
                            className="flex-1 md:flex-none px-5 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-red-500/20"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* GERENCIAR MISSÕES */}
              <section className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 p-6 flex flex-col h-[600px]">
                <h2 className="text-lg font-black text-white flex items-center gap-2 mb-6 flex-shrink-0">
                  <Cpu className="w-5 h-5 text-[#00A3FF]" /> Gerenciar Missões
                </h2>
                
                {/* Lista de Missões Existentes */}
                <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-3 custom-scrollbar">
                  {tarefas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhuma missão cadastrada.</p>
                  ) : (
                    tarefas.map(tarefa => (
                      <div key={tarefa.id} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-xl border border-white/5">
                        <div>
                          <p className="font-bold text-white text-sm">{tarefa.nome}</p>
                          <p className="text-xs text-[#00F0FF] font-bold">{tarefa.pontos} pts</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingTarefa(tarefa);
                              setEditTarefaData({ nome: tarefa.nome, pontos: tarefa.pontos });
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
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
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Nome da Missão"
                      />
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        value={editingTarefa ? (editTarefaData.pontos || '') : (newTarefa.pontos || '')}
                        onChange={e => editingTarefa ? setEditTarefaData({...editTarefaData, pontos: Number(e.target.value)}) : setNewTarefa({...newTarefa, pontos: Number(e.target.value)})}
                        className="w-1/3 bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Pontos"
                      />
                      <button type="submit" className="flex-1 py-3 bg-[#00A3FF] text-white rounded-xl font-bold hover:bg-[#0077CC] transition-colors text-sm shadow-md shadow-[#00A3FF]/20">
                        {editingTarefa ? 'Salvar' : 'Adicionar'}
                      </button>
                      {editingTarefa && (
                        <button 
                          type="button" 
                          onClick={() => { setEditingTarefa(null); setEditTarefaData({nome: '', pontos: 0}); }}
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
              <section className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 p-6 flex flex-col h-[600px]">
                <h2 className="text-lg font-black text-white flex items-center gap-2 mb-6 flex-shrink-0">
                  <Gift className="w-5 h-5 text-[#00A3FF]" /> Gerenciar Prêmios
                </h2>
                
                {/* Lista de Prêmios Existentes */}
                <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-3 custom-scrollbar">
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
                        className={`flex items-center justify-between p-3 bg-[#0A0A0A] rounded-xl border border-white/5 transition-all ${draggedProdutoId === produto.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-300">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <img src={produto.imagem_url} alt={produto.nome} className="w-10 h-10 rounded-lg object-cover bg-[#121212] border border-white/10" />
                          <div>
                            <p className="font-bold text-white text-sm">{produto.nome}</p>
                            <p className="text-xs text-[#00F0FF] font-bold">{produto.preco_pontos} pts • {produto.estoque} em estoque</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduto(produto);
                              setEditProdutoData({ 
                                nome: produto.nome, 
                                descricao: produto.descricao || '', 
                                preco_pontos: produto.preco_pontos, 
                                estoque: produto.estoque, 
                                imagem_url: produto.imagem_url 
                              });
                              setNewProdutoPreview(produto.imagem_url);
                              setNewProdutoFile(null);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
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
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Nome do Prêmio"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="number" 
                        value={editingProduto ? (editProdutoData.preco_pontos || '') : (newProduto.preco_pontos || '')}
                        onChange={e => editingProduto ? setEditProdutoData({...editProdutoData, preco_pontos: Number(e.target.value)}) : setNewProduto({...newProduto, preco_pontos: Number(e.target.value)})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
                        placeholder="Preço (Pontos)"
                      />
                      <input 
                        type="number" 
                        value={editingProduto ? (editProdutoData.estoque || '') : (newProduto.estoque || '')}
                        onChange={e => editingProduto ? setEditProdutoData({...editProdutoData, estoque: Number(e.target.value)}) : setNewProduto({...newProduto, estoque: Number(e.target.value)})}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/50 focus:border-transparent transition-colors text-sm placeholder-gray-600"
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
                            className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#F5F5DC] file:text-[#00A3FF] hover:file:bg-[#E8E8C8] transition-colors cursor-pointer"
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
                        className="w-full bg-[#121212] border border-white/5 rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#00A3FF]/20 focus:bg-[#1A1A1A] transition-colors text-sm"
                        placeholder="URL da Imagem"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors text-sm">
                        {editingProduto ? 'Salvar' : 'Adicionar'}
                      </button>
                      {editingProduto && (
                        <button 
                          type="button" 
                          onClick={() => { 
                            setEditingProduto(null); 
                            setEditProdutoData({nome: '', descricao: '', preco_pontos: 0, estoque: 0, imagem_url: ''}); 
                            setNewProdutoPreview(null);
                            setNewProdutoFile(null);
                          }}
                          className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm"
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
            <section className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 overflow-hidden mt-8">
              <div className="p-6 border-b border-white/5 bg-[#121212]">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#00A3FF]" /> Histórico de Resgates
                </h2>
              </div>
              
              <div className="p-2">
                {resgates.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium bg-[#0A0A0A] rounded-2xl m-2 border border-white/5">Nenhum resgate realizado ainda.</div>
                ) : (
                  <div className="space-y-2">
                    {resgates.map(resgate => (
                      <div key={resgate.id} className={`p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center rounded-2xl transition-colors border ${resgate.usado ? 'bg-[#0A0A0A] border-white/5 opacity-75' : 'bg-[#121212] border-transparent hover:border-white/10 hover:bg-white/5'}`}>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">{resgate.usuario_nome}</span>
                            <span className="text-sm text-gray-500">• {new Date(resgate.data_resgate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="text-sm font-bold text-[#00F0FF]">{resgate.produto_nome}</div>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                          {resgate.usado ? (
                            <span className="flex-1 md:flex-none px-5 py-3 bg-white/5 text-gray-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-white/5">
                              <CheckCircle2 className="w-4 h-4" /> Usado
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleMarkUsado(resgate.id)}
                              className="flex-1 md:flex-none px-5 py-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
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
            <section className="bg-[#121212] rounded-[2rem] shadow-sm border border-white/5 overflow-hidden mt-8">
              <div className="p-6 border-b border-white/5 bg-[#121212]">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#00A3FF]" /> Gerenciar Usuários
                </h2>
              </div>
              
              <div className="p-2">
                <div className="space-y-2">
                  {users.filter(u => u.cargo !== 'admin').map(user => (
                    <div key={user.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#121212] hover:bg-white/5 rounded-2xl transition-colors border border-transparent hover:border-white/10 gap-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.nome} className="w-10 h-10 rounded-full bg-[#0A0A0A] border border-white/10 object-cover" />
                        <div>
                          <p className="font-bold text-white">{user.nome}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#00F0FF]">{user.pontos} pts atuais</p>
                          <p className="text-xs text-gray-500">{user.pontos_acumulados} pts total</p>
                        </div>
                        <button 
                          onClick={() => handlePenalizar(user.id)}
                          className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-red-500/20 ml-auto sm:ml-0"
                        >
                          <AlertCircle className="w-4 h-4" /> Penalizar
                        </button>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.cargo !== 'admin').length === 0 && (
                    <div className="p-8 text-center text-gray-500 font-medium bg-[#0A0A0A] rounded-2xl m-2 border border-white/5">Nenhum usuário comum encontrado.</div>
                  )}
                </div>
              </div>
            </section>
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
              <MobileNavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Shield />} text="Admin" />
            )}
          </div>
        </nav>

      </div>
    </div>
  );
}

// Helper components for Navigation
function SidebarNavButton({ active, onClick, icon, text }: { active: boolean, onClick: () => void, icon: React.ReactNode, text: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-[#00A3FF] text-white shadow-lg shadow-[#00A3FF]/20' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {text}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, text }: { active: boolean, onClick: () => void, icon: React.ReactNode, text: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
        active ? 'text-[#00F0FF]' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      <div className={`[&>svg]:w-[22px] [&>svg]:h-[22px] ${active ? '[&>svg]:fill-[#00F0FF]/20' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold">{text}</span>
    </button>
  );
}
