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
    if (this.token) {
      this.setAuthToken(this.token);
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
    const response: AxiosResponse<Persona> = await this.api.post(
      "/personas",
      personaData
    );
    return response.data;
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
}

export const apiService = new ApiService();
export default apiService;
