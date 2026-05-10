/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { getBotConfig } from "../config.js";

const API_BASE_URL = "https://misaka.com.br/api/v1";

export async function misakaAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const config = await getBotConfig();
  
  if (!config.apiKey) {
    throw new Error("API key não configurada. Configure em src/config.json");
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("API key inválida");
      }
      if (response.status === 403) {
        throw new Error("Sem permissão para este endpoint");
      }
      if (response.status === 429) {
        throw new Error("Rate limit excedido. Tente novamente mais tarde");
      }
      if (response.status === 400) {
        throw new Error("Parâmetro inválido ou ausente");
      }
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error("Resposta da API indica falha");
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro ao conectar com a API");
  }
}
