import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

  private async getHeaders() {
    const token = await this.auth.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  async syncUser() {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.post(`${this.baseUrl}/users/sync`, {}, { headers }));
  }

  async getRoles() {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.get<any[]>(`${this.baseUrl}/roles`, { headers }));
  }

  async createRole(role: any) {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.post(`${this.baseUrl}/roles`, role, { headers }));
  }

  async updateRole(id: string, role: any) {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.put(`${this.baseUrl}/roles/${id}`, role, { headers }));
  }

  async deleteRole(id: string) {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.delete(`${this.baseUrl}/roles/${id}`, { headers }));
  }

  async updateSettings(appKey: string) {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.put(`${this.baseUrl}/users/settings`, { appKey }, { headers }));
  }

  async getAdminUsers() {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.get<any[]>(`${this.baseUrl}/admin/users`, { headers }));
  }

  async disableUser(uid: string) {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.post(`${this.baseUrl}/admin/users/${uid}/disable`, {}, { headers }));
  }

  async enableUser(uid: string) {
    const headers = await this.getHeaders();
    return firstValueFrom(this.http.post(`${this.baseUrl}/admin/users/${uid}/enable`, {}, { headers }));
  }
}
