import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';
import { ToastrService } from 'ngx-toastr';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent {
  private api = inject(ApiService);
  private toastr = inject(ToastrService);
  protected auth = inject(AuthService);

  appKey = '';
  loading = false;

  async saveSettings() {
    if (!this.appKey) {
      this.toastr.warning('Please enter an App Key', 'Warning');
      return;
    }

    this.loading = true;
    try {
      await this.api.updateSettings(this.appKey);
      this.toastr.success('Settings saved successfully', 'Success');
    } catch (error) {
      this.toastr.error('Failed to save settings', 'Error');
    } finally {
      this.loading = false;
    }
  }
}
