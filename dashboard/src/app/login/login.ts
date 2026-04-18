import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth';
import { ApiService } from '../api';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private toastr = inject(ToastrService);
  
  loading = false;

  async loginWithGoogle() {
    this.loading = true;
    try {
      await this.auth.loginWithGoogle();
      await this.api.syncUser();
      this.toastr.success('Welcome back!', 'Success');
    } catch (error: any) {
      this.toastr.error(error.message || 'Login failed', 'Error');
    } finally {
      this.loading = false;
    }
  }
}
