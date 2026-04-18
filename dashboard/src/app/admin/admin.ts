import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api';
import { AuthService } from '../auth';
import { ToastrService } from 'ngx-toastr';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  private toastr = inject(ToastrService);
  protected auth = inject(AuthService);

  users: any[] = [];
  loading = false;

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      this.users = await this.api.getAdminUsers();
    } catch (error: any) {
      this.toastr.error('Failed to load users. Access denied.', 'Admin Error');
    } finally {
      this.loading = false;
    }
  }

  async toggleUser(user: any) {
    try {
      if (user.disabled) {
        await this.api.enableUser(user.uid);
        user.disabled = false;
        this.toastr.success(`User ${user.email} enabled`, 'Success');
      } else {
        await this.api.disableUser(user.uid);
        user.disabled = true;
        this.toastr.warning(`User ${user.email} disabled`, 'Status Changed');
      }
    } catch (error) {
      this.toastr.error('Failed to update user status', 'Error');
    }
  }
}
