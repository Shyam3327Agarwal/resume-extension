import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';
import { AuthService } from '../auth';
import { ToastrService } from 'ngx-toastr';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-role-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './role-dashboard.html',
  styleUrl: './role-dashboard.css'
})
export class RoleDashboardComponent implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private toastr = inject(ToastrService);

  roles: any[] = [];
  loading = false;
  showAddModal = false;
  
  newRole = {
    id: '',
    title: '',
    jd: '',
    requirements: ''
  };

  ngOnInit() {
    this.loadRoles();
  }

  async loadRoles() {
    this.loading = true;
    try {
      this.roles = await this.api.getRoles();
    } catch (error) {
      this.toastr.error('Failed to load roles', 'Error');
    } finally {
      this.loading = false;
    }
  }

  async saveRole() {
    if (!this.newRole.id || !this.newRole.title) {
      this.toastr.warning('Please fill in all required fields', 'Warning');
      return;
    }

    try {
      const payload = {
        ...this.newRole,
        requirements: this.newRole.requirements.split(',').map(r => r.trim()).filter(r => r)
      };
      await this.api.createRole(payload);
      this.toastr.success('Role created successfully', 'Success');
      this.closeModal();
      this.loadRoles();
    } catch (error) {
      this.toastr.error('Failed to create role', 'Error');
    }
  }

  async deleteRole(id: string) {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await this.api.deleteRole(id);
        this.toastr.success('Role deleted', 'Success');
        this.loadRoles();
      } catch (error) {
        this.toastr.error('Failed to delete role', 'Error');
      }
    }
  }

  openModal() {
    this.showAddModal = true;
  }

  closeModal() {
    this.showAddModal = false;
    this.newRole = { id: '', title: '', jd: '', requirements: '' };
  }
}
