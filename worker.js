import { jwtVerify } from 'jose';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Intercepta apenas as requisições para o DeepGame
    if (url.pathname.startsWith('/deepgame')) {
      const cookieHeader = request.headers.get('Cookie');
      
      // O Supabase SSR geralmente salva o cookie com o prefixo sb-[PROJECT_REF]-auth-token
      // ATENÇÃO: Substitua 'SEU_PROJECT_REF' pelo ID real do seu projeto Supabase
      const token = extractAccessToken(cookieHeader, 'sb-SEU_PROJECT_REF-auth-token');

      if (!token) {
        // Sem sessão: redireciona para o Hub Central
        return Response.redirect('https://deepnight.com.br/', 302);
      }

      try {
        // Valida o JWT usando o JWT Secret do Supabase (Adicione isso nas variáveis do Worker)
        const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // Opcional: Injeta o user_id no Header para o seu frontend/backend do DeepGame saber quem é
        const modifiedRequest = new Request(request);
        modifiedRequest.headers.set('X-User-Id', payload.sub);

        // Usuário validado: prossegue para o DeepGame
        return fetch(modifiedRequest);
      } catch (err) {
        // Token inválido/expirado: redireciona para o Hub Central
        return Response.redirect('https://deepnight.com.br/', 302);
      }
    }

    // Outras rotas (como o Hub) passam direto
    return fetch(request);
  }
};

// Função auxiliar para extrair o token do formato de cookie do Supabase
function extractAccessToken(cookieHeader, cookieName) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^| )${cookieName}=([^;]+)`));
  
  if (match) {
    try {
      const decodedValue = decodeURIComponent(match[2]);
      
      // O Supabase SSR costuma encodar o JSON em base64
      if (decodedValue.startsWith('base64-')) {
        const json = JSON.parse(atob(decodedValue.replace('base64-', '')));
        return json.access_token || json[0];
      }
      
      const json = JSON.parse(decodedValue);
      return json.access_token || (Array.isArray(json) ? json[0] : decodedValue);
    } catch (e) {
      return match[2]; 
    }
  }
  return null;
}
