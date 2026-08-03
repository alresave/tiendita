import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../models/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  public toasts = signal<Toast[]>([]);

  public show(title: string, message?: string, type: ToastType = 'info', duration = 3500): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, title, message, type, duration };

    this.toasts.update((current) => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  public success(title: string, message?: string): void {
    this.show(title, message, 'success');
  }

  public error(title: string, message?: string): void {
    this.show(title, message, 'error');
  }

  public info(title: string, message?: string): void {
    this.show(title, message, 'info');
  }

  public warning(title: string, message?: string): void {
    this.show(title, message, 'warning');
  }

  public remove(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
