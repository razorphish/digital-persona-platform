import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  User,
  AuthResponse,
  Persona,
  CreatePersonaRequest,
  Conversation,
  CreateConversationRequest,
  Message,
  SendMessageRequest,
  ChatResponse,
  MediaFile,
  ChatStats,
  LoginForm,
  RegisterForm,
  ImageAnalysisResult,
  VoiceSynthesisResult,
  PersonaMemoriesResponse,
} from "../types";

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Load token from localStorage on initialization
    this.token = localStorage.getItem("access_token");
    console.log("Loading token from localStorage:", this.token);
    if (this.token) {
      this.setAuthToken(this.token);
    } else {
      console.log("No token found in localStorage");
    }

    // Add response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          this.logout();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  private setAuthToken(token: string) {
    this.token = token;
    this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("access_token", token);
    console.log("Auth token set:", token);
    console.log("Headers updated:", this.api.defaults.headers.common);
  }

  private clearAuthToken() {
    this.token = null;
    delete this.api.defaults.headers.common["Authorization"];
    localStorage.removeItem("access_token");
  }

  // Authentication
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post(
      "/auth/login",
      credentials
    );
    this.setAuthToken(response.data.access_token);
    return response.data;
  }

  async register(userData: RegisterForm): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post(
      "/auth/register",
      userData
    );
    this.setAuthToken(response.data.access_token);
    return response.data;
  }

  logout() {
    this.clearAuthToken();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // User management
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get("/auth/me");
    return response.data;
  }

  // Persona management
  async getPersonas(): Promise<Persona[]> {
    const response: AxiosResponse<Persona[]> = await this.api.get("/personas");
    return response.data;
  }

  async createPersona(personaData: CreatePersonaRequest): Promise<Persona> {
    console.log("Creating persona with data:", personaData);
    console.log("Current auth token:", this.token);
    console.log("Request headers:", this.api.defaults.headers.common);

    try {
      const response: AxiosResponse<Persona> = await this.api.post(
        "/personas",
        personaData
      );
      console.log("Persona created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating persona:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      throw error;
    }
  }

  async updatePersona(
    id: number,
    personaData: Partial<CreatePersonaRequest>
  ): Promise<Persona> {
    const response: AxiosResponse<Persona> = await this.api.put(
      `/personas/${id}`,
      personaData
    );
    return response.data;
  }

  async deletePersona(id: number): Promise<void> {
    await this.api.delete(`/personas/${id}`);
  }

  // Conversation management
  async getConversations(personaId?: number): Promise<Conversation[]> {
    const params = personaId ? { persona_id: personaId } : {};
    const response: AxiosResponse<Conversation[]> = await this.api.get(
      "/chat/conversations",
      { params }
    );
    return response.data;
  }

  async createConversation(
    conversationData: CreateConversationRequest
  ): Promise<Conversation> {
    const response: AxiosResponse<Conversation> = await this.api.post(
      "/chat/conversations",
      conversationData
    );
    return response.data;
  }

  async getConversation(id: number): Promise<Conversation> {
    const response: AxiosResponse<Conversation> = await this.api.get(
      `/chat/conversations/${id}`
    );
    return response.data;
  }

  async updateConversation(
    id: number,
    conversationData: CreateConversationRequest
  ): Promise<Conversation> {
    const response: AxiosResponse<Conversation> = await this.api.put(
      `/chat/conversations/${id}`,
      conversationData
    );
    return response.data;
  }

  async deleteConversation(id: number): Promise<void> {
    await this.api.delete(`/chat/conversations/${id}`);
  }

  // Message management
  async getMessages(
    conversationId: number,
    limit?: number
  ): Promise<Message[]> {
    const params = limit ? { limit } : {};
    const response: AxiosResponse<Message[]> = await this.api.get(
      `/chat/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data;
  }

  async sendMessage(
    conversationId: number,
    messageData: SendMessageRequest
  ): Promise<ChatResponse> {
    const response: AxiosResponse<ChatResponse> = await this.api.post(
      `/chat/conversations/${conversationId}/send`,
      messageData
    );
    return response.data;
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.api.delete(`/chat/messages/${messageId}`);
  }

  // File upload
  async uploadFile(file: File): Promise<MediaFile> {
    const formData = new FormData();
    formData.append("file", file);

    const response: AxiosResponse<MediaFile> = await this.api.post(
      "/upload/file",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async getFiles(): Promise<MediaFile[]> {
    const response: AxiosResponse<MediaFile[]> = await this.api.get(
      "/upload/files"
    );
    return response.data;
  }

  async deleteFile(fileId: number): Promise<void> {
    await this.api.delete(`/upload/files/${fileId}`);
  }

  // Statistics
  async getChatStats(): Promise<ChatStats> {
    const response: AxiosResponse<ChatStats> = await this.api.get(
      "/chat/stats"
    );
    return response.data;
  }

  // Health check
  async getHealthStatus(): Promise<any> {
    const response: AxiosResponse = await this.api.get("/chat/health");
    return response.data;
  }

  async getAvailableModels(): Promise<any> {
    const response: AxiosResponse = await this.api.get("/chat/models");
    return response.data;
  }

  // AI Capabilities
  async analyzeImage(
    mediaFileId: number,
    analysisTypes?: string[]
  ): Promise<ImageAnalysisResult> {
    const response = await this.api.post(`/ai/analyze-image/${mediaFileId}`, {
      analysis_types: analysisTypes,
    });
    return response.data;
  }

  async synthesizeVoice(messageId: number): Promise<VoiceSynthesisResult> {
    const response = await this.api.post(`/ai/synthesize-voice/${messageId}`);
    return response.data;
  }

  async getPersonaMemories(
    personaId: number,
    query?: string,
    memoryTypes?: string[],
    limit: number = 10
  ): Promise<PersonaMemoriesResponse> {
    const params: any = { limit };
    if (query) params.query = query;
    if (memoryTypes) params.memory_types = memoryTypes;
    const response = await this.api.get(`/ai/memories/${personaId}`, {
      params,
    });
    return response.data;
  }

  async storePersonaMemory(
    personaId: number,
    memoryType: string,
    content: string,
    importance: number = 1.0,
    context?: object
  ): Promise<any> {
    const data: any = { memory_type: memoryType, content, importance };
    if (context) data.context = context;
    const response = await this.api.post(`/ai/memories/${personaId}`, data);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
